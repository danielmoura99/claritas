"use client";

import type * as React from "react";
import { useTween } from "../../lib/useTween";

const WORDS: [number, string][] = [[20, "Vendedor forte"], [40, "Vendedor"], [60, "Neutro"], [80, "Comprador"], [101, "Comprador forte"]];

/** Market sentiment 0–100 as a tick-mark arc. Ticks light up in sand toward the value; number tweens; serif verdict. */
export interface SentimentGaugeProps {
  value: number;
  size?: number;
  ticks?: number;
  /** Override the auto verdict ("Comprador", "Neutro"…). */
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  style?: React.CSSProperties;
}

export function SentimentGauge({ value = 50, size = 200, ticks = 44, label, minLabel = "Extremo vendedor", maxLabel = "Extremo comprador", style }: SentimentGaugeProps) {
  const v = useTween(Math.max(0, Math.min(100, value)));
  const cx = size / 2, cy = size / 2, r1 = size / 2 - 4, r2 = r1 - size * 0.075;
  const word = label || (WORDS.find(([m]) => v < m) ?? WORDS[WORDS.length - 1])[1];
  const lit = (v / 100) * (ticks - 1);
  const ang = (i: number) => Math.PI + (i / (ticks - 1)) * Math.PI;
  const ea = ang(lit);
  return (
    <div role="meter" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={`Sentimento: ${word}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size, ...style }}>
      <div style={{ position: "relative", width: size, height: size / 2 + 8 }}>
        <svg width={size} height={size / 2 + 8} style={{ display: "block", overflow: "visible" }}>
          {Array.from({ length: ticks }, (_, i) => {
            const a = ang(i), on = i <= lit, near = Math.max(0, 1 - Math.abs(i - lit) / 6);
            return <line key={i} x1={cx + Math.cos(a) * r2} y1={cy + Math.sin(a) * r2} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1}
              stroke={on ? "var(--accent)" : "var(--track)"} strokeOpacity={on ? 0.35 + 0.65 * (i / Math.max(1, lit)) : 1} strokeWidth={on && near > 0.6 ? 2.4 : 1.6} strokeLinecap="round" />;
          })}
          <circle cx={cx + Math.cos(ea) * (r1 + 7)} cy={cy + Math.sin(ea) * (r1 + 7)} r={3.5} fill="var(--accent)" style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 90%, transparent))" }} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ font: `300 ${Math.round(size * 0.22)}px/1 var(--font-mono)`, letterSpacing: "-0.04em", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}</span>
          <span style={{ font: `400 ${Math.round(size * 0.085)}px/1 var(--font-serif)`, fontStyle: "italic", color: "var(--accent)" }}>{word}</span>
        </div>
      </div>
      {(minLabel || maxLabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 8, font: "400 10.5px/1 var(--font-sans)", color: "var(--text-tertiary)" }}>
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
