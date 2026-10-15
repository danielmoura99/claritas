"use client";

import * as React from "react";
import { Icon, type IconName } from "../core/Icon";

const H = { sm: "var(--control-h-sm)", md: "var(--control-h-md)", lg: "var(--control-h-lg)" } as const;

export interface SelectOption { value: string; label: string; }

/** Native select styled for the terminal. */
export interface SelectProps {
  label?: string;
  options: (string | SelectOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Select({ label, options = [], value, defaultValue, onChange, size = "md", icon, disabled = false, style }: SelectProps) {
  const [focus, setFocus] = React.useState(false);
  const opts = options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, opacity: disabled ? 0.5 : 1, ...style }}>
      {label && <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>}
      <span style={{
        position: "relative", display: "flex", alignItems: "center", height: H[size] || H.md,
        background: "var(--surface-raised)", border: `1px solid ${focus ? "var(--accent-line)" : "var(--border-default)"}`, borderRadius: "var(--radius-md)",
        boxShadow: focus ? "0 0 0 3px var(--accent-tint)" : "var(--highlight-top)", transition: "border-color var(--dur-fast) var(--ease-out)",
      }}>
        {icon && <Icon name={icon} size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: 10, pointerEvents: "none" }} />}
        <select value={value} defaultValue={defaultValue} disabled={disabled} onChange={e => onChange?.(e.target.value, e)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: "none", WebkitAppearance: "none", width: "100%", height: "100%", background: "transparent", border: 0, outline: "none", color: "var(--text-primary)", font: "var(--weight-medium) 13px/1 var(--font-sans)", padding: `0 30px 0 ${icon ? 32 : 10}px`, cursor: disabled ? "not-allowed" : "pointer" }}>
          {opts.map(o => <option key={o.value} value={o.value} style={{ background: "var(--surface-raised)" }}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={14} color="var(--text-tertiary)" style={{ position: "absolute", right: 10, pointerEvents: "none" }} />
      </span>
    </label>
  );
}
