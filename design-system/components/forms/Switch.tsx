"use client";

import * as React from "react";

/** On/off toggle for live settings. */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  size?: "sm" | "md";
  tone?: "sand" | "up";
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Switch({ checked, defaultChecked = false, onChange, label, size = "md", tone = "sand", disabled = false, style }: SwitchProps) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => { if (disabled) return; const n = !on; if (checked === undefined) setInner(n); onChange?.(n); };
  const w = size === "sm" ? 26 : 32, h = size === "sm" ? 16 : 20, k = h - 6;
  const onBg = tone === "up" ? "var(--market-up)" : "var(--accent)";
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, userSelect: "none", ...style }}>
      <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={toggle}
        style={{ position: "relative", width: w, height: h, padding: 0, border: `1px solid ${on ? "transparent" : "var(--border-strong)"}`, borderRadius: h, background: on ? onBg : "var(--surface-inset)", cursor: "inherit", transition: "background var(--dur-fast) var(--ease-out)" }}>
        <span style={{ position: "absolute", top: 2, left: 2, width: k, height: k, borderRadius: k, background: on ? "var(--switch-knob-on)" : "var(--switch-knob-off)", transform: `translateX(${on ? w - k - 6 : 0}px)`, transition: "transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)" }} />
      </button>
      {label && <span style={{ font: "var(--weight-regular) 13px/1.3 var(--font-sans)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
