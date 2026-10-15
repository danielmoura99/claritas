import {
  INTERVAL_MS,
  candleKey,
  type Candle,
  type FeedStatus,
  type Interval,
  type MarketStatus,
  type Provider,
  type Quote,
  type ServerMessage,
} from "@claritas/contracts";
import type { FastifyBaseLogger } from "fastify";
import type { CandleEvent, MarketStreamSource, QuoteEvent, UpstreamStream } from "../../providers/market-data-provider";

/** Consumidor do hub (uma conexão WS do frontend, ou um teste). */
export interface StreamClient {
  readonly id: string;
  send(msg: ServerMessage): void;
}

type ChannelKind = "candles" | "quote";

interface ChannelState {
  kind: ChannelKind;
  symbol: string;
  interval?: Interval;
  consumers: Set<StreamClient>;
  status: MarketStatus;
  reason?: string;
  lastEventTimeMs: number | null;
  lastReceivedAtMs: number | null;
  latencyMs: number | null;
  /** Último candle conhecido (aberto ou fechado) — nunca retrocede. */
  lastCandle?: Candle;
  lastQuote?: Quote;
  lingerTimer?: NodeJS.Timeout;
  /** true enquanto a reconciliação REST pós-reconexão não terminou. */
  reconciling: boolean;
}

export interface HubOptions {
  source: MarketStreamSource;
  provider: Provider;
  staleAfterMs: number;
  lingerMs: number;
  /** Após este tempo com o upstream fora, o status passa de `reconnecting` para `offline`. */
  offlineAfterMs?: number;
  /** Busca candles recentes via REST para preencher buracos (backfill). */
  fetchRecentCandles: (symbol: string, interval: Interval, sinceOpenTimeMs: number | null) => Promise<Candle[]>;
  log?: Pick<FastifyBaseLogger, "info" | "warn" | "debug">;
  now?: () => number;
  /** Relógio do provedor − relógio local (ms). Corrige a latência medida. */
  clockOffsetMs?: () => number;
}

const keyOf = (kind: ChannelKind, symbol: string, interval?: Interval) => (kind === "candles" ? candleKey(symbol, interval!) : `quote:${symbol}`);

/**
 * Hub de streaming: deduplica assinaturas (N clientes → 1 stream upstream), mantém o último estado por canal,
 * detecta feed parado (stale), reconcilia via REST após reconexão e só então volta a `live`.
 */
export class StreamHub {
  private readonly channels = new Map<string, ChannelState>();
  private readonly clientChannels = new Map<StreamClient, Set<string>>();
  private upstreamDownSinceMs: number | null = null;
  private watchdog: NodeJS.Timeout | null = null;
  private readonly now: () => number;

  constructor(private readonly opts: HubOptions) {
    this.now = opts.now ?? Date.now;
  }

  start() {
    this.opts.source.start({
      onCandle: (e) => this.onCandle(e),
      onQuote: (e) => this.onQuote(e),
      onOpen: ({ reconnected }) => void this.onUpstreamOpen(reconnected),
      onClose: ({ reason, willReconnect }) => this.onUpstreamClose(reason, willReconnect),
    });
    this.upstreamDownSinceMs = this.now();
    this.watchdog = setInterval(() => this.checkHealth(), 1_000);
    this.watchdog.unref();
  }

  async stop() {
    if (this.watchdog) clearInterval(this.watchdog);
    for (const ch of this.channels.values()) if (ch.lingerTimer) clearTimeout(ch.lingerTimer);
    await this.opts.source.stop();
  }

  // --------------------------------------------------------------- clientes

  subscribe(client: StreamClient, kind: ChannelKind, symbol: string, interval?: Interval) {
    const key = keyOf(kind, symbol, interval);
    let ch = this.channels.get(key);
    if (!ch) {
      ch = {
        kind,
        symbol,
        interval,
        consumers: new Set(),
        status: this.opts.source.isOpen() ? "connecting" : this.upstreamStatus(),
        lastEventTimeMs: null,
        lastReceivedAtMs: null,
        latencyMs: null,
        reconciling: false,
      };
      this.channels.set(key, ch);
      this.opts.source.subscribe([this.toUpstream(ch)]);
    } else if (ch.lingerTimer) {
      clearTimeout(ch.lingerTimer);
      ch.lingerTimer = undefined;
    }
    ch.consumers.add(client);
    let set = this.clientChannels.get(client);
    if (!set) this.clientChannels.set(client, (set = new Set()));
    set.add(key);

    client.send({ type: "subscribed", channel: kind, symbol, interval });
    client.send({ type: "status", data: this.statusOf(ch) });
    // Snapshot: o último estado conhecido, se já houver (outro cliente pode ter aberto o canal antes).
    if (ch.lastCandle && ch.lastEventTimeMs) {
      client.send({ type: "candle.upsert", data: ch.lastCandle, source: this.opts.provider, receivedAt: new Date(ch.lastReceivedAtMs ?? this.now()).toISOString(), eventTimeMs: ch.lastEventTimeMs });
    }
    if (ch.lastQuote && ch.lastEventTimeMs) {
      client.send({ type: "quote.update", data: ch.lastQuote, source: this.opts.provider, receivedAt: new Date(ch.lastReceivedAtMs ?? this.now()).toISOString(), eventTimeMs: ch.lastEventTimeMs });
    }
  }

