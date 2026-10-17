import {
  ServerMessageSchema,
  candleKey,
  type CandleUpsertMessage,
  type FeedStatus,
  type Interval,
  type QuoteUpdateMessage,
} from "@claritas/contracts";
import { authApi } from "../api/client";
import { WS_URL } from "../api/config";

export type ConnectionState = "idle" | "connecting" | "open" | "closed";

type CandleListener = { onUpsert?: (m: CandleUpsertMessage) => void; onStatus?: (s: FeedStatus) => void };
type QuoteListener = { onQuote?: (m: QuoteUpdateMessage) => void; onStatus?: (s: FeedStatus) => void };

interface Entry<L> {
  kind: "candles" | "quote";
  symbol: string;
  interval?: Interval;
  listeners: Set<L>;
}

/**
 * Cliente do WebSocket Claritas: UMA conexão por aba, assinaturas com contagem de referências,
 * reconexão com backoff e reassinatura automática. Só conhece o contrato Claritas — nunca a Binance.
 * `resolveUrl` é chamado a cada (re)conexão: a URL leva um ticket de uso único da sessão.
 */
export class MarketStreamClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = "idle";
  private readonly entries = new Map<string, Entry<CandleListener | QuoteListener>>();
  private readonly stateListeners = new Set<(s: ConnectionState, info: { reconnected: boolean }) => void>();
  private attempt = 0;
  private everOpened = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Invalida resoluções de URL em andamento quando a conexão é fechada antes de abrir. */
  private generation = 0;
  private resolving = false;

  constructor(private readonly resolveUrl: () => Promise<string>, private readonly createSocket: (url: string) => WebSocket = (u) => new WebSocket(u)) {}

  get connectionState() {
    return this.state;
  }

  onConnectionState(fn: (s: ConnectionState, info: { reconnected: boolean }) => void) {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  subscribeCandles(symbol: string, interval: Interval, listener: CandleListener) {
    return this.add(candleKey(symbol, interval), { kind: "candles", symbol, interval }, listener);
  }

  subscribeQuote(symbol: string, listener: QuoteListener) {
    return this.add(`quote:${symbol}`, { kind: "quote", symbol }, listener);
  }

  private add(key: string, meta: { kind: "candles" | "quote"; symbol: string; interval?: Interval }, listener: CandleListener | QuoteListener) {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { ...meta, listeners: new Set() };
      this.entries.set(key, entry);
      this.sendSubscribe(entry);
    }
    entry.listeners.add(listener);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.ensureConnected();
    return () => {
      const e = this.entries.get(key);
      if (!e) return;
      e.listeners.delete(listener);
      if (e.listeners.size === 0) {
        this.entries.delete(key);
        this.sendUnsubscribe(e);
        // Sem assinaturas por um tempo → fecha a conexão (não deixa socket ocioso aberto).
        if (this.entries.size === 0) this.idleTimer = setTimeout(() => this.close(), 15_000);
      }
    };
  }

  private ensureConnected() {
    if (this.ws || this.resolving || typeof window === "undefined") return;
    this.setState("connecting");
    this.resolving = true;
    const gen = this.generation;
    this.resolveUrl().then(
      (url) => {
        this.resolving = false;
        if (gen !== this.generation || this.ws) return;
        this.open(url);
      },
      () => {
        // Sem ticket (API fora ou sessão encerrada — o portão de auth cuida desse caso): tenta de novo com backoff.
        this.resolving = false;
        if (gen !== this.generation) return;
        this.setState("closed");
        if (this.entries.size > 0) this.scheduleReconnect();
      },
    );
  }

  private open(url: string) {
    const ws = this.createSocket(url);
    this.ws = ws;
    ws.onopen = () => {
      const reconnected = this.everOpened;
      this.everOpened = true;
      this.attempt = 0;
      this.setState("open", reconnected);
      for (const e of this.entries.values()) this.sendSubscribe(e);
    };
    ws.onmessage = (ev) => this.handle(String(ev.data));
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.setState("closed");
      if (this.entries.size > 0) this.scheduleReconnect();
    };
    ws.onerror = () => {
      /* onclose cuida da reconexão */
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const ceiling = Math.min(15_000, 500 * 2 ** this.attempt++);
    const delay = ceiling / 2 + (crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32) * (ceiling / 2);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureConnected();
    }, delay);
  }

  close() {
    this.generation++;
    this.resolving = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const ws = this.ws;
    this.ws = null;
    ws?.close(1000);
    this.setState("idle");
  }

  private setState(s: ConnectionState, reconnected = false) {
    this.state = s;
    for (const fn of this.stateListeners) fn(s, { reconnected });
  }

  private send(obj: object) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  private sendSubscribe(e: Entry<unknown>) {
    if (e.kind === "candles") this.send({ type: "subscribe", channel: "candles", symbol: e.symbol, interval: e.interval });
    else this.send({ type: "subscribe_quote", channel: "quote", symbol: e.symbol });
  }

  private sendUnsubscribe(e: Entry<unknown>) {
    if (e.kind === "candles") this.send({ type: "unsubscribe", channel: "candles", symbol: e.symbol, interval: e.interval });
    else this.send({ type: "unsubscribe_quote", channel: "quote", symbol: e.symbol });
  }

  private handle(text: string) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }
    const parsed = ServerMessageSchema.safeParse(json);
    if (!parsed.success) return;
    const m = parsed.data;
    if (m.type === "candle.upsert") {
      for (const l of this.entries.get(candleKey(m.data.symbol, m.data.interval))?.listeners ?? []) (l as CandleListener).onUpsert?.(m);
    } else if (m.type === "quote.update") {
      for (const l of this.entries.get(`quote:${m.data.symbol}`)?.listeners ?? []) (l as QuoteListener).onQuote?.(m);
    } else if (m.type === "status") {
      const key = m.data.interval ? candleKey(m.data.symbol, m.data.interval) : `quote:${m.data.symbol}`;
      for (const l of this.entries.get(key)?.listeners ?? []) l.onStatus?.(m.data);
    }
  }
}

/** URL do WebSocket com um ticket novo da sessão atual. */
export async function ticketedStreamUrl(base = WS_URL): Promise<string> {
  const { ticket } = await authApi.streamTicket();
  return `${base}${base.includes("?") ? "&" : "?"}ticket=${encodeURIComponent(ticket)}`;
}

let shared: MarketStreamClient | null = null;
/** Instância única por aba. */
export function getStreamClient() {
  shared ??= new MarketStreamClient(() => ticketedStreamUrl());
  return shared;
}
