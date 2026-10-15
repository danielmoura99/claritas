import type * as React from "react";
import { Icon, type IconName } from "./Icon";

export type BadgeTone = "neutral" | "up" | "down" | "sand" | "info" | "warn";

const TONES: Record<BadgeTone, { fg: string; tint: string; solid: string; solidFg: string; line: string }> = {
  neutral: { fg: "var(--text-secondary)", tint: "var(--tint-neutral)", solid: "var(--ink-600)", solidFg: "var(--ink-50)", line: "var(--border-strong)" },
  up: { fg: "var(--market-up-text)", tint: "var(--market-up-tint)", solid: "var(--market-up)", solidFg: "var(--text-on-up)", line: "var(--market-up-line)" },
  down: { fg: "var(--market-down-text)", tint: "var(--market-down-tint)", solid: "var(--market-down)", solidFg: "var(--text-on-down)", line: "var(--market-down-line)" },
  sand: { fg: "var(--accent)", tint: "var(--accent-tint)", solid: "var(--accent)", solidFg: "var(--text-on-accent)", line: "var(--accent-line)" },
  info: { fg: "var(--status-info)", tint: "var(--status-info-tint)", solid: "var(--info-500)", solidFg: "var(--text-on-info)", line: "var(--status-info-line)" },
  warn: { fg: "var(--warn-400)", tint: "var(--status-warn-tint)", solid: "var(--warn-500)", solidFg: "var(--text-on-warn)", line: "var(--status-warn-line)" },
};

/** Compact mono uppercase status label. */
export interface BadgeProps {
  tone?: BadgeTone;
  variant?: "soft" | "outline" | "solid";
  size?: "sm" | "md";
  icon?: IconName;
  dot?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ tone = "neutral", variant = "soft", size = "md", icon, dot = false, children, style }: BadgeProps) {
  const t = TONES[tone] || TONES.neutral;
  const sm = size === "sm";
  const solid = variant === "solid";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, height: sm ? 18 : 22, padding: sm ? "0 6px" : "0 8px",
      font: `var(--weight-medium) ${sm ? 10 : 10.5}px/1 var(--font-mono)`, letterSpacing: "var(--label-track)", textTransform: "uppercase", whiteSpace: "nowrap",
      color: solid ? t.solidFg : t.fg, background: solid ? t.solid : variant === "outline" ? "transparent" : t.tint,
      border: `1px solid ${variant === "outline" ? t.line : "transparent"}`, borderRadius: "var(--radius-sm)", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 6, background: "currentColor" }} />}
      {icon && <Icon name={icon} size={sm ? 11 : 12} strokeWidth={2} />}
      {children}
    </span>
  );
}
