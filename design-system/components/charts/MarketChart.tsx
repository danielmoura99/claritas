"use client";

import * as React from "react";
import type { IChartApi, ISeriesApi, ISeriesMarkersPluginApi, IPriceLine, Time, UTCTimestamp, SeriesMarker } from "lightweight-charts";

/**
 * Gráfico de mercado REAL (TradingView Lightweight Charts, Apache-2.0) com a gramática visual Claritas:
 * velas osso/grafite, volume em branco translúcido, última vela e etiqueta do último preço em areia,
 * níveis Claritas tracejados 5·4, grade 4%, eixo mono à direita. Recebe números já convertidos na borda
 * (o componente não conhece provedores nem contratos de API). Cores vêm dos tokens CSS e acompanham o tema.
 */

export interface ChartBar {
  /** Abertura da barra em epoch ms UTC. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
export interface ChartLine {
  id: string;
  label: string;
  /** sand = indicador Claritas rápido; ink = indicador lento/secundário. */
  tone: "sand" | "ink";
  points: { time: number; value: number }[];
}
export interface ChartLevel {
  id: string;
  price: number;
  label: string;
  tone?: "sand" | "up" | "down" | "info";
}
export interface ChartMarker {
  id: string;
  time: number;
  side: "buy" | "sell" | "info";
  label: string;
}

export interface MarketChartProps {
  bars: ChartBar[];
  /** Identidade da série (ex.: "BTCUSDT:5m"). Mudou → recarrega dados e reenquadra; nunca mistura séries. */
  seriesKey: string;
  decimals?: number;
  height?: number | string;
  lines?: ChartLine[];
  levels?: ChartLevel[];
  markers?: ChartMarker[];
  showVolume?: boolean;
  /** Fuso de EXIBIÇÃO (os dados continuam em UTC). */
  timeZone?: string;
  /** Rótulo da unidade de preço exibido na legenda (ex.: "USDT"). */
  unit?: string;
  watermark?: string;
  /** Conteúdo sobreposto quando não há barras (carregando, erro, vazio). */
  overlay?: React.ReactNode;
  style?: React.CSSProperties;
}

type Lwc = typeof import("lightweight-charts");

interface Palette {
  grid: string; axis: string; up: string; down: string; volUp: string; volDown: string; crosshair: string;
  crosshairLabel: string; accent: string; border: string; font: string; maFast: string; maSlow: string;
  upLine: string; downLine: string; info: string; text: string;
}

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    grid: v("--chart-grid", "rgba(255,255,255,.04)"),
    axis: v("--chart-axis-text", "#5C5B58"),
    up: v("--candle-up", "#DED8CC"),
    down: v("--candle-down", "#5C5B58"),
    volUp: v("--chart-volume-up", "rgba(255,255,255,.13)"),
    volDown: v("--chart-volume-down", "rgba(255,255,255,.07)"),
    crosshair: v("--chart-crosshair", "rgba(173,171,166,.4)"),
    crosshairLabel: v("--chart-crosshair-label-bg", "#3A3A38"),
    accent: v("--accent", "#C8B28E"),
    border: v("--border-subtle", "rgba(255,255,255,.055)"),
    font: v("--font-mono", "monospace"),
    maFast: v("--chart-ma-fast", "#C8B28E"),
    maSlow: v("--chart-ma-slow", "#86847F"),
    upLine: v("--market-up", "#DED8CC"),
    downLine: v("--market-down-text", "#D4917E"),
    info: v("--status-info", "#9BA7B4"),
    text: v("--text-secondary", "#ADABA6"),
  };
}

const toTime = (ms: number) => Math.floor(ms / 1000) as UTCTimestamp;

