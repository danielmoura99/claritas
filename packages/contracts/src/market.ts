import { z } from "zod";

/** Intervalos suportados pelo Claritas (subconjunto case-sensitive dos intervalos Binance: `1m` ≠ `1M`). */
export const INTERVALS = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"] as const;
export const IntervalSchema = z.enum(INTERVALS);
export type Interval = z.infer<typeof IntervalSchema>;

/** Duração de cada intervalo em ms (todos fixos; `1d` em UTC). */
export const INTERVAL_MS: Record<Interval, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

export const PROVIDERS = ["binance_spot"] as const;
export const ProviderSchema = z.enum(PROVIDERS);
export type Provider = z.infer<typeof ProviderSchema>;

export const MARKET_STATUSES = ["connecting", "live", "stale", "reconnecting", "offline"] as const;
export const MarketStatusSchema = z.enum(MARKET_STATUSES);
export type MarketStatus = z.infer<typeof MarketStatusSchema>;

/** Número decimal em string — preserva a precisão do fornecedor. Converter para number só na borda visual. */
export const DecimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, "decimal string esperado");
export type DecimalString = z.infer<typeof DecimalStringSchema>;

/** Símbolo normalizado do par (`BTCUSDT`): maiúsculas e dígitos. */
export const SymbolSchema = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]+$/, "símbolo inválido"));

export const MarketAssetSchema = z.object({
  /** Identidade interna — nunca confundir com o símbolo externo: `BINANCE_SPOT:BTCUSDT`. */
  id: z.string(),
  provider: ProviderSchema,
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  displayName: z.string(),
  tickSize: DecimalStringSchema.optional(),
  /** Casas decimais exibíveis do preço, derivadas do tickSize. */
  pricePrecision: z.number().int().min(0).max(18).optional(),
  status: z.enum(["TRADING", "HALTED", "UNKNOWN"]),
});
export type MarketAsset = z.infer<typeof MarketAssetSchema>;

export const CandleSchema = z
  .object({
    symbol: z.string(),
    interval: IntervalSchema,
    /** UTC epoch ms; chave lógica do candle junto com (provider, symbol, interval). */
    openTimeMs: z.number().int().nonnegative(),
    closeTimeMs: z.number().int().nonnegative(),
    open: DecimalStringSchema,
    high: DecimalStringSchema,
    low: DecimalStringSchema,
    close: DecimalStringSchema,
    volumeBase: DecimalStringSchema,
    volumeQuote: DecimalStringSchema.optional(),
    trades: z.number().int().nonnegative().optional(),
    isClosed: z.boolean(),
    provider: ProviderSchema,
  })
  .refine((c) => c.closeTimeMs > c.openTimeMs, { message: "closeTimeMs deve ser maior que openTimeMs" });
export type Candle = z.infer<typeof CandleSchema>;

/** Cotação de janela móvel de 24h do fornecedor (não é "variação do dia" nem da sessão). */
export const QuoteSchema = z.object({
  symbol: z.string(),
  lastPrice: DecimalStringSchema,
  openPrice: DecimalStringSchema,
  highPrice: DecimalStringSchema,
  lowPrice: DecimalStringSchema,
  priceChange: DecimalStringSchema,
  priceChangePercent: DecimalStringSchema,
  volumeBase: DecimalStringSchema,
  volumeQuote: DecimalStringSchema,
  /** Janela explícita da variação. */
  window: z.literal("rolling_24h"),
  openTimeMs: z.number().int(),
  closeTimeMs: z.number().int(),
  provider: ProviderSchema,
});
export type Quote = z.infer<typeof QuoteSchema>;

export const FeedStatusSchema = z.object({
  symbol: z.string(),
  interval: IntervalSchema.optional(),
  status: MarketStatusSchema,
  source: ProviderSchema,
  /** Horário do último evento do fornecedor (ISO) — null se ainda não houve evento. */
  lastEventAt: z.string().nullable(),
  /** Horário em que a API recebeu o último evento (ISO). */
  lastReceivedAt: z.string().nullable(),
  /** receivedAt − eventTime do último evento, em ms (medido, não prometido). */
  latencyMs: z.number().nullable(),
  reason: z.string().optional(),
});
export type FeedStatus = z.infer<typeof FeedStatusSchema>;

export const marketEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({
    data,
    source: ProviderSchema,
    receivedAt: z.string(),
    asOf: z.string(),
    status: MarketStatusSchema,
  });
export type MarketEnvelope<T> = {
  data: T;
  source: Provider;
  receivedAt: string;
  asOf: string;
  status: MarketStatus;
};

export const CandlesQuerySchema = z.object({
  symbol: SymbolSchema,
  interval: IntervalSchema,
  limit: z.coerce.number().int().min(1).max(1000).default(500),
  endTimeMs: z.coerce.number().int().positive().optional(),
});
export type CandlesQuery = z.infer<typeof CandlesQuerySchema>;

export const SymbolQuerySchema = z.object({ symbol: SymbolSchema });

export const AssetsQuerySchema = z.object({
  search: z.string().trim().max(20).optional(),
  quote: z.string().trim().toUpperCase().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/** Converte o decimal do contrato em number apenas para renderização. Lança se não for finito. */
export function toChartNumber(value: DecimalString): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`valor não numérico: ${value}`);
  return n;
}

/** Casas decimais significativas de um tickSize ("0.01000000" → 2). */
export function precisionFromTickSize(tickSize: string): number {
  const [, frac = ""] = tickSize.split(".");
  const trimmed = frac.replace(/0+$/, "");
  return trimmed.length;
}
