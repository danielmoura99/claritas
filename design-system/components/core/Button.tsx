"use client";

import * as React from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "buy" | "sell";
export type ButtonSize = "sm" | "md" | "lg";

const SIZES: Record<ButtonSize, { h: string; px: number; fs: number; gap: number; icon: number }> = {
  sm: { h: "var(--control-h-sm)", px: 10, fs: 12, gap: 6, icon: 14 },
  md: { h: "var(--control-h-md)", px: 14, fs: 13, gap: 7, icon: 15 },
  lg: { h: "var(--control-h-lg)", px: 18, fs: 14, gap: 8, icon: 16 },
};
const VARIANTS: Record<ButtonVariant, { bg: string; hover: string; active: string; fg: string; hoverFg?: string; border: string }> = {
  primary: { bg: "var(--accent)", hover: "var(--accent-hover)", active: "var(--accent-pressed)", fg: "var(--text-on-accent)", border: "transparent" },
  secondary: { bg: "var(--surface-raised)", hover: "var(--surface-hover)", active: "var(--surface-active)", fg: "var(--text-primary)", border: "var(--border-default)" },
  ghost: { bg: "transparent", hover: "var(--surface-hover)", active: "var(--surface-active)", fg: "var(--text-secondary)", hoverFg: "var(--text-primary)", border: "transparent" },
  outline: { bg: "transparent", hover: "var(--accent-tint)", active: "var(--accent-tint-strong)", fg: "var(--accent)", border: "var(--accent-line)" },
  buy: { bg: "var(--order-buy)", hover: "var(--order-buy-hover)", active: "var(--order-buy-pressed)", fg: "var(--text-on-up)", border: "transparent" },
  sell: { bg: "var(--order-sell)", hover: "var(--order-sell-hover)", active: "var(--order-sell-pressed)", fg: "var(--text-on-down)", border: "transparent" },
};

/** Action button. Primary (sand) is the single most important action per view; buy/sell are order-intent only. */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Lucide icon name rendered before the label. */
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Keyboard hint shown inside the button, e.g. "⌘K". */
  kbd?: string;
  type?: "button" | "submit" | "reset";
  /** Force a visual state (docs/showcase only). */
  forceState?: "hover" | "active" | "focus";
}

export function Button({ variant = "secondary", size = "md", icon, iconRight, loading = false, disabled = false, fullWidth = false, kbd, children, style, onClick, type = "button", forceState, ...rest }: ButtonProps) {
  const [hoverState, setHover] = React.useState(false);
  const [downState, setDown] = React.useState(false);
  const [focusState, setFocus] = React.useState(false);
  const focus = focusState || forceState === "focus";
  const hover = hoverState || forceState === "hover";
  const down = downState || forceState === "active";
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const off = disabled || loading;
  const bg = off ? v.bg : down ? v.active : hover ? v.hover : v.bg;
  return (
    <button type={type} disabled={off} onClick={onClick} aria-busy={loading || undefined}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)} onMouseUp={() => setDown(false)}
      onFocus={e => setFocus(e.currentTarget.matches(":focus-visible"))} onBlur={() => setFocus(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: s.gap,
        height: s.h, padding: `0 ${s.px}px`, width: fullWidth ? "100%" : undefined,
        font: `var(--weight-medium) ${s.fs}px/1 var(--font-sans)`, letterSpacing: "-0.005em", whiteSpace: "nowrap",
        color: hover && v.hoverFg && !off ? v.hoverFg : v.fg, background: bg,
        border: `1px solid ${v.border}`, borderRadius: "var(--radius-md)",
        // Inline box-shadow would otherwise hide the global :focus-visible ring, so focus is drawn here.
        boxShadow: focus ? "var(--focus-ring)" : variant === "secondary" ? "var(--highlight-top)" : "none",
        opacity: disabled ? 0.4 : 1, cursor: off ? "not-allowed" : "pointer",
        transition: "background var(--dur-tick) var(--ease-out), color var(--dur-tick) var(--ease-out)",
        ...style,
      }} {...rest}>
      {loading ? <Icon name="refresh-cw" size={s.icon} style={{ animation: "cl-spin 900ms linear infinite" }} /> : icon ? <Icon name={icon} size={s.icon} /> : null}
      {children}
      {iconRight && <Icon name={iconRight} size={s.icon} />}
      {kbd && <span style={{ font: "var(--weight-medium) 10px/1 var(--font-mono)", padding: "3px 5px", borderRadius: "var(--radius-xs)", background: "var(--kbd-bg)", opacity: 0.75 }}>{kbd}</span>}
    </button>
  );
}
