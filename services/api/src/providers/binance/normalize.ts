import {
  CandleSchema,
  INTERVALS,
  precisionFromTickSize,
  type Candle,
  type Interval,
  type MarketAsset,
  type Quote,
} from "@claritas/contracts";
import type { ExchangeSymbol, RestKline, Ticker24h, WsKlineEvent, WsMiniTicker } from "./schemas";

export const PROVIDER = "binance_spot" as const;

export const assetId = (symbol: string) => `BINANCE_SPOT:${symbol}`;

export const isSupportedInterval = (i: string): i is Interval => (INTERVALS as readonly string[]).includes(i);

/** Checa a coerência OHLC: low ≤ min(open, close) ≤ max(open, close) ≤ high e volume ≥ 0. */
export function isConsistentOhlc(c: Pick<Candle, "open" | "high" | "low" | "close" | "volumeBase">): boolean {
  const o = Number(c.open), h = Number(c.high), l = Number(c.low), cl = Number(c.close), v = Number(c.volumeBase);
  return [o, h, l, cl, v].every(Number.isFinite) && l <= Math.min(o, cl) && Math.max(o, cl) <= h && v >= 0;
}

/**
 * Converte linha REST em candle canônico. `nowMs` decide `isClosed`: a última barra devolvida pela Binance
 * pode estar em formação (closeTime no futuro).
 */
export function restKlineToCandle(row: RestKline, symbol: string, interval: Interval, nowMs: number): Candle {
  const [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades] = row;
  return CandleSchema.parse({
    symbol,
    interval,
    openTimeMs: openTime,
    closeTimeMs: closeTime,
    open,
    high,
    low,
    close,
    volumeBase: volume,
    volumeQuote: quoteVolume,
    trades,
    isClosed: closeTime < nowMs,
    provider: PROVIDER,
  });
}

export function wsKlineToCandle(ev: WsKlineEvent): Candle | null {
  const k = ev.k;
  if (!isSupportedInterval(k.i)) return null;
  return CandleSchema.parse({
    symbol: k.s,
    interval: k.i,
    openTimeMs: k.t,
    closeTimeMs: k.T,
    open: k.o,
    high: k.h,
    low: k.l,
    close: k.c,
    volumeBase: k.v,
    volumeQuote: k.q,
    trades: k.n,
    isClosed: k.x,
    provider: PROVIDER,
  });
}

/** Ordena por openTimeMs e remove duplicatas (a última ocorrência de cada chave vence). */
export function sortDedupeCandles(candles: Candle[]): Candle[] {
  const byKey = new Map<number, Candle>();
  for (const c of candles) byKey.set(c.openTimeMs, c);
  return [...byKey.values()].sort((a, b) => a.openTimeMs - b.openTimeMs);
}

export function tickerToQuote(t: Ticker24h): Quote {
  return {
    symbol: t.symbol,
    lastPrice: t.lastPrice,
    openPrice: t.openPrice,
    highPrice: t.highPrice,
    lowPrice: t.lowPrice,
    priceChange: t.priceChange,
    priceChangePercent: t.priceChangePercent,
    volumeBase: t.volume,
    volumeQuote: t.quoteVolume,
    window: "rolling_24h",
    openTimeMs: t.openTime,
    closeTimeMs: t.closeTime,
    provider: PROVIDER,
  };
}

/**
 * miniTicker não traz priceChange/percent: derivados aqui de (close − open) com aritmética decimal
 * em escala inteira para não perder precisão.
 */
export function miniTickerToQuote(m: WsMiniTicker): Quote {
  const change = subtractDecimal(m.c, m.o);
  const pct = Number(m.o) === 0 ? "0" : ((Number(m.c) - Number(m.o)) / Number(m.o) * 100).toFixed(3);
  return {
    symbol: m.s,
    lastPrice: m.c,
    openPrice: m.o,
    highPrice: m.h,
    lowPrice: m.l,
    priceChange: change,
    priceChangePercent: pct,
    volumeBase: m.v,
    volumeQuote: m.q,
    window: "rolling_24h",
    openTimeMs: m.E - 86_400_000,
    closeTimeMs: m.E,
    provider: PROVIDER,
  };
}

/** a − b em decimal exato (strings), preservando a maior escala dos operandos. */
export function subtractDecimal(a: string, b: string): string {
  const scale = Math.max(a.split(".")[1]?.length ?? 0, b.split(".")[1]?.length ?? 0);
  const toInt = (s: string) => {
    const neg = s.startsWith("-");
    const [i = "0", f = ""] = s.replace("-", "").split(".");
    const v = BigInt(i + f.padEnd(scale, "0"));
    return neg ? -v : v;
  };
  const diff = toInt(a) - toInt(b);
  const neg = diff < 0n;
  const digits = (neg ? -diff : diff).toString().padStart(scale + 1, "0");
  const int = digits.slice(0, digits.length - scale);
  const frac = scale ? "." + digits.slice(digits.length - scale) : "";
  return (neg ? "-" : "") + int + frac;
}

export function exchangeSymbolToAsset(s: ExchangeSymbol): MarketAsset {
  const tickSize = s.filters.find((f) => f.filterType === "PRICE_FILTER")?.tickSize;
  return {
    id: assetId(s.symbol),
    provider: PROVIDER,
    symbol: s.symbol,
    baseAsset: s.baseAsset,
    quoteAsset: s.quoteAsset,
    displayName: `${s.baseAsset}/${s.quoteAsset}`,
    tickSize,
    pricePrecision: tickSize ? precisionFromTickSize(tickSize) : undefined,
    status: s.status === "TRADING" ? "TRADING" : s.status === "BREAK" || s.status === "HALT" ? "HALTED" : "UNKNOWN",
  };
}
