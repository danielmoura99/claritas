import type * as React from "react";

/** Brand name set in Instrument Serif. No logo was supplied — never add a symbol. */
export interface WordmarkProps {
  size?: number;
  color?: string;
  /** Mono product suffix, e.g. "Terminal". */
  product?: string;
  style?: React.CSSProperties;
}

export function Wordmark({ size = 22, color = "var(--text-primary)", product, style }: WordmarkProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: Math.round(size * 0.45), whiteSpace: "nowrap", ...style }}>
      <span style={{ font: `400 ${size}px/1 var(--font-serif)`, letterSpacing: "-0.01em", color }}>Claritas</span>
      {product && <span style={{ font: `var(--weight-medium) ${Math.max(10, Math.round(size * 0.42))}px/1 var(--font-mono)`, letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{product}</span>}
    </span>
  );
}
