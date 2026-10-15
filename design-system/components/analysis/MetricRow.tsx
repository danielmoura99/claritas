"use client";

import * as React from "react";
import { Icon, type IconName } from "../core/Icon";

const TONES = { sand: "var(--accent)", up: "var(--market-up-text)", down: "var(--market-down-text)", neutral: "var(--text-primary)", muted: "var(--text-secondary)" } as const;

/** Key-value analysis row (regime, risk/reward, key level…). Value fades in when it changes. */
export interface MetricRowProps {
  icon?: IconName;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "sand" | "up" | "down" | "neutral" | "muted";
  dense?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function MetricRow({ icon, label, value, sub, tone = "sand", dense = false, onClick, style }: MetricRowProps) {
  const [hover, setHover] = React.useState(false);
  const col = TONES[tone] || TONES.sand;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}
      style={{
        display: "grid", gridTemplateColumns: icon ? "22px minmax(0,1fr) auto" : "minmax(0,1fr) auto", alignItems: "center", gap: 12,
        minHeight: dense ? 34 : 44, padding: "6px 2px", borderBottom: "1px solid var(--border-subtle)", cursor: onClick ? "pointer" : "default",
        background: hover && onClick ? "var(--surface-hover)" : "transparent", transition: "background var(--dur-tick) var(--ease-out)", ...style,
      }}>
      {icon && <span style={{ color: "var(--text-tertiary)" }}><Icon name={icon} size={16} strokeWidth={1.5} /></span>}
      <span style={{ font: `400 ${dense ? 12.5 : 13}px/1.3 var(--font-sans)`, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
        <span key={String(value)} style={{ font: `500 ${dense ? 12.5 : 13.5}px/1 var(--font-mono)`, color: col, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", animation: "cl-fade 500ms var(--ease-out)" }}>{value}</span>
        {sub && <span style={{ font: "400 10.5px/1 var(--font-mono)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{sub}</span>}
      </span>
    </div>
  );
}
