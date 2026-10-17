import type * as React from "react";

/** One verifiable number with its label — admin overview, account limits. Numbers in Geist Mono. */
export interface StatTileProps {
  label: string;
  /** Pre-formatted value (pt-BR). Pass `null` when the number does not exist yet — renders "—" with the hint. */
  value: React.ReactNode | null;
  hint?: React.ReactNode;
  /** sand = Claritas emphasis (use sparingly) · muted = pending/unavailable. */
  tone?: "default" | "sand" | "muted";
  /** number (default) = Geist Mono numeral · text = short label in the UI face (plan name, origin). */
  kind?: "number" | "text";
  style?: React.CSSProperties;
}

export function StatTile({ label, value, hint, tone = "default", kind = "number", style }: StatTileProps) {
  const color = tone === "sand" ? "var(--accent)" : tone === "muted" || value === null ? "var(--text-disabled)" : "var(--text-primary)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px", minWidth: 0, background: "var(--surface-panel)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-panel)", ...style }}>
      <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={kind === "text" && value !== null
        ? { font: "var(--text-heading)", color, minHeight: "var(--num-l-size)", display: "flex", alignItems: "center" }
        : { font: "var(--weight-medium) var(--num-l-size)/1 var(--font-mono)", letterSpacing: "var(--num-l-track)", fontVariantNumeric: "tabular-nums", color }}>{value ?? "—"}</span>
      {hint && <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{hint}</span>}
    </div>
  );
}
