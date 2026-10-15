import { z } from "zod";

/** Schemas dos payloads BRUTOS da Binance Spot. Nunca saem do provider — viram tipos canônicos em normalize.ts. */

const dec = z.string().regex(/^-?\d+(\.\d+)?$/);

/** Linha de GET /api/v3/klines: [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBase, takerQuote, ignore]. */
export const RestKlineSchema = z.tuple([
  z.number().int(),
  dec,
  dec,
  dec,
  dec,
  dec,
  z.number().int(),
  dec,
  z.number().int(),
  dec,
  dec,
  z.unknown(),
]);
export type RestKline = z.infer<typeof RestKlineSchema>;

export const ExchangeSymbolSchema = z.looseObject({
  symbol: z.string(),
  status: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  filters: z.array(z.looseObject({ filterType: z.string(), tickSize: z.string().optional() })).default([]),
});
export const ExchangeInfoSchema = z.looseObject({
  serverTime: z.number().optional(),
  symbols: z.array(ExchangeSymbolSchema),
});
export type ExchangeSymbol = z.infer<typeof ExchangeSymbolSchema>;

export const Ticker24hSchema = z.looseObject({
  symbol: z.string(),
  priceChange: dec,
  priceChangePercent: dec,
  lastPrice: dec,
  openPrice: dec,
  highPrice: dec,
  lowPrice: dec,
  volume: dec,
  quoteVolume: dec,
  openTime: z.number().int(),
  closeTime: z.number().int(),
});
export type Ticker24h = z.infer<typeof Ticker24hSchema>;

export const BinanceErrorSchema = z.object({ code: z.number(), msg: z.string() });

/** Evento WS `<symbol>@kline_<interval>`. */
export const WsKlineEventSchema = z.looseObject({
  e: z.literal("kline"),
  E: z.number().int(),
  s: z.string(),
  k: z.looseObject({
    t: z.number().int(),
    T: z.number().int(),
    s: z.string(),
    i: z.string(),
    o: dec,
    c: dec,
    h: dec,
    l: dec,
    v: dec,
    n: z.number().int(),
    x: z.boolean(),
    q: dec,
  }),
});
export type WsKlineEvent = z.infer<typeof WsKlineEventSchema>;

/** Evento WS `<symbol>@miniTicker` (janela móvel 24h). */
export const WsMiniTickerSchema = z.looseObject({
  e: z.literal("24hrMiniTicker"),
  E: z.number().int(),
  s: z.string(),
  c: dec,
  o: dec,
  h: dec,
  l: dec,
  v: dec,
  q: dec,
});
export type WsMiniTicker = z.infer<typeof WsMiniTickerSchema>;
