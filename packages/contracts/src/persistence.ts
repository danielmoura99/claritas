import { z } from "zod";
import { IntervalSchema, SymbolSchema } from "./market";

/** Id opaco do cliente anônimo (gerado no navegador). Não identifica pessoa nem conta. */
export const ClientIdSchema = z.string().regex(/^[A-Za-z0-9-]{8,64}$/, "clientId inválido");

export const WatchlistItemSchema = z.object({
  /** Identidade independente do provedor. */
  baseAsset: z.string(),
  quoteAsset: z.string(),
  /** Símbolo no provedor atual (derivado; Binance Spot = base + cotação). */
  symbol: z.string(),
  position: z.number().int(),
});
export const WatchlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(WatchlistItemSchema),
  updatedAt: z.string(),
});
export type Watchlist = z.infer<typeof WatchlistSchema>;

export const PreferenceSchema = z.object({
  clientId: ClientIdSchema,
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
