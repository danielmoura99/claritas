import { z } from "zod";
import { DecimalStringSchema, IntervalSchema, ProviderSchema } from "./market";
import { EVENT_TYPES, REGIME_STATES } from "./analysis";

export const ScannerQuerySchema = z.object({
  quote: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/).default("USDT"),
  size: z.coerce.number().int().min(5).max(100).default(30),
  timeframe: IntervalSchema.default("15m"),
});
export type ScannerQuery = z.infer<typeof ScannerQuerySchema>;

export const ScannerRowSchema = z.object({
  symbol: z.string(),
  displayName: z.string(),
  pricePrecision: z.number().int().optional(),
  /** Posição no ranking do universo (1 = maior volume 24h em moeda de cotação). */
  rank: z.number().int(),
  lastPrice: DecimalStringSchema,
  change24hPct: DecimalStringSchema,
  quoteVolume24h: DecimalStringSchema,
  high24h: DecimalStringSchema,
  low24h: DecimalStringSchema,
  regime: z.enum(REGIME_STATES),
  /** Último evento (cruzamento EMA9×21 ou rompimento Donchian 20) nas barras fechadas analisadas. */
  lastEvent: z.object({ type: z.enum(EVENT_TYPES), openTimeMs: z.number().int(), barsAgo: z.number().int() }).nullable(),
  relVolume: DecimalStringSchema.nullable(),
  volatilityPct: DecimalStringSchema.nullable(),
  changeNPct: DecimalStringSchema.nullable(),
  /** Fechamentos das últimas barras do timeframe (para sparkline). */
  closes: z.array(DecimalStringSchema),
  lastClosedOpenTimeMs: z.number().int(),
});
export type ScannerRow = z.infer<typeof ScannerRowSchema>;

export const ScannerResultSchema = z.object({
  provider: ProviderSchema,
  scannedAt: z.string(),
  timeframe: IntervalSchema,
  universe: z.object({ quote: z.string(), size: z.number().int(), rankedBy: z.literal("quoteVolume24h"), excludedBases: z.array(z.string()) }),
  params: z.object({ barsAnalyzed: z.number().int(), changeN: z.number().int(), recentBars: z.number().int() }),
  results: z.array(ScannerRowSchema),
  skipped: z.array(z.object({ symbol: z.string(), reason: z.string() })),
});
export type ScannerResult = z.infer<typeof ScannerResultSchema>;
