import type * as React from "react";
import { Icon, type IconName } from "../core/Icon";

export type ToastTone = "sand" | "up" | "down" | "info" | "warn";

const TONES: Record<ToastTone, { icon: IconName; color: string }> = {
  sand: { icon: "sparkles", color: "var(--accent)" },
  up: { icon: "trending-up", color: "var(--market-up-text)" },
  down: { icon: "trending-down", color: "var(--market-down-text)" },
  info: { icon: "info", color: "var(--status-info)" },
  warn: { icon: "triangle-alert", color: "var(--warn-400)" },
};

/** Transient notification (glass, top-right stack). */
export interface ToastProps {
  tone?: ToastTone;
  title: React.ReactNode;
  message?: React.ReactNode;
  icon?: IconName;
  /** Mono meta, e.g. time. */
  meta?: string;
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export function Toast({ tone = "sand", title, message, icon, meta, action, onAction, onClose, style }: ToastProps) {
  const t = TONES[tone] || TONES.sand;
  return (
    <div role="status" style={{
      display: "flex", gap: 12, width: 360, maxWidth: "100%", padding: "12px 12px 12px 14px", borderRadius: "var(--radius-lg)",
      background: "var(--glass-bg)", backdropFilter: "var(--blur-glass)", WebkitBackdropFilter: "var(--blur-glass)",
      boxShadow: tone === "sand" ? "var(--shadow-pop), var(--glow-sand-soft)" : "var(--shadow-pop)",
      animation: "cl-pop var(--dur-slow) var(--ease-out)", ...style,
    }}>
      <span style={{ display: "grid", placeItems: "center", width: 28, height: 28, flexShrink: 0, borderRadius: "var(--radius-md)", background: "var(--tint-neutral-subtle)", color: t.color }}>
        <Icon name={icon || t.icon} size={15} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ font: "var(--weight-medium) 13px/1.3 var(--font-sans)", color: "var(--text-primary)", flex: 1 }}>{title}</span>
          {meta && <span style={{ font: "400 10.5px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>{meta}</span>}
        </div>
        {message && <span style={{ font: "var(--weight-regular) 12.5px/1.45 var(--font-sans)", color: "var(--text-secondary)", textWrap: "pretty" }}>{message}</span>}
        {action && <button type="button" onClick={onAction} style={{ alignSelf: "flex-start", marginTop: 4, padding: 0, border: 0, background: "none", cursor: "pointer", font: "var(--weight-medium) 12px/1 var(--font-sans)", color: t.color }}>{action} →</button>}
      </div>
      {onClose && <button type="button" aria-label="Fechar" onClick={onClose} style={{ alignSelf: "flex-start", display: "grid", placeItems: "center", width: 22, height: 22, padding: 0, border: 0, borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}><Icon name="x" size={14} /></button>}
    </div>
  );
}
