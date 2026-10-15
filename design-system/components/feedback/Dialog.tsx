"use client";

import * as React from "react";
import { Icon } from "../core/Icon";

/** Modal with serif title and blurred backdrop. */
export interface DialogProps {
  open?: boolean;
  title: React.ReactNode;
  eyebrow?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  /** Render the box without the fixed overlay (for docs/cards). */
  inline?: boolean;
  style?: React.CSSProperties;
}

export function Dialog({ open = true, title, eyebrow, children, footer, onClose, width = 440, inline = false, style }: DialogProps) {
  React.useEffect(() => {
    if (!open || !onClose) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  const box = (
    <div role="dialog" aria-modal={inline ? undefined : true} onClick={e => e.stopPropagation()} style={{
      width, maxWidth: "calc(100vw - 32px)", background: "var(--surface-raised)", borderRadius: "var(--radius-xl)",
      boxShadow: "var(--shadow-dialog)", animation: "cl-pop var(--dur-base) var(--ease-out)", overflow: "hidden", ...style,
    }}>
      <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 18px 0 20px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {eyebrow && <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--accent)" }}>{eyebrow}</span>}
          <h2 style={{ margin: 0, font: "400 var(--display-s-size)/var(--display-s-lh) var(--font-serif)", color: "var(--text-primary)" }}>{title}</h2>
        </div>
        {onClose && <button type="button" aria-label="Fechar" onClick={onClose} style={{ display: "grid", placeItems: "center", width: 28, height: 28, padding: 0, border: 0, borderRadius: "var(--radius-md)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}><Icon name="x" size={16} /></button>}
      </header>
      <div style={{ padding: "14px 20px 20px", font: "var(--text-body)", color: "var(--text-secondary)" }}>{children}</div>
      {footer && <footer style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", background: "var(--surface-panel)", borderTop: "1px solid var(--border-subtle)" }}>{footer}</footer>}
    </div>
  );
  if (inline) return box;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: "var(--z-dialog)", display: "grid", placeItems: "center", background: "var(--surface-overlay)", backdropFilter: "var(--blur-overlay)", WebkitBackdropFilter: "var(--blur-overlay)", animation: "cl-fade var(--dur-fast) var(--ease-out)" }}>
      {box}
    </div>
  );
}
