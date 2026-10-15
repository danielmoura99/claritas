import { describe, expect, it } from "vitest";
import type { Candle } from "@claritas/contracts";
import { atr, crossovers, donchian, donchianBreakouts, ema, logReturnStdevPct, sma, toDecimalString } from "../../src/modules/analysis/indicators";
import { computeAnalysis } from "../../src/modules/analysis/analysis-service";

describe("indicadores — valores conhecidos", () => {
  it("SMA", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("EMA com semente SMA e α = 2/(n+1)", () => {
    // n=3, α=0.5: semente = (1+2+3)/3 = 2; EMA_3 = 0.5·4 + 0.5·2 = 3; EMA_4 = 0.5·5 + 0.5·3 = 4
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
    expect(ema([1, 2], 3)).toEqual([null, null]);
  });

  it("ATR de Wilder", () => {
    const h = [10, 12, 13, 12], l = [8, 9, 11, 10], c = [9, 11, 12, 11];
    // TR: [max(3,3,0)=3, max(2,2,0)=2, max(2,0,2)=2]; n=2 → semente (3+2)/2=2.5 em t=2; t=3: (2.5·1+2)/2 = 2.25
    expect(atr(h, l, c, 2)).toEqual([null, null, 2.5, 2.25]);
  });

  it("volatilidade = desvio-padrão amostral dos retornos log (%)", () => {
    const c = [100, 110, 99];
    const r = [Math.log(1.1), Math.log(99 / 110)];
    const m = (r[0]! + r[1]!) / 2;
    const expected = Math.sqrt(((r[0]! - m) ** 2 + (r[1]! - m) ** 2) / 1) * 100;
    expect(logReturnStdevPct(c, 2)).toBeCloseTo(expected, 10);
    expect(logReturnStdevPct(c, 3)).toBeNull();
  });

  it("Donchian e rompimentos usam só as barras ANTERIORES", () => {
    const h = [5, 6, 7, 6, 9], l = [1, 2, 3, 2, 4], c = [4, 5, 6, 5, 8];
    expect(donchian(h, l, 3)).toEqual({ upper: 9, lower: 2 });
    expect(donchianBreakouts(h, l, c, 3)).toEqual([{ index: 4, direction: "up", level: 7 }]);
    // sequência de rompimentos: só a primeira barra
    expect(donchianBreakouts([5, 5, 5, 6, 7, 8], [1, 1, 1, 1, 1, 1], [4, 4, 4, 6, 7, 8], 3).map((b) => b.index)).toEqual([3]);
  });

  it("cruzamentos para cima e para baixo", () => {
    expect(crossovers([1, 2, 3, 2], [2, 2, 2, 2.5])).toEqual([
      { index: 2, direction: "up" },
      { index: 3, direction: "down" },
    ]);
    expect(crossovers([null, 1, 3], [null, 2, 2])).toEqual([{ index: 2, direction: "up" }]);
  });

  it("decimal sem notação científica e sem -0", () => {
    expect(toDecimalString(81752.0123456, 4)).toBe("81752.0123");
    expect(toDecimalString(-0.00001, 2)).toBe("0.00");
    expect(() => toDecimalString(Number.NaN, 2)).toThrow();
  });
});

// Série de TESTE sintética: tendência linear de alta (fictícia), só para exercitar as regras.
const T0 = Date.UTC(2023, 0, 2);
const M5 = 300_000;
const series = (n: number, f: (i: number) => number): Candle[] =>
  Array.from({ length: n }, (_, i) => {
    const c = f(i);
    return { symbol: "TESTUSDT", interval: "5m", openTimeMs: T0 + i * M5, closeTimeMs: T0 + (i + 1) * M5 - 1, open: String(c - 0.5), high: String(c + 1), low: String(c - 1), close: String(c), volumeBase: "1", volumeQuote: String(100 + (i % 3)), isClosed: true, provider: "binance_spot" };
  });

describe("computeAnalysis", () => {
  it("tendência de alta → regime 'alta' com evidência e regra explícita", () => {
    const a = computeAnalysis("TESTUSDT", "5m", series(60, (i) => 100 + i), false, 4, T0);
    expect(a.regime.state).toBe("alta");
    expect(a.regime.rule).toMatch(/não é previsão nem probabilidade/);
    expect(Number(a.regime.evidence.ema9)).toBeGreaterThan(Number(a.regime.evidence.ema21));
    expect(a.basis).toMatchObject({ candles: 60, includesOpenCandle: false, lastOpenTimeMs: T0 + 59 * M5 });
    for (const i of a.indicators) {
      expect(i.formula.length).toBeGreaterThan(0);
      expect(i.algorithm.length).toBeGreaterThan(0);
      expect(i.minBars).toBeGreaterThan(0);
    }
    expect(a.indicators.find((i) => i.id === "sma20")!.value).toBe((159 - 9.5).toFixed(4)); // média de 140..159
    expect(a.levels.map((l) => l.id)).toEqual(["donchian_high", "donchian_low"]);
    // Nenhum campo de probabilidade/confiança (a regra só traz o aviso de que NÃO é probabilidade).
    expect(JSON.stringify({ ...a, regime: { ...a.regime, rule: "" } })).not.toMatch(/probabil|confian|acerto/i);
    expect(a.events.filter((e) => e.type === "breakout_high").length).toBeLessThanOrEqual(1); // sequência conta no máximo uma vez
  });

  it("tendência de baixa → 'baixa'; virada gera cruzamento EMA", () => {
    const down = computeAnalysis("TESTUSDT", "5m", series(60, (i) => 200 - i), false, 4, T0);
    expect(down.regime.state).toBe("baixa");
    const v = computeAnalysis("TESTUSDT", "5m", series(80, (i) => (i < 40 ? 200 - i : 160 + (i - 40) * 3)), false, 4, T0);
    expect(v.events.some((e) => e.type === "ema_cross_up")).toBe(true);
    expect(v.events.every((e, k, arr) => k === 0 || arr[k - 1]!.openTimeMs >= e.openTimeMs)).toBe(true); // mais recentes primeiro
  });

  it("séries das médias para o gráfico começam quando há barras suficientes", () => {
    const a = computeAnalysis("TESTUSDT", "5m", series(60, (i) => 100 + i), false, 4, T0);
    expect(a.series.ema9![0]!.t).toBe(T0 + 8 * M5);
    expect(a.series.ema21![0]!.t).toBe(T0 + 20 * M5);
  });
});