  unsubscribe(client: StreamClient, kind: ChannelKind, symbol: string, interval?: Interval) {
    const key = keyOf(kind, symbol, interval);
    this.detach(client, key);
    this.clientChannels.get(client)?.delete(key);
    client.send({ type: "unsubscribed", channel: kind, symbol, interval });
  }

  /** Remove o cliente de todos os canais (conexão fechada). Garante que não sobra assinatura órfã. */
  removeClient(client: StreamClient) {
    for (const key of this.clientChannels.get(client) ?? []) this.detach(client, key);
    this.clientChannels.delete(client);
  }

  subscriptionCount(client: StreamClient) {
    return this.clientChannels.get(client)?.size ?? 0;
  }

  private detach(client: StreamClient, key: string) {
    const ch = this.channels.get(key);
    if (!ch) return;
    ch.consumers.delete(client);
    if (ch.consumers.size > 0 || ch.lingerTimer) return;
    // Retém a assinatura upstream por um tempo para evitar churn (trocas rápidas de ativo/timeframe).
    const release = () => {
      const current = this.channels.get(key);
      if (!current || current.consumers.size > 0) return;
      this.channels.delete(key);
      this.opts.source.unsubscribe([this.toUpstream(current)]);
    };
    if (this.opts.lingerMs <= 0) release();
    else {
      ch.lingerTimer = setTimeout(release, this.opts.lingerMs);
      ch.lingerTimer.unref();
    }
  }

  // ------------------------------------------------------------- consultas

  getStatus(symbol: string, interval?: Interval): FeedStatus {
    const ch = this.channels.get(interval ? keyOf("candles", symbol, interval) : keyOf("quote", symbol));
    if (ch) return this.statusOf(ch);
    return {
      symbol,
      interval,
      status: this.opts.source.isOpen() ? "connecting" : this.upstreamStatus(),
      source: this.opts.provider,
      lastEventAt: null,
      lastReceivedAt: null,
      latencyMs: null,
      reason: "sem assinatura ativa — o status por par só existe enquanto há consumidores",
    };
  }

  stats() {
    return {
      upstreamOpen: this.opts.source.isOpen(),
      channels: this.channels.size,
      clients: this.clientChannels.size,
      byChannel: [...this.channels.entries()].map(([key, ch]) => ({ key, consumers: ch.consumers.size, status: ch.status })),
    };
  }

  // ------------------------------------------------------------- upstream

  private onCandle({ candle, eventTimeMs, receivedAtMs }: CandleEvent) {
    const ch = this.channels.get(candleKey(candle.symbol, candle.interval));
    if (!ch) return;
    this.touch(ch, eventTimeMs, receivedAtMs);
    if (!this.applyCandle(ch, candle)) return;
    this.broadcast(ch, { type: "candle.upsert", data: candle, source: this.opts.provider, receivedAt: new Date(receivedAtMs).toISOString(), eventTimeMs });
    if (!ch.reconciling) this.setStatus(ch, "live");
  }

  private onQuote({ quote, eventTimeMs, receivedAtMs }: QuoteEvent) {
    const ch = this.channels.get(keyOf("quote", quote.symbol));
    if (!ch) return;
    if (ch.lastEventTimeMs && eventTimeMs < ch.lastEventTimeMs) return;
    this.touch(ch, eventTimeMs, receivedAtMs);
    ch.lastQuote = quote;
    this.broadcast(ch, { type: "quote.update", data: quote, source: this.opts.provider, receivedAt: new Date(receivedAtMs).toISOString(), eventTimeMs });
    if (!ch.reconciling) this.setStatus(ch, "live");
  }

  /**
   * Regras de upsert: candle mais antigo que o último conhecido é ignorado (não retrocede);
   * um candle fechado não é reaberto por evento atrasado. Retorna true se houve mudança a propagar.
   */
  private applyCandle(ch: ChannelState, candle: Candle): boolean {
    const last = ch.lastCandle;
    if (last) {
      if (candle.openTimeMs < last.openTimeMs) return false;
      if (candle.openTimeMs === last.openTimeMs && last.isClosed && !candle.isClosed) return false;
    }
    ch.lastCandle = candle;
    return true;
  }

  private touch(ch: ChannelState, eventTimeMs: number, receivedAtMs: number) {
    ch.lastEventTimeMs = eventTimeMs;
    ch.lastReceivedAtMs = receivedAtMs;
    ch.latencyMs = receivedAtMs + (this.opts.clockOffsetMs?.() ?? 0) - eventTimeMs;
  }

