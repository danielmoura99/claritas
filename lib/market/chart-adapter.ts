import { toChartNumber, type Candle } from "@claritas/contracts";
import type { ChartBar } from "@/design-system";

/** Borda de visualização: decimal string → number SOMENTE aqui, com validação (lança em valor não numérico). */
export function candleToBar(c: Candle): ChartBar {
  return {
    time: c.openTimeMs,
    open: toChartNumber(c.open),
    high: toChartNumber(c.high),
    low: toChartNumber(c.low),
    close: toChartNumber(c.close),
    volume: toChartNumber(c.volumeBase),
  };
}

/**
 * Aplica um upsert à série (chave = openTimeMs) sem nunca retroceder:
 * - mesma barra → substitui; barra nova → acrescenta; barra mais antiga que a última → ignora.
 * Retorna o MESMO array se nada mudou (evita re-render).
 */
export function upsertCandle(series: Candle[], c: Candle): Candle[] {
  const last = series[series.length - 1];
  if (!last) return [c];
  if (c.symbol !== last.symbol || c.interval !== last.interval) return series; // nunca mistura séries
  if (c.openTimeMs > last.openTimeMs) return [...series, c];
  if (c.openTimeMs === last.openTimeMs) {
    if (last.isClosed && !c.isClosed) return series;
    return [...series.slice(0, -1), c];
  }
  return series;
}

/** Junta histórico REST com upserts recebidos enquanto ele carregava (dedupe por openTimeMs, ordem crescente). */
export function mergeCandles(history: Candle[], pending: Candle[]): Candle[] {
  let out = history;
  for (const c of [...pending].sort((a, b) => a.openTimeMs - b.openTimeMs)) out = upsertCandle(out, c);
  return out;
}
