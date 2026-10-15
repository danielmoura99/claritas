"use client";

import * as React from "react";
import { Icon, type IconName } from "../core/Icon";

export interface TabItem { value: string; label: React.ReactNode; icon?: IconName; count?: number; }

/** Underline tabs. The active indicator is sand and slides between tabs. */
export interface TabsProps {
  items: (string | TabItem)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export function Tabs({ items = [], value, defaultValue, onChange, size = "md", style }: TabsProps) {
  const tabs: TabItem[] = items.map(t => (typeof t === "string" ? { value: t, label: t } : t));
  const [inner, setInner] = React.useState(defaultValue ?? tabs[0]?.value);
  const cur = value !== undefined ? value : inner;
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = React.useState<{ left: number; width: number } | null>(null);
  const [hover, setHover] = React.useState<string | null>(null);
  React.useLayoutEffect(() => {
    const el = cur !== undefined ? refs.current[cur] : null;
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [cur, items.length]);
  const h = size === "sm" ? 34 : 42;
  return (
    <div role="tablist" style={{ position: "relative", display: "flex", gap: 20, height: h, borderBottom: "1px solid var(--border-subtle)", ...style }}>
      {tabs.map(t => {
        const on = t.value === cur;
        return (
          <button key={t.value} ref={el => { refs.current[t.value] = el; }} type="button" role="tab" aria-selected={on}
            onMouseEnter={() => setHover(t.value)} onMouseLeave={() => setHover(null)}
            onClick={() => { if (value === undefined) setInner(t.value); onChange?.(t.value); }}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: "100%", padding: 0, border: 0, background: "transparent", cursor: "pointer",
              font: `var(--weight-medium) ${size === "sm" ? 12.5 : 13}px/1 var(--font-sans)`, whiteSpace: "nowrap",
              color: on ? "var(--text-primary)" : hover === t.value ? "var(--text-secondary)" : "var(--text-tertiary)", transition: "color var(--dur-fast) var(--ease-out)" }}>
            {t.icon && <Icon name={t.icon} size={14} />}
            {t.label}
            {t.count != null && <span style={{ font: "500 10px/1 var(--font-mono)", padding: "3px 5px", borderRadius: "var(--radius-xs)", background: on ? "var(--accent-tint)" : "var(--tint-neutral)", color: on ? "var(--accent)" : "var(--text-tertiary)" }}>{t.count}</span>}
          </button>
        );
      })}
      {ind && <span style={{ position: "absolute", bottom: -1, height: 2, left: ind.left, width: ind.width, background: "var(--accent)", borderRadius: 2, boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 60%, transparent)", transition: "left var(--dur-base) var(--ease-out), width var(--dur-base) var(--ease-out)" }} />}
    </div>
  );
}
