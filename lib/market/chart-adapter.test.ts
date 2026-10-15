import { describe, expect, it } from "vitest";
import type { Candle } from "@claritas/contracts";
import { candleToBar, mergeCandles, upsertCandle } from "./chart-adapter";
import { feedIndicator, displayDecimals, formatPrice } from "./presentation";

// Candles fictícios de TESTE (só formato).
const T0 = Date.UTC(2023, 0, 2, 12);
const M5 = 300_000;
const c = (i: number, close: string, isClosed = false, symbol = "TESTUSDT", interval: Candle["interval"] = "5m"): Candle => ({
  symbol, interval, openTimeMs: T0 + i * M5, closeTimeMs: T0 + (i + 1) * M5 - 1, open: "100", high: "120", low: "90", close, volumeBase: "3.5", isClosed, provider: "binance_spot",
});

describe("chart-adapter", () => {
  it("converte decimal → number só na borda e mantém o tempo em ms UTC", () => {
    expect(candleToBar(c(0, "101.12345678"))).toEqual({ time: T0, open: 100, high: 120, low: 90, close: 101.12345678, volume: 3.5 });
    expect(() => candleToBar({ ...c(0, "1"), close: "NaN" })).toThrow();
  });

  it("upsert: atualiza barra corrente, acrescenta nova, nunca retrocede nem reabre", () => {
    let s = [c(0, "100", true), c(1, "101")];
    s = upsertCandle(s, c(1, "102"));
    expect(s.map((x) => x.close)).toEqual(["100", "102"]);
    s = upsertCandle(s, c(2, "103"));
    expect(s).toHaveLength(3);
    const before = s;
    expect(upsertCandle(s, c(0, "999"))).toBe(before); // mais antiga → ignorada
    s = upsertCandle(s, c(2, "104", true));
    expect(upsertCandle(s, c(2, "105", false))).toBe(s); // fechada não reabre
  });

  it("nunca mistura séries de outro símbolo/intervalo", () => {
    const s = [c(0, "100")];
    expect(upsertCandle(s, c(1, "1", false, "OTHERUSDT"))).toBe(s);
    expect(upsertCandle(s, c(1, "1", false, "TESTUSDT", "15m"))).toBe(s);
  });

  it("merge do histórico com upserts recebidos durante o carregamento", () => {
    const history = [c(0, "100", true), c(1, "101")];
    const pending = [c(2, "103"), c(1, "102", true)];
    expect(mergeCandles(history, pending).map((x) => [x.openTimeMs - T0, x.close])).toEqual([
      [0, "100"],
      [M5, "102"],
      [2 * M5, "103"],
    ]);
  });
});

describe("presentation", () => {
  it('"Ao vivo" somente com status live', () => {
    expect(feedIndicator("live").label).toBe("Ao vivo");
    for (const s of ["connecting", "stale", "reconnecting", "offline"] as const) expect(feedIndicator(s).label).not.toMatch(/vivo/i);
  });

  it("precisão de exibição vem do tickSize quando disponível", () => {
    expect(displayDecimals(81_000, 2)).toBe(2);
    expect(displayDecimals(0.08, 5)).toBe(5);
    expect(displayDecimals(0.08)).toBe(6);
    expect(formatPrice("81752.01000000", 2)).toBe("81.752,01");
    expect(formatPrice(undefined, 2)).toBe("—");
  });
});
