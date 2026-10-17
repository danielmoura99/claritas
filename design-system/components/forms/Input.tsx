"use client";

import * as React from "react";
import { Icon, type IconName } from "../core/Icon";

const H = { sm: "var(--control-h-sm)", md: "var(--control-h-md)", lg: "var(--control-h-lg)" } as const;

/** Text / numeric field on an inset surface. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: IconName;
  /** Leading unit, e.g. "R$". */
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  /** Mono tabular font for prices/quantities. */
  mono?: boolean;
  kbd?: string;
  /** Trailing interactive element inside the field (e.g. the reveal toggle of PasswordInput). */
  end?: React.ReactNode;
  inputStyle?: React.CSSProperties;
  /** Force the focus look (docs/showcase only). */
  forceFocus?: boolean;
}

export function Input({ label, hint, error, icon, prefix, suffix, size = "md", mono = false, kbd, end, value, defaultValue, placeholder, onChange, disabled = false, type = "text", style, inputStyle, forceFocus = false, ...rest }: InputProps) {
  const [focusState, setFocus] = React.useState(false);
  // Nome acessível = só o rótulo; dica/erro entram como descrição (não como parte do nome).
  const id = React.useId();
  const labelId = label ? `${id}-label` : undefined;
  const noteId = error || hint ? `${id}-note` : undefined;
  const describedBy = [noteId, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const focus = focusState || forceFocus;
  const border = error ? "var(--market-down)" : focus ? "var(--accent-line)" : "var(--border-default)";
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, opacity: disabled ? 0.5 : 1, ...style }}>
      {label && <span id={labelId} style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</span>}
      <span style={{
        display: "flex", alignItems: "center", gap: 8, height: H[size] || H.md, padding: "0 10px",
        background: "var(--surface-inset)", border: `1px solid ${border}`, borderRadius: "var(--radius-md)",
        boxShadow: focus && !error ? "0 0 0 3px var(--accent-tint)" : "none",
        transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
      }}>
        {icon && <Icon name={icon} size={15} color="var(--text-tertiary)" />}
        {prefix && <span style={{ font: "500 12px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>{prefix}</span>}
        <input type={type} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} onChange={onChange}
          aria-invalid={error ? true : undefined} aria-labelledby={rest["aria-label"] ? undefined : labelId}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, height: "100%", background: "transparent", border: 0, outline: "none", padding: 0, color: "var(--text-primary)",
            font: mono ? "var(--weight-medium) 13px/1 var(--font-mono)" : "var(--weight-regular) 13px/1 var(--font-sans)",
            fontVariantNumeric: "tabular-nums", ...inputStyle,
          }} {...rest} aria-describedby={describedBy} />
        {suffix && <span style={{ font: "500 12px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>{suffix}</span>}
        {kbd && <span style={{ font: "500 10px/1 var(--font-mono)", color: "var(--text-tertiary)", padding: "3px 5px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-xs)" }}>{kbd}</span>}
        {end}
      </span>
      {(error || hint) && <span id={noteId} style={{ font: "var(--text-caption)", color: error ? "var(--market-down-text)" : "var(--text-tertiary)" }}>{error || hint}</span>}
    </label>
  );
}
