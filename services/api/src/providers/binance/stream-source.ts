import WebSocket from "ws";
import type { FastifyBaseLogger } from "fastify";
import { backoffDelay } from "../../infrastructure/backoff";
import type { MarketStreamSource, UpstreamHandlers, UpstreamStream } from "../market-data-provider";
import { WsKlineEventSchema, WsMiniTickerSchema } from "./schemas";
import { miniTickerToQuote, wsKlineToCandle } from "./normalize";

export interface BinanceStreamOptions {
  wsUrl: string;
  log?: Pick<FastifyBaseLogger, "info" | "warn" | "debug" | "error">;
  /** Intervalo mínimo entre mensagens de controle enviadas (Binance: máx. 5 msgs/s por conexão, contando pings/pongs). */
  controlIntervalMs?: number;
  /** Sem nenhuma mensagem por este tempo (com assinaturas ativas) → conexão considerada morta. */
  silenceTimeoutMs?: number;
  /** A Binance encerra conexões após 24h; reconectamos antes, de forma controlada. */
  maxConnectionAgeMs?: number;
  /** Fábrica injetável para testes. */
  createSocket?: (url: string) => WebSocket;
}

const MAX_PARAMS_PER_MESSAGE = 100;

export const streamName = (s: UpstreamStream) =>
  s.kind === "candles" ? `${s.symbol.toLowerCase()}@kline_${s.interval}` : `${s.symbol.toLowerCase()}@miniTicker`;

/**
 * Uma única conexão WebSocket com a Binance para TODAS as assinaturas (endpoint combinado `/stream`),
 * com SUBSCRIBE/UNSUBSCRIBE dinâmicos. Nunca abre um socket por cliente do frontend.
 */
export class BinanceStreamSource implements MarketStreamSource {
  private ws: WebSocket | null = null;
  private handlers: UpstreamHandlers | null = null;
  private readonly desired = new Set<string>();
  private readonly active = new Set<string>();
  private pendingSub = new Set<string>();
  private pendingUnsub = new Set<string>();
  private flushTimer: NodeJS.Timeout | null = null;
  private lastControlAt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private ageTimer: NodeJS.Timeout | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private attempt = 0;
  private everOpened = false;
  private stopped = true;
  private nextId = 1;

  constructor(private readonly opts: BinanceStreamOptions) {}

  start(handlers: UpstreamHandlers) {
    this.handlers = handlers;
    this.stopped = false;
    this.connect();
  }

  isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  subscribe(streams: UpstreamStream[]) {
    for (const s of streams.map(streamName)) {
      this.desired.add(s);
      this.pendingUnsub.delete(s);
      if (!this.active.has(s)) this.pendingSub.add(s);
    }
    this.scheduleFlush();
  }

  unsubscribe(streams: UpstreamStream[]) {
    for (const s of streams.map(streamName)) {
      this.desired.delete(s);
      this.pendingSub.delete(s);
      if (this.active.has(s)) this.pendingUnsub.add(s);
    }
    this.scheduleFlush();
  }