function makeFormatters(timeZone: string, decimals: number) {
  const dtf = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", { timeZone, ...opts });
  const hm = dtf({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const hms = dtf({ hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const dm = dtf({ day: "2-digit", month: "2-digit" });
  const mon = dtf({ month: "short" });
  const yr = dtf({ year: "numeric" });
  const full = dtf({ day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const asDate = (t: Time) => new Date((t as number) * 1000);
  return {
    tick: (t: Time, type: number) => {
      const d = asDate(t);
      // TickMarkType: 0 Year, 1 Month, 2 DayOfMonth, 3 Time, 4 TimeWithSeconds
      return type === 0 ? yr.format(d) : type === 1 ? mon.format(d).replace(".", "") : type === 2 ? dm.format(d) : type === 4 ? hms.format(d) : hm.format(d);
    },
    time: (t: Time) => full.format(asDate(t)),
    price: (p: number) => num.format(p),
    num,
  };
}

/** Converte barras em dados das séries; a ÚLTIMA vela vai em areia (é onde a leitura acontece). */
function toSeriesData(bars: ChartBar[], p: Palette) {
  const candles = bars.map((b, i) => {
    const base = { time: toTime(b.time), open: b.open, high: b.high, low: b.low, close: b.close };
    return i === bars.length - 1 ? { ...base, color: p.accent, wickColor: p.accent, borderColor: p.accent } : base;
  });
  const volume = bars.map((b) => ({ time: toTime(b.time), value: b.volume ?? 0, color: b.close >= b.open ? p.volUp : p.volDown }));
  return { candles, volume };
}

export function MarketChart({
  bars,
  seriesKey,
  decimals = 2,
  height = 360,
  lines = [],
  levels = [],
  markers = [],
  showVolume = true,
  timeZone = "America/Sao_Paulo",
  unit,
  watermark,
  overlay,
  style,
}: MarketChartProps) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const host = React.useRef<HTMLDivElement>(null);
  const api = React.useRef<{
    lwc: Lwc;
    chart: IChartApi;
    candles: ISeriesApi<"Candlestick">;
    volume: ISeriesApi<"Histogram">;
    lines: Map<string, ISeriesApi<"Line">>;
    priceLines: IPriceLine[];
    markers: ISeriesMarkersPluginApi<Time>;
    palette: Palette;
  } | null>(null);
  const applied = React.useRef<{ key: string; first: number; length: number } | null>(null);
  /** Momento em que a série atual foi carregada: redimensionamentos logo depois reenquadram (layout ainda assentando). */
  const fittedAt = React.useRef(0);
  const [ready, setReady] = React.useState(false);
  const [hover, setHover] = React.useState<ChartBar | null>(null);
  const fmt = React.useMemo(() => makeFormatters(timeZone, decimals), [timeZone, decimals]);
  const fmtRef = React.useRef(fmt);
  React.useEffect(() => { fmtRef.current = fmt; }, [fmt]);
  const barsRef = React.useRef(bars);
  React.useEffect(() => { barsRef.current = bars; }, [bars]);

  // Criação do gráfico (uma vez). lightweight-charts é carregado sob demanda: não roda no servidor.
  React.useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    void import("lightweight-charts").then((lwc) => {
      if (disposed || !host.current || !wrap.current) return;
      const p = readPalette(wrap.current);
      const f = fmtRef.current;
      const chart = lwc.createChart(host.current, {
        autoSize: true,
        layout: { background: { type: lwc.ColorType.Solid, color: "transparent" }, textColor: p.axis, fontFamily: p.font, fontSize: 10.5, attributionLogo: true },
        grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
        rightPriceScale: { borderColor: p.border, scaleMargins: { top: 0.12, bottom: showVolume ? 0.2 : 0.06 } },
        timeScale: { borderColor: p.border, timeVisible: true, secondsVisible: false, rightOffset: 4, tickMarkFormatter: f.tick },
        crosshair: {
          mode: lwc.CrosshairMode.Normal,
          vertLine: { color: p.crosshair, style: lwc.LineStyle.Dashed, labelBackgroundColor: p.crosshairLabel },
          horzLine: { color: p.crosshair, style: lwc.LineStyle.Dashed, labelBackgroundColor: p.crosshairLabel },
        },
        localization: { locale: "pt-BR", timeFormatter: f.time, priceFormatter: f.price },
      });
      const candles = chart.addSeries(lwc.CandlestickSeries, {
        upColor: p.up, downColor: p.down, wickUpColor: p.up, wickDownColor: p.down, borderVisible: false,
        priceLineColor: p.accent, priceLineStyle: lwc.LineStyle.Dotted, lastValueVisible: true,
        priceFormat: { type: "price", precision: decimals, minMove: 1 / 10 ** decimals },
      });
      const volume = chart.addSeries(lwc.HistogramSeries, { priceScaleId: "volume", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.84, bottom: 0 }, visible: false });
      const markersApi = lwc.createSeriesMarkers(candles, []);
      chart.subscribeCrosshairMove((param) => {
        if (!param.time) return setHover(null);
        const t = (param.time as number) * 1000;
        setHover(barsRef.current.find((b) => b.time === t) ?? null);
      });
      api.current = { lwc, chart, candles, volume, lines: new Map(), priceLines: [], markers: markersApi, palette: p };

      // Tema: tokens mudam com data-theme → reaplica as cores lidas do CSS.
      const mo = new MutationObserver(() => {
        if (!wrap.current || !api.current) return;
        const np = readPalette(wrap.current);
        api.current.palette = np;
        chart.applyOptions({ layout: { textColor: np.axis, fontFamily: np.font }, grid: { vertLines: { color: np.grid }, horzLines: { color: np.grid } }, rightPriceScale: { borderColor: np.border }, timeScale: { borderColor: np.border } });
        candles.applyOptions({ upColor: np.up, downColor: np.down, wickUpColor: np.up, wickDownColor: np.down, priceLineColor: np.accent });
        applied.current = null; // força recolorir os dados no próximo render
        setReady((r) => !r);
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      // O contêiner pode mudar de largura logo após a carga (grid/fontes assentando): reenquadra nesse intervalo.
      const ro = new ResizeObserver(() => {
        if (performance.now() - fittedAt.current < 2_000) chart.timeScale().fitContent();
      });
      ro.observe(host.current);
      setReady(true);
      cleanup = () => {
        ro.disconnect();
        mo.disconnect();
        chart.remove();
        api.current = null;
        applied.current = null;
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
    // Criação única; opções dinâmicas são aplicadas nos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.chart.applyOptions({ localization: { timeFormatter: fmt.time, priceFormatter: fmt.price }, timeScale: { tickMarkFormatter: fmt.tick } });
    a.candles.applyOptions({ priceFormat: { type: "price", precision: decimals, minMove: 1 / 10 ** decimals } });
  }, [fmt, decimals, ready]);

  // Dados: setData na carga/troca de série/abertura de barra; update() incremental a cada tick.
  React.useEffect(() => {
    const a = api.current;
    if (!a) return;
    if (bars.length === 0) {
      a.candles.setData([]);
      a.volume.setData([]);
      // Série vazia (carregando) não conta como aplicada: os primeiros dados reais precisam reenquadrar.
      applied.current = null;
      return;
    }
    const prev = applied.current;
    const first = bars[0]!.time;
    const last = bars[bars.length - 1]!;
    const sameSeries = prev && prev.key === seriesKey && prev.first === first;
    if (sameSeries && prev.length === bars.length) {
      a.candles.update({ time: toTime(last.time), open: last.open, high: last.high, low: last.low, close: last.close, color: a.palette.accent, wickColor: a.palette.accent, borderColor: a.palette.accent });
      a.volume.update({ time: toTime(last.time), value: last.volume ?? 0, color: last.close >= last.open ? a.palette.volUp : a.palette.volDown });
      return;
    }
    const { candles, volume } = toSeriesData(bars, a.palette);
    a.candles.setData(candles);
    a.volume.setData(showVolume ? volume : []);
    if (!prev || prev.key !== seriesKey) {
      a.chart.timeScale().fitContent();
      fittedAt.current = performance.now();
    }
    applied.current = { key: seriesKey, first, length: bars.length };
  }, [bars, seriesKey, showVolume, ready]);

  // Indicadores (linhas)
  React.useEffect(() => {
    const a = api.current;
    if (!a) return;
    const wanted = new Set(lines.map((l) => l.id));
    for (const [id, s] of a.lines) if (!wanted.has(id)) { a.chart.removeSeries(s); a.lines.delete(id); }
    for (const l of lines) {
      let s = a.lines.get(l.id);
      const color = l.tone === "sand" ? a.palette.maFast : a.palette.maSlow;
      if (!s) {
        s = a.chart.addSeries(a.lwc.LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
        a.lines.set(l.id, s);
      } else s.applyOptions({ color });
      s.setData(l.points.map((pt) => ({ time: toTime(pt.time), value: pt.value })));
    }
  }, [lines, ready]);

  // Níveis Claritas (tracejado 5·4 → LineStyle.Dashed) e marcadores de eventos
  React.useEffect(() => {
    const a = api.current;
    if (!a) return;
    for (const pl of a.priceLines) a.candles.removePriceLine(pl);
    const toneColor = (t?: ChartLevel["tone"]) => (t === "up" ? a.palette.upLine : t === "down" ? a.palette.downLine : t === "info" ? a.palette.info : a.palette.accent);
    a.priceLines = levels.map((lv) =>
      a.candles.createPriceLine({ price: lv.price, color: toneColor(lv.tone), lineWidth: 1, lineStyle: a.lwc.LineStyle.Dashed, axisLabelVisible: true, title: lv.label.toUpperCase() }),
    );
    const ms: SeriesMarker<Time>[] = markers
      .map((m) => ({
        id: m.id,
        time: toTime(m.time),
        position: m.side === "buy" ? ("belowBar" as const) : ("aboveBar" as const),
        shape: m.side === "buy" ? ("arrowUp" as const) : m.side === "sell" ? ("arrowDown" as const) : ("circle" as const),
        color: m.side === "buy" ? a.palette.upLine : m.side === "sell" ? a.palette.downLine : a.palette.accent,
        text: m.label.toUpperCase(),
      }))
      .sort((x, y) => (x.time as number) - (y.time as number));
    a.markers.setMarkers(ms);
  }, [levels, markers, ready]);

  const shown = hover ?? bars[bars.length - 1] ?? null;
  const chg = shown ? ((shown.close - shown.open) / shown.open) * 100 : 0;

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height, minHeight: 0, borderRadius: "var(--radius-md)", overflow: "hidden", ...style }}>
      {watermark && (
        <div aria-hidden style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", font: "400 clamp(28px, 6vw, 72px)/1 var(--font-serif)", color: "var(--chart-watermark)" }}>{watermark}</div>
      )}
      <div ref={host} style={{ position: "absolute", inset: "28px 0 0 0" }} />
      <div aria-live="off" style={{ position: "absolute", top: 6, left: 10, right: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", font: "400 11px/1.2 var(--font-mono)", color: "var(--text-tertiary)", pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}>
        {shown && (
          <>
            {([["A", shown.open], ["M", shown.high], ["m", shown.low], ["F", shown.close]] as const).map(([k, val]) => (
              <span key={k}>{k} <span style={{ color: "var(--text-secondary)" }}>{fmt.num.format(val)}</span></span>
            ))}
            <span style={{ color: chg >= 0 ? "var(--market-up-text)" : "var(--market-down-text)" }}>{chg >= 0 ? "+" : "−"}{fmt.num.format(Math.abs(chg)).replace(/(,\d{2})\d*$/, "$1")}%</span>
            {unit && <span>{unit}</span>}
          </>
        )}
        {lines.map((l) => <span key={l.id} style={{ color: l.tone === "sand" ? "var(--chart-ma-fast)" : "var(--chart-ma-slow)" }}>{l.label}</span>)}
      </div>
      {overlay && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24 }}>{overlay}</div>}
    </div>
  );
}
