"use client";

import * as React from "react";

const hexToRgb = (h: string) => {
  const m = (h || "").trim().replace("#", "");
  if (m.length !== 6) return [200, 178, 142];
  return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16));
};

/** Animated dot-mesh surface (canvas) — Claritas' projected probability landscape. Procedural, not an illustration. Sits behind charts. */
export interface ProbabilityFieldProps {
  width?: number | string;
  height?: number | string;
  cols?: number;
  rows?: number;
  /** CSS custom property to read the dot color from. Default '--sand-400'. */
  colorVar?: string;
  /** 0–1 overall opacity. */
  intensity?: number;
  speed?: number;
  /** 0–1 horizontal position of the probability peak. */
  peak?: number;
  /** Peak width (0.1 narrow – 0.4 wide). */
  spread?: number;
  /** Draw thin row lines between dots. */
  wire?: boolean;
  style?: React.CSSProperties;
}

export function ProbabilityField({ width = "100%", height = "100%", cols = 56, rows = 24, colorVar = "--sand-400", intensity = 1, speed = 1, peak = 0.55, spread = 0.2, wire = true, style }: ProbabilityFieldProps) {
  const wrap = React.useRef<HTMLDivElement>(null), cv = React.useRef<HTMLCanvasElement>(null);
  const cfg = React.useRef({ cols, rows, intensity, speed, peak, spread, wire });
  // The animation loop reads the latest props without restarting.
  React.useEffect(() => { cfg.current = { cols, rows, intensity, speed, peak, spread, wire }; }, [cols, rows, intensity, speed, peak, spread, wire]);
  React.useEffect(() => {
    const el = wrap.current, c = cv.current; if (!el || !c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const [R, G, B] = hexToRgb(getComputedStyle(el).getPropertyValue(colorVar));
    let W = 0, H = 0, raf = 0, t = Math.random() * 10, last = performance.now();
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = () => { const r = el.getBoundingClientRect(); const d = window.devicePixelRatio || 1; W = r.width; H = r.height; c.width = W * d; c.height = H * d; c.style.width = W + "px"; c.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(size); ro.observe(el); size();
    const frame = (now: number) => {
      const k = cfg.current; t += Math.min(0.05, (now - last) / 1000) * k.speed; last = now;
      ctx.clearRect(0, 0, W, H);
      const px = k.peak * 2 - 1 + 0.12 * Math.sin(t * 0.33);
      const pts: { x: number; y: number; a: number; s: number }[][] = [];
      for (let r = 0; r < k.rows; r++) {
        const z = r / (k.rows - 1); const row = [];
        for (let q = 0; q < k.cols; q++) {
          const x = (q / (k.cols - 1)) * 2 - 1;
          const bump = Math.exp(-((x - px) ** 2) / (2 * k.spread ** 2)) * Math.exp(-((z - 0.42 - 0.06 * Math.sin(t * 0.5)) ** 2) / (2 * 0.2 ** 2));
          const wave = 0.07 * Math.sin(x * 5 + t * 1.15 + z * 6) + 0.045 * Math.sin(z * 9 - t * 0.8 + x * 2);
          const h = bump * 0.95 + wave * (0.35 + bump);
          const p = 1 / (1 + z * 1.5);
          row.push({ x: W / 2 + x * W * 0.6 * p, y: H * 0.94 - z * H * 0.5 - h * H * 0.5 * p, a: (0.12 + 0.88 * Math.min(1, bump * 1.3 + 0.08)) * (1 - z * 0.6) * k.intensity, s: (0.55 + 1.15 * p * (0.45 + bump)) });
        }
        pts.push(row);
      }
      if (k.wire) {
        ctx.lineWidth = 0.6;
        for (const row of pts) { ctx.beginPath(); row.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y))); ctx.strokeStyle = `rgba(${R},${G},${B},${0.09 * k.intensity})`; ctx.stroke(); }
      }
      for (const row of pts) for (const pt of row) { ctx.fillStyle = `rgba(${R},${G},${B},${pt.a.toFixed(3)})`; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.s, 0, 6.283); ctx.fill(); }
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [colorVar]);
  return <div ref={wrap} aria-hidden style={{ position: "relative", width, height, pointerEvents: "none", ...style }}><canvas ref={cv} style={{ position: "absolute", inset: 0 }} /></div>;
}