  async stop() {
    this.stopped = true;
    for (const t of [this.reconnectTimer, this.ageTimer, this.silenceTimer, this.flushTimer]) if (t) clearTimeout(t);
    const ws = this.ws;
    this.ws = null;
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      await new Promise<void>((resolve) => {
        ws.once("close", () => resolve());
        ws.close(1000, "shutdown");
        setTimeout(() => {
          ws.terminate();
          resolve();
        }, 2_000).unref();
      });
    }
  }

  // ---------------------------------------------------------------- conexão

  private connect() {
    if (this.stopped) return;
    const url = `${this.opts.wsUrl.replace(/\/$/, "")}/stream`;
    const ws = this.opts.createSocket ? this.opts.createSocket(url) : new WebSocket(url, { handshakeTimeout: 10_000 });
    this.ws = ws;

    ws.on("open", () => {
      const reconnected = this.everOpened;
      this.everOpened = true;
      this.attempt = 0;
      this.active.clear();
      this.pendingUnsub.clear();
      this.pendingSub = new Set(this.desired);
      this.opts.log?.info({ streams: this.desired.size, reconnected }, "binance ws conectado");
      this.armSilenceTimer();
      const maxAge = this.opts.maxConnectionAgeMs ?? 23 * 3_600_000;
      this.ageTimer = setTimeout(() => this.recycle("idade máxima da conexão"), maxAge);
      this.ageTimer.unref();
      this.flush();
      this.handlers?.onOpen({ reconnected });
    });

    ws.on("message", (raw) => {
      this.armSilenceTimer();
      this.handleMessage(raw.toString());
    });

    ws.on("ping", () => this.armSilenceTimer()); // ws responde o pong automaticamente com o mesmo payload

    ws.on("error", (err) => this.opts.log?.warn({ err: err.message }, "binance ws erro"));

    ws.on("close", (code, reasonBuf) => {
      if (this.ws !== ws) return; // conexão antiga já substituída
      for (const t of [this.ageTimer, this.silenceTimer]) if (t) clearTimeout(t);
      this.active.clear();
      this.ws = null;
      const reason = `${code}${reasonBuf.length ? " " + reasonBuf.toString() : ""}`;
      const willReconnect = !this.stopped;
      this.opts.log?.warn({ reason, willReconnect }, "binance ws fechado");
      this.handlers?.onClose({ reason, willReconnect });
      if (willReconnect) this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    const delay = this.attempt === 0 ? 250 : backoffDelay(this.attempt, { baseMs: 1_000, capMs: 30_000 }) + 250;
    this.attempt++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
    this.reconnectTimer.unref();
  }

  /** Fecha a conexão atual de propósito (o handler de close agenda a reconexão). */
  private recycle(reason: string) {
    this.opts.log?.info({ reason }, "reciclando conexão binance ws");
    this.ws?.terminate();
  }

  private armSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    const timeout = this.opts.silenceTimeoutMs ?? 30_000;
    this.silenceTimer = setTimeout(() => {
      // A Binance manda ping a cada 20s e klines a cada 2s; silêncio prolongado = conexão morta (meia-aberta).
      if (this.desired.size > 0) this.recycle("silêncio do upstream");
      else this.armSilenceTimer();
    }, timeout);
    this.silenceTimer.unref();
  }

  // ------------------------------------------------------- assinaturas

  private scheduleFlush() {
    if (this.flushTimer || !this.isOpen()) return;
    const wait = Math.max(0, (this.opts.controlIntervalMs ?? 250) - (Date.now() - this.lastControlAt));
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, wait);
    this.flushTimer.unref();
  }

  /** Envia UMA mensagem de controle por vez (sub ou unsub), respeitando o intervalo mínimo. */
  private flush() {
    if (!this.isOpen()) return;
    const sinceLast = Date.now() - this.lastControlAt;
    if (sinceLast < (this.opts.controlIntervalMs ?? 250)) return this.scheduleFlush();
    let method: "SUBSCRIBE" | "UNSUBSCRIBE" | null = null;
    let params: string[] = [];
    if (this.pendingUnsub.size) {
      method = "UNSUBSCRIBE";
      params = [...this.pendingUnsub].slice(0, MAX_PARAMS_PER_MESSAGE);
      params.forEach((p) => {
        this.pendingUnsub.delete(p);
        this.active.delete(p);
      });
    } else if (this.pendingSub.size) {
      method = "SUBSCRIBE";
      params = [...this.pendingSub].slice(0, MAX_PARAMS_PER_MESSAGE);
      params.forEach((p) => {
        this.pendingSub.delete(p);
        this.active.add(p);
      });
    }
    if (!method) return;
    this.lastControlAt = Date.now();
    this.ws!.send(JSON.stringify({ method, params, id: this.nextId++ }));
    if (this.pendingSub.size || this.pendingUnsub.size) this.scheduleFlush();
  }

  // ------------------------------------------------------------ mensagens

  private handleMessage(text: string) {
    let msg: unknown;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;
    const m = msg as { stream?: string; data?: unknown; result?: unknown; id?: unknown; error?: unknown; e?: string };
    if ("error" in m && m.error) {
      this.opts.log?.warn({ error: m.error }, "binance ws erro de controle");
      return;
    }
    if ("result" in m) return; // resposta de SUBSCRIBE/UNSUBSCRIBE
    const data = (m.data ?? m) as { e?: string };
    if (data.e === "serverShutdown") return this.recycle("serverShutdown");

    const receivedAtMs = Date.now();
    if (data.e === "kline") {
      const parsed = WsKlineEventSchema.safeParse(data);
      if (!parsed.success) return;
      const candle = wsKlineToCandle(parsed.data);
      if (candle) this.handlers?.onCandle({ candle, eventTimeMs: parsed.data.E, receivedAtMs });
    } else if (data.e === "24hrMiniTicker") {
      const parsed = WsMiniTickerSchema.safeParse(data);
      if (!parsed.success) return;
      this.handlers?.onQuote({ quote: miniTickerToQuote(parsed.data), eventTimeMs: parsed.data.E, receivedAtMs });
    }
  }
}
