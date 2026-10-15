/**
 * Indicadores técnicos determinísticos. Entradas: arrays em ordem cronológica crescente.
 * Saídas alinhadas ao índice da entrada; `null` onde não há barras suficientes.
 * Fórmulas documentadas em docs/ANALYSIS_METHODS.md.
 */

/** SMA_t = (1/n) Σ_{i=t−n+1..t} x_i */
export function sma(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= n) sum -= values[i - n]!;
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

/** EMA_t = α·x_t + (1−α)·EMA_{t−1}, α = 2/(n+1); semente EMA_{n−1} = SMA(n) das n primeiras. */
export function ema(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < n) return out;
  const alpha = 2 / (n + 1);
  let prev = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = prev;
  for (let i = n; i < values.length; i++) {
    prev = alpha * values[i]! + (1 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

/** TR_t = max(H−L, |H−C_{t−1}|, |L−C_{t−1}|); ATR Wilder: semente = média dos n primeiros TR, depois ATR_t = (ATR_{t−1}·(n−1) + TR_t)/n. */
export function atr(high: number[], low: number[], close: number[], n: number): (number | null)[] {
  const len = close.length;
  const out: (number | null)[] = new Array(len).fill(null);
  if (len < n + 1) return out;
  const tr: number[] = [];
  for (let i = 1; i < len; i++) {
    tr.push(Math.max(high[i]! - low[i]!, Math.abs(high[i]! - close[i - 1]!), Math.abs(low[i]! - close[i - 1]!)));
  }
  let prev = tr.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n] = prev;
  for (let i = n + 1; i < len; i++) {
    prev = (prev * (n - 1) + tr[i - 1]!) / n;
    out[i] = prev;
  }
  return out;
}

/** Desvio-padrão amostral dos retornos logarítmicos r_t = ln(C_t / C_{t−1}) nas últimas n barras (em %, por barra). */
export function logReturnStdevPct(close: number[], n: number): number | null {
  if (close.length < n + 1) return null;
  const r: number[] = [];
  for (let i = close.length - n; i < close.length; i++) r.push(Math.log(close[i]! / close[i - 1]!));
  const mean = r.reduce((a, b) => a + b, 0) / r.length;
  const variance = r.reduce((a, b) => a + (b - mean) ** 2, 0) / (r.length - 1);
  return Math.sqrt(variance) * 100;
}

/** Canal de Donchian: maior máxima / menor mínima das n barras até t (inclusive). */
export function donchian(high: number[], low: number[], n: number, endIndex = high.length - 1): { upper: number; lower: number } | null {
  if (endIndex + 1 < n) return null;
  let upper = -Infinity, lower = Infinity;
  for (let i = endIndex - n + 1; i <= endIndex; i++) {
    upper = Math.max(upper, high[i]!);
    lower = Math.min(lower, low[i]!);
  }
  return { upper, lower };
}

/** Índices em que a série rápida cruza a lenta: para cima (fast_{t−1} ≤ slow_{t−1} e fast_t > slow_t) ou para baixo. */
export function crossovers(fast: (number | null)[], slow: (number | null)[]): { index: number; direction: "up" | "down" }[] {
  const out: { index: number; direction: "up" | "down" }[] = [];
  for (let i = 1; i < fast.length; i++) {
    const f0 = fast[i - 1], s0 = slow[i - 1], f1 = fast[i], s1 = slow[i];
    if (f0 == null || s0 == null || f1 == null || s1 == null) continue;
    if (f0 <= s0 && f1 > s1) out.push({ index: i, direction: "up" });
    else if (f0 >= s0 && f1 < s1) out.push({ index: i, direction: "down" });
  }
  return out;
}

/**
 * Rompimentos de Donchian: fechamento acima da máxima (ou abaixo da mínima) das n barras ANTERIORES.
 * Só a PRIMEIRA barra de uma sequência conta (numa tendência, toda barra romperia — isso não é um evento novo).
 */
export function donchianBreakouts(high: number[], low: number[], close: number[], n: number): { index: number; direction: "up" | "down"; level: number }[] {
  const out: { index: number; direction: "up" | "down"; level: number }[] = [];
  let prev: "up" | "down" | null = null;
  for (let i = n; i < close.length; i++) {
    const ch = donchian(high, low, n, i - 1)!;
    const dir = close[i]! > ch.upper ? "up" : close[i]! < ch.lower ? "down" : null;
    if (dir && dir !== prev) out.push({ index: i, direction: dir, level: dir === "up" ? ch.upper : ch.lower });
    prev = dir;
  }
  return out;
}

/** Número → string decimal sem notação científica, com `digits` casas. */
export function toDecimalString(v: number, digits: number): string {
  if (!Number.isFinite(v)) throw new Error("valor não finito");
  const s = v.toFixed(Math.max(0, Math.min(12, digits)));
  return s === "-0" || /^-0\.0*$/.test(s) ? s.slice(1) : s;
}
