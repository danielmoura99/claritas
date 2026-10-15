"use client";

import * as React from "react";
import { Icon, type IconName } from "../core/Icon";
import { Badge, type BadgeTone } from "../core/Badge";
import { ConfidenceMeter } from "./ConfidenceMeter";

export type SignalKind = "buy" | "sell" | "watch" | "alert" | "pattern";

const KINDS: Record<SignalKind, { tone: BadgeTone; label: string; icon: IconName }> = {
  buy: { tone: "up", label: "Compra", icon: "trending-up" },
  sell: { tone: "down", label: "Venda", icon: "trending-down" },
  watch: { tone: "sand", label: "Observar", icon: "eye" },
  alert: { tone: "warn", label: "Alerta", icon: "triangle-alert" },
  pattern: { tone: "sand", label: "Padrão", icon: "scan-line" },
};

function useTyped(text: string | undefined, on: boolean, speed = 14) {
  const len = (text || "").length;
  const [n, setN] = React.useState(on ? 0 : len);
  React.useEffect(() => {
    if (!on || !text) return;
    let i = 0;
    const id = setInterval(() => { i += 2; setN(i); if (i >= text.length) clearInterval(id); }, speed);
    return () => { clearInterval(id); setN(0); };
  }, [text, on, speed]);
  return on && text ? n : len;
}

export interface SignalLevel { label: string; value: string; tone?: "up" | "down"; }

/** A single Claritas read. Title is set in serif — it's the analyst's voice. `fresh` = just arrived (rise + sand glow + typed body). */
export interface SignalCardProps {
  kind?: SignalKind;
  symbol?: string;
  timeframe?: string;
  /** Mono time, e.g. "14:32". */
  time?: string;
  title: string;
  body?: string;
  /** 0–100 */
  confidence?: number;
  levels?: SignalLevel[];
  tags?: string[];
  /** Just arrived: rise-in, sand glow and typed body. */
  fresh?: boolean;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function SignalCard({ kind = "watch", symbol, timeframe, time, title, body, confidence, levels, tags = [], fresh = false, compact = false, selected = false, onClick, style }: SignalCardProps) {
  const k = KINDS[kind] || KINDS.watch;
  const typed = useTyped(body, fresh);
  const [hover, setHover] = React.useState(false);
  const typing = fresh && body && typed < body.length;
  return (
    <article onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      display: "flex", flexDirection: "column", gap: compact ? 8 : 12, padding: compact ? "12px 14px" : 16, borderRadius: "var(--radius-lg)",
      background: selected ? "var(--surface-raised)" : hover && onClick ? "var(--surface-hover)" : "var(--surface-panel)",
      boxShadow: selected ? "var(--glow-sand-soft)" : "var(--shadow-panel)", cursor: onClick ? "pointer" : "default",
      animation: fresh ? "cl-rise var(--dur-slow) var(--ease-out), cl-glow-once 2.4s var(--ease-out)" : "none", transition: "background var(--dur-tick) var(--ease-out)", ...style,
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Badge tone={k.tone} icon={k.icon} size="sm">{k.label}</Badge>
        {symbol && <span style={{ font: "var(--weight-semibold) 12px/1 var(--font-mono)", color: "var(--text-primary)" }}>{symbol}</span>}
        {timeframe && <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>{timeframe}</span>}
        <span style={{ flex: 1 }} />
        {fresh && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "500 10px/1 var(--font-mono)", letterSpacing: "var(--label-track)", color: "var(--accent)" }}><Icon name="sparkles" size={11} />NOVO</span>}
        {time && <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{time}</span>}
      </header>
      {title && <h4 style={{ margin: 0, font: `400 ${compact ? 17 : 20}px/1.2 var(--font-serif)`, color: "var(--text-primary)", letterSpacing: "-0.005em", textWrap: "pretty" }}>{title}</h4>}
      {body && !compact && (
        <p style={{ margin: 0, font: "var(--weight-regular) 13px/1.55 var(--font-sans)", color: "var(--text-secondary)", textWrap: "pretty" }}>
          {body.slice(0, typed)}
          {typing && <span style={{ display: "inline-block", width: 7, height: 13, marginLeft: 1, verticalAlign: "-2px", background: "var(--accent)", animation: "cl-caret 900ms steps(1) infinite" }} />}
        </p>
      )}
      {levels && levels.length > 0 && !compact && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${levels.length},minmax(0,1fr))`, gap: 1, background: "var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {levels.map(l => (
            <div key={l.label} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "8px 10px", background: "var(--surface-inset)" }}>
              <span style={{ font: "500 9.5px/1 var(--font-mono)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{l.label}</span>
              <span style={{ font: "500 13px/1 var(--font-mono)", color: l.tone === "up" ? "var(--market-up-text)" : l.tone === "down" ? "var(--market-down-text)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{l.value}</span>
            </div>
          ))}
        </div>
      )}
      {(confidence != null || tags.length > 0) && (
        <footer style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {confidence != null && <ConfidenceMeter value={confidence} size="sm" segments={16} style={{ flex: 1 }} />}
          {tags.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>{tags.map(t => <Badge key={t} size="sm">{t}</Badge>)}</div>}
        </footer>
      )}
    </article>
  );
}
