import { describe, expect, it } from "vitest";
import {
  exchangeSymbolToAsset,
  isConsistentOhlc,
  miniTickerToQuote,
  restKlineToCandle,
  sortDedupeCandles,
  subtractDecimal,
  wsKlineToCandle,
} from "../../src/providers/binance/normalize";
import { RestKlineSchema, WsKlineEventSchema } from "../../src/providers/binance/schemas";
import { FIVE_MIN, T0, exchangeInfo, kline, wsKline } from "../fixtures/binance";

describe("normalização Binance → contrato Claritas", () => {
  it("mantém timestamps UTC em ms e decimais como string sem arredondar", () => {
    const row = RestKlineSchema.parse([...kline(0, "16612.12345678")]);
    const c = restKlineToCandle(row, "TESTUSDT", "5m", T0 + 10 * FIVE_MIN);
    expect(c.openTimeMs).toBe(T0);
    expect(new Date(c.openTimeMs).toISOString()).toBe("2023-01-02T12:00:00.000Z");
    expect(c.closeTimeMs).toBe(T0 + FIVE_MIN - 1);
    expect(c.open).toBe("16612.12345678");
    expect(c.volumeBase).toBe("10.00000000");
    expect(c.volumeQuote).toBe("1000.00000000");
    expect(c.provider).toBe("binance_spot");
  });

  it("marca a barra em formação como aberta (closeTime no futuro)", () => {
    const row = RestKlineSchema.parse([...kline(5)]);
    expect(restKlineToCandle(row, "TESTUSDT", "5m", T0 + 5 * FIVE_MIN + 10).isClosed).toBe(false);
    expect(restKlineToCandle(row, "TESTUSDT", "5m", T0 + 6 * FIVE_MIN).isClosed).toBe(true);
  });

  it("ordena por openTimeMs e deduplica (último vence)", () => {
    const mk = (i: number, close: string) => restKlineToCandle(RestKlineSchema.parse([...kline(i, "100", "120", "90", close)]), "TESTUSDT", "5m", T0);
    const out = sortDedupeCandles([mk(2, "101"), mk(0, "100"), mk(2, "111"), mk(1, "100")]);
    expect(out.map((c) => c.openTimeMs)).toEqual([T0, T0 + FIVE_MIN, T0 + 2 * FIVE_MIN]);
    expect(out[2]!.close).toBe("111");
  });

  it("valida coerência OHLC", () => {
    expect(isConsistentOhlc({ open: "100", high: "110", low: "90", close: "105", volumeBase: "1" })).toBe(true);
    expect(isConsistentOhlc({ open: "100", high: "99", low: "90", close: "105", volumeBase: "1" })).toBe(false);
    expect(isConsistentOhlc({ open: "100", high: "110", low: "101", close: "105", volumeBase: "1" })).toBe(false);
    expect(isConsistentOhlc({ open: "100", high: "110", low: "90", close: "105", volumeBase: "-1" })).toBe(false);
  });

  it("evento WS respeita a flag x e ignora intervalos não suportados", () => {
    const open = wsKlineToCandle(WsKlineEventSchema.parse(wsKline(3, false)));
    const closed = wsKlineToCandle(WsKlineEventSchema.parse(wsKline(3, true)));
    expect(open?.isClosed).toBe(false);
    expect(closed?.isClosed).toBe(true);
    expect(open?.openTimeMs).toBe(T0 + 3 * FIVE_MIN);
    expect(wsKlineToCandle(WsKlineEventSchema.parse(wsKline(3, false, "1", "1M")))).toBeNull();
  });

  it("subtração decimal exata", () => {
    expect(subtractDecimal("81760.00000000", "83319.78000000")).toBe("-1559.78000000");
    expect(subtractDecimal("0.3", "0.1")).toBe("0.2");
    expect(subtractDecimal("1", "0.00000001")).toBe("0.99999999");
  });

  it("miniTicker deriva variação de 24h explícita", () => {
    const q = miniTickerToQuote({ e: "24hrMiniTicker", E: T0, s: "TESTUSDT", c: "105.00", o: "100.00", h: "110", l: "90", v: "1", q: "100" });
    expect(q.priceChange).toBe("5.00");
    expect(q.priceChangePercent).toBe("5.000");
    expect(q.window).toBe("rolling_24h");
  });

  it("exchangeInfo vira ativo com id interno e precisão", () => {
    const a = exchangeSymbolToAsset(exchangeInfo.symbols[0]!);
    expect(a).toMatchObject({ id: "BINANCE_SPOT:TESTUSDT", symbol: "TESTUSDT", status: "TRADING", pricePrecision: 2, displayName: "TEST/USDT" });
    expect(exchangeSymbolToAsset(exchangeInfo.symbols[1]!).status).toBe("HALTED");
  });
});
