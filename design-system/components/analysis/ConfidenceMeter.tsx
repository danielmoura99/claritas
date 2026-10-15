import type * as React from "react";

/** Segmented bar or arc showing how sure Claritas is. Segments fill in sequence on mount/change. */
export interface ConfidenceMeterProps {
  /** 0–100 */
  value: number;
  variant?: "bar" | "arc";
  segments?: number;
  label?: string | null;
  showValue?: boolean;
  size?: "sm" | "md";
  tone?: "sand" | "up" | "down";
  style?: React.CSSProperties;
}

export function ConfidenceMeter({ value = 0, variant = "bar", segments = 12, label = "Confiança", showValue = true, size = "md", tone = "sand", style }: ConfidenceMeterProps) {
  const v = Math.max(0, Math.min(100, value));
  const col = tone === "up" ? "var(--market-up)" : tone === "down" ? "var(--market-down)" : "var(--accent)";
  if (variant === "arc") {
    const d = size === "sm" ? 64 : 96, sw = size === "sm" ? 5 : 7, r = (d - sw) / 2, c = Math.PI * r;
    return (
      <div role="meter" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label || "Confiança"} style={{ position: "relative", width: d, height: d / 2 + 6, ...style }}>
        <svg width={d} height={d / 2 + sw} viewBox={`0 0 ${d} ${d / 2 + sw}`} style={{ display: "block", overflow: "visible" }}>
          <path d={`M${sw / 2},${d / 2} A${r},${r} 0 0 1 ${d - sw / 2},${d / 2}`} fill="none" stroke="var(--track)" strokeWidth={sw} strokeLinecap="round" />
          <path d={`M${sw / 2},${d / 2} A${r},${r} 0 0 1 ${d - sw / 2},${d / 2}`} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset var(--dur-draw) var(--ease-out)", filter: tone === "sand" ? "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 50%, transparent))" : "none" }} />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center" }}>
          <div style={{ font: `var(--weight-medium) ${size === "sm" ? 15 : 22}px/1 var(--font-mono)`, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{Math.round(v)}<span style={{ fontSize: "0.55em", color: "var(--text-tertiary)" }}>%</span></div>
        </div>
      </div>
    );
  }
  const lit = Math.round((v / 100) * segments);
  const h = size === "sm" ? 6 : 10;
  return (
    <div role="meter" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label || "Confiança"} style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0, ...style }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {label && <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>}
          {showValue && <span style={{ font: "var(--weight-medium) 12px/1 var(--font-mono)", color: col }}>{Math.round(v)}%</span>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${segments},1fr)`, gap: 2 }}>
        {Array.from({ length: segments }, (_, i) => (
          <span key={i} style={{ height: h, borderRadius: 1.5, background: i < lit ? col : "var(--track)", opacity: i < lit ? 0.45 + (0.55 * (i + 1)) / Math.max(1, lit) : 1,
            transition: `background var(--dur-fast) var(--ease-out) ${i * 40}ms, opacity var(--dur-fast) var(--ease-out) ${i * 40}ms` }} />
        ))}
      </div>
    </div>
  );
}
