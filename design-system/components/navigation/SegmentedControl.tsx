"use client";

import * as React from "react";

export interface SegmentOption { value: string; label: React.ReactNode; }

/** Sliding-indicator segmented control — timeframes (1m 5m 15m 1h D), chart types, views. */
export interface SegmentedControlProps {
  options: (string | SegmentOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  /** Mono labels (default true — timeframes). */
  mono?: boolean;
  fullWidth?: boolean;
  style?: React.CSSProperties;
}

export function SegmentedControl({ options = [], value, defaultValue, onChange, size = "md", mono = true, fullWidth = false, style }: SegmentedControlProps) {
  const opts: SegmentOption[] = options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
  const [inner, setInner] = React.useState(defaultValue ?? opts[0]?.value);
  const cur = value !== undefined ? value : inner;
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const wrap = React.useRef<HTMLDivElement>(null);
  const [ind, setInd] = React.useState<{ left: number; width: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = cur !== undefined ? refs.current[cur] : null, w = wrap.current;
    if (el && w) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  }, [cur, options.length]);
  const h = size === "sm" ? 24 : 30;
  return (
    <div ref={wrap} role="tablist" style={{ position: "relative", display: fullWidth ? "flex" : "inline-flex", padding: 2, gap: 0, background: "var(--surface-inset)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", ...style }}>
      {ind && <span style={{ position: "absolute", top: 2, bottom: 2, left: ind.left, width: ind.width, background: "var(--surface-active)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-raised)", transition: "left var(--dur-base) var(--ease-out), width var(--dur-base) var(--ease-out)" }} />}
      {opts.map(o => {
        const on = o.value === cur;
        return (
          <button key={o.value} ref={el => { refs.current[o.value] = el; }} type="button" role="tab" aria-selected={on}
            onClick={() => { if (value === undefined) setInner(o.value); onChange?.(o.value); }}
            style={{
              position: "relative", flex: fullWidth ? 1 : undefined, height: h, padding: size === "sm" ? "0 8px" : "0 11px", border: 0, background: "transparent", cursor: "pointer",
              font: mono ? `var(--weight-medium) ${size === "sm" ? 11 : 12}px/1 var(--font-mono)` : `var(--weight-medium) ${size === "sm" ? 12 : 13}px/1 var(--font-sans)`,
              color: on ? "var(--text-primary)" : "var(--text-tertiary)", transition: "color var(--dur-fast) var(--ease-out)", whiteSpace: "nowrap",
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}
