"use client";

import * as React from "react";

const SIZE = { xs: "var(--num-xs-size)", sm: "var(--num-s-size)", md: "var(--num-m-size)", lg: "var(--num-l-size)", xl: "var(--num-xl-size)" } as const;
const TRACK = { xs: "0", sm: "0", md: "var(--num-m-track)", lg: "var(--num-l-track)", xl: "var(--num-xl-track)" } as const;
const fmt = (v: number, d: number) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Live price. On each change only the digits that moved flash (up / down) — the eye goes straight to the tick. */
export interface PriceTickerProps {
  value: number;
  decimals?: number;
  /** Currency/unit prefix, e.g. "R$" or "pts". */
  prefix?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: number;
  flash?: boolean;
  color?: string;
  style?: React.CSSProperties;
}

type Tick = { n: number; dir: "up" | "down" | null; from: number; prev: number };

export function PriceTicker({ value, decimals = 2, prefix, size = "md", weight = 500, flash = true, color = "var(--text-primary)", style }: PriceTickerProps) {
  const str = fmt(value, decimals);
  // Derive the flash from the previous value during render (React's "store info from previous renders" pattern).
  const [tick, setTick] = React.useState<Tick>({ n: 0, dir: null, from: -1, prev: value });
  if (tick.prev !== value) {
    if (!flash) setTick({ ...tick, prev: value });
    else {
      const old = fmt(tick.prev, decimals);
      let i = 0; while (i < str.length && str[i] === old[i]) i++;
      setTick({ n: tick.n + 1, dir: value > tick.prev ? "up" : "down", from: old.length === str.length ? i : 0, prev: value });
    }
  }
  const split = tick.dir && tick.from >= 0 ? tick.from : str.length;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: "0.3em", whiteSpace: "nowrap", color, font: `${weight} ${SIZE[size] || SIZE.md}/1 var(--font-mono)`, letterSpacing: TRACK[size], fontVariantNumeric: "tabular-nums slashed-zero", ...style }}>
      {prefix && <span style={{ fontSize: "0.62em", color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: 0 }}>{prefix}</span>}
      <span>
        {str.slice(0, split)}
        {split < str.length && <span key={tick.n} style={{ borderRadius: 2, animation: `${tick.dir === "up" ? "cl-flash-up" : "cl-flash-down"} 900ms var(--ease-out)` }}>{str.slice(split)}</span>}
      </span>
    </span>
  );
}
