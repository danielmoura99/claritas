import type { Candle, Interval, MarketAsset, Provider, Quote } from "@claritas/contracts";

export interface CandleRequest {
  symbol: string;
  interval: Interval;
  limit: number;
  startTimeMs?: number;
  endTimeMs?: number;
}

/**
 * Contrato que qualquer provedor de dados de mercado implementa. Os módulos da API e o frontend
 * só conhecem os tipos canônicos de @claritas/contracts — trocar a Binance não altera componentes visuais.
 */
export interface MarketDataProvider {
  readonly id: Provider;
  /** Todos os ativos negociáveis do provedor (pode vir de cache). */
  listAssets(): Promise<MarketAsset[]>;
  getQuote(symbol: string): Promise<Quote>;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  /** Tickers 24h de todos os ativos (usado pelo scanner; custo alto no provedor). */
  getAllQuotes(): Promise<Quote[]>;
  /** Candles em ordem crescente de openTimeMs, sem duplicidade. */
  getCandles(req: CandleRequest): Promise<Candle[]>;
  /** Conectividade simples com o provedor (readiness informativa). */
  ping(): Promise<boolean>;
  /** Offset estimado relógio do provedor − relógio local (ms), para medir latência sem viés de relógio. */
  estimateClockOffsetMs?(): Promise<number>;
}

/** Evento de candle recebido do streaming upstream, já normalizado. */
export interface CandleEvent {
  candle: Candle;
  eventTimeMs: number;
  receivedAtMs: number;
}

export interface QuoteEvent {
  quote: Quote;
  eventTimeMs: number;
  receivedAtMs: number;
}

export type UpstreamStream =
  | { kind: "candles"; symbol: string; interval: Interval }
  | { kind: "quote"; symbol: string };

export interface UpstreamHandlers {
  onCandle(e: CandleEvent): void;
  onQuote(e: QuoteEvent): void;
  /** Conexão upstream aberta (ou reaberta). `reconnected=true` exige reconciliação via REST. */
  onOpen(info: { reconnected: boolean }): void;
  onClose(info: { reason: string; willReconnect: boolean }): void;
}

/** Fonte de streaming do provedor: uma conexão compartilhada com assinaturas dinâmicas. */
export interface MarketStreamSource {
  start(handlers: UpstreamHandlers): void;
  subscribe(streams: UpstreamStream[]): void;
  unsubscribe(streams: UpstreamStream[]): void;
  isOpen(): boolean;
  stop(): Promise<void>;
}