  private async onUpstreamOpen(reconnected: boolean) {
    this.upstreamDownSinceMs = null;
    if (!reconnected) return;
    // Reconciliação: antes de voltar a `live`, busca via REST as barras perdidas durante a queda.
    const candleChannels = [...this.channels.values()].filter((c) => c.kind === "candles");
    await Promise.all(
      candleChannels.map(async (ch) => {
        ch.reconciling = true;
        this.setStatus(ch, "reconnecting", "reconciliando candles via REST");
        try {
          const since = ch.lastCandle?.openTimeMs ?? null;
          const recent = await this.opts.fetchRecentCandles(ch.symbol, ch.interval!, since);
          for (const c of recent) {
            if (this.applyCandle(ch, c)) {
              this.broadcast(ch, { type: "candle.upsert", data: c, source: this.opts.provider, receivedAt: new Date(this.now()).toISOString(), eventTimeMs: Math.min(c.closeTimeMs, this.now()) });
            }
          }
          ch.reconciling = false;
          // Fica em `reconnecting` até o primeiro evento WS chegar (prova de que o fluxo voltou).
          this.setStatus(ch, "reconnecting", "aguardando primeiro evento após reconciliação");
        } catch (err) {
          ch.reconciling = false;
          this.opts.log?.warn({ key: candleKey(ch.symbol, ch.interval!), err: String(err) }, "falha no backfill pós-reconexão");
          this.setStatus(ch, "reconnecting", "falha ao reconciliar via REST; aguardando eventos");
        }
      }),
    );
    for (const ch of this.channels.values()) if (ch.kind === "quote") this.setStatus(ch, "reconnecting", "aguardando primeiro evento");
  }

  private onUpstreamClose(reason: string, willReconnect: boolean) {
    this.upstreamDownSinceMs ??= this.now();
    for (const ch of this.channels.values()) this.setStatus(ch, willReconnect ? "reconnecting" : "offline", `conexão com o provedor caiu (${reason})`);
  }

  private upstreamStatus(): MarketStatus {
    if (this.upstreamDownSinceMs === null) return "connecting";
    return this.now() - this.upstreamDownSinceMs > (this.opts.offlineAfterMs ?? 60_000) ? "offline" : "reconnecting";
  }

  /** Watchdog: stale por silêncio; reconnecting → offline após queda longa. */
  checkHealth() {
    const now = this.now();
    for (const ch of this.channels.values()) {
      if (ch.status === "live" && ch.lastReceivedAtMs !== null && now - ch.lastReceivedAtMs > this.opts.staleAfterMs) {
        this.setStatus(ch, "stale", `sem eventos há ${Math.round((now - ch.lastReceivedAtMs) / 1000)}s`);
      }
      if (ch.status === "connecting" && ch.lastReceivedAtMs === null && this.opts.source.isOpen() === false) {
        this.setStatus(ch, this.upstreamStatus(), "provedor indisponível");
      }
      if (ch.status === "reconnecting" && this.upstreamDownSinceMs !== null && this.upstreamStatus() === "offline") {
        this.setStatus(ch, "offline", "provedor indisponível há mais de 60s");
      }
      // Candle aberto cujo horário de fechamento já passou há muito: o feed travou mesmo com a conexão viva.
      if (ch.status === "live" && ch.kind === "candles" && ch.lastCandle && !ch.lastCandle.isClosed && now > ch.lastCandle.closeTimeMs + Math.max(this.opts.staleAfterMs, INTERVAL_MS[ch.interval!] / 2)) {
        this.setStatus(ch, "stale", "barra corrente não fechou no horário previsto");
      }
    }
  }

  // --------------------------------------------------------------- internos

  private setStatus(ch: ChannelState, status: MarketStatus, reason?: string) {
    if (ch.status === status && ch.reason === reason) return;
    ch.status = status;
    ch.reason = status === "live" ? undefined : reason;
    this.broadcast(ch, { type: "status", data: this.statusOf(ch) });
  }

  private statusOf(ch: ChannelState): FeedStatus {
    return {
      symbol: ch.symbol,
      interval: ch.interval,
      status: ch.status,
      source: this.opts.provider,
      lastEventAt: ch.lastEventTimeMs ? new Date(ch.lastEventTimeMs).toISOString() : null,
      lastReceivedAt: ch.lastReceivedAtMs ? new Date(ch.lastReceivedAtMs).toISOString() : null,
      latencyMs: ch.latencyMs,
      ...(ch.reason ? { reason: ch.reason } : {}),
    };
  }

  private broadcast(ch: ChannelState, msg: ServerMessage) {
    for (const c of ch.consumers) c.send(msg);
  }

  private toUpstream(ch: ChannelState): UpstreamStream {
    return ch.kind === "candles" ? { kind: "candles", symbol: ch.symbol, interval: ch.interval! } : { kind: "quote", symbol: ch.symbol };
  }
}
