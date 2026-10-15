/* @ds-bundle: {"format":4,"namespace":"ClaritasDesignSystem_c8f168","components":[{"name":"ConfidenceMeter","sourcePath":"components/analysis/ConfidenceMeter.jsx"},{"name":"MetricRow","sourcePath":"components/analysis/MetricRow.jsx"},{"name":"SentimentGauge","sourcePath":"components/analysis/SentimentGauge.jsx"},{"name":"SignalCard","sourcePath":"components/analysis/SignalCard.jsx"},{"name":"CandleChart","sourcePath":"components/charts/CandleChart.jsx"},{"name":"DistributionCurve","sourcePath":"components/charts/DistributionCurve.jsx"},{"name":"FlowArea","sourcePath":"components/charts/FlowArea.jsx"},{"name":"ProbabilityField","sourcePath":"components/charts/ProbabilityField.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Sparkline.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"Tooltip","sourcePath":"components/core/Tooltip.jsx"},{"name":"Wordmark","sourcePath":"components/core/Wordmark.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"LiveIndicator","sourcePath":"components/feedback/LiveIndicator.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Delta","sourcePath":"components/market/Delta.jsx"},{"name":"PriceTicker","sourcePath":"components/market/PriceTicker.jsx"},{"name":"TickerTape","sourcePath":"components/market/TickerTape.jsx"},{"name":"WatchRow","sourcePath":"components/market/WatchRow.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/analysis/ConfidenceMeter.jsx":"a8a3cbbbdbc2","components/analysis/MetricRow.jsx":"e371235e2ce1","components/analysis/SentimentGauge.jsx":"054624897532","components/analysis/SignalCard.jsx":"0924bf3afc45","components/charts/CandleChart.jsx":"dfbf452d2f73","components/charts/DistributionCurve.jsx":"998d0532915e","components/charts/FlowArea.jsx":"c982121b042f","components/charts/ProbabilityField.jsx":"784920ace8a5","components/charts/Sparkline.jsx":"a74691b15e41","components/core/Badge.jsx":"ad8a78800b50","components/core/Button.jsx":"0cfd997445f8","components/core/Icon.jsx":"da359200e65c","components/core/IconButton.jsx":"486f42485418","components/core/Panel.jsx":"c44fba361062","components/core/Tooltip.jsx":"e5d4471853a1","components/core/Wordmark.jsx":"09d05a5b1978","components/feedback/Dialog.jsx":"c55f3dfb8f12","components/feedback/LiveIndicator.jsx":"f64d9df31933","components/feedback/Toast.jsx":"23f92c1dbddb","components/forms/Checkbox.jsx":"ac0c57bc0683","components/forms/Input.jsx":"d164691b7b56","components/forms/Select.jsx":"0951081afaec","components/forms/Switch.jsx":"a2a56efbbc44","components/market/Delta.jsx":"1c66e3ba1117","components/market/PriceTicker.jsx":"ad7d8059471b","components/market/TickerTape.jsx":"27240cda8d8b","components/market/WatchRow.jsx":"b378df67aa91","components/navigation/SegmentedControl.jsx":"2ddc281077a9","components/navigation/Tabs.jsx":"3dee6d337f06","ui_kits/terminal/App.jsx":"9695937eb6db","ui_kits/terminal/Chrome.jsx":"d47306075286","ui_kits/terminal/Desk.jsx":"1c44eed52abb","ui_kits/terminal/Report.jsx":"1e91589e0e05","ui_kits/terminal/Scanner.jsx":"77c76d536229","ui_kits/terminal/Watchlist.jsx":"3a646bc5567e","ui_kits/terminal/data.js":"11302518f865"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ClaritasDesignSystem_c8f168 = window.ClaritasDesignSystem_c8f168 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/analysis/ConfidenceMeter.jsx
try { (() => {
// How sure Claritas is. Segments fill in sequence on mount/change.
function ConfidenceMeter({
  value = 0,
  variant = 'bar',
  segments = 12,
  label = 'Confiança',
  showValue = true,
  size = 'md',
  tone = 'sand',
  style
}) {
  const v = Math.max(0, Math.min(100, value));
  const col = tone === 'up' ? 'var(--market-up)' : tone === 'down' ? 'var(--market-down)' : 'var(--accent)';
  if (variant === 'arc') {
    const d = size === 'sm' ? 64 : 96,
      sw = size === 'sm' ? 5 : 7,
      r = (d - sw) / 2,
      c = Math.PI * r;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        width: d,
        height: d / 2 + 6,
        ...style
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: d,
      height: d / 2 + sw,
      viewBox: `0 0 ${d} ${d / 2 + sw}`,
      style: {
        display: 'block',
        overflow: 'visible'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: `M${sw / 2},${d / 2} A${r},${r} 0 0 1 ${d - sw / 2},${d / 2}`,
      fill: "none",
      stroke: "var(--ink-700)",
      strokeWidth: sw,
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: `M${sw / 2},${d / 2} A${r},${r} 0 0 1 ${d - sw / 2},${d / 2}`,
      fill: "none",
      stroke: col,
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeDasharray: c,
      strokeDashoffset: c * (1 - v / 100),
      style: {
        transition: 'stroke-dashoffset var(--dur-draw) var(--ease-out)',
        filter: `drop-shadow(0 0 6px ${tone === 'sand' ? 'rgba(200,178,142,.5)' : 'transparent'})`
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        font: `var(--weight-medium) ${size === 'sm' ? 15 : 22}px/1 var(--font-mono)`,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em'
      }
    }, Math.round(v), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.55em',
        color: 'var(--text-tertiary)'
      }
    }, "%"))));
  }
  const lit = Math.round(v / 100 * segments);
  const h = size === 'sm' ? 6 : 10;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
      minWidth: 0,
      ...style
    }
  }, (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-medium) 12px/1 var(--font-mono)',
      color: col
    }
  }, Math.round(v), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${segments},1fr)`,
      gap: 2
    }
  }, Array.from({
    length: segments
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      height: h,
      borderRadius: 1.5,
      background: i < lit ? col : 'var(--ink-700)',
      opacity: i < lit ? 0.45 + 0.55 * (i + 1) / Math.max(1, lit) : 1,
      transition: `background var(--dur-fast) var(--ease-out) ${i * 40}ms, opacity var(--dur-fast) var(--ease-out) ${i * 40}ms`
    }
  }))));
}
Object.assign(__ds_scope, { ConfidenceMeter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/analysis/ConfidenceMeter.jsx", error: String((e && e.message) || e) }); }

// components/analysis/SentimentGauge.jsx
try { (() => {
const useTween = (target, ms = 900) => {
  const [v, setV] = React.useState(target);
  const from = React.useRef(target);
  React.useEffect(() => {
    const a = from.current,
      t0 = performance.now();
    let raf;
    const f = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const x = a + (target - a) * e;
      setV(x);
      from.current = x;
      if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
};
const WORDS = [[20, 'Vendedor forte'], [40, 'Vendedor'], [60, 'Neutro'], [80, 'Comprador'], [101, 'Comprador forte']];

// Market sentiment 0–100 as a tick-mark arc. Ticks light up in sand toward the value; number tweens.
function SentimentGauge({
  value = 50,
  size = 200,
  ticks = 44,
  label,
  minLabel = 'Extremo vendedor',
  maxLabel = 'Extremo comprador',
  style
}) {
  const v = useTween(Math.max(0, Math.min(100, value)));
  const cx = size / 2,
    cy = size / 2,
    r1 = size / 2 - 4,
    r2 = r1 - size * 0.075;
  const word = label || WORDS.find(([m]) => v < m)[1];
  const lit = v / 100 * (ticks - 1);
  const ang = i => Math.PI + i / (ticks - 1) * Math.PI;
  const ea = ang(lit);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: size,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size / 2 + 8
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size / 2 + 8,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, Array.from({
    length: ticks
  }, (_, i) => {
    const a = ang(i),
      on = i <= lit,
      near = Math.max(0, 1 - Math.abs(i - lit) / 6);
    return /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: cx + Math.cos(a) * r2,
      y1: cy + Math.sin(a) * r2,
      x2: cx + Math.cos(a) * r1,
      y2: cy + Math.sin(a) * r1,
      stroke: on ? 'var(--accent)' : 'var(--ink-700)',
      strokeOpacity: on ? 0.35 + 0.65 * (i / Math.max(1, lit)) : 1,
      strokeWidth: on && near > 0.6 ? 2.4 : 1.6,
      strokeLinecap: "round"
    });
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx + Math.cos(ea) * (r1 + 7),
    cy: cy + Math.sin(ea) * (r1 + 7),
    r: 3.5,
    fill: "var(--accent)",
    style: {
      filter: 'drop-shadow(0 0 8px rgba(200,178,142,.9))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `300 ${Math.round(size * 0.22)}px/1 var(--font-mono)`,
      letterSpacing: '-0.04em',
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, Math.round(v)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `400 ${Math.round(size * 0.085)}px/1 var(--font-serif)`,
      fontStyle: 'italic',
      color: 'var(--accent)'
    }
  }, word))), (minLabel || maxLabel) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 8,
      font: '400 10.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("span", null, minLabel), /*#__PURE__*/React.createElement("span", null, maxLabel)));
}
Object.assign(__ds_scope, { SentimentGauge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/analysis/SentimentGauge.jsx", error: String((e && e.message) || e) }); }

// components/charts/DistributionCurve.jsx
try { (() => {
const erf = x => {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const useTween = (target, ms = 700) => {
  const [v, setV] = React.useState(target);
  const from = React.useRef(target);
  React.useEffect(() => {
    const a = from.current,
      t0 = performance.now();
    let raf;
    const f = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const x = a + (target - a) * e;
      setV(x);
      from.current = x;
      if (k < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
};
const fmt = (v, d) => Number(v).toLocaleString('pt-BR', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});

// Projected price distribution. The curve morphs as mean/sd change; shows P(price ≥ target).
function DistributionCurve({
  mean = 100,
  sd = 4,
  target,
  min,
  max,
  ticks = 5,
  decimals = 0,
  height = 120,
  showProbability = true,
  caption,
  style
}) {
  const wrap = React.useRef(null);
  const [w, setW] = React.useState(260);
  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(120, e.contentRect.width)));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  const lo = min ?? mean - sd * 3.4,
    hi = max ?? mean + sd * 3.4;
  const headH = showProbability && target != null ? 40 : 0;
  const svgH = height - headH;
  const axisH = 18,
    plotH = svgH - axisH;
  const x = v => (v - lo) / (hi - lo) * w;
  const pdf = (v, m, s) => Math.exp(-((v - m) ** 2) / (2 * s * s));
  const curve = (m, s, k = 1) => {
    let d = '';
    for (let i = 0; i <= 64; i++) {
      const v = lo + (hi - lo) * i / 64;
      d += (i ? 'L' : 'M') + x(v).toFixed(1) + ',' + (4 + (1 - pdf(v, m, s) * k) * (plotH - 6)).toFixed(1);
    }
    return d;
  };
  const d = curve(mean, sd),
    prior = curve(lo + (hi - lo) / 2, sd * 1.25, 0.82);
  const p = target != null ? (1 - 0.5 * (1 + erf((target - mean) / (sd * Math.SQRT2)))) * 100 : null;
  const pv = useTween(p ?? 0);
  const tickVals = Array.from({
    length: ticks
  }, (_, i) => lo + (hi - lo) * (i + 0.5) / ticks);
  const tr = 'd 900ms cubic-bezier(.2,.8,.2,1)';
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      position: 'relative',
      width: '100%',
      height,
      ...style
    }
  }, headH > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
      height: headH
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 26px/1 var(--font-mono)',
      letterSpacing: '-0.03em',
      color: 'var(--accent)'
    }
  }, Math.round(pv), "%"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1.3 var(--font-sans)',
      color: 'var(--text-tertiary)',
      textAlign: 'right'
    }
  }, caption || `chance de ≥ ${fmt(target, decimals)}`)), /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: svgH,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "cl-dist-g",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--accent)",
    stopOpacity: "0.18"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--accent)",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: prior,
    fill: "none",
    stroke: "var(--ink-500)",
    strokeDasharray: "2 3",
    style: {
      d: `path("${prior}")`,
      transition: tr
    }
  }), /*#__PURE__*/React.createElement("path", {
    d: `${d}L${w},${plotH}L0,${plotH}Z`,
    fill: "url(#cl-dist-g)",
    style: {
      d: `path("${d}L${w},${plotH}L0,${plotH}Z")`,
      transition: tr
    }
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: "var(--text-primary)",
    strokeWidth: 1.25,
    style: {
      d: `path("${d}")`,
      transition: tr
    }
  }), /*#__PURE__*/React.createElement("line", {
    x1: x(mean),
    x2: x(mean),
    y1: 8,
    y2: plotH,
    stroke: "var(--accent)",
    strokeDasharray: "3 3",
    style: {
      transition: 'all 900ms cubic-bezier(.2,.8,.2,1)'
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(mean),
    cy: 4 + 0 * plotH,
    r: 3.5,
    fill: "var(--accent)",
    style: {
      transition: 'cx 900ms cubic-bezier(.2,.8,.2,1)',
      filter: 'drop-shadow(0 0 6px rgba(200,178,142,.7))'
    }
  }), target != null && /*#__PURE__*/React.createElement("line", {
    x1: x(target),
    x2: x(target),
    y1: 0,
    y2: plotH,
    stroke: "var(--accent)",
    strokeOpacity: 0.35
  }), /*#__PURE__*/React.createElement("line", {
    x1: 0,
    x2: w,
    y1: plotH,
    y2: plotH,
    stroke: "var(--border-default)"
  }), tickVals.map(v => /*#__PURE__*/React.createElement("text", {
    key: v,
    x: x(v),
    y: svgH - 3,
    textAnchor: "middle",
    fill: "var(--chart-axis-text)",
    style: {
      font: '400 10px var(--font-mono)'
    }
  }, fmt(v, decimals)))));
}
Object.assign(__ds_scope, { DistributionCurve });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/DistributionCurve.jsx", error: String((e && e.message) || e) }); }

