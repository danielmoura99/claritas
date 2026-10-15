import type * as React from "react";

const SIZE = { xs: 11, sm: 12, md: 13, lg: 15, xl: 20 } as const;
const fmt = (v: number, d: number) => Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Directional change, colored by sign. ▲/▼ are Unicode glyphs on purpose — they sit on the mono baseline in dense tables. */
export interface DeltaProps {
  value: number;
  kind?: "pct" | "abs" | "bps";
  decimals?: number;
  variant?: "text" | "pill";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  arrow?: boolean;
  sign?: boolean;
  style?: React.CSSProperties;
}

export function Delta({ value = 0, kind = "pct", decimals = 2, variant = "text", size = "md", arrow = true, sign = true, style }: DeltaProps) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  const color = dir === "up" ? "var(--market-up-text)" : dir === "down" ? "var(--market-down-text)" : "var(--market-flat)";
  const tint = dir === "up" ? "var(--market-up-tint)" : dir === "down" ? "var(--market-down-tint)" : "var(--market-flat-tint)";
  const glyph = dir === "up" ? "▲" : dir === "down" ? "▼" : "–";
  const s = sign ? (dir === "up" ? "+" : dir === "down" ? "−" : "") : "";
  const body = kind === "pct" ? `${s}${fmt(value, decimals)}%` : kind === "bps" ? `${s}${fmt(value, 0)} bps` : `${s}${fmt(value, decimals)}`;
  const fs = SIZE[size] || SIZE.md;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: Math.round(fs * 0.35), whiteSpace: "nowrap", color,
      font: `var(--weight-medium) ${fs}px/1 var(--font-mono)`, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em",
      ...(variant === "pill" ? { background: tint, padding: `${Math.round(fs * 0.3)}px ${Math.round(fs * 0.5)}px`, borderRadius: "var(--radius-sm)" } : null), ...style,
    }}>
      {arrow && <span aria-hidden style={{ fontSize: Math.round(fs * 0.62), transform: "translateY(-0.5px)" }}>{glyph}</span>}
      {body}
    </span>
  );
}
