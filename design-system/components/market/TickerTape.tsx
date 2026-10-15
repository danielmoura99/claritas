"use client";

import * as React from "react";
import { Delta } from "./Delta";
import { PriceTicker } from "./PriceTicker";

export interface TapeItem { symbol: string; price: number; change: number; decimals?: number; signal?: boolean; }

/** The tape that rolls all session long. Pauses on hover. Items can carry a Claritas `signal` (sand dot). */
export interface TickerTapeProps {
  items: TapeItem[];
  /** Seconds per full loop. */
  speed?: number;
  height?: number;
  onSelect?: (symbol: string) => void;
  style?: React.CSSProperties;
}

const MASK = "linear-gradient(90deg,transparent,black 4%,black 96%,transparent)";

export function TickerTape({ items = [], speed = 60, height = 32, onSelect, style }: TickerTapeProps) {
  const [paused, setPaused] = React.useState(false);
  const row = (k: number) => (
    <div key={k} aria-hidden={k === 1 || undefined} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {items.map(it => (
        <button key={k + it.symbol} type="button" tabIndex={k === 1 ? -1 : undefined} onClick={() => onSelect?.(it.symbol)} style={{
          display: "inline-flex", alignItems: "center", gap: 10, height, padding: "0 18px", border: 0, background: "transparent", cursor: onSelect ? "pointer" : "default",
          borderRight: "1px solid var(--border-subtle)",
        }}>
          {it.signal && <span style={{ width: 5, height: 5, borderRadius: 5, background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />}
          <span style={{ font: "var(--weight-semibold) 11.5px/1 var(--font-mono)", color: "var(--text-primary)", letterSpacing: "0.02em" }}>{it.symbol}</span>
          <PriceTicker value={it.price} size="xs" color="var(--text-secondary)" decimals={it.decimals ?? 2} />
          <Delta value={it.change} size="xs" />
        </button>
      ))}
    </div>
  );
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{ position: "relative", height, overflow: "hidden", background: "var(--surface-inset)", borderBottom: "1px solid var(--border-subtle)", maskImage: MASK, WebkitMaskImage: MASK, ...style }}>
      <div style={{ display: "flex", width: "max-content", animation: `cl-tape ${speed}s linear infinite`, animationPlayState: paused ? "paused" : "running" }}>
        {row(0)}{row(1)}
      </div>
    </div>
  );
}
