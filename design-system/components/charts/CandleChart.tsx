"use client";

import * as React from "react";
import { ProbabilityField } from "./ProbabilityField";
import { fmtBR as fmtN, fmtTimeBR as fmtT } from "../../lib/format";
import { makeRng } from "../../lib/random";

export interface Candle { t: number; o: number; h: number; l: number; c: number; v: number; }
export interface Annotation {
  id: string;
  type: "level" | "zone" | "trend" | "marker";
  /** level */ price?: number;
  /** zone */ from?: number; to?: number;
  /** trend */ t1?: number; p1?: number; t2?: number; p2?: number;
  /** marker */ t?: number; side?: "buy" | "sell" | "info";
  label?: string;
  tone?: "sand" | "up" | "down" | "info";
}

export interface GenerateSeriesOptions { count?: number; start?: number; seed?: number; vol?: number; interval?: number; startTime?: number }

function generateSeries({ count = 96, start = 38.2, seed = 7, vol = 0.0016, interval = 300000, startTime = Date.UTC(2026, 9, 9, 13, 0) }: GenerateSeriesOptions = {}): Candle[] {
  const r = makeRng(seed); let p = start; const out: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i / 17 + seed) * vol * 0.035;
    const o = p; let h = o, l = o, c = o;
    for (let k = 0; k < 8; k++) { c *= 1 + (r() - 0.5) * vol * 2.2 + drift; h = Math.max(h, c); l = Math.min(l, c); }
    h *= 1 + r() * vol * 0.9; l *= 1 - r() * vol * 0.9;
    out.push({ t: startTime + i * interval, o, h, l, c, v: Math.round((0.5 + r()) * 9e4 * (1 + (Math.abs(c - o) / o) * 220)) });
    p = c;
  }
  return out;
}
function sma(arr: Candle[], n: number): (number | null)[] { const out: (number | null)[] = new Array(arr.length).fill(null); let sum = 0; for (let i = 0; i < arr.length; i++) { sum += arr[i].c; if (i >= n) sum -= arr[i - n].c; if (i >= n - 1) out[i] = sum / n; } return out; }
function niceTicks(min: number, max: number, count = 5) {
  const raw = (max - min) / count; const mag = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / mag;
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag; const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v);
  return out;
}
const TONE = { sand: "var(--annotation)", up: "var(--market-up)", down: "var(--market-down-text)", info: "var(--status-info)" } as const;
const MONO = "var(--font-mono)";

/** Live candlestick chart with Claritas annotations drawn in sand, analysis scan beam and crosshair. */
export interface CandleChartProps {
  /** Controlled data. Omit to use the built-in simulated session. */
  data?: Candle[];
  height?: number | string;
  /** Visible candle count. */
  window?: number;
  /** Simulate a live tape (only when `data` is omitted). */
  live?: boolean;
  tickMs?: number;
  ticksPerCandle?: number;
  seed?: number;
  start?: number;
  decimals?: number;
  annotations?: Annotation[];
  /** Auto-draw support/resistance + MA crossover markers. */
  autoAnalyze?: boolean;
  /** Sweep the sand analysis beam across the plot. */
  scanning?: boolean;
  showVolume?: boolean;
  /** SMA periods; first is "fast" (sand), second "slow" (ink). */
  ma?: number[];
  crosshair?: boolean;
  /** Faint serif text behind candles, e.g. "PETR4 · 5m". */
  watermark?: string;
  /** Animated sand probability mesh behind the right side of the plot. */
  field?: boolean;
  onTick?: (series: Candle[]) => void;
  style?: React.CSSProperties;
}

type Hover = { i: number; y: number } | null;

