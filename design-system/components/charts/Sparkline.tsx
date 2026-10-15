"use client";

import * as React from "react";

/** Tiny line chart, colored by direction. */
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  /** Dashed line at the first value (open). */
  baseline?: boolean;
  /** Pulsing dot on the last point. */
  liveDot?: boolean;
  /** Draw-on animation on mount. */
  animate?: boolean;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export function Sparkline({ data = [], width = 96, height = 28, color, area = true, baseline = true, liveDot = false, animate = true, strokeWidth = 1.5, style }: SparklineProps) {
  const id = "cl-spark-" + React.useId().replace(/:/g, "");
  if (data.length < 2) return <svg width={width} height={height} style={style} />;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pad = 3;
  const px = (i: number) => (i / (data.length - 1)) * (width - pad * 2) + pad;
  const py = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const up = data[data.length - 1] >= data[0];
  const col = color || (up ? "var(--market-up)" : "var(--market-down)");
  const d = data.map((v, i) => (i ? "L" : "M") + px(i).toFixed(1) + "," + py(v).toFixed(1)).join("");
  const lx = px(data.length - 1), ly = py(data[data.length - 1]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.28" /><stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      {baseline && <line x1={pad} x2={width - pad} y1={py(data[0])} y2={py(data[0])} stroke="var(--chart-baseline)" strokeDasharray="2 2" strokeWidth={1} />}
      {area && <path d={`${d}L${lx},${height}L${pad},${height}Z`} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={col} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round"
        pathLength={animate ? 1 : undefined} strokeDasharray={animate ? 1 : undefined}
        style={animate ? ({ "--cl-len": 1, animation: "cl-draw var(--dur-draw) var(--ease-out) both" } as React.CSSProperties) : undefined} />
      {liveDot && (<g>
        <circle cx={lx} cy={ly} r={4} fill="none" stroke={col} style={{ animation: "cl-ring 1.6s var(--ease-out) infinite" }} />
        <circle cx={lx} cy={ly} r={2.25} fill={col} />
      </g>)}
    </svg>
  );
}
