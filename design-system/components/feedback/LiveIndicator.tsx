import type * as React from "react";

export type LiveStatus = "live" | "analyzing" | "pre" | "auction" | "closed" | "delayed";

const STATES: Record<LiveStatus, { color: string; label: string; pulse: boolean }> = {
  live: { color: "var(--market-up)", label: "Ao vivo", pulse: true },
  analyzing: { color: "var(--accent)", label: "Analisando", pulse: true },
  pre: { color: "var(--accent)", label: "Pré-abertura", pulse: false },
  auction: { color: "var(--warn-500)", label: "Leilão", pulse: true },
  closed: { color: "var(--ink-500)", label: "Fechado", pulse: false },
  delayed: { color: "var(--info-400)", label: "Atraso 15 min", pulse: false },
};

/** Session / stream status dot + label. */
export interface LiveIndicatorProps {
  status?: LiveStatus;
  label?: string;
  /** Mono secondary text, e.g. a clock "14:32:07". */
  detail?: string;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function LiveIndicator({ status = "live", label, detail, size = "md", style }: LiveIndicatorProps) {
  const s = STATES[status] || STATES.live;
  const d = size === "sm" ? 6 : 7;
  return (
    <span role="status" style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", ...style }}>
      <span style={{ position: "relative", width: d, height: d, color: s.color }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: d, background: s.color, animation: s.pulse ? "cl-pulse 1.6s var(--ease-out) infinite" : "none" }} />
      </span>
      <span style={{ font: `var(--weight-medium) ${size === "sm" ? 10 : 11}px/1 var(--font-mono)`, letterSpacing: "var(--label-track)", textTransform: "uppercase", color: s.color }}>{label || s.label}</span>
      {detail && <span style={{ font: `var(--weight-regular) ${size === "sm" ? 10 : 11}px/1 var(--font-mono)`, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{detail}</span>}
    </span>
  );
}
