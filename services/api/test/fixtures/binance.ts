// FIXTURES DE TESTE — formato Binance Spot, valores fictícios. Proibido importar fora de test/.
export const T0 = Date.UTC(2023, 0, 2, 12, 0, 0); // 2023-01-02T12:00:00Z
export const FIVE_MIN = 300_000;

/** Linha REST de kline: [openTime, o, h, l, c, v, closeTime, q, trades, takerBase, takerQuote, ignore]. */
export const kline = (i: number, o = "100.00000000", h = "110.00000000", l = "90.00000000", c = "105.00000000") =>
  [T0 + i * FIVE_MIN, o, h, l, c, "10.00000000", T0 + (i + 1) * FIVE_MIN - 1, "1000.00000000", 42, "5.0", "500.0", "0"] as const;

export const exchangeInfo = {
  serverTime: T0,
  symbols: [
    { symbol: "TESTUSDT", status: "TRADING", baseAsset: "TEST", quoteAsset: "USDT", filters: [{ filterType: "PRICE_FILTER", tickSize: "0.01000000" }] },
    { symbol: "HALTUSDT", status: "BREAK", baseAsset: "HALT", quoteAsset: "USDT", filters: [] },
    { symbol: "TESTBTC", status: "TRADING", baseAsset: "TEST", quoteAsset: "BTC", filters: [{ filterType: "PRICE_FILTER", tickSize: "0.00000100" }] },
  ],
};

export const ticker = (symbol = "TESTUSDT") => ({
  symbol,
  priceChange: "5.00000000",
  priceChangePercent: "5.000",
  lastPrice: "105.00000000",
  openPrice: "100.00000000",
  highPrice: "110.00000000",
  lowPrice: "90.00000000",
  volume: "1000.00000000",
  quoteVolume: "100000.00000000",
  openTime: T0 - 86_400_000,
  closeTime: T0,
});

export const wsKline = (i: number, closed: boolean, close = "105.00000000", interval = "5m") => ({
  e: "kline",
  E: T0 + i * FIVE_MIN + 1_000,
  s: "TESTUSDT",
  k: { t: T0 + i * FIVE_MIN, T: T0 + (i + 1) * FIVE_MIN - 1, s: "TESTUSDT", i: interval, o: "100.00000000", c: close, h: "110.00000000", l: "90.00000000", v: "10.00000000", n: 7, x: closed, q: "1000.00000000" },
});

export const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
