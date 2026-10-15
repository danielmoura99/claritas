"use client";

import * as React from "react";
import { fmtBR } from "../../lib/format";
import { useTween } from "../../lib/useTween";

const erf = (x: number) => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };

/** Projected price distribution. The curve morphs as mean/sd change; shows P(price ≥ target). */
export interface DistributionCurveProps {
  mean: number;
  sd: number;
  target?: number;
  min?: number;
  max?: number;
  ticks?: number;
  decimals?: number;
  height?: number;
  showProbability?: boolean;
  caption?: string;
  style?: React.CSSProperties;
}

export function DistributionCurve({ mean = 100, sd = 4, target, min, max, ticks = 5, decimals = 0, height = 120, showProbability = true, caption, style }: DistributionCurveProps) {
  const gid = "cl-dist-" + React.useId().replace(/:/g, "");
  const wrap = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(260);
  React.useLayoutEffect(() => { const ro = new ResizeObserver(([e]) => setW(Math.max(120, e.contentRect.width))); if (wrap.current) ro.observe(wrap.current); return () => ro.disconnect(); }, []);
  const lo = min ?? mean - sd * 3.4, hi = max ?? mean + sd * 3.4;
  const headH = showProbability && target != null ? 40 : 0; const svgH = height - headH; const axisH = 18, plotH = svgH - axisH;
  const x = (v: number) => ((v - lo) / (hi - lo)) * w;
  const pdf = (v: number, m: number, s: number) => Math.exp(-((v - m) ** 2) / (2 * s * s));
  const curve = (m: number, s: number, k = 1) => { let d = ""; for (let i = 0; i <= 64; i++) { const v = lo + ((hi - lo) * i) / 64; d += (i ? "L" : "M") + x(v).toFixed(1) + "," + (4 + (1 - pdf(v, m, s) * k) * (plotH - 6)).toFixed(1); } return d; };
  const d = curve(mean, sd), prior = curve(lo + (hi - lo) / 2, sd * 1.25, 0.82);
  const p = target != null ? (1 - 0.5 * (1 + erf((target - mean) / (sd * Math.SQRT2)))) * 100 : null;
  const pv = useTween(p ?? 0, 700);
  const tickVals = Array.from({ length: ticks }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / ticks);
  const tr = "d 900ms var(--ease-out)";
  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height, ...style }}>
      {headH > 0 && (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, height: headH }}>
          <span style={{ font: "400 26px/1 var(--font-mono)", letterSpacing: "-0.03em", color: "var(--accent)" }}>{Math.round(pv)}%</span>
          <span style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--text-tertiary)", textAlign: "right" }}>{caption || `chance de ≥ ${fmtBR(target as number, decimals)}`}</span>
        </div>
      )}
      <svg width={w} height={svgH} style={{ display: "block", overflow: "visible" }}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" /><stop offset="100%" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
        <path d={prior} fill="none" stroke="var(--chart-prior)" strokeDasharray="2 3" style={{ d: `path("${prior}")`, transition: tr } as React.CSSProperties} />
        <path d={`${d}L${w},${plotH}L0,${plotH}Z`} fill={`url(#${gid})`} style={{ d: `path("${d}L${w},${plotH}L0,${plotH}Z")`, transition: tr } as React.CSSProperties} />
        <path d={d} fill="none" stroke="var(--text-primary)" strokeWidth={1.25} style={{ d: `path("${d}")`, transition: tr } as React.CSSProperties} />
        <line x1={x(mean)} x2={x(mean)} y1={8} y2={plotH} stroke="var(--accent)" strokeDasharray="3 3" style={{ transition: "all 900ms var(--ease-out)" }} />
        <circle cx={x(mean)} cy={4} r={3.5} fill="var(--accent)" style={{ transition: "cx 900ms var(--ease-out)", filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 70%, transparent))" }} />
        {target != null && <line x1={x(target)} x2={x(target)} y1={0} y2={plotH} stroke="var(--accent)" strokeOpacity={0.35} />}
        <line x1={0} x2={w} y1={plotH} y2={plotH} stroke="var(--border-default)" />
        {tickVals.map(v => <text key={v} x={x(v)} y={svgH - 3} textAnchor="middle" fill="var(--chart-axis-text)" style={{ font: "400 10px var(--font-mono)" }}>{fmtBR(v, decimals)}</text>)}
      </svg>
    </div>
  );
}
