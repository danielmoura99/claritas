"use client";

import * as React from "react";
import { makeRng } from "../../lib/random";

const smooth = (pts: number[][]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
};

/** Streaming area chart (net flow, cumulative volume). In live mode the curve glides left continuously. */
export interface FlowAreaProps {
  /** Controlled values. Omit to self-simulate. */
  data?: number[];
  live?: boolean;
  tickMs?: number;
  points?: number;
  height?: number;
  color?: string;
  /** Upward bias of the simulated walk. */
  drift?: number;
  grid?: boolean;
  /** Seed for the simulated walk (deterministic first render). */
  seed?: number;
  onTick?: (data: number[]) => void;
  style?: React.CSSProperties;
}

export function FlowArea({ data, live = false, tickMs = 1000, points = 40, height = 96, color = "var(--accent)", drift = 0.12, grid = true, seed = 11, onTick, style }: FlowAreaProps) {
  const id = "cl-flow-" + React.useId().replace(/:/g, "");
  const wrap = React.useRef<HTMLDivElement>(null);
  const rng = React.useRef<() => number>(null);
  const [w, setW] = React.useState(240);
  const [inner, setInner] = React.useState(() => { const r = makeRng(seed); let v = 0; return Array.from({ length: points }, () => (v += r() - 0.5 + drift)); });
  const [n, setN] = React.useState(0);
  const series = data || inner;
  React.useLayoutEffect(() => { const ro = new ResizeObserver(([e]) => setW(Math.max(80, e.contentRect.width))); if (wrap.current) ro.observe(wrap.current); return () => ro.disconnect(); }, []);
  React.useEffect(() => {
    if (!live || data) return;
    if (!rng.current) rng.current = makeRng(seed * 7 + 3);
    const r = rng.current;
    const t = setInterval(() => { setInner(s => [...s.slice(1), s[s.length - 1] + (r() - 0.5) * 1.1 + drift]); setN(x => x + 1); }, tickMs);
    return () => clearInterval(t);
  }, [live, data, tickMs, drift, seed]);
  const onTickRef = React.useRef(onTick);
  React.useEffect(() => { onTickRef.current = onTick; });
  React.useEffect(() => { onTickRef.current?.(series); }, [series]);
  const min = Math.min(...series), max = Math.max(...series), span = max - min || 1;
  const step = w / (series.length - 2);
  const pts = series.map((v, i) => [i * step, 6 + (1 - (v - min) / span) * (height - 12)]);
  const d = smooth(pts);
  const last = pts[pts.length - 2];
  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height, overflow: "hidden", ...style }}>
      <svg width={w} height={height} style={{ display: "block", overflow: "visible" }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.38" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {grid && [0.25, 0.5, 0.75].map(f => <line key={f} x1={0} x2={w} y1={height * f} y2={height * f} stroke="var(--chart-grid)" />)}
        <g key={n} style={live && !data ? ({ "--cl-dx": step + "px", animation: `cl-slide-x ${tickMs}ms linear` } as React.CSSProperties) : undefined}>
          <path d={`${d}L${pts[pts.length - 1][0]},${height}L0,${height}Z`} fill={`url(#${id})`} />
          <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
        </g>
        <circle cx={last[0]} cy={last[1]} r={5} fill="none" stroke={color} style={{ animation: "cl-ring 1.6s var(--ease-out) infinite" }} />
        <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
      </svg>
    </div>
  );
}
