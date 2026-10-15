import { describe, expect, it } from "vitest";
import {
  CandleSchema,
  CandlesQuerySchema,
  ClientMessageSchema,
  IntervalSchema,
  ServerMessageSchema,
  SymbolSchema,
  precisionFromTickSize,
  toChartNumber,
} from "../src";

// Fixture de teste (formato apenas) — não é dado de mercado.
const candle = {
  symbol: "BTCUSDT",
  interval: "5m",
  openTimeMs: 1_700_000_000_000,
  closeTimeMs: 1_700_000_299_999,
  open: "100.10",
  high: "101.00",
  low: "99.90",
  close: "100.50",
  volumeBase: "12.5",
  isClosed: false,
  provider: "binance_spot",
};

describe("contracts/market", () => {
  it("intervalos são case-sensitive (1m ≠ 1M)", () => {
    expect(IntervalSchema.safeParse("1m").success).toBe(true);
    expect(IntervalSchema.safeParse("1M").success).toBe(false);
  });

  it("normaliza símbolo para maiúsculas e rejeita caracteres inválidos", () => {
    expect(SymbolSchema.parse(" btcusdt ")).toBe("BTCUSDT");
    expect(SymbolSchema.safeParse("BTC-USDT").success).toBe(false);
    expect(SymbolSchema.safeParse("PETR4; DROP").success).toBe(false);
  });

  it("aceita candle válido e exige decimais em string", () => {
    expect(CandleSchema.parse(candle).close).toBe("100.50");
    expect(CandleSchema.safeParse({ ...candle, close: 100.5 }).success).toBe(false);
    expect(CandleSchema.safeParse({ ...candle, close: "1e5" }).success).toBe(false);
  });

  it("rejeita candle com closeTime anterior ao openTime", () => {
    expect(CandleSchema.safeParse({ ...candle, closeTimeMs: candle.openTimeMs }).success).toBe(false);
  });

  it("query de candles aplica default e limites", () => {
    expect(CandlesQuerySchema.parse({ symbol: "ethusdt", interval: "15m" })).toEqual({ symbol: "ETHUSDT", interval: "15m", limit: 500 });
    expect(CandlesQuerySchema.safeParse({ symbol: "BTCUSDT", interval: "5m", limit: "1001" }).success).toBe(false);
    expect(CandlesQuerySchema.safeParse({ symbol: "BTCUSDT", interval: "2h" }).success).toBe(false);
  });

  it("converte decimal para number só na borda e falha em lixo", () => {
    expect(toChartNumber("81752.01000000")).toBe(81752.01);
    expect(() => toChartNumber("abc")).toThrow();
  });

  it("deriva precisão do tickSize", () => {
    expect(precisionFromTickSize("0.01000000")).toBe(2);
    expect(precisionFromTickSize("1.00000000")).toBe(0);
    expect(precisionFromTickSize("0.00001000")).toBe(5);
  });
});

describe("contracts/stream", () => {
  it("valida mensagens do cliente", () => {
    expect(ClientMessageSchema.parse({ type: "subscribe", channel: "candles", symbol: "btcusdt", interval: "5m" })).toMatchObject({ symbol: "BTCUSDT" });
    expect(ClientMessageSchema.safeParse({ type: "subscribe", channel: "candles", symbol: "BTCUSDT", interval: "1M" }).success).toBe(false);
    expect(ClientMessageSchema.safeParse({ type: "hack" }).success).toBe(false);
  });

  it("valida candle.upsert do servidor", () => {
    const msg = { type: "candle.upsert", data: candle, source: "binance_spot", receivedAt: new Date(0).toISOString(), eventTimeMs: 1 };
    expect(ServerMessageSchema.parse(msg).type).toBe("candle.upsert");
  });
});