// components/charts/FlowArea.jsx
try { (() => {
let FLOW_ID = 0;
const smooth = pts => {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
};

// Streaming area chart (net flow, cumulative volume). In live mode the curve glides left continuously.
function FlowArea({
  data,
  live = false,
  tickMs = 1000,
  points = 40,
  height = 96,
  color = 'var(--accent)',
  drift = 0.12,
  grid = true,
  onTick,
  style
}) {
  const id = React.useRef('cl-flow-' + ++FLOW_ID).current;
  const wrap = React.useRef(null);
  const [w, setW] = React.useState(240);
  const [inner, setInner] = React.useState(() => {
    let v = 0;
    return Array.from({
      length: points
    }, () => v += Math.random() - 0.5 + drift);
  });
  const [n, setN] = React.useState(0);
  const series = data || inner;
  React.useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(80, e.contentRect.width)));
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    if (!live || data) return;
    const t = setInterval(() => {
      setInner(s => [...s.slice(1), s[s.length - 1] + (Math.random() - 0.5) * 1.1 + drift]);
      setN(x => x + 1);
    }, tickMs);
    return () => clearInterval(t);
  }, [live, data, tickMs, drift]);
  React.useEffect(() => {
    onTick && onTick(series);
  }, [series]);
  const min = Math.min(...series),
    max = Math.max(...series),
    span = max - min || 1;
  const step = w / (series.length - 2);
  const pts = series.map((v, i) => [i * step, 6 + (1 - (v - min) / span) * (height - 12)]);
  const d = smooth(pts);
  const last = pts[pts.length - 2];
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      position: 'relative',
      width: '100%',
      height,
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: w,
    height: height,
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: id,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.38"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), grid && [0.25, 0.5, 0.75].map(f => /*#__PURE__*/React.createElement("line", {
    key: f,
    x1: 0,
    x2: w,
    y1: height * f,
    y2: height * f,
    stroke: "var(--chart-grid)"
  })), /*#__PURE__*/React.createElement("g", {
    key: n,
    style: live && !data ? {
      '--cl-dx': step + 'px',
      animation: `cl-slide-x ${tickMs}ms linear`
    } : undefined
  }, /*#__PURE__*/React.createElement("path", {
    d: `${d}L${pts[pts.length - 1][0]},${height}L0,${height}Z`,
    fill: `url(#${id})`
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("circle", {
    cx: last[0],
    cy: last[1],
    r: 5,
    fill: "none",
    stroke: color,
    style: {
      animation: 'cl-ring 1.6s var(--ease-out) infinite'
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: last[0],
    cy: last[1],
    r: 2.5,
    fill: color
  })));
}
Object.assign(__ds_scope, { FlowArea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/FlowArea.jsx", error: String((e && e.message) || e) }); }

// components/charts/ProbabilityField.jsx
try { (() => {
const hexToRgb = h => {
  const m = (h || '').trim().replace('#', '');
  if (m.length !== 6) return [200, 178, 142];
  return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16));
};

// Animated dot-mesh surface: Claritas' projected probability landscape. Procedural (canvas), not an illustration.
function ProbabilityField({
  width = '100%',
  height = '100%',
  cols = 56,
  rows = 24,
  colorVar = '--sand-400',
  intensity = 1,
  speed = 1,
  peak = 0.55,
  spread = 0.2,
  wire = true,
  style
}) {
  const wrap = React.useRef(null),
    cv = React.useRef(null),
    cfg = React.useRef({});
  cfg.current = {
    cols,
    rows,
    intensity,
    speed,
    peak,
    spread,
    wire
  };
  React.useEffect(() => {
    const el = wrap.current,
      c = cv.current;
    if (!el || !c) return;
    const ctx = c.getContext('2d');
    const [R, G, B] = hexToRgb(getComputedStyle(el).getPropertyValue(colorVar));
    let W = 0,
      H = 0,
      raf,
      t = Math.random() * 10,
      last = performance.now();
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = () => {
      const r = el.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      W = r.width;
      H = r.height;
      c.width = W * d;
      c.height = H * d;
      c.style.width = W + 'px';
      c.style.height = H + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();
    const frame = now => {
      const k = cfg.current;
      t += Math.min(0.05, (now - last) / 1000) * k.speed;
      last = now;
      ctx.clearRect(0, 0, W, H);
      const px = k.peak * 2 - 1 + 0.12 * Math.sin(t * 0.33);
      const pts = [];
      for (let r = 0; r < k.rows; r++) {
        const z = r / (k.rows - 1);
        const row = [];
        for (let q = 0; q < k.cols; q++) {
          const x = q / (k.cols - 1) * 2 - 1;
          const bump = Math.exp(-((x - px) ** 2) / (2 * k.spread ** 2)) * Math.exp(-((z - 0.42 - 0.06 * Math.sin(t * 0.5)) ** 2) / (2 * 0.2 ** 2));
          const wave = 0.07 * Math.sin(x * 5 + t * 1.15 + z * 6) + 0.045 * Math.sin(z * 9 - t * 0.8 + x * 2);
          const h = bump * 0.95 + wave * (0.35 + bump);
          const p = 1 / (1 + z * 1.5);
          row.push({
            x: W / 2 + x * W * 0.6 * p,
            y: H * 0.94 - z * H * 0.5 - h * H * 0.5 * p,
            a: (0.12 + 0.88 * Math.min(1, bump * 1.3 + 0.08)) * (1 - z * 0.6) * k.intensity,
            s: 0.55 + 1.15 * p * (0.45 + bump)
          });
        }
        pts.push(row);
      }
      if (k.wire) {
        ctx.lineWidth = 0.6;
        for (const row of pts) {
          ctx.beginPath();
          row.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
          ctx.strokeStyle = `rgba(${R},${G},${B},${0.09 * k.intensity})`;
          ctx.stroke();
        }
      }
      for (const row of pts) for (const pt of row) {
        ctx.fillStyle = `rgba(${R},${G},${B},${pt.a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.s, 0, 6.283);
        ctx.fill();
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [colorVar]);
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      position: 'relative',
      width,
      height,
      pointerEvents: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: cv,
    style: {
      position: 'absolute',
      inset: 0
    }
  }));
}
Object.assign(__ds_scope, { ProbabilityField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/ProbabilityField.jsx", error: String((e && e.message) || e) }); }

// components/charts/CandleChart.jsx
try { (() => {
const BRT = 'America/Sao_Paulo';
const fmtN = (v, d = 2) => Number(v).toLocaleString('pt-BR', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});
const fmtT = t => new Date(t).toLocaleTimeString('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: BRT
});
const makeRng = seed => {
  let s = seed >>> 0 || 1;
  return () => {
    s = s * 1664525 + 1013904223 >>> 0;
    return s / 4294967296;
  };
};
function generateSeries({
  count = 96,
  start = 38.2,
  seed = 7,
  vol = 0.0016,
  interval = 300000,
  startTime = Date.UTC(2026, 9, 9, 13, 0)
} = {}) {
  const r = makeRng(seed);
  let p = start;
  const out = [];
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i / 17 + seed) * vol * 0.035;
    const o = p;
    let h = o,
      l = o,
      c = o;
    for (let k = 0; k < 8; k++) {
      c *= 1 + (r() - 0.5) * vol * 2.2 + drift;
      h = Math.max(h, c);
      l = Math.min(l, c);
    }
    h *= 1 + r() * vol * 0.9;
    l *= 1 - r() * vol * 0.9;
    out.push({
      t: startTime + i * interval,
      o,
      h,
      l,
      c,
      v: Math.round((0.5 + r()) * 9e4 * (1 + Math.abs(c - o) / o * 220))
    });
    p = c;
  }
  return out;
}
function sma(arr, n) {
  const out = new Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i].c;
    if (i >= n) sum -= arr[i - n].c;
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}
function niceTicks(min, max, count = 5) {
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const n = raw / mag;
  const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(v);
  return out;
}
const TONE = {
  sand: 'var(--annotation)',
  up: 'var(--market-up)',
  down: 'var(--market-down-text)',
  info: 'var(--status-info)'
};
const MONO = 'var(--font-mono)';
function CandleChart({
  data,
  height = 360,
  window: win = 72,
  live = false,
  tickMs = 650,
  ticksPerCandle = 9,
  seed = 7,
  start = 38.2,
  decimals = 2,
  annotations = [],
  autoAnalyze = false,
  scanning = false,
  showVolume = true,
  ma = [9, 21],
  crosshair = true,
  watermark,
  field = false,
  onTick,
  style
}) {
  const wrap = React.useRef(null);
  const [box, setBox] = React.useState({
    w: 640,
    h: typeof height === 'number' ? height : 360
  });
  const [inner, setInner] = React.useState(() => generateSeries({
    seed,
    start
  }));
  const [hover, setHover] = React.useState(null);
  const rng = React.useRef(makeRng(seed * 31 + 5));
  const n = React.useRef(0);
  const series = data || inner;
  React.useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({
      w: Math.max(200, e.contentRect.width),
      h: Math.max(160, e.contentRect.height)
    }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    if (!live || data) return;
    const id = setInterval(() => setInner(prev => {
      const s = prev.slice();
      const last = {
        ...s[s.length - 1]
      };
      const r = rng.current;
      n.current++;
      const iv = s.length > 1 ? s[1].t - s[0].t : 300000;
      const bias = Math.sin(n.current / 37) * 0.00035;
      last.c *= 1 + (r() - 0.5) * 0.0042 + bias;
      last.h = Math.max(last.h, last.c);
      last.l = Math.min(last.l, last.c);
      last.v += Math.round(r() * 9000);
      s[s.length - 1] = last;
      if (n.current % ticksPerCandle === 0) s.push({
        t: last.t + iv,
        o: last.c,
        h: last.c,
        l: last.c,
        c: last.c,
        v: Math.round(r() * 15000)
      });
      if (s.length > win + 60) s.shift();
      return s;
    }), tickMs);
    return () => clearInterval(id);
  }, [live, data, tickMs, ticksPerCandle, win]);
  React.useEffect(() => {
    onTick && onTick(series);
  }, [series]);
  const W = box.w,
    H = box.h,
    axisW = 66,
    top = 30,
    bottom = 22;
  const plotW = W - axisW;
  const plotH = H - top - bottom;
  const volH = showVolume ? Math.round(plotH * 0.16) : 0;
  const priceH = plotH - volH - (showVolume ? 8 : 0);
  const offset = Math.max(0, series.length - win);
  const vis = series.slice(offset);
  const step = plotW / win;
  const bw = Math.max(1, Math.min(14, step * 0.62));
  const maLines = ma.map(p => sma(series, p).slice(offset));

  // Auto analysis — Claritas reads the tape and draws its conclusions in sand.
  const auto = [];
  if (autoAnalyze && vis.length > 20) {
    const look = vis.slice(-48);
    const res = Math.max(...look.map(c => c.h)),
      sup = Math.min(...look.map(c => c.l));
    auto.push({
      id: 'res-' + res.toFixed(2),
      type: 'level',
      price: res,
      label: 'Resistência'
    });
    auto.push({
      id: 'sup-' + sup.toFixed(2),
      type: 'level',
      price: sup,
      label: 'Suporte'
    });
    const f = sma(series, 9).slice(offset),
      sl = sma(series, 21).slice(offset);
    const marks = [];
    for (let i = 1; i < vis.length - 1; i++) {
      if (f[i - 1] == null || sl[i - 1] == null) continue;
      if (f[i - 1] <= sl[i - 1] && f[i] > sl[i]) marks.push({
        id: 'x-' + vis[i].t,
        type: 'marker',
        t: vis[i].t,
        side: 'buy',
        label: 'Cruzamento ↑'
      });
      if (f[i - 1] >= sl[i - 1] && f[i] < sl[i]) marks.push({
        id: 'x-' + vis[i].t,
        type: 'marker',
        t: vis[i].t,
        side: 'sell',
        label: 'Cruzamento ↓'
      });
    }
    auto.push(...marks.slice(-3));
  }
  const notes = [...auto, ...annotations];
  let lo = Math.min(...vis.map(c => c.l)),
    hi = Math.max(...vis.map(c => c.h));
  notes.forEach(a => {
    [a.price, a.from, a.to].forEach(p => {
      if (p != null && p > lo * 0.97 && p < hi * 1.03) {
        lo = Math.min(lo, p);
        hi = Math.max(hi, p);
      }
    });
  });
  const pad = (hi - lo) * 0.08 || 0.5;
  lo -= pad;
  hi += pad;
  const y = p => top + (1 - (p - lo) / (hi - lo)) * priceH;
  const x = i => i * step + step / 2;
  const idxOf = t => vis.findIndex(c => c.t === t);
  const ticks = niceTicks(lo, hi, 5);
  const maxV = Math.max(...vis.map(c => c.v));
  const volTop = top + priceH + 8;
  const last = vis[vis.length - 1];
  const prevC = vis.length > 1 ? vis[vis.length - 2].c : last.o;
  const lastCol = 'var(--accent)';
  const hc = hover != null ? vis[hover.i] : last;
  const chg = (hc.c - hc.o) / hc.o * 100;
  const path = arr => arr.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean).map((p, i) => (i ? 'L' : 'M') + p).join('');
  const chip = (cx, cy, text, color, anchor = 'start', solid = false) => {
    const w = text.length * 6.1 + 12;
    const x0 = anchor === 'end' ? cx - w : anchor === 'middle' ? cx - w / 2 : cx;
    return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("rect", {
      x: x0,
      y: cy - 9,
      width: w,
      height: 18,
      rx: 3,
      fill: solid ? color : 'var(--annotation-label-bg)',
      stroke: color,
      strokeOpacity: solid ? 0 : 0.55
    }), /*#__PURE__*/React.createElement("text", {
      x: x0 + 6,
      y: cy + 3.5,
      fill: solid ? 'var(--ink-950)' : color,
      style: {
        font: `500 10px ${MONO}`,
        letterSpacing: '0.04em'
      }
    }, text));
  };
  const onMove = e => {
    if (!crosshair) return;
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left,
      my = e.clientY - r.top;
    if (mx > plotW) return setHover(null);
    setHover({
      i: Math.max(0, Math.min(vis.length - 1, Math.floor(mx / step))),
      y: my
    });
  };
  const timeEvery = Math.max(1, Math.round(90 / step));
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      position: 'relative',
      width: '100%',
      height,
      background: 'var(--chart-bg)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      userSelect: 'none',
      ...style
    }
  }, field && /*#__PURE__*/React.createElement(__ds_scope.ProbabilityField, {
    intensity: 1,
    spread: 0.26,
    peak: 0.6,
    rows: 26,
    cols: 64,
    style: {
      position: 'absolute',
      left: plotW * 0.28,
      width: plotW * 0.72,
      top: top + priceH * 0.22,
      height: priceH * 0.86
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: W,
    height: H,
    style: {
      position: 'relative',
      display: 'block'
    },
    onMouseMove: onMove,
    onMouseLeave: () => setHover(null)
  }, watermark && /*#__PURE__*/React.createElement("text", {
    x: plotW / 2,
    y: top + priceH / 2 + 18,
    textAnchor: "middle",
    fill: "rgba(255,255,255,.035)",
    style: {
      font: `400 ${Math.min(72, plotW / 8)}px var(--font-serif)`
    }
  }, watermark), ticks.map(v => /*#__PURE__*/React.createElement("g", {
    key: v
  }, /*#__PURE__*/React.createElement("line", {
    x1: 0,
    x2: plotW,
    y1: y(v),
    y2: y(v),
    stroke: "var(--chart-grid)"
  }), /*#__PURE__*/React.createElement("text", {
    x: plotW + 8,
    y: y(v) + 3.5,
    fill: "var(--chart-axis-text)",
    style: {
      font: `400 10.5px ${MONO}`
    }
  }, fmtN(v, decimals)))), /*#__PURE__*/React.createElement("line", {
    x1: plotW,
    x2: plotW,
    y1: top - 8,
    y2: H - bottom,
    stroke: "var(--border-subtle)"
  }), vis.map((c, i) => i % timeEvery === 0 && x(i) > 24 && x(i) < plotW - 20 ? /*#__PURE__*/React.createElement("text", {
    key: 't' + c.t,
    x: x(i),
    y: H - 7,
    textAnchor: "middle",
    fill: "var(--chart-axis-text)",
    style: {
      font: `400 10px ${MONO}`
    }
  }, fmtT(c.t)) : null), notes.filter(a => a.type === 'zone').map(a => {
    const y1 = y(Math.max(a.from, a.to)),
      y2 = y(Math.min(a.from, a.to));
    const col = TONE[a.tone] || TONE.sand;
    return /*#__PURE__*/React.createElement("g", {
      key: a.id,
      style: {
        animation: 'cl-fade var(--dur-slow) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("rect", {
      x: 0,
      y: y1,
      width: plotW,
      height: Math.max(1, y2 - y1),
      fill: a.tone && a.tone !== 'sand' ? 'rgba(255,255,255,.03)' : 'var(--annotation-zone)'
    }), /*#__PURE__*/React.createElement("line", {
      x1: 0,
      x2: plotW,
      y1: y1,
      y2: y1,
      stroke: col,
      strokeOpacity: 0.35
    }), /*#__PURE__*/React.createElement("line", {
      x1: 0,
      x2: plotW,
      y1: y2,
      y2: y2,
      stroke: col,
      strokeOpacity: 0.35
    }), a.label && chip(8, y1 + 13, a.label.toUpperCase(), col));
  }), showVolume && vis.map((c, i) => {
    const h = c.v / maxV * volH;
    return /*#__PURE__*/React.createElement("rect", {
      key: 'v' + c.t,
      x: x(i) - bw / 2,
      y: volTop + volH - h,
      width: bw,
      height: h,
      fill: c.c >= c.o ? 'var(--chart-volume-up)' : 'var(--chart-volume-down)'
    });
  }), maLines.map((arr, k) => /*#__PURE__*/React.createElement("path", {
    key: 'ma' + k,
    d: path(arr),
    fill: "none",
    stroke: k === 0 ? 'var(--chart-ma-fast)' : 'var(--chart-ma-slow)',
    strokeOpacity: k === 0 ? 0.8 : 0.45,
    strokeWidth: 1.25
  })), vis.map((c, i) => {
    const up = c.c >= c.o;
    const col = up ? 'var(--candle-up)' : 'var(--candle-down)';
    const isLast = i === vis.length - 1;
    const by = y(Math.max(c.o, c.c));
    const bh = Math.max(1, Math.abs(y(c.o) - y(c.c)));
    return /*#__PURE__*/React.createElement("g", {
      key: c.t,
      opacity: hover && hover.i !== i ? 0.92 : 1,
      style: isLast ? {
        filter: 'drop-shadow(0 0 6px rgba(200,178,142,.6))'
      } : undefined
    }, /*#__PURE__*/React.createElement("line", {
      x1: x(i),
      x2: x(i),
      y1: y(c.h),
      y2: y(c.l),
      stroke: col,
      strokeWidth: 1
    }), /*#__PURE__*/React.createElement("rect", {
      x: x(i) - bw / 2,
      y: by,
      width: bw,
      height: bh,
      fill: isLast ? 'var(--accent)' : col,
      rx: bw > 6 ? 1 : 0
    }));
  }), notes.filter(a => a.type === 'trend').map(a => {
    const i1 = idxOf(a.t1),
      i2 = idxOf(a.t2);
    if (i1 < 0 || i2 < 0) return null;
    const col = TONE[a.tone] || TONE.sand;
    return /*#__PURE__*/React.createElement("g", {
      key: a.id
    }, /*#__PURE__*/React.createElement("line", {
      x1: x(i1),
      y1: y(a.p1),
      x2: x(i2),
      y2: y(a.p2),
      stroke: col,
      strokeWidth: 1.5,
      pathLength: 1,
      strokeDasharray: 1,
      style: {
        '--cl-len': 1,
        animation: 'cl-draw var(--dur-draw) var(--ease-out) both'
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x(i1),
      cy: y(a.p1),
      r: 2.5,
      fill: col
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x(i2),
      cy: y(a.p2),
      r: 2.5,
      fill: col
    }), a.label && chip(x(i2) + 8, y(a.p2), a.label.toUpperCase(), col));
  }), notes.filter(a => a.type === 'level').map(a => {
    const yy = y(a.price);
    if (yy < top - 2 || yy > top + priceH + 2) return null;
    const col = TONE[a.tone] || TONE.sand;
    const txt = `${(a.label || 'Nível').toUpperCase()} ${fmtN(a.price, decimals)}`;
    return /*#__PURE__*/React.createElement("g", {
      key: a.id
    }, /*#__PURE__*/React.createElement("line", {
      x1: 0,
      x2: plotW,
      y1: yy,
      y2: yy,
      stroke: col,
      strokeWidth: 1,
      strokeDasharray: "5 4",
      style: {
        transformBox: 'fill-box',
        transformOrigin: 'left',
        animation: 'cl-grow-x var(--dur-draw) var(--ease-out) both'
      }
    }), /*#__PURE__*/React.createElement("g", {
      style: {
        animation: 'cl-fade var(--dur-slow) var(--ease-out) 300ms both'
      }
    }, chip(8, yy - 13, txt, col)), /*#__PURE__*/React.createElement("rect", {
      x: plotW + 1,
      y: yy - 9,
      width: axisW - 4,
      height: 18,
      rx: 3,
      fill: "var(--annotation-label-bg)",
      stroke: col,
      strokeOpacity: 0.6
    }), /*#__PURE__*/React.createElement("text", {
      x: plotW + 8,
      y: yy + 3.5,
      fill: col,
      style: {
        font: `500 10.5px ${MONO}`
      }
    }, fmtN(a.price, decimals)));
  }), notes.filter(a => a.type === 'marker').map(a => {
    const i = idxOf(a.t);
    if (i < 0) return null;
    const c = vis[i];
    const buy = a.side === 'buy';
    const col = a.side === 'info' ? TONE.sand : buy ? 'var(--market-up)' : 'var(--market-down-text)';
    const cy = buy ? y(c.l) + 12 : y(c.h) - 12;
    return /*#__PURE__*/React.createElement("g", {
      key: a.id,
      style: {
        animation: 'cl-fade var(--dur-slow) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x(i),
      cy: cy,
      r: 4,
      fill: "none",
      stroke: col,
      style: {
        animation: 'cl-ring 1.8s var(--ease-out) 3'
      }
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x(i),
      cy: cy,
      r: 3.5,
      fill: col,
      stroke: "var(--chart-bg)",
      strokeWidth: 1.5
    }), a.label && chip(x(i), buy ? cy + 16 : cy - 16, a.label.toUpperCase(), col, 'middle'));
  }), /*#__PURE__*/React.createElement("line", {
    x1: 0,
    x2: plotW,
    y1: y(last.c),
    y2: y(last.c),
    stroke: lastCol,
    strokeOpacity: 0.6,
    strokeDasharray: "1 3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: x(vis.length - 1),
    cy: y(last.c),
    r: 2.5,
    fill: lastCol,
    style: {
      animation: 'cl-breathe 1.4s ease-in-out infinite'
    }
  }), /*#__PURE__*/React.createElement("rect", {
    x: plotW + 1,
    y: y(last.c) - 10,
    width: axisW - 4,
    height: 20,
    rx: 3,
    fill: lastCol
  }), /*#__PURE__*/React.createElement("text", {
    x: plotW + 8,
    y: y(last.c) + 4,
    fill: "var(--ink-950)",
    style: {
      font: `600 11px ${MONO}`
    }
  }, fmtN(last.c, decimals)), hover && /*#__PURE__*/React.createElement("g", {
    pointerEvents: "none"
  }, /*#__PURE__*/React.createElement("line", {
    x1: x(hover.i),
    x2: x(hover.i),
    y1: top - 8,
    y2: H - bottom,
    stroke: "var(--chart-crosshair)",
    strokeDasharray: "3 3"
  }), hover.y > top && hover.y < top + priceH && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: 0,
    x2: plotW,
    y1: hover.y,
    y2: hover.y,
    stroke: "var(--chart-crosshair)",
    strokeDasharray: "3 3"
  }), /*#__PURE__*/React.createElement("rect", {
    x: plotW + 1,
    y: hover.y - 9,
    width: axisW - 4,
    height: 18,
    rx: 3,
    fill: "var(--ink-600)"
  }), /*#__PURE__*/React.createElement("text", {
    x: plotW + 8,
    y: hover.y + 3.5,
    fill: "var(--ink-50)",
    style: {
      font: `500 10.5px ${MONO}`
    }
  }, fmtN(lo + (1 - (hover.y - top) / priceH) * (hi - lo), decimals))), chip(x(hover.i), H - bottom + 10, fmtT(hc.t), 'var(--ink-600)', 'middle', true))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      left: 10,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      font: `400 11px ${MONO}`,
      color: 'var(--text-tertiary)',
      pointerEvents: 'none',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }
  }, [['A', hc.o], ['M', hc.h], ['m', hc.l], ['F', hc.c]].map(([k, v]) => /*#__PURE__*/React.createElement("span", {
    key: k
  }, k, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)'
    }
  }, fmtN(v, decimals)))), /*#__PURE__*/React.createElement("span", {
    style: {
      color: chg >= 0 ? 'var(--market-up-text)' : 'var(--market-down-text)'
    }
  }, chg >= 0 ? '+' : '', fmtN(chg, 2), "%"), ma.map((p, k) => /*#__PURE__*/React.createElement("span", {
    key: p,
    style: {
      color: k === 0 ? 'var(--chart-ma-fast)' : 'var(--chart-ma-slow)',
      opacity: 0.9
    }
  }, "MM", p))), scanning && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: top - 8,
      width: plotW,
      height: plotH + 8,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 'var(--z-chart-overlay)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '14%',
      background: 'var(--scan-beam)',
      borderRight: '1px solid rgba(243,237,226,.8)',
      animation: 'cl-scan var(--dur-scan) linear infinite'
    }
  })));
}
CandleChart.generateSeries = generateSeries;
CandleChart.sma = sma;
Object.assign(__ds_scope, { CandleChart });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/CandleChart.jsx", error: String((e && e.message) || e) }); }

// components/charts/Sparkline.jsx
try { (() => {
let SPARK_ID = 0;
function Sparkline({
  data = [],
  width = 96,
  height = 28,
  color,
  area = true,
  baseline = true,
  liveDot = false,
  animate = true,
  strokeWidth = 1.5,
  style
}) {
  const id = React.useRef('cl-spark-' + ++SPARK_ID).current;
  if (data.length < 2) return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    style: style
  });
  const min = Math.min(...data),
    max = Math.max(...data),
    span = max - min || 1;
  const pad = 3;
  const px = i => i / (data.length - 1) * (width - pad * 2) + pad;
  const py = v => pad + (1 - (v - min) / span) * (height - pad * 2);
  const up = data[data.length - 1] >= data[0];
  const col = color || (up ? 'var(--market-up)' : 'var(--market-down)');
  const d = data.map((v, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ',' + py(v).toFixed(1)).join('');
  const lx = px(data.length - 1),
    ly = py(data[data.length - 1]);
  return /*#__PURE__*/React.createElement("svg", {
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: 'block',
      overflow: 'visible',
      ...style
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: id,
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: col,
    stopOpacity: "0.28"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: col,
    stopOpacity: "0"
  }))), baseline && /*#__PURE__*/React.createElement("line", {
    x1: pad,
    x2: width - pad,
    y1: py(data[0]),
    y2: py(data[0]),
    stroke: "var(--ink-600)",
    strokeDasharray: "2 2",
    strokeWidth: 1
  }), area && /*#__PURE__*/React.createElement("path", {
    d: `${d}L${lx},${height}L${pad},${height}Z`,
    fill: `url(#${id})`
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: col,
    strokeWidth: strokeWidth,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    pathLength: animate ? 1 : undefined,
    strokeDasharray: animate ? 1 : undefined,
    style: animate ? {
      '--cl-len': 1,
      animation: 'cl-draw var(--dur-draw) var(--ease-out) both'
    } : undefined
  }), liveDot && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("circle", {
    cx: lx,
    cy: ly,
    r: 4,
    fill: "none",
    stroke: col,
    style: {
      animation: 'cl-ring 1.6s var(--ease-out) infinite'
    }
  }), /*#__PURE__*/React.createElement("circle", {
    cx: lx,
    cy: ly,
    r: 2.25,
    fill: col
  })));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Lucide icon paths (lucide-static@0.460.0, ISC) — copied programmatically, not redrawn. SVG files also live in assets/icons/.
const PATHS = {
  "activity": "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\" />",
  "arrow-down": "<path d=\"M12 5v14\" /><path d=\"m19 12-7 7-7-7\" />",
  "arrow-down-right": "<path d=\"m7 7 10 10\" /><path d=\"M17 7v10H7\" />",
  "arrow-up": "<path d=\"m5 12 7-7 7 7\" /><path d=\"M12 19V5\" />",
  "arrow-up-right": "<path d=\"M7 7h10v10\" /><path d=\"M7 17 17 7\" />",
  "bell": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" />",
  "bell-ring": "<path d=\"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9\" /><path d=\"M10.3 21a1.94 1.94 0 0 0 3.4 0\" /><path d=\"M4 2C2.8 3.7 2 5.7 2 8\" /><path d=\"M22 8c0-2.3-.8-4.3-2-6\" />",
  "book-open": "<path d=\"M12 7v14\" /><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" />",
  "brain": "<path d=\"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z\" /><path d=\"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z\" /><path d=\"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4\" /><path d=\"M17.599 6.5a3 3 0 0 0 .399-1.375\" /><path d=\"M6.003 5.125A3 3 0 0 0 6.401 6.5\" /><path d=\"M3.477 10.896a4 4 0 0 1 .585-.396\" /><path d=\"M19.938 10.5a4 4 0 0 1 .585.396\" /><path d=\"M6 18a4 4 0 0 1-1.967-.516\" /><path d=\"M19.967 17.484A4 4 0 0 1 18 18\" />",
  "calendar": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" />",
  "chart-candlestick": "<path d=\"M9 5v4\" /><rect width=\"4\" height=\"6\" x=\"7\" y=\"9\" rx=\"1\" /><path d=\"M9 15v2\" /><path d=\"M17 3v2\" /><rect width=\"4\" height=\"8\" x=\"15\" y=\"5\" rx=\"1\" /><path d=\"M17 13v3\" /><path d=\"M3 3v16a2 2 0 0 0 2 2h16\" />",
  "chart-column": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"M18 17V9\" /><path d=\"M13 17V5\" /><path d=\"M8 17v-3\" />",
  "chart-line": "<path d=\"M3 3v16a2 2 0 0 0 2 2h16\" /><path d=\"m19 9-5 5-4-4-3 3\" />",
  "chart-no-axes-combined": "<path d=\"M12 16v5\" /><path d=\"M16 14v7\" /><path d=\"M20 10v11\" /><path d=\"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15\" /><path d=\"M4 18v3\" /><path d=\"M8 14v7\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevron-up": "<path d=\"m18 15-6-6-6 6\" />",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\" /><line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\" />",
  "circle-dot": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><circle cx=\"12\" cy=\"12\" r=\"1\" />",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><polyline points=\"12 6 12 12 16 14\" />",
  "command": "<path d=\"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3\" />",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" /><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />",
  "crosshair": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><line x1=\"22\" x2=\"18\" y1=\"12\" y2=\"12\" /><line x1=\"6\" x2=\"2\" y1=\"12\" y2=\"12\" /><line x1=\"12\" x2=\"12\" y1=\"6\" y2=\"2\" /><line x1=\"12\" x2=\"12\" y1=\"22\" y2=\"18\" />",
  "download": "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><polyline points=\"7 10 12 15 17 10\" /><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\" />",
  "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\" /><circle cx=\"19\" cy=\"12\" r=\"1\" /><circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "external-link": "<path d=\"M15 3h6v6\" /><path d=\"M10 14 21 3\" /><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\" /><path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\" /><path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\" /><path d=\"m2 2 20 20\" />",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M10 9H8\" /><path d=\"M16 13H8\" /><path d=\"M16 17H8\" />",
  "filter": "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\" />",
  "flame": "<path d=\"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z\" />",
  "gauge": "<path d=\"m12 14 4-4\" /><path d=\"M3.34 19a10 10 0 1 1 17.32 0\" />",
  "globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
  "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /><path d=\"M3 3v5h5\" /><path d=\"M12 7v5l4 2\" />",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 16v-4\" /><path d=\"M12 8h.01\" />",
  "layers": "<path d=\"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z\" /><path d=\"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65\" /><path d=\"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65\" />",
  "layout-grid": "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\" /><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\" />",
  "list": "<path d=\"M3 12h.01\" /><path d=\"M3 18h.01\" /><path d=\"M3 6h.01\" /><path d=\"M8 12h13\" /><path d=\"M8 18h13\" /><path d=\"M8 6h13\" />",
  "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
  "log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" /><polyline points=\"16 17 21 12 16 7\" /><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\" />",
  "maximize-2": "<polyline points=\"15 3 21 3 21 9\" /><polyline points=\"9 21 3 21 3 15\" /><line x1=\"21\" x2=\"14\" y1=\"3\" y2=\"10\" /><line x1=\"3\" x2=\"10\" y1=\"21\" y2=\"14\" />",
  "menu": "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" />",
  "minus": "<path d=\"M5 12h14\" />",
  "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
  "move-up-right": "<path d=\"M13 5H19V11\" /><path d=\"M19 5L5 19\" />",
  "newspaper": "<path d=\"M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2\" /><path d=\"M18 14h-8\" /><path d=\"M15 18h-5\" /><path d=\"M10 6h8v4h-8V6Z\" />",
  "pause": "<rect x=\"14\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" /><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\" rx=\"1\" />",
  "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /><path d=\"m15 5 4 4\" />",
  "play": "<polygon points=\"6 3 20 12 6 21 6 3\" />",
  "plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />",
  "radar": "<path d=\"M19.07 4.93A10 10 0 0 0 6.99 3.34\" /><path d=\"M4 6h.01\" /><path d=\"M2.29 9.62A10 10 0 1 0 21.31 8.35\" /><path d=\"M16.24 7.76A6 6 0 1 0 8.23 16.67\" /><path d=\"M12 18h.01\" /><path d=\"M17.99 11.66A6 6 0 0 1 15.77 16.67\" /><circle cx=\"12\" cy=\"12\" r=\"2\" /><path d=\"m13.41 10.59 5.66-5.66\" />",
  "radio": "<path d=\"M4.9 19.1C1 15.2 1 8.8 4.9 4.9\" /><path d=\"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5\" /><circle cx=\"12\" cy=\"12\" r=\"2\" /><path d=\"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5\" /><path d=\"M19.1 4.9C23 8.8 23 15.1 19.1 19\" />",
  "refresh-cw": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\" /><path d=\"M21 3v5h-5\" /><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\" /><path d=\"M8 16H3v5\" />",
  "ruler": "<path d=\"M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z\" /><path d=\"m14.5 12.5 2-2\" /><path d=\"m11.5 9.5 2-2\" /><path d=\"m8.5 6.5 2-2\" /><path d=\"m17.5 15.5 2-2\" />",
  "scale": "<path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"M7 21h10\" /><path d=\"M12 3v18\" /><path d=\"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2\" />",
  "scan-line": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /><path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" /><path d=\"M7 12h10\" />",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\" /><path d=\"m21 21-4.3-4.3\" />",
  "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
  "share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\" /><circle cx=\"6\" cy=\"12\" r=\"3\" /><circle cx=\"18\" cy=\"19\" r=\"3\" /><line x1=\"8.59\" x2=\"15.42\" y1=\"13.51\" y2=\"17.49\" /><line x1=\"15.41\" x2=\"8.59\" y1=\"6.51\" y2=\"10.49\" />",
  "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /><path d=\"m9 12 2 2 4-4\" />",
  "sliders-horizontal": "<line x1=\"21\" x2=\"14\" y1=\"4\" y2=\"4\" /><line x1=\"10\" x2=\"3\" y1=\"4\" y2=\"4\" /><line x1=\"21\" x2=\"12\" y1=\"12\" y2=\"12\" /><line x1=\"8\" x2=\"3\" y1=\"12\" y2=\"12\" /><line x1=\"21\" x2=\"16\" y1=\"20\" y2=\"20\" /><line x1=\"12\" x2=\"3\" y1=\"20\" y2=\"20\" /><line x1=\"14\" x2=\"14\" y1=\"2\" y2=\"6\" /><line x1=\"8\" x2=\"8\" y1=\"10\" y2=\"14\" /><line x1=\"16\" x2=\"16\" y1=\"18\" y2=\"22\" />",
  "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\" /><path d=\"M20 3v4\" /><path d=\"M22 5h-4\" /><path d=\"M4 17v2\" /><path d=\"M5 18H3\" />",
  "square-split-horizontal": "<path d=\"M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3\" /><path d=\"M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3\" /><line x1=\"12\" x2=\"12\" y1=\"4\" y2=\"20\" />",
  "star": "<path d=\"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z\" />",
  "sun": "<circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M12 2v2\" /><path d=\"M12 20v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"m17.66 17.66 1.41 1.41\" /><path d=\"M2 12h2\" /><path d=\"M20 12h2\" /><path d=\"m6.34 17.66-1.41 1.41\" /><path d=\"m19.07 4.93-1.41 1.41\" />",
  "target": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><circle cx=\"12\" cy=\"12\" r=\"6\" /><circle cx=\"12\" cy=\"12\" r=\"2\" />",
  "trending-down": "<polyline points=\"22 17 13.5 8.5 8.5 13.5 2 7\" /><polyline points=\"16 17 22 17 22 11\" />",
  "trending-up": "<polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\" /><polyline points=\"16 7 22 7 22 13\" />",
  "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /><path d=\"M12 9v4\" /><path d=\"M12 17h.01\" />",
  "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /><circle cx=\"12\" cy=\"7\" r=\"4\" />",
  "volume-2": "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" /><path d=\"M16 9a5 5 0 0 1 0 6\" /><path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\" /><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\" />",
  "waves": "<path d=\"M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\" /><path d=\"M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\" /><path d=\"M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1\" />",
  "x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
  "zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />"
};
function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  title,
  style,
  ...rest
}) {
  const inner = PATHS[name];
  if (!inner && typeof console !== 'undefined') console.warn('[Claritas Icon] unknown icon: ' + name);
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: title ? 'img' : undefined,
    "aria-hidden": title ? undefined : true,
    "aria-label": title,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: inner || ''
    }
  }, rest));
}
Icon.names = Object.keys(PATHS);
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/analysis/MetricRow.jsx
try { (() => {
const TONES = {
  sand: 'var(--accent)',
  up: 'var(--market-up-text)',
  down: 'var(--market-down-text)',
  neutral: 'var(--text-primary)',
  muted: 'var(--text-secondary)'
};

// Key-value analysis row (regime, risk/reward, key level…). Value fades in when it changes.
function MetricRow({
  icon,
  label,
  value,
  sub,
  tone = 'sand',
  dense = false,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  const col = TONES[tone] || TONES.sand;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'grid',
      gridTemplateColumns: icon ? '22px minmax(0,1fr) auto' : 'minmax(0,1fr) auto',
      alignItems: 'center',
      gap: 12,
      minHeight: dense ? 34 : 44,
      padding: '6px 2px',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: onClick ? 'pointer' : 'default',
      background: hover && onClick ? 'var(--surface-hover)' : 'transparent',
      transition: 'background var(--dur-tick) var(--ease-out)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `400 ${dense ? 12.5 : 13}px/1.3 var(--font-sans)`,
      color: 'var(--text-secondary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: String(value),
    style: {
      font: `500 ${dense ? 12.5 : 13.5}px/1 var(--font-mono)`,
      color: col,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      animation: 'cl-fade 500ms var(--ease-out)'
    }
  }, value), sub && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 10.5px/1 var(--font-mono)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap'
    }
  }, sub)));
}
Object.assign(__ds_scope, { MetricRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/analysis/MetricRow.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const TONES = {
  neutral: {
    fg: 'var(--text-secondary)',
    tint: 'rgba(255,255,255,.06)',
    solid: 'var(--ink-600)',
    solidFg: 'var(--ink-50)',
    line: 'var(--border-strong)'
  },
  up: {
    fg: 'var(--market-up-text)',
    tint: 'var(--market-up-tint)',
    solid: 'var(--up-500)',
    solidFg: '#03140D',
    line: 'rgba(230,224,213,.45)'
  },
  down: {
    fg: 'var(--market-down-text)',
    tint: 'var(--market-down-tint)',
    solid: 'var(--down-500)',
    solidFg: '#fff',
    line: 'rgba(196,122,102,.45)'
  },
  sand: {
    fg: 'var(--accent)',
    tint: 'var(--accent-tint)',
    solid: 'var(--accent)',
    solidFg: 'var(--text-on-accent)',
    line: 'var(--accent-line)'
  },
  info: {
    fg: 'var(--status-info)',
    tint: 'var(--status-info-tint)',
    solid: 'var(--info-500)',
    solidFg: '#fff',
    line: 'rgba(155,167,180,.45)'
  },
  warn: {
    fg: 'var(--warn-400)',
    tint: 'var(--status-warn-tint)',
    solid: 'var(--warn-500)',
    solidFg: '#1E0D02',
    line: 'rgba(207,148,102,.45)'
  }
};
function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
  dot = false,
  children,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  const sm = size === 'sm';
  const solid = variant === 'solid';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      height: sm ? 18 : 22,
      padding: sm ? '0 6px' : '0 8px',
      font: `var(--weight-medium) ${sm ? 10 : 10.5}px/1 var(--font-mono)`,
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color: solid ? t.solidFg : t.fg,
      background: solid ? t.solid : variant === 'outline' ? 'transparent' : t.tint,
      border: `1px solid ${variant === 'outline' ? t.line : 'transparent'}`,
      borderRadius: 'var(--radius-sm)',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 6,
      background: 'currentColor'
    }
  }), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: sm ? 11 : 12,
    strokeWidth: 2
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/analysis/SignalCard.jsx
try { (() => {
const KINDS = {
  buy: {
    tone: 'up',
    label: 'Compra',
    icon: 'trending-up'
  },
  sell: {
    tone: 'down',
    label: 'Venda',
    icon: 'trending-down'
  },
  watch: {
    tone: 'sand',
    label: 'Observar',
    icon: 'eye'
  },
  alert: {
    tone: 'warn',
    label: 'Alerta',
    icon: 'triangle-alert'
  },
  pattern: {
    tone: 'sand',
    label: 'Padrão',
    icon: 'scan-line'
  }
};
function useTyped(text, on, speed = 14) {
  const [n, setN] = React.useState(on ? 0 : (text || '').length);
  React.useEffect(() => {
    if (!on || !text) {
      setN((text || '').length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, on]);
  return n;
}

// A single Claritas read. Title is set in serif — it's the analyst's voice. `fresh` = just arrived (rise + sand glow + typed body).
function SignalCard({
  kind = 'watch',
  symbol,
  timeframe,
  time,
  title,
  body,
  confidence,
  levels,
  tags = [],
  fresh = false,
  compact = false,
  selected = false,
  onClick,
  style
}) {
  const k = KINDS[kind] || KINDS.watch;
  const typed = useTyped(body, fresh);
  const [hover, setHover] = React.useState(false);
  const typing = fresh && body && typed < body.length;
  return /*#__PURE__*/React.createElement("article", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? 8 : 12,
      padding: compact ? '12px 14px' : 16,
      borderRadius: 'var(--radius-lg)',
      background: selected ? 'var(--surface-raised)' : hover && onClick ? 'var(--surface-hover)' : 'var(--surface-panel)',
      boxShadow: selected ? 'var(--glow-sand-soft)' : 'var(--shadow-panel)',
      cursor: onClick ? 'pointer' : 'default',
      animation: fresh ? 'cl-rise var(--dur-slow) var(--ease-out), cl-glow-once 2.4s var(--ease-out)' : 'none',
      transition: 'background var(--dur-tick) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: k.tone,
    icon: k.icon,
    size: "sm"
  }, k.label), symbol && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-semibold) 12px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, symbol), timeframe && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, timeframe), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), fresh && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: '500 10px/1 var(--font-mono)',
      letterSpacing: 'var(--label-track)',
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: 11
  }), "NOVO"), time && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, time)), title && /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      font: `400 ${compact ? 17 : 20}px/1.2 var(--font-serif)`,
      color: 'var(--text-primary)',
      letterSpacing: '-0.005em',
      textWrap: 'pretty'
    }
  }, title), body && !compact && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--weight-regular) 13px/1.55 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, body.slice(0, typed), typing && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 7,
      height: 13,
      marginLeft: 1,
      verticalAlign: '-2px',
      background: 'var(--accent)',
      animation: 'cl-caret 900ms steps(1) infinite'
    }
  })), levels && levels.length > 0 && !compact && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: `repeat(${levels.length},minmax(0,1fr))`,
      gap: 1,
      background: 'var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden'
    }
  }, levels.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.label,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      padding: '8px 10px',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 9.5px/1 var(--font-mono)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, l.label), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px/1 var(--font-mono)',
      color: l.tone === 'up' ? 'var(--market-up-text)' : l.tone === 'down' ? 'var(--market-down-text)' : 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, l.value)))), (confidence != null || tags.length > 0) && /*#__PURE__*/React.createElement("footer", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 14
    }
  }, confidence != null && /*#__PURE__*/React.createElement(__ds_scope.ConfidenceMeter, {
    value: confidence,
    size: "sm",
    segments: 16,
    style: {
      flex: 1
    }
  }), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: t,
    size: "sm"
  }, t)))));
}
Object.assign(__ds_scope, { SignalCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/analysis/SignalCard.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 'var(--control-h-sm)',
    px: 10,
    fs: 12,
    gap: 6,
    icon: 14
  },
  md: {
    h: 'var(--control-h-md)',
    px: 14,
    fs: 13,
    gap: 7,
    icon: 15
  },
  lg: {
    h: 'var(--control-h-lg)',
    px: 18,
    fs: 14,
    gap: 8,
    icon: 16
  }
};
const VARIANTS = {
  primary: {
    bg: 'var(--accent)',
    hover: 'var(--accent-hover)',
    active: 'var(--accent-pressed)',
    fg: 'var(--text-on-accent)',
    border: 'transparent'
  },
  secondary: {
    bg: 'var(--surface-raised)',
    hover: 'var(--surface-hover)',
    active: 'var(--surface-active)',
    fg: 'var(--text-primary)',
    border: 'var(--border-default)'
  },
  ghost: {
    bg: 'transparent',
    hover: 'var(--surface-hover)',
    active: 'var(--surface-active)',
    fg: 'var(--text-secondary)',
    hoverFg: 'var(--text-primary)',
    border: 'transparent'
  },
  outline: {
    bg: 'transparent',
    hover: 'var(--accent-tint)',
    active: 'var(--accent-tint-strong)',
    fg: 'var(--accent)',
    border: 'var(--accent-line)'
  },
  buy: {
    bg: 'var(--up-500)',
    hover: 'var(--up-400)',
    active: 'var(--up-600)',
    fg: '#03140D',
    border: 'transparent'
  },
  sell: {
    bg: 'var(--down-500)',
    hover: 'var(--down-400)',
    active: 'var(--down-600)',
    fg: '#FFFFFF',
    border: 'transparent'
  }
};
function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  kbd,
  children,
  style,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const off = disabled || loading;
  const bg = off ? v.bg : down ? v.active : hover ? v.hover : v.bg;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: off,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      padding: `0 ${s.px}px`,
      width: fullWidth ? '100%' : undefined,
      font: `var(--weight-medium) ${s.fs}px/1 var(--font-sans)`,
      letterSpacing: '-0.005em',
      whiteSpace: 'nowrap',
      color: hover && v.hoverFg && !off ? v.hoverFg : v.fg,
      background: bg,
      border: `1px solid ${v.border}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: variant === 'secondary' ? 'var(--highlight-top)' : 'none',
      opacity: disabled ? 0.4 : 1,
      cursor: off ? 'not-allowed' : 'pointer',
      transition: 'background var(--dur-tick) var(--ease-out), color var(--dur-tick) var(--ease-out)',
      ...style
    }
  }, rest), loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "refresh-cw",
    size: s.icon,
    style: {
      animation: 'cl-spin 900ms linear infinite'
    }
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }) : null, children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }), kbd && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-medium) 10px/1 var(--font-mono)',
      padding: '3px 5px',
      borderRadius: 'var(--radius-xs)',
      background: 'rgba(0,0,0,.18)',
      opacity: 0.75
    }
  }, kbd));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
const GLOWS = {
  sand: 'var(--glow-sand-soft)',
  up: 'var(--glow-up)',
  down: 'var(--glow-down)'
};
function Panel({
  title,
  eyebrow,
  actions,
  footer,
  padding = true,
  glow,
  inset = false,
  children,
  style,
  bodyStyle
}) {
  const pad = padding === true ? 'var(--panel-pad)' : padding === false ? 0 : typeof padding === 'number' ? padding + 'px' : padding;
  const hasHead = title || eyebrow || actions;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      minHeight: 0,
      background: inset ? 'var(--surface-inset)' : 'var(--surface-panel)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: glow ? GLOWS[glow] : 'var(--shadow-panel)',
      transition: 'box-shadow var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, hasHead && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 42,
      padding: '4px 10px 0 var(--panel-pad)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      minWidth: 0,
      flex: 1
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: 'var(--weight-medium) 13px/1.3 var(--font-sans)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: pad,
      ...bodyStyle
    }
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    style: {
      padding: '10px var(--panel-pad)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  placement = 'top',
  delay = 250,
  kbd,
  children,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const t = React.useRef(null);
  const show = () => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(t.current);
    setOpen(false);
  };
  React.useEffect(() => () => clearTimeout(t.current), []);
  const pos = {
    top: {
      bottom: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    bottom: {
      top: 'calc(100% + 6px)',
      left: '50%',
      transform: 'translateX(-50%)'
    },
    left: {
      right: 'calc(100% + 6px)',
      top: '50%',
      transform: 'translateY(-50%)'
    },
    right: {
      left: 'calc(100% + 6px)',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      ...style
    },
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide
  }, children, open && content && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos,
      zIndex: 'var(--z-tooltip)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--ink-700)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-pop)',
      font: 'var(--weight-medium) 11.5px/1.2 var(--font-sans)',
      animation: 'cl-fade var(--dur-fast) var(--ease-out)'
    }
  }, content, kbd && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 10px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, kbd)));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    box: 28,
    icon: 15
  },
  md: {
    box: 34,
    icon: 16
  },
  lg: {
    box: 42,
    icon: 18
  }
};
function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  active = false,
  disabled = false,
  badge = false,
  tooltip = true,
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const base = variant === 'secondary' ? 'var(--surface-raised)' : 'transparent';
  const bg = active ? 'var(--accent-tint)' : hover && !disabled ? 'var(--surface-hover)' : base;
  const fg = active ? 'var(--accent)' : hover && !disabled ? 'var(--text-primary)' : 'var(--text-tertiary)';
  const btn = /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    "aria-pressed": active || undefined,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'inline-grid',
      placeItems: 'center',
      width: s.box,
      height: s.box,
      padding: 0,
      color: fg,
      background: bg,
      borderRadius: 'var(--radius-md)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: `1px solid ${variant === 'secondary' ? 'var(--border-default)' : 'transparent'}`,
      opacity: disabled ? 0.4 : 1,
      transition: 'background var(--dur-tick) var(--ease-out), color var(--dur-tick) var(--ease-out)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 6,
      background: 'var(--accent)',
      boxShadow: '0 0 0 2px var(--surface-panel)'
    }
  }));
  return tooltip && label ? /*#__PURE__*/React.createElement(__ds_scope.Tooltip, {
    content: label
  }, btn) : btn;
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Wordmark.jsx
try { (() => {
// No logo was supplied — the brand is set in plain type (Instrument Serif). Do not add a symbol.
function Wordmark({
  size = 22,
  color = 'var(--text-primary)',
  product,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: Math.round(size * 0.45),
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: `400 ${size}px/1 var(--font-serif)`,
      letterSpacing: '-0.01em',
      color
    }
  }, "Claritas"), product && /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-medium) ${Math.max(10, Math.round(size * 0.42))}px/1 var(--font-mono)`,
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, product));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  width = 440,
  inline = false,
  style
}) {
  React.useEffect(() => {
    if (!open || !onClose) return;
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const box = /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: 'calc(100vw - 32px)',
      background: 'var(--surface-raised)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-dialog)',
      animation: 'cl-pop var(--dur-base) var(--ease-out)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '18px 18px 0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--accent)'
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: '400 var(--display-s-size)/var(--display-s-lh) var(--font-serif)',
      color: 'var(--text-primary)'
    }
  }, title)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 28,
      height: 28,
      padding: 0,
      border: 0,
      borderRadius: 'var(--radius-md)',
      background: 'transparent',
      color: 'var(--text-tertiary)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px 20px',
      font: 'var(--text-body)',
      color: 'var(--text-secondary)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      padding: '12px 16px',
      background: 'var(--surface-panel)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer));
  if (inline) return box;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-dialog)',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--surface-overlay)',
      backdropFilter: 'var(--blur-overlay)',
      WebkitBackdropFilter: 'var(--blur-overlay)',
      animation: 'cl-fade var(--dur-fast) var(--ease-out)'
    }
  }, box);
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/LiveIndicator.jsx
try { (() => {
const STATES = {
  live: {
    color: 'var(--market-up)',
    label: 'Ao vivo',
    pulse: true
  },
  analyzing: {
    color: 'var(--accent)',
    label: 'Analisando',
    pulse: true
  },
  pre: {
    color: 'var(--accent)',
    label: 'Pré-abertura',
    pulse: false
  },
  auction: {
    color: 'var(--warn-500)',
    label: 'Leilão',
    pulse: true
  },
  closed: {
    color: 'var(--ink-500)',
    label: 'Fechado',
    pulse: false
  },
  delayed: {
    color: 'var(--info-400)',
    label: 'Atraso 15 min',
    pulse: false
  }
};
function LiveIndicator({
  status = 'live',
  label,
  detail,
  size = 'md',
  style
}) {
  const s = STATES[status] || STATES.live;
  const d = size === 'sm' ? 6 : 7;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: d,
      height: d,
      color: s.color
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: d,
      background: s.color,
      animation: s.pulse ? 'cl-pulse 1.6s var(--ease-out) infinite' : 'none'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-medium) ${size === 'sm' ? 10 : 11}px/1 var(--font-mono)`,
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: s.color
    }
  }, label || s.label), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      font: `var(--weight-regular) ${size === 'sm' ? 10 : 11}px/1 var(--font-mono)`,
      color: 'var(--text-tertiary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, detail));
}
Object.assign(__ds_scope, { LiveIndicator });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/LiveIndicator.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const TONES = {
  sand: {
    icon: 'sparkles',
    color: 'var(--accent)'
  },
  up: {
    icon: 'trending-up',
    color: 'var(--market-up-text)'
  },
  down: {
    icon: 'trending-down',
    color: 'var(--market-down-text)'
  },
  info: {
    icon: 'info',
    color: 'var(--status-info)'
  },
  warn: {
    icon: 'triangle-alert',
    color: 'var(--warn-400)'
  }
};
function Toast({
  tone = 'sand',
  title,
  message,
  icon,
  meta,
  action,
  onAction,
  onClose,
  style
}) {
  const t = TONES[tone] || TONES.sand;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      gap: 12,
      width: 360,
      maxWidth: '100%',
      padding: '12px 12px 12px 14px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--blur-glass)',
      WebkitBackdropFilter: 'var(--blur-glass)',
      boxShadow: tone === 'sand' ? 'var(--shadow-pop), var(--glow-sand-soft)' : 'var(--shadow-pop)',
      animation: 'cl-pop var(--dur-slow) var(--ease-out)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 28,
      height: 28,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: 'rgba(255,255,255,.04)',
      color: t.color
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-medium) 13px/1.3 var(--font-sans)',
      color: 'var(--text-primary)',
      flex: 1
    }
  }, title), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 10.5px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, meta)), message && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-regular) 12.5px/1.45 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, message), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      alignSelf: 'flex-start',
      marginTop: 4,
      padding: 0,
      border: 0,
      background: 'none',
      cursor: 'pointer',
      font: 'var(--weight-medium) 12px/1 var(--font-sans)',
      color: t.color
    }
  }, action, " \u2192")), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      alignSelf: 'flex-start',
      display: 'grid',
      placeItems: 'center',
      width: 22,
      height: 22,
      padding: 0,
      border: 0,
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      color: 'var(--text-tertiary)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  defaultChecked = false,
  onChange,
  label,
  description,
  indeterminate = false,
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    const n = !on;
    if (checked === undefined) setInner(n);
    onChange && onChange(n);
  };
  const filled = on || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    onClick: e => {
      e.preventDefault();
      toggle();
    },
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "checkbox",
    "aria-checked": indeterminate ? 'mixed' : on,
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 16,
      height: 16,
      flexShrink: 0,
      borderRadius: 'var(--radius-sm)',
      background: filled ? 'var(--accent)' : 'var(--surface-inset)',
      border: `1px solid ${filled ? 'var(--accent)' : 'var(--border-strong)'}`,
      color: 'var(--text-on-accent)',
      transition: 'background var(--dur-tick) var(--ease-out), border-color var(--dur-tick) var(--ease-out)',
      marginTop: description ? 1 : 0
    }
  }, indeterminate ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 12,
    strokeWidth: 3
  }) : on ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 12,
    strokeWidth: 3
  }) : null), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-regular) 13px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h-md)',
  lg: 'var(--control-h-lg)'
};
function Input({
  label,
  hint,
  error,
  icon,
  prefix,
  suffix,
  size = 'md',
  mono = false,
  kbd,
  value,
  defaultValue,
  placeholder,
  onChange,
  disabled = false,
  type = 'text',
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? 'var(--market-down)' : focus ? 'var(--accent-line)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: H[size] || H.md,
      padding: '0 10px',
      background: 'var(--surface-inset)',
      border: `1px solid ${border}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus && !error ? '0 0 0 3px var(--accent-tint)' : 'none',
      transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--text-tertiary)"
  }), prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      background: 'transparent',
      border: 0,
      outline: 'none',
      padding: 0,
      color: 'var(--text-primary)',
      font: mono ? 'var(--weight-medium) 13px/1 var(--font-mono)' : 'var(--weight-regular) 13px/1 var(--font-sans)',
      fontVariantNumeric: 'tabular-nums',
      ...inputStyle
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, suffix), kbd && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 10px/1 var(--font-mono)',
      color: 'var(--text-tertiary)',
      padding: '3px 5px',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-xs)'
    }
  }, kbd)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: error ? 'var(--market-down-text)' : 'var(--text-tertiary)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const H = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h-md)',
  lg: 'var(--control-h-lg)'
};
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  icon,
  disabled = false,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: H[size] || H.md,
      background: 'var(--surface-raised)',
      border: `1px solid ${focus ? 'var(--accent-line)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? '0 0 0 3px var(--accent-tint)' : 'var(--highlight-top)',
      transition: 'border-color var(--dur-fast) var(--ease-out)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--text-tertiary)",
    style: {
      position: 'absolute',
      left: 10,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.value, e),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: '100%',
      background: 'transparent',
      border: 0,
      outline: 'none',
      color: 'var(--text-primary)',
      font: 'var(--weight-medium) 13px/1 var(--font-sans)',
      padding: `0 30px 0 ${icon ? 32 : 10}px`,
      cursor: 'pointer'
    }
  }, opts.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value,
    style: {
      background: 'var(--ink-850)'
    }
  }, o.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--text-tertiary)",
    style: {
      position: 'absolute',
      right: 10,
      pointerEvents: 'none'
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  defaultChecked = false,
  onChange,
  label,
  size = 'md',
  tone = 'sand',
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    const n = !on;
    if (checked === undefined) setInner(n);
    onChange && onChange(n);
  };
  const w = size === 'sm' ? 26 : 32,
    h = size === 'sm' ? 16 : 20,
    k = h - 6;
  const onBg = tone === 'up' ? 'var(--market-up)' : 'var(--accent)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      userSelect: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    disabled: disabled,
    onClick: toggle,
    style: {
      position: 'relative',
      width: w,
      height: h,
      padding: 0,
      border: `1px solid ${on ? 'transparent' : 'var(--border-strong)'}`,
      borderRadius: h,
      background: on ? onBg : 'var(--surface-inset)',
      cursor: 'inherit',
      transition: 'background var(--dur-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: 2,
      width: k,
      height: k,
      borderRadius: k,
      background: on ? 'var(--ink-950)' : 'var(--ink-400)',
      transform: `translateX(${on ? w - k - 6 : 0}px)`,
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-regular) 13px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/market/Delta.jsx
try { (() => {
const SIZE = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
  xl: 20
};
const fmt = (v, d) => Math.abs(v).toLocaleString('pt-BR', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});

// Directional change. ▲/▼ are Unicode glyphs on purpose — they sit on the mono baseline in dense tables.
function Delta({
  value = 0,
  kind = 'pct',
  decimals = 2,
  variant = 'text',
  size = 'md',
  arrow = true,
  sign = true,
  style
}) {
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const color = dir === 'up' ? 'var(--market-up-text)' : dir === 'down' ? 'var(--market-down-text)' : 'var(--market-flat)';
  const tint = dir === 'up' ? 'var(--market-up-tint)' : dir === 'down' ? 'var(--market-down-tint)' : 'rgba(255,255,255,.05)';
  const glyph = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–';
  const s = sign ? dir === 'up' ? '+' : dir === 'down' ? '−' : '' : '';
  const body = kind === 'pct' ? `${s}${fmt(value, decimals)}%` : kind === 'bps' ? `${s}${fmt(value, 0)} bps` : `${s}${fmt(value, decimals)}`;
  const fs = SIZE[size] || SIZE.md;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: Math.round(fs * 0.35),
      whiteSpace: 'nowrap',
      color,
      font: `var(--weight-medium) ${fs}px/1 var(--font-mono)`,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
      ...(variant === 'pill' ? {
        background: tint,
        padding: `${Math.round(fs * 0.3)}px ${Math.round(fs * 0.5)}px`,
        borderRadius: 'var(--radius-sm)'
      } : null),
      ...style
    }
  }, arrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: Math.round(fs * 0.62),
      transform: 'translateY(-0.5px)'
    }
  }, glyph), body);
}
Object.assign(__ds_scope, { Delta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/Delta.jsx", error: String((e && e.message) || e) }); }

// components/market/PriceTicker.jsx
try { (() => {
const SIZE = {
  xs: 'var(--num-xs-size)',
  sm: 'var(--num-s-size)',
  md: 'var(--num-m-size)',
  lg: 'var(--num-l-size)',
  xl: 'var(--num-xl-size)'
};
const TRACK = {
  xs: '0',
  sm: '0',
  md: 'var(--num-m-track)',
  lg: 'var(--num-l-track)',
  xl: 'var(--num-xl-track)'
};

// Live price. On each change only the digits that moved flash (green up / red down) — the eye goes straight to the tick.
function PriceTicker({
  value,
  decimals = 2,
  prefix,
  size = 'md',
  weight = 500,
  flash = true,
  color = 'var(--text-primary)',
  style
}) {
  const prev = React.useRef(value);
  const [tick, setTick] = React.useState({
    n: 0,
    dir: null,
    from: -1
  });
  const str = Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  React.useEffect(() => {
    if (prev.current === value || !flash) {
      prev.current = value;
      return;
    }
    const old = Number(prev.current).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    let i = 0;
    while (i < str.length && str[i] === old[i]) i++;
    setTick(t => ({
      n: t.n + 1,
      dir: value > prev.current ? 'up' : 'down',
      from: old.length === str.length ? i : 0
    }));
    prev.current = value;
  }, [value]);
  const split = tick.dir && tick.from >= 0 ? tick.from : str.length;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '0.3em',
      whiteSpace: 'nowrap',
      color,
      font: `${weight} ${SIZE[size] || SIZE.md}/1 var(--font-mono)`,
      letterSpacing: TRACK[size],
      fontVariantNumeric: 'tabular-nums slashed-zero',
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.62em',
      color: 'var(--text-tertiary)',
      fontWeight: 500,
      letterSpacing: 0
    }
  }, prefix), /*#__PURE__*/React.createElement("span", null, str.slice(0, split), split < str.length && /*#__PURE__*/React.createElement("span", {
    key: tick.n,
    style: {
      borderRadius: 2,
      animation: `${tick.dir === 'up' ? 'cl-flash-up' : 'cl-flash-down'} 900ms var(--ease-out)`
    }
  }, str.slice(split))));
}
Object.assign(__ds_scope, { PriceTicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/PriceTicker.jsx", error: String((e && e.message) || e) }); }

// components/market/TickerTape.jsx
try { (() => {
// The tape that rolls all session long. Pauses on hover. Items can carry a Claritas `signal` (sand dot).
function TickerTape({
  items = [],
  speed = 60,
  height = 32,
  onSelect,
  style
}) {
  const [paused, setPaused] = React.useState(false);
  const row = k => /*#__PURE__*/React.createElement("div", {
    key: k,
    "aria-hidden": k === 1 || undefined,
    style: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0
    }
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: k + it.symbol,
    type: "button",
    onClick: () => onSelect && onSelect(it.symbol),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      height,
      padding: '0 18px',
      border: 0,
      background: 'transparent',
      cursor: onSelect ? 'pointer' : 'default',
      borderRight: '1px solid var(--border-subtle)'
    }
  }, it.signal && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 5,
      background: 'var(--accent)',
      boxShadow: '0 0 8px var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-semibold) 11.5px/1 var(--font-mono)',
      color: 'var(--text-primary)',
      letterSpacing: '0.02em'
    }
  }, it.symbol), /*#__PURE__*/React.createElement(__ds_scope.PriceTicker, {
    value: it.price,
    size: "xs",
    color: "var(--text-secondary)",
    decimals: it.decimals ?? 2
  }), /*#__PURE__*/React.createElement(__ds_scope.Delta, {
    value: it.change,
    size: "xs"
  }))));
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    style: {
      position: 'relative',
      height,
      overflow: 'hidden',
      background: 'var(--surface-inset)',
      borderBottom: '1px solid var(--border-subtle)',
      maskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)',
      WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      width: 'max-content',
      animation: `cl-tape ${speed}s linear infinite`,
      animationPlayState: paused ? 'paused' : 'running'
    }
  }, row(0), row(1)));
}
Object.assign(__ds_scope, { TickerTape });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/TickerTape.jsx", error: String((e && e.message) || e) }); }

// components/market/WatchRow.jsx
try { (() => {
// Watchlist row: symbol · sparkline · last · change. `signal` marks a fresh Claritas read on the asset.
function WatchRow({
  symbol,
  name,
  price,
  change,
  series,
  selected = false,
  signal,
  dense = false,
  onClick,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 64px 84px',
      alignItems: 'center',
      gap: 12,
      height: dense ? 'var(--row-h-dense)' : 48,
      padding: '0 12px 0 14px',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      background: selected ? 'var(--surface-active)' : hover ? 'var(--surface-hover)' : 'transparent',
      transition: 'background var(--dur-tick) var(--ease-out)',
      ...style
    }
  }, selected && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: 2,
      borderRadius: 2,
      background: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-semibold) 12.5px/1 var(--font-mono)',
      color: 'var(--text-primary)',
      letterSpacing: '0.01em'
    }
  }, symbol), signal && /*#__PURE__*/React.createElement("span", {
    title: "Novo sinal Claritas",
    style: {
      width: 6,
      height: 6,
      borderRadius: 6,
      background: signal === 'up' ? 'var(--market-up)' : signal === 'down' ? 'var(--market-down)' : 'var(--accent)',
      boxShadow: '0 0 0 2px var(--accent-tint-strong)',
      animation: 'cl-breathe 2s ease-in-out infinite'
    }
  })), !dense && name && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--weight-regular) 11.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name)), series ? /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    data: series,
    width: 64,
    height: dense ? 18 : 24,
    baseline: false,
    animate: false
  }) : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: dense ? 'row' : 'column',
      alignItems: 'flex-end',
      gap: dense ? 8 : 5,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.PriceTicker, {
    value: price,
    size: "sm"
  }), /*#__PURE__*/React.createElement(__ds_scope.Delta, {
    value: change,
    size: "xs",
    arrow: false
  })));
}
Object.assign(__ds_scope, { WatchRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/market/WatchRow.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
// Sliding-indicator segmented control — timeframes (1m 5m 15m 1h D), chart types, views.
function SegmentedControl({
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  mono = true,
  fullWidth = false,
  style
}) {
  const opts = options.map(o => typeof o === 'string' ? {
    value: o,
    label: o
  } : o);
  const [inner, setInner] = React.useState(defaultValue ?? (opts[0] && opts[0].value));
  const cur = value !== undefined ? value : inner;
  const refs = React.useRef({});
  const wrap = React.useRef(null);
  const [ind, setInd] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = refs.current[cur],
      w = wrap.current;
    if (el && w) setInd({
      left: el.offsetLeft,
      width: el.offsetWidth
    });
  }, [cur, options.length]);
  const h = size === 'sm' ? 24 : 30;
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    role: "tablist",
    style: {
      position: 'relative',
      display: fullWidth ? 'flex' : 'inline-flex',
      padding: 2,
      gap: 0,
      background: 'var(--surface-inset)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, ind && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      bottom: 2,
      left: ind.left,
      width: ind.width,
      background: 'var(--surface-active)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-raised)',
      transition: 'left var(--dur-base) var(--ease-out), width var(--dur-base) var(--ease-out)'
    }
  }), opts.map(o => {
    const on = o.value === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      ref: el => refs.current[o.value] = el,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onClick: () => {
        if (value === undefined) setInner(o.value);
        onChange && onChange(o.value);
      },
      style: {
        position: 'relative',
        flex: fullWidth ? 1 : undefined,
        height: h,
        padding: size === 'sm' ? '0 8px' : '0 11px',
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        font: mono ? `var(--weight-medium) ${size === 'sm' ? 11 : 12}px/1 var(--font-mono)` : `var(--weight-medium) ${size === 'sm' ? 12 : 13}px/1 var(--font-sans)`,
        color: on ? 'var(--text-primary)' : 'var(--text-tertiary)',
        transition: 'color var(--dur-fast) var(--ease-out)',
        whiteSpace: 'nowrap'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
// Underline tabs. The active indicator is sand and slides between tabs.
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  style
}) {
  const tabs = items.map(t => typeof t === 'string' ? {
    value: t,
    label: t
  } : t);
  const [inner, setInner] = React.useState(defaultValue ?? (tabs[0] && tabs[0].value));
  const cur = value !== undefined ? value : inner;
  const refs = React.useRef({});
  const [ind, setInd] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  React.useLayoutEffect(() => {
    const el = refs.current[cur];
    if (el) setInd({
      left: el.offsetLeft,
      width: el.offsetWidth
    });
  }, [cur, items.length]);
  const h = size === 'sm' ? 34 : 42;
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      position: 'relative',
      display: 'flex',
      gap: 20,
      height: h,
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, tabs.map(t => {
    const on = t.value === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: t.value,
      ref: el => refs.current[t.value] = el,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onMouseEnter: () => setHover(t.value),
      onMouseLeave: () => setHover(null),
      onClick: () => {
        if (value === undefined) setInner(t.value);
        onChange && onChange(t.value);
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: '100%',
        padding: 0,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        font: `var(--weight-medium) ${size === 'sm' ? 12.5 : 13}px/1 var(--font-sans)`,
        whiteSpace: 'nowrap',
        color: on ? 'var(--text-primary)' : hover === t.value ? 'var(--text-secondary)' : 'var(--text-tertiary)',
        transition: 'color var(--dur-fast) var(--ease-out)'
      }
    }, t.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 14
    }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 10px/1 var(--font-mono)',
        padding: '3px 5px',
        borderRadius: 'var(--radius-xs)',
        background: on ? 'var(--accent-tint)' : 'rgba(255,255,255,.06)',
        color: on ? 'var(--accent)' : 'var(--text-tertiary)'
      }
    }, t.count));
  }), ind && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: -1,
      height: 2,
      left: ind.left,
      width: ind.width,
      background: 'var(--accent)',
      borderRadius: 2,
      boxShadow: '0 0 12px rgba(200,178,142,.6)',
      transition: 'left var(--dur-base) var(--ease-out), width var(--dur-base) var(--ease-out)'
    }
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function nowHM() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}
function makeSignal(tpl, symbol, price, id) {
  const up = tpl.kind === 'buy' || tpl.kind === 'pattern';
  const f = v => fmtBR(v);
  return {
    ...tpl,
    id,
    symbol,
    time: nowHM(),
    levels: tpl.kind === 'watch' || tpl.kind === 'alert' ? [{
      label: 'Faixa',
      value: `${f(price * 0.997)}–${f(price * 1.003)}`
    }, {
      label: 'Último',
      value: f(price)
    }] : [{
      label: 'Entrada',
      value: f(price)
    }, {
      label: 'Alvo',
      value: f(price * (up ? 1.016 : 0.984)),
      tone: up ? 'up' : 'down'
    }, {
      label: 'Stop',
      value: f(price * (up ? 0.992 : 1.008)),
      tone: up ? 'down' : 'up'
    }]
  };
}
function App() {
  const {
    TickerTape,
    Toast,
    Dialog,
    Button,
    Input,
    Select,
    Checkbox,
    Switch,
    CandleChart
  } = window.ClaritasDesignSystem_c8f168;
  const D = window.CL_DATA;
  const [screen, setScreenRaw] = React.useState(() => localStorage.getItem('cl-kit-screen') || 'desk');
  const setScreen = s => {
    setScreenRaw(s);
    localStorage.setItem('cl-kit-screen', s);
  };
  const [sel, setSel] = React.useState('PETR4');
  const [auto, setAuto] = React.useState(true);
  const [quotes, setQuotes] = React.useState(() => D.assets.map(a => ({
    ...a,
    series: CandleChart.generateSeries({
      seed: a.seed,
      start: a.price * (1 - a.change / 100),
      count: 48
    }).map(c => c.c)
  })));
  const [macro, setMacro] = React.useState(() => D.macro.map((m, i) => ({
    ...m,
    series: CandleChart.generateSeries({
      seed: 90 + i,
      start: m.price * (1 - m.change / 100),
      count: 40,
      vol: 0.0012
    }).map(c => c.c)
  })));
  const [live, setLive] = React.useState({});
  const [feed, setFeed] = React.useState(() => [makeSignal(D.signals[3], 'WEGE3', 52.9, 'seed-1'), {
    ...makeSignal(D.signals[2], 'BBAS3', 27.61, 'seed-2'),
    time: '13:48'
  }, {
    ...makeSignal(D.signals[1], 'ITUB4', 34.18, 'seed-3'),
    time: '12:20'
  }]);
  const [freshId, setFreshId] = React.useState(null);
  const [marks, setMarks] = React.useState({
    WEGE3: 'sand'
  });
  const [toasts, setToasts] = React.useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [bias, setBias] = React.useState(64);
  const liveRef = React.useRef(live);
  liveRef.current = live;
  const selRef = React.useRef(sel);
  selRef.current = sel;
  const pushToast = t => {
    const id = Date.now() + Math.random();
    setToasts(ts => [{
      ...t,
      id
    }, ...ts].slice(0, 3));
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5200);
  };
  React.useEffect(() => {
    const id = setInterval(() => {
      setQuotes(qs => qs.map(q => {
        if (Math.random() < 0.45) return q;
        const p = q.price * (1 + (Math.random() - 0.5) * 0.0024);
        return {
          ...q,
          price: p,
          change: q.change + (p - q.price) / q.price * 100,
          series: [...q.series.slice(1), p]
        };
      }));
      setMacro(ms => ms.map(m => {
        if (Math.random() < 0.4) return m;
        const p = m.price * (1 + (Math.random() - 0.5) * 0.0008);
        return {
          ...m,
          price: p,
          change: m.change + (p - m.price) / m.price * 100,
          series: [...m.series.slice(1), p]
        };
      }));
      setBias(b => Math.max(28, Math.min(86, b + (Math.random() - 0.48) * 2.4)));
    }, 1200);
    return () => clearInterval(id);
  }, []);
  React.useEffect(() => {
    if (!auto) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      const tpl = D.signals[(n + 1) % D.signals.length];
      const other = n % 3 === 0;
      const symbol = other ? D.assets[n * 5 % D.assets.length].symbol : selRef.current;
      const price = other ? D.assets.find(a => a.symbol === symbol).price : liveRef.current.price || 38;
      const sig = makeSignal(tpl, symbol, price, 'sig-' + Date.now());
      setFeed(f => [sig, ...f].slice(0, 14));
      setFreshId(sig.id);
      setMarks(m => ({
        ...m,
        [symbol]: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand'
      }));
      setBias(b => Math.max(30, Math.min(84, b + (sig.kind === 'buy' ? 4 : sig.kind === 'sell' ? -5 : 1))));
      if (other || screen !== 'desk') pushToast({
        tone: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand',
        title: `Novo sinal em ${symbol}`,
        message: sig.title,
        meta: sig.time,
        action: 'Ver no gráfico',
        symbol
      });
    }, 9000);
    return () => clearInterval(id);
  }, [auto, screen]);
  const onTick = React.useCallback(s => {
    const last = s[s.length - 1];
    const first = s[0];
    setLive({
      price: last.c,
      change: (last.c - first.o) / first.o * 100,
      series: s
    });
  }, []);
  const open = sym => {
    setSel(sym);
    setScreen('desk');
    setMarks(m => ({
      ...m,
      [sym]: undefined
    }));
  };
  const asset = D.assets.find(a => a.symbol === sel);
  const shown = quotes.map(q => q.symbol === sel && live.price ? {
    ...q,
    price: live.price,
    change: live.change
  } : q);
  const tape = [...macro, ...shown.map(q => ({
    symbol: q.symbol,
    price: q.price,
    change: q.change,
    signal: !!marks[q.symbol]
  }))];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      minWidth: 1280,
      overflow: 'hidden',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    macro: macro,
    onAlert: () => setAlertOpen(true)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Rail, {
    screen: screen,
    onScreen: setScreen
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 'var(--panel-gap)',
      padding: 10,
      minWidth: 0,
      minHeight: 0
    }
  }, screen === 'desk' && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 380px',
      gridTemplateRows: 'minmax(0,1fr) 260px',
      gap: 'var(--panel-gap)',
      minWidth: 0,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(ChartStage, {
    asset: asset,
    quotes: shown,
    signals: marks,
    onSelect: open,
    live: live,
    onTick: onTick,
    auto: auto,
    setAuto: setAuto,
    thoughts: D.thoughts,
    onAlert: () => setAlertOpen(true)
  }), /*#__PURE__*/React.createElement(AnalysisRail, {
    asset: asset,
    price: live.price || asset.price,
    feed: feed,
    bias: bias,
    freshId: freshId,
    onPick: open
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'grid',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Widgets, {
    price: live.price,
    bias: bias
  }))), screen === 'scanner' && /*#__PURE__*/React.createElement(ScannerScreen, {
    quotes: quotes,
    onOpen: open
  }), screen === 'report' && /*#__PURE__*/React.createElement(ReportScreen, {
    quotes: quotes,
    onOpen: open
  }))), /*#__PURE__*/React.createElement(TickerTape, {
    items: tape,
    speed: 80,
    height: 30,
    onSelect: s => D.assets.some(a => a.symbol === s) && open(s),
    style: {
      borderBottom: 0,
      borderTop: '1px solid var(--border-subtle)',
      background: 'transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 72,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 'var(--z-toast)'
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, _extends({
    key: t.id
  }, t, {
    onAction: () => open(t.symbol),
    onClose: () => setToasts(ts => ts.filter(x => x.id !== t.id))
  })))), /*#__PURE__*/React.createElement(Dialog, {
    open: alertOpen,
    onClose: () => setAlertOpen(false),
    eyebrow: `${asset.symbol} · ${asset.name}`,
    title: "Criar alerta",
    width: 420,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setAlertOpen(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: "bell",
      onClick: () => {
        setAlertOpen(false);
        pushToast({
          tone: 'info',
          title: 'Alerta criado',
          message: `${asset.symbol} cruzando R$ ${fmtBR((live.price || asset.price) * 1.01)}`,
          meta: nowHM()
        });
      }
    }, "Criar alerta"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Condi\xE7\xE3o",
    options: ['Preço cruzar para cima', 'Preço cruzar para baixo', 'Novo sinal Claritas', 'Volume atípico']
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Pre\xE7o",
    prefix: "R$",
    mono: true,
    defaultValue: fmtBR((live.price || asset.price) * 1.01),
    hint: `Último: ${fmtBR(live.price || asset.price)}`
  })), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Anexar leitura Claritas",
    description: "O alerta chega com a an\xE1lise do gr\xE1fico no momento do disparo."
  }), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true,
    size: "sm",
    label: "Som de alerta"
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Chrome.jsx
try { (() => {
function useClock() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
}
function MacroQuote({
  q
}) {
  const {
    Delta,
    Sparkline,
    PriceTicker
  } = window.ClaritasDesignSystem_c8f168;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)',
      letterSpacing: '0.02em'
    }
  }, q.symbol), /*#__PURE__*/React.createElement(PriceTicker, {
    value: q.price,
    decimals: q.decimals ?? 2,
    size: "xs",
    color: "var(--text-secondary)"
  })), /*#__PURE__*/React.createElement(Delta, {
    value: q.change,
    size: "xs",
    arrow: false
  })), /*#__PURE__*/React.createElement(Sparkline, {
    data: q.series,
    width: 64,
    height: 24,
    color: q.change >= 0 ? 'var(--accent)' : 'var(--market-down-text)',
    baseline: false,
    animate: false,
    area: false,
    strokeWidth: 1.25
  }));
}
function TopBar({
  macro,
  onAlert
}) {
  const {
    Wordmark,
    Input,
    LiveIndicator,
    IconButton,
    Tooltip
  } = window.ClaritasDesignSystem_c8f168;
  const clock = useClock();
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      height: 60,
      padding: '0 16px 0 20px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 22,
    product: "Terminal"
  }), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Buscar ativo ou perguntar \xE0 Claritas\u2026",
    kbd: "/",
    size: "sm",
    style: {
      width: 380
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28
    }
  }, macro.slice(0, 3).map(q => /*#__PURE__*/React.createElement(MacroQuote, {
    key: q.symbol,
    q: q
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 26,
      background: 'var(--border-default)'
    }
  }), /*#__PURE__*/React.createElement(LiveIndicator, {
    status: "live",
    detail: clock
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Alertas",
    badge: true,
    onClick: onAlert
  })), /*#__PURE__*/React.createElement(Tooltip, {
    content: "Marina Duarte \xB7 Plano Pro",
    placement: "bottom"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 30,
      height: 30,
      borderRadius: 30,
      border: '1px solid var(--border-strong)',
      color: 'var(--text-secondary)',
      font: '500 11px/1 var(--font-mono)'
    }
  }, "MD")));
}
function Rail({
  screen,
  onScreen
}) {
  const {
    IconButton
  } = window.ClaritasDesignSystem_c8f168;
  const items = [{
    id: 'desk',
    icon: 'chart-candlestick',
    label: 'Pregão ao vivo'
  }, {
    id: 'scanner',
    icon: 'radar',
    label: 'Scanner'
  }, {
    id: 'report',
    icon: 'file-text',
    label: 'Relatório de fechamento'
  }];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 'var(--rail-w)',
      padding: '12px 0',
      borderRight: '1px solid var(--border-subtle)'
    }
  }, items.map(i => /*#__PURE__*/React.createElement(IconButton, {
    key: i.id,
    icon: i.icon,
    label: i.label,
    active: screen === i.id,
    onClick: () => onScreen(i.id)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "history",
    label: "Replay de preg\xF5es"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "settings",
    label: "Ajustes"
  }));
}
Object.assign(window, {
  TopBar,
  Rail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Desk.jsx
try { (() => {
const fmtBR = (v, d = 2) => Number(v).toLocaleString('pt-BR', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});
const LBL = {
  font: 'var(--text-label)',
  letterSpacing: 'var(--label-track)',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  whiteSpace: 'nowrap'
};
function Thinking({
  thoughts
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI(x => (x + 1) % thoughts.length), 2200);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      font: '400 12px/1 var(--font-mono)',
      backgroundImage: 'linear-gradient(90deg,var(--ink-500) 0%,var(--sand-200) 50%,var(--ink-500) 100%)',
      backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      animation: 'cl-shimmer 2.2s linear infinite, cl-fade 300ms var(--ease-out)'
    }
  }, thoughts[i], "\u2026");
}
function Stat({
  k,
  v
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'baseline',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...LBL,
      fontSize: 10
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, v));
}
function ChartStage({
  asset,
  quotes,
  signals,
  onSelect,
  live,
  onTick,
  auto,
  setAuto,
  thoughts,
  onAlert
}) {
  const {
    Panel,
    PriceTicker,
    Delta,
    SegmentedControl,
    IconButton,
    Switch,
    CandleChart,
    Icon,
    Button
  } = window.ClaritasDesignSystem_c8f168;
  const [tf, setTf] = React.useState('5m');
  const s = live.series || [];
  const vwap = s.length ? s.reduce((a, c) => a + (c.h + c.l + c.c) / 3 * c.v, 0) / s.reduce((a, c) => a + c.v, 0) : 0;
  const hi = s.length ? Math.max(...s.map(c => c.h)) : 0,
    lo = s.length ? Math.min(...s.map(c => c.l)) : 0;
  const price = live.price || asset.price;
  const chg = live.change ?? asset.change;
  const abs = price - price / (1 + chg / 100);
  return /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '18px 16px 10px 22px'
    }
  }, /*#__PURE__*/React.createElement(SymbolPicker, {
    asset: asset,
    quotes: quotes,
    onSelect: onSelect,
    signals: signals
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(PriceTicker, {
    value: price,
    size: "lg",
    weight: 400
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: abs,
    kind: "abs",
    size: "sm",
    arrow: false
  }), /*#__PURE__*/React.createElement(Delta, {
    value: chg,
    size: "sm",
    arrow: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    options: ['1m', '5m', '15m', '1h', 'D'],
    value: tf,
    onChange: setTf
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "star",
    label: "Favoritar",
    size: "sm"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "layers",
    label: "Indicadores",
    size: "sm"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "maximize-2",
    label: "Tela cheia",
    size: "sm"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    icon: "bell",
    onClick: onAlert
  }, "Alerta")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: '0 6px 0 10px'
    }
  }, /*#__PURE__*/React.createElement(CandleChart, {
    key: asset.symbol + tf,
    seed: asset.seed + tf.length,
    start: asset.price * (1 - asset.change / 100),
    live: true,
    tickMs: tf === '1m' ? 420 : 650,
    ticksPerCandle: tf === '1m' ? 5 : 9,
    autoAnalyze: auto,
    scanning: auto,
    field: auto,
    height: "100%",
    window: 78,
    onTick: onTick
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      height: 40,
      padding: '0 18px 0 16px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    size: "sm",
    checked: auto,
    onChange: setAuto
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      color: auto ? 'var(--accent)' : 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 10.5px/1 var(--font-mono)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase'
    }
  }, "Claritas")), auto ? /*#__PURE__*/React.createElement(Thinking, {
    thoughts: thoughts
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, "an\xE1lise autom\xE1tica pausada"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 8
    }
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "VWAP",
    v: fmtBR(vwap)
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "M\xE1x",
    v: fmtBR(hi)
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "M\xEDn",
    v: fmtBR(lo)
  })));
}
function AnalysisRail({
  asset,
  price,
  feed,
  bias,
  freshId,
  onPick
}) {
  const {
    Panel,
    Tabs,
    SignalCard,
    LiveIndicator,
    MetricRow,
    Icon,
    ConfidenceMeter
  } = window.ClaritasDesignSystem_c8f168;
  const [tab, setTab] = React.useState('sum');
  const glowing = freshId && Date.now() - freshId < 2500;
  const word = bias >= 60 ? 'Viés comprador' : bias <= 40 ? 'Viés vendedor' : 'Viés neutro';
  const conf = bias >= 72 || bias <= 30 ? 'Confiança alta' : 'Confiança média';
  const sup = price * 0.986,
    tgt = price * 1.021;
  const body = bias >= 60 ? `${asset.symbol} sustenta força relativa acima do Ibovespa, com compradores defendendo cada recuo. O preço segue acima da VWAP e do suporte em ${fmtBR(sup)}, com volume saudável — cenário de continuidade.` : `${asset.symbol} perdeu ritmo desde o meio do pregão. Volume em queda e preço oscilando em torno da VWAP: sem vantagem clara até sair da faixa.`;
  return /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    glow: glowing ? 'sand' : false,
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 18px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: LBL
  }, "Leitura Claritas"), /*#__PURE__*/React.createElement(LiveIndicator, {
    status: "analyzing",
    size: "sm",
    label: "Ao vivo"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      padding: '18px 18px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 14,
      height: 14,
      flexShrink: 0,
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 14,
      background: 'var(--accent)',
      boxShadow: '0 0 16px rgba(200,178,142,.7)',
      animation: 'cl-pulse 2s var(--ease-out) infinite'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: word,
    style: {
      font: '400 28px/1 var(--font-serif)',
      color: 'var(--text-primary)',
      animation: 'cl-fade 500ms var(--ease-out)'
    }
  }, word), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, conf, " \xB7 ", Math.round(bias), "%"))), /*#__PURE__*/React.createElement("p", {
    key: word,
    style: {
      margin: 0,
      padding: '14px 18px 4px',
      font: '400 13.5px/1.6 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty',
      animation: 'cl-fade 500ms var(--ease-out)'
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    size: "sm",
    value: tab,
    onChange: setTab,
    items: [{
      value: 'sum',
      label: 'Resumo'
    }, {
      value: 'sig',
      label: 'Sinais',
      count: feed.length
    }, {
      value: 'tech',
      label: 'Técnico'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '6px 18px 14px'
    }
  }, tab === 'sum' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MetricRow, {
    icon: "trending-up",
    label: "Regime atual",
    value: bias >= 55 ? 'Tendência de alta' : 'Lateral'
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "scale",
    label: "Risco / retorno",
    value: `${fmtBR(1.8 + bias / 100, 1)} : 1`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "crosshair",
    label: "N\xEDvel-chave",
    value: fmtBR(sup),
    sub: "suporte"
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "target",
    label: "Pr\xF3ximo alvo",
    value: fmtBR(tgt),
    sub: `+${fmtBR((tgt / price - 1) * 100, 1)}%`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      marginTop: 14,
      padding: 14,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-panel)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 30,
      height: 30,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-tint)',
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "move-up-right",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...LBL,
      fontSize: 10
    }
  }, "Estrat\xE9gia"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, bias >= 60 ? 'Comprar nos recuos' : 'Aguardar rompimento'), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1.5 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, "Entradas perto de ", fmtBR(sup), ", alvo em ", fmtBR(tgt), ". Invalida abaixo de ", fmtBR(sup * 0.994), ".")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  }))), tab === 'sig' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingTop: 6
    }
  }, feed.map((f, i) => /*#__PURE__*/React.createElement(SignalCard, {
    key: f.id,
    fresh: f.id === freshId,
    compact: i > 0,
    kind: f.kind,
    symbol: f.symbol,
    timeframe: f.tf,
    time: f.time,
    title: f.title,
    body: f.body,
    levels: i === 0 ? f.levels : undefined,
    confidence: i === 0 ? f.conf : undefined,
    onClick: () => onPick(f.symbol)
  }))), tab === 'tech' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      paddingTop: 10
    }
  }, [['Tendência (MM9 × MM21)', bias + 6], ['Força relativa vs. IBOV', bias - 4], ['Fluxo de agressão', bias + 2], ['Volatilidade', 46]].map(([l, v]) => /*#__PURE__*/React.createElement(ConfidenceMeter, {
    key: l,
    label: l,
    value: Math.max(5, Math.min(98, v)),
    segments: 18
  })))));
}
function Widget({
  title,
  children,
  action
}) {
  const {
    Panel,
    IconButton
  } = window.ClaritasDesignSystem_c8f168;
  return /*#__PURE__*/React.createElement(Panel, {
    eyebrow: title,
    actions: action || /*#__PURE__*/React.createElement(IconButton, {
      icon: "maximize-2",
      label: "Expandir",
      size: "sm"
    }),
    padding: "4px 18px 16px",
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, children);
}
function Widgets({
  price,
  bias
}) {
  const {
    SentimentGauge,
    FlowArea,
    DistributionCurve,
    MetricRow
  } = window.ClaritasDesignSystem_c8f168;
  const [net, setNet] = React.useState(1.24);
  const [inst, setInst] = React.useState(68);
  const [sig, setSig] = React.useState({
    vol: 1.8,
    align: 3,
    foreign: 312
  });
  const base = React.useRef(price);
  React.useEffect(() => {
    const id = setInterval(() => {
      setInst(v => Math.max(55, Math.min(78, v + (Math.random() - 0.5) * 2)));
      setSig(s => ({
        vol: Math.max(0.8, s.vol + (Math.random() - 0.48) * 0.12),
        align: Math.random() < 0.15 ? s.align === 3 ? 4 : 3 : s.align,
        foreign: s.foreign + Math.round((Math.random() - 0.4) * 14)
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);
  const p = price || base.current || 38;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 'var(--panel-gap)',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Widget, {
    title: "Sentimento"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SentimentGauge, {
    value: bias,
    size: 190
  }))), /*#__PURE__*/React.createElement(Widget, {
    title: "Fluxo l\xEDquido"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, "Hoje, todos os participantes"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 26px/1 var(--font-mono)',
      letterSpacing: '-0.03em',
      color: 'var(--accent)',
      margin: '10px 0 6px'
    }
  }, "+R$ ", fmtBR(net, 2), " bi"), /*#__PURE__*/React.createElement(FlowArea, {
    live: true,
    height: 74,
    tickMs: 900,
    onTick: d => setNet(Math.max(0.2, 0.6 + d[d.length - 1] / 18))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginTop: 10
    }
  }, [['Institucional', inst], ['Varejo', 100 - inst]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 10px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-raised)',
      font: '400 11.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, k, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11.5px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, Math.round(v), "%"))))), /*#__PURE__*/React.createElement(Widget, {
    title: "Distribui\xE7\xE3o de fechamento"
  }, /*#__PURE__*/React.createElement(DistributionCurve, {
    mean: p * (1 + (bias - 50) / 2500),
    sd: p * 0.0085,
    target: p * 1.01,
    min: p * 0.97,
    max: p * 1.03,
    decimals: 2,
    ticks: 4,
    height: 170,
    caption: `chance de fechar ≥ ${fmtBR(p * 1.01)}`
  })), /*#__PURE__*/React.createElement(Widget, {
    title: "Sinais-chave",
    action: /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => e.preventDefault(),
      style: {
        font: '400 11.5px/1 var(--font-sans)',
        color: 'var(--text-tertiary)'
      }
    }, "Ver todos \u2192")
  }, /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "activity",
    label: "Momentum",
    value: bias >= 55 ? 'Comprador' : 'Neutro'
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "chart-column",
    label: "Volume",
    value: `${fmtBR(sig.vol, 1)}× média`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "layers",
    label: "Alinhamento de tempos",
    value: `${sig.align} de 4`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "globe",
    label: "Fluxo estrangeiro",
    value: `${sig.foreign >= 0 ? '+' : '−'}R$ ${Math.abs(sig.foreign)} mi`,
    tone: sig.foreign >= 0 ? 'sand' : 'down',
    style: {
      borderBottom: 0
    }
  })));
}
Object.assign(window, {
  ChartStage,
  AnalysisRail,
  Widgets,
  fmtBR
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Desk.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Report.jsx
try { (() => {
function ReportScreen({
  quotes,
  onOpen
}) {
  const {
    Panel,
    Badge,
    Button,
    Delta,
    CandleChart,
    SignalCard,
    Sparkline
  } = window.ClaritasDesignSystem_c8f168;
  const series = React.useMemo(() => CandleChart.generateSeries({
    seed: 3,
    start: 130870,
    count: 84,
    vol: 0.0011
  }), []);
  const marks = [{
    id: 'm1',
    type: 'marker',
    t: series[14].t,
    side: 'buy',
    label: 'PETR4 ↑'
  }, {
    id: 'm2',
    type: 'marker',
    t: series[38].t,
    side: 'sell',
    label: 'MGLU3 ↓'
  }, {
    id: 'm3',
    type: 'marker',
    t: series[61].t,
    side: 'buy',
    label: 'WEGE3 ↑'
  }, {
    id: 'z1',
    type: 'zone',
    from: series[30].l,
    to: series[30].h * 1.0006,
    label: 'Lateralização 12h–14h'
  }];
  const sorted = [...quotes].sort((a, b) => b.change - a.change);
  const movers = [...sorted.slice(0, 3), ...sorted.slice(-3)];
  const kpis = [['Ibovespa', '131.420', '+0,42%', 'up'], ['Volume financeiro', 'R$ 24,1 bi', '+8% vs. média', null], ['Sinais emitidos', '37', '12 compra · 9 venda', null], ['Taxa de acerto', '68%', '25 de 37 no alvo', 'sand']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 340px',
      gap: 'var(--panel-gap)',
      maxWidth: 1320
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 28,
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "sand",
    dot: true
  }, "Relat\xF3rio Claritas"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, "Sexta, 9 de outubro de 2026 \xB7 fechamento 17:00")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '400 var(--display-l-size)/var(--display-l-lh) var(--font-serif)',
      letterSpacing: 'var(--display-l-track)',
      color: 'var(--text-primary)',
      maxWidth: 820,
      textWrap: 'pretty'
    }
  }, "Ibovespa fecha em alta de 0,42%, puxado por petr\xF3leo e ", /*#__PURE__*/React.createElement("i", {
    style: {
      color: 'var(--accent)'
    }
  }, "uma tarde de rompimentos.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 720,
      font: '400 15px/1.6 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, "A manh\xE3 foi lateral, entre 130.900 e 131.200 pontos. Depois das 14h o fluxo comprador voltou com PETR4 e PRIO3, e o \xEDndice renovou a m\xE1xima \xE0s 16:20. Varejo seguiu pressionado pelos juros futuros.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "share-2",
    size: "sm"
  }, "Compartilhar"), /*#__PURE__*/React.createElement(Button, {
    icon: "download",
    size: "sm"
  }, "Exportar PDF"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 1,
      marginTop: 24,
      background: 'var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, kpis.map(([k, v, d, t]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '16px 18px',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 26px/1 var(--font-mono)',
      letterSpacing: '-0.02em',
      color: t === 'sand' ? 'var(--accent)' : 'var(--text-primary)'
    }
  }, v), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: t === 'up' ? 'var(--market-up-text)' : 'var(--text-tertiary)'
    }
  }, d))))), /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "IBOV \xB7 5m",
    title: "O dia em uma tela",
    padding: 8
  }, /*#__PURE__*/React.createElement(CandleChart, {
    data: series,
    annotations: marks,
    height: 360,
    decimals: 0,
    ma: [9],
    crosshair: true,
    watermark: "IBOV"
  })), /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "Destaques",
    title: "Maiores altas e baixas",
    padding: false
  }, movers.map((q, i) => /*#__PURE__*/React.createElement("div", {
    key: q.symbol,
    onClick: () => onOpen(q.symbol),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 70px 70px',
      alignItems: 'center',
      gap: 10,
      height: 46,
      padding: '0 16px',
      cursor: 'pointer',
      borderTop: i === 3 ? '1px solid var(--border-default)' : i ? '1px solid var(--border-subtle)' : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, q.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, q.sector)), /*#__PURE__*/React.createElement(Sparkline, {
    data: q.series,
    width: 70,
    height: 22,
    baseline: false,
    animate: false
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: q.change,
    size: "sm"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--panel-gap)'
    }
  }, /*#__PURE__*/React.createElement(SignalCard, {
    kind: "buy",
    symbol: "PETR4",
    timeframe: "15m",
    time: "14:05",
    title: "Rompimento de R$ 38,10 \u2014 alvo atingido \xE0s 16:20",
    confidence: 81,
    tags: ['Alvo ✓']
  }), /*#__PURE__*/React.createElement(SignalCard, {
    kind: "pattern",
    symbol: "WEGE3",
    timeframe: "1h",
    time: "15:10",
    title: "Bandeira de alta confirmou no fechamento",
    confidence: 66,
    tags: ['Padrão']
  }), /*#__PURE__*/React.createElement(SignalCard, {
    kind: "sell",
    symbol: "MGLU3",
    timeframe: "5m",
    time: "11:42",
    title: "Perda da VWAP \u2014 stop acionado, sinal invalidado",
    confidence: 58,
    tags: ['Stop']
  }))));
}
window.ReportScreen = ReportScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Report.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Scanner.jsx
try { (() => {
const SETUPS = [{
  k: 'Rompimento',
  tone: 'up'
}, {
  k: 'Pullback na MM21',
  tone: 'up'
}, {
  k: 'Divergência IFR',
  tone: 'sand'
}, {
  k: 'Perda da VWAP',
  tone: 'down'
}, {
  k: 'Bandeira',
  tone: 'sand'
}, {
  k: 'Topo duplo',
  tone: 'down'
}];
function ScannerScreen({
  quotes,
  onOpen
}) {
  const {
    Panel,
    Checkbox,
    Select,
    SegmentedControl,
    Button,
    Badge,
    Sparkline,
    Delta,
    PriceTicker,
    ConfidenceMeter,
    LiveIndicator
  } = window.ClaritasDesignSystem_c8f168;
  const [found, setFound] = React.useState([]);
  const [scanned, setScanned] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  const total = 84;
  React.useEffect(() => {
    if (!running) return;
    setFound([]);
    setScanned(0);
    let n = 0;
    const id = setInterval(() => {
      n += 3;
      setScanned(Math.min(total, n));
      if (n % 9 === 0 && n / 9 <= quotes.length) {
        const q = quotes[(n / 9 - 1) % quotes.length];
        const s = SETUPS[n / 9 % SETUPS.length];
        setFound(f => [{
          ...q,
          setup: s,
          conf: 48 + q.seed * 7 % 44,
          at: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Sao_Paulo'
          })
        }, ...f]);
      }
      if (n >= total) {
        setRunning(false);
        clearInterval(id);
      }
    }, 140);
    return () => clearInterval(id);
  }, [running]);
  const pct = scanned / total * 100;
  const col = 'minmax(0,1.3fr) 110px 90px 80px minmax(0,1.2fr) 150px 80px';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--panel-gap)',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "Crit\xE9rios",
    title: "Scanner",
    style: {
      width: 260,
      flexShrink: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    },
    footer: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: "radar",
      fullWidth: true,
      loading: running,
      onClick: () => setRunning(true)
    }, running ? 'Varrendo…' : 'Varrer novamente')
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Universo",
    options: ['Ibovespa (84)', 'IBrX-100', 'Small caps', 'Minha carteira']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Tempo gr\xE1fico"), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    fullWidth: true,
    options: ['5m', '15m', '1h', 'D'],
    defaultValue: "15m"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Setups"), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Rompimentos",
    description: "Fechamento acima de resist\xEAncia"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Pullbacks em m\xE9dias"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Diverg\xEAncias de IFR"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Padr\xF5es gr\xE1ficos"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Perda de VWAP"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "S\xF3 volume acima da m\xE9dia"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    style: {
      flex: 1,
      minWidth: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '18px 20px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }
  }, running && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '22%',
      background: 'var(--scan-beam)',
      borderRight: '1px solid rgba(243,237,226,.8)',
      animation: 'cl-scan 1.6s linear infinite',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(LiveIndicator, {
    status: running ? 'analyzing' : 'live',
    label: running ? 'Varrendo o Ibovespa' : 'Varredura concluída',
    detail: `${scanned}/${total} ativos`
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 30px/1.1 var(--font-serif)',
      color: 'var(--text-primary)'
    }
  }, found.length, " ", found.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas')), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 26px/1 var(--font-mono)',
      color: 'var(--accent)',
      letterSpacing: '-0.02em'
    }
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 2,
      marginTop: 14,
      background: 'var(--ink-700)',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: pct + '%',
      background: 'var(--accent)',
      borderRadius: 2,
      boxShadow: '0 0 10px var(--accent)',
      transition: 'width 140ms linear'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: col,
      gap: 16,
      padding: '10px 20px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, ['Ativo', 'Intraday', 'Último', 'Var.', 'Setup', 'Confiança', 'Hora'].map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      textAlign: ['Último', 'Var.', 'Hora'].includes(h) ? 'right' : 'left'
    }
  }, h))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, found.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.symbol,
    onClick: () => onOpen(r.symbol),
    style: {
      display: 'grid',
      gridTemplateColumns: col,
      gap: 16,
      alignItems: 'center',
      height: 52,
      padding: '0 20px',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      animation: 'cl-rise var(--dur-slow) var(--ease-out)'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-hover)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12.5px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, r.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, r.name)), /*#__PURE__*/React.createElement(Sparkline, {
    data: r.series,
    width: 110,
    height: 26
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(PriceTicker, {
    value: r.price,
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: r.change,
    size: "xs"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Badge, {
    tone: r.setup.tone,
    variant: "outline"
  }, r.setup.k)), /*#__PURE__*/React.createElement(ConfidenceMeter, {
    value: r.conf,
    label: null,
    showValue: false,
    size: "sm",
    segments: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right',
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, r.at))))));
}
window.ScannerScreen = ScannerScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Scanner.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/Watchlist.jsx
try { (() => {
// Symbol picker: the watchlist lives in a popover so the desk stays quiet.
function SymbolPicker({
  asset,
  quotes,
  onSelect,
  signals
}) {
  const {
    WatchRow,
    Icon,
    Input
  } = window.ClaritasDesignSystem_c8f168;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const list = quotes.filter(x => !q || (x.symbol + x.name).toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(o => !o),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 10px 6px 6px',
      margin: '-6px 0 -6px -6px',
      border: 0,
      borderRadius: 'var(--radius-md)',
      background: open ? 'var(--surface-hover)' : 'transparent',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 17px/1 var(--font-mono)',
      color: 'var(--text-primary)',
      letterSpacing: '0.01em'
    }
  }, asset.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap'
    }
  }, asset.name)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--text-tertiary)"
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 10px)',
      left: -6,
      zIndex: 'var(--z-dropdown)',
      width: 340,
      padding: 6,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-pop)',
      animation: 'cl-pop var(--dur-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Filtrar",
    size: "sm",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      margin: '2px 2px 6px'
    },
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 380,
      overflowY: 'auto'
    }
  }, list.map(x => /*#__PURE__*/React.createElement(WatchRow, {
    key: x.symbol,
    symbol: x.symbol,
    name: x.name,
    price: x.price,
    change: x.change,
    series: x.series,
    selected: x.symbol === asset.symbol,
    signal: signals[x.symbol],
    onClick: () => {
      onSelect(x.symbol);
      setOpen(false);
    }
  })))));
}
window.SymbolPicker = SymbolPicker;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/Watchlist.jsx", error: String((e && e.message) || e) }); }

// ui_kits/terminal/data.js
try { (() => {
// Mock market data for the Claritas Terminal UI kit (B3, fictitious prices).
window.CL_DATA = {
  assets: [{
    symbol: 'PETR4',
    name: 'Petrobras PN',
    price: 38.42,
    change: 1.21,
    seed: 7,
    sector: 'Petróleo'
  }, {
    symbol: 'VALE3',
    name: 'Vale ON',
    price: 61.27,
    change: -0.64,
    seed: 11,
    sector: 'Mineração'
  }, {
    symbol: 'ITUB4',
    name: 'Itaú Unibanco PN',
    price: 34.18,
    change: 0.33,
    seed: 19,
    sector: 'Bancos'
  }, {
    symbol: 'WEGE3',
    name: 'WEG ON',
    price: 52.9,
    change: 2.08,
    seed: 23,
    sector: 'Bens industriais'
  }, {
    symbol: 'BBAS3',
    name: 'Banco do Brasil ON',
    price: 27.61,
    change: -1.12,
    seed: 29,
    sector: 'Bancos'
  }, {
    symbol: 'BBDC4',
    name: 'Bradesco PN',
    price: 13.42,
    change: 0.15,
    seed: 31,
    sector: 'Bancos'
  }, {
    symbol: 'PRIO3',
    name: 'PRIO ON',
    price: 44.8,
    change: 1.74,
    seed: 37,
    sector: 'Petróleo'
  }, {
    symbol: 'B3SA3',
    name: 'B3 ON',
    price: 11.37,
    change: -0.44,
    seed: 41,
    sector: 'Financeiro'
  }, {
    symbol: 'ABEV3',
    name: 'Ambev ON',
    price: 12.08,
    change: 0.08,
    seed: 43,
    sector: 'Consumo'
  }, {
    symbol: 'SUZB3',
    name: 'Suzano ON',
    price: 56.12,
    change: -0.92,
    seed: 47,
    sector: 'Papel e celulose'
  }, {
    symbol: 'RENT3',
    name: 'Localiza ON',
    price: 41.55,
    change: 0.61,
    seed: 53,
    sector: 'Locação'
  }, {
    symbol: 'MGLU3',
    name: 'Magazine Luiza ON',
    price: 9.84,
    change: -2.31,
    seed: 59,
    sector: 'Varejo'
  }],
  macro: [{
    symbol: 'IBOV',
    price: 131420,
    change: 0.42,
    decimals: 0
  }, {
    symbol: 'IFIX',
    price: 3318,
    change: 0.06,
    decimals: 0
  }, {
    symbol: 'USDBRL',
    price: 5.4321,
    change: -0.21,
    decimals: 4
  }, {
    symbol: 'DI1F27',
    price: 13.42,
    change: 0.05
  }, {
    symbol: 'S&P FUT',
    price: 5832,
    change: 0.18,
    decimals: 0
  }],
  // Claritas reads — templates the live desk cycles through.
  signals: [{
    kind: 'buy',
    tf: '5m',
    title: 'Rompimento confirmado acima da resistência',
    body: 'Fechamento acima do nível testado três vezes desde a abertura, com volume 2,1× a média de 20 períodos. Invalida se voltar a fechar abaixo do nível.',
    conf: 78,
    tags: ['Rompimento', 'Volume']
  }, {
    kind: 'watch',
    tf: '15m',
    title: 'Testando a VWAP pela terceira vez',
    body: 'Preço oscila em torno da VWAP com volume caindo. Sem direção definida — aguardar fechamento fora da faixa.',
    conf: 52,
    tags: ['VWAP']
  }, {
    kind: 'sell',
    tf: '5m',
    title: 'Perdeu a mínima do dia com fluxo vendedor',
    body: 'Três velas de baixa consecutivas com saldo de agressão negativo. MM9 cruzou a MM21 para baixo.',
    conf: 64,
    tags: ['Fluxo', 'Médias']
  }, {
    kind: 'pattern',
    tf: '1h',
    title: 'Bandeira de alta em formação',
    body: 'Mastro de +2,4% seguido de consolidação estreita e volume decrescente. Alvo projetado pela altura do mastro.',
    conf: 61,
    tags: ['Padrão']
  }, {
    kind: 'alert',
    tf: '1m',
    title: 'Volume atípico nos últimos 3 minutos',
    body: 'Negócios 4,3× acima do normal para o horário. Pode anteceder notícia — conferir fatos relevantes.',
    conf: 70,
    tags: ['Volume']
  }, {
    kind: 'buy',
    tf: '15m',
    title: 'Divergência de alta no IFR',
    body: 'Preço fez nova mínima, IFR(14) não. Primeiro sinal de exaustão vendedora desde 11:20.',
    conf: 58,
    tags: ['IFR', 'Divergência']
  }],
  thoughts: ['lendo fluxo de agressão', 'comparando volume com 20 períodos', 'recalculando suportes', 'checando correlação com IBOV', 'medindo amplitude do dia', 'procurando padrões de candle', 'cruzando médias 9 × 21', 'avaliando VWAP']
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/terminal/data.js", error: String((e && e.message) || e) }); }

__ds_ns.ConfidenceMeter = __ds_scope.ConfidenceMeter;

__ds_ns.MetricRow = __ds_scope.MetricRow;

__ds_ns.SentimentGauge = __ds_scope.SentimentGauge;

__ds_ns.SignalCard = __ds_scope.SignalCard;

__ds_ns.CandleChart = __ds_scope.CandleChart;

__ds_ns.DistributionCurve = __ds_scope.DistributionCurve;

__ds_ns.FlowArea = __ds_scope.FlowArea;

__ds_ns.ProbabilityField = __ds_scope.ProbabilityField;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.LiveIndicator = __ds_scope.LiveIndicator;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Delta = __ds_scope.Delta;

__ds_ns.PriceTicker = __ds_scope.PriceTicker;

__ds_ns.TickerTape = __ds_scope.TickerTape;

__ds_ns.WatchRow = __ds_scope.WatchRow;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
