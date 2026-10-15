"use client";

import * as React from "react";
import { Icon, type IconName } from "./Icon";
import { Tooltip } from "./Tooltip";

const SIZES = { sm: { box: 28, icon: 15 }, md: { box: 34, icon: 16 }, lg: { box: 42, icon: 18 } } as const;

/** Square icon-only button for toolbars and panel headers. */
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Lucide icon name. */
  icon: IconName;
  /** Accessible label; also shown as tooltip. */
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "secondary";
  /** Toggled-on state (sand tint). */
  active?: boolean;
  disabled?: boolean;
  /** Small sand dot (unread / new). */
  badge?: boolean;
  tooltip?: boolean;
  /** Force hover look (docs/showcase only). */
  forceHover?: boolean;
}

export function IconButton({ icon, label, size = "md", variant = "ghost", active = false, disabled = false, badge = false, tooltip = true, onClick, style, forceHover = false, ...rest }: IconButtonProps) {
  const [hoverState, setHover] = React.useState(false);
  const hover = hoverState || forceHover;
  const s = SIZES[size] || SIZES.md;
  const base = variant === "secondary" ? "var(--surface-raised)" : "transparent";
  const bg = active ? "var(--accent-tint)" : hover && !disabled ? "var(--surface-hover)" : base;
  const fg = active ? "var(--accent)" : hover && !disabled ? "var(--text-primary)" : "var(--text-tertiary)";
  const btn = (
    <button type="button" aria-label={label} aria-pressed={active || undefined} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "inline-grid", placeItems: "center", width: s.box, height: s.box, padding: 0,
        color: fg, background: bg, borderRadius: "var(--radius-md)", cursor: disabled ? "not-allowed" : "pointer",
        border: `1px solid ${variant === "secondary" ? "var(--border-default)" : "transparent"}`, opacity: disabled ? 0.4 : 1,
        transition: "background var(--dur-tick) var(--ease-out), color var(--dur-tick) var(--ease-out)", ...style,
      }} {...rest}>
      <Icon name={icon} size={s.icon} />
      {badge && <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 6, background: "var(--accent)", boxShadow: "0 0 0 2px var(--surface-panel)" }} />}
    </button>
  );
  return tooltip && label ? <Tooltip content={label}>{btn}</Tooltip> : btn;
}
