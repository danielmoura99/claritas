"use client";

import * as React from "react";
import { Icon } from "../core/Icon";

/** Sand-filled checkbox. */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Checkbox({ checked, defaultChecked = false, onChange, label, description, indeterminate = false, disabled = false, style }: CheckboxProps) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => { if (disabled) return; const n = !on; if (checked === undefined) setInner(n); onChange?.(n); };
  const filled = on || indeterminate;
  return (
    <label onClick={e => { e.preventDefault(); toggle(); }} style={{ display: "inline-flex", alignItems: description ? "flex-start" : "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, userSelect: "none", ...style }}>
      <span role="checkbox" aria-checked={indeterminate ? "mixed" : on} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} onKeyDown={e => { if (e.key === " ") { e.preventDefault(); toggle(); } }}
        style={{
          display: "grid", placeItems: "center", width: 16, height: 16, flexShrink: 0, borderRadius: "var(--radius-sm)",
          background: filled ? "var(--accent)" : "var(--surface-inset)", border: `1px solid ${filled ? "var(--accent)" : "var(--border-strong)"}`,
          color: "var(--text-on-accent)", transition: "background var(--dur-tick) var(--ease-out), border-color var(--dur-tick) var(--ease-out)", marginTop: description ? 1 : 0,
        }}>
        {indeterminate ? <Icon name="minus" size={12} strokeWidth={3} /> : on ? <Icon name="check" size={12} strokeWidth={3} /> : null}
      </span>
      {(label || description) && (
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {label && <span style={{ font: "var(--weight-regular) 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>{label}</span>}
          {description && <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{description}</span>}
        </span>
      )}
    </label>
  );
}
