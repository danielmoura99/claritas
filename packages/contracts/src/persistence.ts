import { z } from "zod";
import { IntervalSchema, SymbolSchema } from "./market";

export const WatchlistItemSchema = z.object({
  /** Identidade independente do provedor. */
  baseAsset: z.string(),
  quoteAsset: z.string(),
  /** Símbolo no provedor atual (derivado; Binance Spot = base + cotação). */
  symbol: z.string(),
  position: z.number().int(),
});
/** Watchlist do usuário da sessão. */
export const WatchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(WatchlistItemSchema),
  updatedAt: z.string(),
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

/** Preferências do terminal do usuário da sessão. */
export const PreferenceSchema = z.object({
  symbol: z.string().nullable(),
  interval: IntervalSchema.nullable(),
  showAnalysis: z.boolean(),
  updatedAt: z.string(),
});
export type Preference = z.infer<typeof PreferenceSchema>;

export const PreferenceUpdateSchema = z
  .object({
    symbol: SymbolSchema.nullable().optional(),
    interval: IntervalSchema.nullable().optional(),
    showAnalysis: z.boolean().optional(),
  })
  .strict();
export type PreferenceUpdate = z.infer<typeof PreferenceUpdateSchema>;
