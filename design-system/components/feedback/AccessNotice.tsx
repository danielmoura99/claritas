import type * as React from "react";
import { Icon, type IconName } from "../core/Icon";

/**
 * Access state panel — a locked feature, an expired trial, a suspended account, an empty admin view.
 * Quiet by design: dotted ground, serif title, explicit text (never color alone), optional actions.
 */
export interface AccessNoticeProps {
  /** lock = not included/locked · info = neutral state · warn = needs attention (expiring, quota). */
  tone?: "lock" | "info" | "warn";
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons / links. */
  actions?: React.ReactNode;
  icon?: IconName;
  /** Fill the parent and center (screen-level lock). */
  fill?: boolean;
  style?: React.CSSProperties;
}

const ICON: Record<NonNullable<AccessNoticeProps["tone"]>, { icon: IconName; color: string }> = {
  lock: { icon: "lock", color: "var(--accent)" },
  info: { icon: "info", color: "var(--status-info)" },
  warn: { icon: "triangle-alert", color: "var(--status-warn)" },
};

export function AccessNotice({ tone = "lock", eyebrow, title, children, actions, icon, fill = false, style }: AccessNoticeProps) {
  const t = ICON[tone];
  return (
    <section
      role={tone === "warn" ? "alert" : "status"}
      className="cl-dotgrid"
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14, padding: "28px 28px 26px",
        border: "1px dashed var(--border-default)", borderRadius: "var(--radius-lg)", background: "var(--surface-panel)",
        ...(fill ? { flex: 1, justifyContent: "center", minHeight: 0 } : {}),
        animation: "cl-rise var(--dur-base) var(--ease-out)",
        ...style,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
        <Icon name={icon ?? t.icon} size={14} color={t.color} />
        {eyebrow}
      </span>
      <h2 style={{ margin: 0, maxWidth: 560, font: "var(--weight-regular) var(--display-s-size)/var(--display-s-lh) var(--font-serif)", color: "var(--text-primary)", textWrap: "balance" }}>{title}</h2>
      {children && <div style={{ maxWidth: 560, font: "var(--text-body)", color: "var(--text-secondary)", textWrap: "pretty" }}>{children}</div>}
      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>{actions}</div>}
    </section>
  );
}
