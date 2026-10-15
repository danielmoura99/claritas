import { describe, expect, it } from "vitest";
import type { ScannerRow } from "@claritas/contracts";
import { applyCriteria, type Criterion } from "./scanner-criteria";

// Linhas FICTÍCIAS de teste.
const row = (symbol: string, over: Partial<ScannerRow>): ScannerRow => ({
  symbol, displayName: symbol, rank: 1, lastPrice: "1", change24hPct: "0", quoteVolume24h: "200000000", high24h: "1", low24h: "1",
  regime: "indefinido", lastEvent: null, relVolume: "1.00", volatilityPct: "0.1", changeNPct: "0", closes: [], lastClosedOpenTimeMs: 0, ...over,
});
const rows = [
  row("A", { regime: "alta", lastEvent: { type: "ema_cross_up", openTimeMs: 1, barsAgo: 2 }, relVolume: "2.00" }),
  row("B", { regime: "baixa", lastEvent: { type: "breakout_low", openTimeMs: 1, barsAgo: 1 } }),
  row("C", { regime: "alta", lastEvent: { type: "ema_cross_up", openTimeMs: 1, barsAgo: 9 }, quoteVolume24h: "5" }),
];
const pick = (sel: Criterion[], minVol = 0) => applyCriteria(rows, new Set(sel), 5, minVol).map((r) => r.symbol);

describe("critérios do scanner", () => {
  it("sem critérios devolve o universo", () => expect(pick([])).toEqual(["A", "B", "C"]));
  it("regime", () => {
    expect(pick(["regime_alta"])).toEqual(["A", "C"]);
    expect(pick(["regime_baixa"])).toEqual(["B"]);
  });
  it("evento recente usa a janela de barras", () => {
    expect(pick(["cross_recent"])).toEqual(["A"]);
    expect(pick(["breakout_recent"])).toEqual(["B"]);
  });
  it("critérios combinam com E lógico e filtro de volume", () => {
    expect(pick(["regime_alta", "rel_volume"])).toEqual(["A"]);
    expect(pick(["regime_alta"], 100_000_000)).toEqual(["A"]);
  });
});