export function CandleChart({
  data, height = 360, window: win = 72, live = false, tickMs = 650, ticksPerCandle = 9, seed = 7, start = 38.2, decimals = 2,
  annotations = [], autoAnalyze = false, scanning = false, showVolume = true, ma = [9, 21], crosshair = true, watermark, field = false, onTick, style,
}: CandleChartProps) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 640, h: typeof height === "number" ? height : 360 });
  const [inner, setInner] = React.useState(() => generateSeries({ seed, start }));
  const [hover, setHover] = React.useState<Hover>(null);
  const rng = React.useRef<() => number>(null);
  const n = React.useRef(0);
  const series = data || inner;

  React.useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: Math.max(200, e.contentRect.width), h: Math.max(160, e.contentRect.height) }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!live || data) return;
    if (!rng.current) rng.current = makeRng(seed * 31 + 5);
    const r = rng.current;
    const id = setInterval(() => setInner(prev => {
      const s = prev.slice(); const last = { ...s[s.length - 1] }; n.current++;
      const iv = s.length > 1 ? s[1].t - s[0].t : 300000; const bias = Math.sin(n.current / 37) * 0.00035;
      last.c *= 1 + (r() - 0.5) * 0.0042 + bias; last.h = Math.max(last.h, last.c); last.l = Math.min(last.l, last.c); last.v += Math.round(r() * 9000);
      s[s.length - 1] = last;
      if (n.current % ticksPerCandle === 0) s.push({ t: last.t + iv, o: last.c, h: last.c, l: last.c, c: last.c, v: Math.round(r() * 15000) });
      if (s.length > win + 60) s.shift();
      return s;
    }), tickMs);
    return () => clearInterval(id);
  }, [live, data, tickMs, ticksPerCandle, win, seed]);

  const onTickRef = React.useRef(onTick);
  React.useEffect(() => { onTickRef.current = onTick; });
  React.useEffect(() => { onTickRef.current?.(series); }, [series]);

  const W = box.w, H = box.h, axisW = 66, top = 30, bottom = 22;
  const plotW = W - axisW; const plotH = H - top - bottom;
  const volH = showVolume ? Math.round(plotH * 0.16) : 0; const priceH = plotH - volH - (showVolume ? 8 : 0);
  const offset = Math.max(0, series.length - win); const vis = series.slice(offset);
  const step = plotW / win; const bw = Math.max(1, Math.min(14, step * 0.62));
  const maLines = ma.map(p => sma(series, p).slice(offset));

  // Auto analysis — Claritas reads the tape and draws its conclusions in sand.
  const auto: Annotation[] = [];
  if (autoAnalyze && vis.length > 20) {
    const look = vis.slice(-48);
    const res = Math.max(...look.map(c => c.h)), sup = Math.min(...look.map(c => c.l));
    auto.push({ id: "res-" + res.toFixed(2), type: "level", price: res, label: "Resistência" });
    auto.push({ id: "sup-" + sup.toFixed(2), type: "level", price: sup, label: "Suporte" });
    const f = sma(series, 9).slice(offset), sl = sma(series, 21).slice(offset); const marks: Annotation[] = [];
    for (let i = 1; i < vis.length - 1; i++) {
      const f0 = f[i - 1], s0 = sl[i - 1], f1 = f[i], s1 = sl[i];
      if (f0 == null || s0 == null || f1 == null || s1 == null) continue;
      if (f0 <= s0 && f1 > s1) marks.push({ id: "x-" + vis[i].t, type: "marker", t: vis[i].t, side: "buy", label: "Cruzamento ↑" });
      if (f0 >= s0 && f1 < s1) marks.push({ id: "x-" + vis[i].t, type: "marker", t: vis[i].t, side: "sell", label: "Cruzamento ↓" });
    }
    auto.push(...marks.slice(-3));
  }
  const notes = [...auto, ...annotations];

  let lo = Math.min(...vis.map(c => c.l)), hi = Math.max(...vis.map(c => c.h));
  notes.forEach(a => { [a.price, a.from, a.to].forEach(p => { if (p != null && p > lo * 0.97 && p < hi * 1.03) { lo = Math.min(lo, p); hi = Math.max(hi, p); } }); });
  const pad = (hi - lo) * 0.08 || 0.5; lo -= pad; hi += pad;
  const y = (p: number) => top + (1 - (p - lo) / (hi - lo)) * priceH;
  const x = (i: number) => i * step + step / 2;
  const idxOf = (t?: number) => vis.findIndex(c => c.t === t);
  const ticks = niceTicks(lo, hi, 5);
  const maxV = Math.max(...vis.map(c => c.v)); const volTop = top + priceH + 8;
  const last = vis[vis.length - 1];
  const lastCol = "var(--accent)";
  const hc = hover != null ? vis[hover.i] : last; const chg = ((hc.c - hc.o) / hc.o) * 100;
  const path = (arr: (number | null)[]) => arr.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).map((p, i) => (i ? "L" : "M") + p).join("");
  const chip = (cx: number, cy: number, text: string, color: string, anchor: "start" | "middle" | "end" = "start", solid = false) => {
    const w = text.length * 6.1 + 12; const x0 = anchor === "end" ? cx - w : anchor === "middle" ? cx - w / 2 : cx;
    return (<g>
      <rect x={x0} y={cy - 9} width={w} height={18} rx={3} fill={solid ? color : "var(--annotation-label-bg)"} stroke={color} strokeOpacity={solid ? 0 : 0.55} />
      <text x={x0 + 6} y={cy + 3.5} fill={solid ? "var(--chart-last-fg)" : color} style={{ font: `500 10px ${MONO}`, letterSpacing: "0.04em" }}>{text}</text>
    </g>);
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!crosshair) return; const r = e.currentTarget.getBoundingClientRect(); const mx = e.clientX - r.left, my = e.clientY - r.top;
    if (mx > plotW) return setHover(null);
    setHover({ i: Math.max(0, Math.min(vis.length - 1, Math.floor(mx / step))), y: my });
  };
  const timeEvery = Math.max(1, Math.round(90 / step));

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height, background: "var(--chart-bg)", borderRadius: "var(--radius-md)", overflow: "hidden", userSelect: "none", ...style }}>
      {field && <ProbabilityField intensity={1} spread={0.26} peak={0.6} rows={26} cols={64} style={{ position: "absolute", left: plotW * 0.28, width: plotW * 0.72, top: top + priceH * 0.22, height: priceH * 0.86 }} />}
      <svg width={W} height={H} style={{ position: "relative", display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {watermark && <text x={plotW / 2} y={top + priceH / 2 + 18} textAnchor="middle" fill="var(--chart-watermark)" style={{ font: `400 ${Math.min(72, plotW / 8)}px var(--font-serif)` }}>{watermark}</text>}
        {ticks.map(v => (<g key={v}>
          <line x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke="var(--chart-grid)" />
          <text x={plotW + 8} y={y(v) + 3.5} fill="var(--chart-axis-text)" style={{ font: `400 10.5px ${MONO}` }}>{fmtN(v, decimals)}</text>
        </g>))}
        <line x1={plotW} x2={plotW} y1={top - 8} y2={H - bottom} stroke="var(--border-subtle)" />
        {vis.map((c, i) => (i % timeEvery === 0 && x(i) > 24 && x(i) < plotW - 20 ? <text key={"t" + c.t} x={x(i)} y={H - 7} textAnchor="middle" fill="var(--chart-axis-text)" style={{ font: `400 10px ${MONO}` }}>{fmtT(c.t)}</text> : null))}

        {notes.filter(a => a.type === "zone" && a.from != null && a.to != null).map(a => {
          const from = a.from as number, to = a.to as number;
          const y1 = y(Math.max(from, to)), y2 = y(Math.min(from, to)); const col = TONE[a.tone || "sand"] || TONE.sand;
          return (<g key={a.id} style={{ animation: "cl-fade var(--dur-slow) var(--ease-out)" }}>
            <rect x={0} y={y1} width={plotW} height={Math.max(1, y2 - y1)} fill={a.tone && a.tone !== "sand" ? "var(--chart-zone-neutral)" : "var(--annotation-zone)"} />
            <line x1={0} x2={plotW} y1={y1} y2={y1} stroke={col} strokeOpacity={0.35} /><line x1={0} x2={plotW} y1={y2} y2={y2} stroke={col} strokeOpacity={0.35} />
            {a.label && chip(8, y1 + 13, a.label.toUpperCase(), col)}
          </g>);
        })}

        {showVolume && vis.map((c, i) => { const h = (c.v / maxV) * volH; return <rect key={"v" + c.t} x={x(i) - bw / 2} y={volTop + volH - h} width={bw} height={h} fill={c.c >= c.o ? "var(--chart-volume-up)" : "var(--chart-volume-down)"} />; })}
        {maLines.map((arr, k) => <path key={"ma" + k} d={path(arr)} fill="none" stroke={k === 0 ? "var(--chart-ma-fast)" : "var(--chart-ma-slow)"} strokeOpacity={k === 0 ? 0.8 : 0.45} strokeWidth={1.25} />)}

        {vis.map((c, i) => {
          const up = c.c >= c.o; const col = up ? "var(--candle-up)" : "var(--candle-down)"; const isLast = i === vis.length - 1;
          const by = y(Math.max(c.o, c.c)); const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
          return (<g key={c.t} opacity={hover && hover.i !== i ? 0.92 : 1} style={isLast ? { filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))" } : undefined}>
            <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={col} strokeWidth={1} />
            <rect x={x(i) - bw / 2} y={by} width={bw} height={bh} fill={isLast ? "var(--accent)" : col} rx={bw > 6 ? 1 : 0} />
          </g>);
        })}

        {notes.filter(a => a.type === "trend").map(a => {
          const i1 = idxOf(a.t1), i2 = idxOf(a.t2); if (i1 < 0 || i2 < 0 || a.p1 == null || a.p2 == null) return null; const col = TONE[a.tone || "sand"] || TONE.sand;
          return (<g key={a.id}>
            <line x1={x(i1)} y1={y(a.p1)} x2={x(i2)} y2={y(a.p2)} stroke={col} strokeWidth={1.5} pathLength={1} strokeDasharray={1} style={{ "--cl-len": 1, animation: "cl-draw var(--dur-draw) var(--ease-out) both" } as React.CSSProperties} />
            <circle cx={x(i1)} cy={y(a.p1)} r={2.5} fill={col} /><circle cx={x(i2)} cy={y(a.p2)} r={2.5} fill={col} />
            {a.label && chip(x(i2) + 8, y(a.p2), a.label.toUpperCase(), col)}
          </g>);
        })}

        {notes.filter(a => a.type === "level" && a.price != null).map(a => {
          const price = a.price as number;
          const yy = y(price); if (yy < top - 2 || yy > top + priceH + 2) return null; const col = TONE[a.tone || "sand"] || TONE.sand;
          const txt = `${(a.label || "Nível").toUpperCase()} ${fmtN(price, decimals)}`;
          return (<g key={a.id}>
            <line x1={0} x2={plotW} y1={yy} y2={yy} stroke={col} strokeWidth={1} strokeDasharray="5 4" style={{ transformBox: "fill-box", transformOrigin: "left", animation: "cl-grow-x var(--dur-draw) var(--ease-out) both" }} />
            <g style={{ animation: "cl-fade var(--dur-slow) var(--ease-out) 300ms both" }}>{chip(8, yy - 13, txt, col)}</g>
            <rect x={plotW + 1} y={yy - 9} width={axisW - 4} height={18} rx={3} fill="var(--annotation-label-bg)" stroke={col} strokeOpacity={0.6} />
            <text x={plotW + 8} y={yy + 3.5} fill={col} style={{ font: `500 10.5px ${MONO}` }}>{fmtN(price, decimals)}</text>
          </g>);
        })}

        {notes.filter(a => a.type === "marker").map(a => {
          const i = idxOf(a.t); if (i < 0) return null; const c = vis[i]; const buy = a.side === "buy";
          const col = a.side === "info" ? TONE.sand : buy ? "var(--market-up)" : "var(--market-down-text)";
          const cy = buy ? y(c.l) + 12 : y(c.h) - 12;
          return (<g key={a.id} style={{ animation: "cl-fade var(--dur-slow) var(--ease-out)" }}>
            <circle cx={x(i)} cy={cy} r={4} fill="none" stroke={col} style={{ animation: "cl-ring 1.8s var(--ease-out) 3" }} />
            <circle cx={x(i)} cy={cy} r={3.5} fill={col} stroke="var(--chart-bg)" strokeWidth={1.5} />
            {a.label && chip(x(i), buy ? cy + 16 : cy - 16, a.label.toUpperCase(), col, "middle")}
          </g>);
        })}

        <line x1={0} x2={plotW} y1={y(last.c)} y2={y(last.c)} stroke={lastCol} strokeOpacity={0.6} strokeDasharray="1 3" />
        <circle cx={x(vis.length - 1)} cy={y(last.c)} r={2.5} fill={lastCol} style={{ animation: "cl-breathe 1.4s ease-in-out infinite" }} />
        <rect x={plotW + 1} y={y(last.c) - 10} width={axisW - 4} height={20} rx={3} fill={lastCol} />
        <text x={plotW + 8} y={y(last.c) + 4} fill="var(--chart-last-fg)" style={{ font: `600 11px ${MONO}` }}>{fmtN(last.c, decimals)}</text>

        {hover && (<g pointerEvents="none">
          <line x1={x(hover.i)} x2={x(hover.i)} y1={top - 8} y2={H - bottom} stroke="var(--chart-crosshair)" strokeDasharray="3 3" />
          {hover.y > top && hover.y < top + priceH && (<>
            <line x1={0} x2={plotW} y1={hover.y} y2={hover.y} stroke="var(--chart-crosshair)" strokeDasharray="3 3" />
            <rect x={plotW + 1} y={hover.y - 9} width={axisW - 4} height={18} rx={3} fill="var(--chart-crosshair-label-bg)" />
            <text x={plotW + 8} y={hover.y + 3.5} fill="var(--chart-crosshair-label-fg)" style={{ font: `500 10.5px ${MONO}` }}>{fmtN(lo + (1 - (hover.y - top) / priceH) * (hi - lo), decimals)}</text>
          </>)}
          {chip(x(hover.i), H - bottom + 10, fmtT(hc.t), "var(--chart-crosshair-label-bg)", "middle", true)}
        </g>)}
      </svg>

      <div style={{ position: "absolute", top: 8, left: 10, display: "flex", gap: 12, alignItems: "center", font: `400 11px ${MONO}`, color: "var(--text-tertiary)", pointerEvents: "none", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {([["A", hc.o], ["M", hc.h], ["m", hc.l], ["F", hc.c]] as const).map(([k, v]) => <span key={k}>{k} <span style={{ color: "var(--text-secondary)" }}>{fmtN(v, decimals)}</span></span>)}
        <span style={{ color: chg >= 0 ? "var(--market-up-text)" : "var(--market-down-text)" }}>{chg >= 0 ? "+" : ""}{fmtN(chg, 2)}%</span>
        {ma.map((p, k) => <span key={p} style={{ color: k === 0 ? "var(--chart-ma-fast)" : "var(--chart-ma-slow)", opacity: 0.9 }}>MM{p}</span>)}
      </div>

      {scanning && (
        <div style={{ position: "absolute", left: 0, top: top - 8, width: plotW, height: plotH + 8, overflow: "hidden", pointerEvents: "none", zIndex: "var(--z-chart-overlay)" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, width: "14%", background: "var(--scan-beam)", borderRight: "1px solid var(--scan-edge)", animation: "cl-scan var(--dur-scan) linear infinite" }} />
        </div>
      )}
    </div>
  );
}
CandleChart.generateSeries = generateSeries;
CandleChart.sma = sma;
