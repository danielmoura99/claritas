import type * as React from "react";

const GLOWS = { sand: "var(--glow-sand-soft)", up: "var(--glow-up)", down: "var(--glow-down)" } as const;

/** Surface container for every terminal module (chart, watchlist, feed). */
export interface PanelProps {
  title?: React.ReactNode;
  /** Mono uppercase label before the title. */
  eyebrow?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  /** true = 16px, false = 0, number = px. */
  padding?: boolean | number | string;
  /** Live emphasis ring. */
  glow?: "sand" | "up" | "down" | false;
  /** Darker inset surface (charts). */
  inset?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}

export function Panel({ title, eyebrow, actions, footer, padding = true, glow, inset = false, children, style, bodyStyle }: PanelProps) {
  const pad = padding === true ? "var(--panel-pad)" : padding === false ? 0 : typeof padding === "number" ? padding + "px" : padding;
  const hasHead = title || eyebrow || actions;
  return (
    <section style={{
      display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0,
      background: inset ? "var(--surface-inset)" : "var(--surface-panel)", borderRadius: "var(--radius-xl)",
      boxShadow: glow ? GLOWS[glow] : "var(--shadow-panel)", transition: "box-shadow var(--dur-slow) var(--ease-out)", ...style,
    }}>
      {hasHead && (
        <header style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, padding: "4px 10px 0 var(--panel-pad)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0, flex: 1 }}>
            {eyebrow && <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>{eyebrow}</span>}
            {title && <h3 style={{ margin: 0, font: "var(--weight-medium) 13px/1.3 var(--font-sans)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h3>}
          </div>
          {actions && <div style={{ display: "flex", alignItems: "center", gap: 2 }}>{actions}</div>}
        </header>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: pad, ...bodyStyle }}>{children}</div>
      {footer && <footer style={{ padding: "10px var(--panel-pad)", borderTop: "1px solid var(--border-subtle)" }}>{footer}</footer>}
    </section>
  );
}
