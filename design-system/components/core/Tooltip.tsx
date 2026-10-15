"use client";

import * as React from "react";

/** Hover/focus hint. Short, sentence case. */
export interface TooltipProps {
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  kbd?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Keep the tooltip open (docs/showcase only). */
  defaultOpen?: boolean;
}

const POS: Record<NonNullable<TooltipProps["placement"]>, React.CSSProperties> = {
  top: { bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
  bottom: { top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" },
  left: { right: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
  right: { left: "calc(100% + 6px)", top: "50%", transform: "translateY(-50%)" },
};

export function Tooltip({ content, placement = "top", delay = 250, kbd, children, style, defaultOpen = false }: TooltipProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const t = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = () => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(t.current); if (!defaultOpen) setOpen(false); };
  React.useEffect(() => () => clearTimeout(t.current), []);
  return (
    <span style={{ position: "relative", display: "inline-flex", ...style }} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {open && content && (
        <span role="tooltip" style={{
          position: "absolute", ...POS[placement], zIndex: "var(--z-tooltip)", pointerEvents: "none", whiteSpace: "nowrap",
          display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: "var(--radius-sm)",
          background: "var(--tooltip-bg)", color: "var(--tooltip-fg)", boxShadow: "var(--shadow-pop)",
          font: "var(--weight-medium) 11.5px/1.2 var(--font-sans)", animation: "cl-fade var(--dur-fast) var(--ease-out)",
        }}>
          {content}
          {kbd && <span style={{ font: "500 10px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>{kbd}</span>}
        </span>
      )}
    </span>
  );
}
