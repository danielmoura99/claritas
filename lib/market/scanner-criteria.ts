import type { ScannerRow } from "@claritas/contracts";

export type Criterion = "regime_alta" | "regime_baixa" | "cross_recent" | "breakout_recent" | "rel_volume";
export const CRITERIA: { id: Criterion; label: string; description: string }[] = [
  { id: "regime_alta", label: "Regime de alta", description: "EMA9 > EMA21 e fechamento > SMA20" },
  { id: "regime_baixa", label: "Regime de baixa", description: "EMA9 < EMA21 e fechamento < SMA20" },
  { id: "cross_recent", label: "Cruzamento EMA recente", description: "EMA9 × EMA21 nas últimas 5 barras fechadas" },
  { id: "breakout_recent", label: "Rompimento recente", description: "Fechamento além da máx./mín. de 20 barras, últimas 5" },
  { id: "rel_volume", label: "Volume relativo ≥ 1,5×", description: "Última barra vs média de 20" },
];

/** Aplica os critérios marcados (E lógico). Sem critérios → todo o universo. Puro: testável. */
export function applyCriteria(rows: ScannerRow[], selected: Set<Criterion>, recentBars: number, minVolume: number): ScannerRow[] {
  return rows.filter((r) => {
    if (Number(r.quoteVolume24h) < minVolume) return false;
    if (selected.has("regime_alta") && r.regime !== "alta") return false;
    if (selected.has("regime_baixa") && r.regime !== "baixa") return false;
    const ev = r.lastEvent;
    if (selected.has("cross_recent") && !(ev && ev.type.startsWith("ema") && ev.barsAgo < recentBars)) return false;
    if (selected.has("breakout_recent") && !(ev && ev.type.startsWith("breakout") && ev.barsAgo < recentBars)) return false;
    if (selected.has("rel_volume") && !(r.relVolume && Number(r.relVolume) >= 1.5)) return false;
    return true;
  });
}

