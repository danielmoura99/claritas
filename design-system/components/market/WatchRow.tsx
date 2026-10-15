"use client";

import * as React from "react";
import { Delta } from "./Delta";
import { PriceTicker } from "./PriceTicker";
import { Sparkline } from "../charts/Sparkline";

/** Watchlist row: symbol · sparkline · last · change. `signal` marks a fresh Claritas read on the asset. */
export interface WatchRowProps {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  series?: number[];
  selected?: boolean;
  /** Fresh Claritas signal marker. */
  signal?: "up" | "down" | "sand" | boolean;
  dense?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  /** Force hover look (docs/showcase only). */
  forceHover?: boolean;
}

export function WatchRow({ symbol, name, price, change, series, selected = false, signal, dense = false, onClick, style, forceHover = false }: WatchRowProps) {
  const [hoverState, setHover] = React.useState(false);
  const hover = hoverState || forceHover;
  return (
    <div role="button" tabIndex={0} aria-pressed={selected} onClick={onClick} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1fr) 64px 84px", alignItems: "center", gap: 12,
        height: dense ? "var(--row-h-dense)" : 48, padding: "0 12px 0 14px", cursor: "pointer", borderRadius: "var(--radius-md)",
        background: selected ? "var(--surface-active)" : hover ? "var(--surface-hover)" : "transparent", transition: "background var(--dur-tick) var(--ease-out)", ...style,
      }}>
      {selected && <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 2, borderRadius: 2, background: "var(--accent)" }} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ font: "var(--weight-semibold) 12.5px/1 var(--font-mono)", color: "var(--text-primary)", letterSpacing: "0.01em" }}>{symbol}</span>
          {signal && <span title="Novo sinal Claritas" style={{ width: 6, height: 6, borderRadius: 6, background: signal === "up" ? "var(--market-up)" : signal === "down" ? "var(--market-down)" : "var(--accent)", boxShadow: "0 0 0 2px var(--accent-tint-strong)", animation: "cl-breathe 2s ease-in-out infinite" }} />}
        </span>
        {!dense && name && <span style={{ font: "var(--weight-regular) 11.5px/1 var(--font-sans)", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>}
      </div>
      {series ? <Sparkline data={series} width={64} height={dense ? 18 : 24} baseline={false} animate={false} /> : <span />}
      <div style={{ display: "flex", flexDirection: dense ? "row" : "column", alignItems: "flex-end", gap: dense ? 8 : 5, justifyContent: "flex-end" }}>
        <PriceTicker value={price} size="sm" />
        <Delta value={change} size="xs" arrow={false} />
      </div>
    </div>
  );
}
