"use client";

import * as React from "react";

/** Inline text action in sand caption — "Criar conta", "← Voltar". Renders <a> with `href`, otherwise <button>. */
export interface TextLinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function TextLink({ children, href, onClick, disabled = false, style }: TextLinkProps) {
  const [hover, setHover] = React.useState(false);
  const css: React.CSSProperties = {
    font: "var(--text-caption)", color: disabled ? "var(--text-disabled)" : hover ? "var(--accent-hover)" : "var(--accent)",
    textDecoration: "none", whiteSpace: "nowrap", background: "transparent", border: 0, padding: 0, borderRadius: "var(--radius-xs)",
    cursor: disabled ? "not-allowed" : "pointer", transition: "color var(--dur-fast) var(--ease-out)", ...style,
  };
  const events = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) };
  if (href && !disabled) return <a href={href} style={css} {...events}>{children}</a>;
  return <button type="button" onClick={onClick} disabled={disabled} style={css} {...events}>{children}</button>;
}
