"use client";

import * as React from "react";
import { toChartNumber } from "@claritas/contracts";
import { Switch, type ChartLevel, type ChartLine, type ChartMarker } from "@/design-system";
import { displayDecimals } from "@/lib/market/presentation";
import { useAnalysis } from "@/lib/market/use-analysis";
import { useAsset } from "@/lib/market/use-assets";
import { useLiveCandles } from "@/lib/market/use-live-candles";
import { useQuotes } from "@/lib/market/use-quotes";
import { useSelection } from "@/lib/market/use-selection";
import { AnalysisRail, eventTone } from "./AnalysisRail";
import { LiveDesk } from "./LiveDesk";
import { Widgets } from "./Widgets";

/** Pregão ao Vivo: gráfico real + leitura determinística + widgets com métricas reais. */
export function LiveDeskScreen() {
  const { symbol, interval } = useSelection();
  const live = useLiveCandles(symbol, interval);
  const asset = useAsset(symbol);
  const quoteSymbols = React.useMemo(() => [symbol], [symbol]);
  const { quotes } = useQuotes(quoteSymbols);
  const quote = quotes[symbol];
  const [showAnalysis, setShowAnalysis] = React.useState(true);

  // A análise só é recalculada quando FECHA uma barra (não a cada tick).
  const lastClosed = React.useMemo(() => {
    for (let i = live.candles.length - 1; i >= 0; i--) if (live.candles[i]!.isClosed) return live.candles[i]!.openTimeMs;
    return null;
  }, [live.candles]);
  const { analysis, loading, error } = useAnalysis(symbol, interval, live.seriesKey === `${symbol}:${interval}` ? lastClosed : null);

  const lastPrice = live.candles.length ? toChartNumber(live.candles[live.candles.length - 1]!.close) : undefined;
  const decimals = displayDecimals(lastPrice, asset?.pricePrecision);

  // Depende só da 1ª barra da série: as sobreposições NÃO são recalculadas a cada tick.
  const firstBar = live.candles[0]?.openTimeMs ?? 0;
  const overlays = React.useMemo(() => {
    if (!analysis || !showAnalysis) return undefined;
    const lines: ChartLine[] = [
      { id: "ema9", label: "EMA9", tone: "sand", points: (analysis.series.ema9 ?? []).map((p) => ({ time: p.t, value: Number(p.v) })) },
      { id: "ema21", label: "EMA21", tone: "ink", points: (analysis.series.ema21 ?? []).map((p) => ({ time: p.t, value: Number(p.v) })) },
    ];
    const levels: ChartLevel[] = analysis.levels.map((l) => ({ id: l.id, price: Number(l.price), label: l.label, tone: "sand" }));
    const markers: ChartMarker[] = analysis.events
      .filter((e) => e.openTimeMs >= firstBar)
      // Só os mais recentes, com rótulo curto: o preço precisa continuar legível.
      .slice(0, 6)
      .map((e) => ({ id: e.id, time: e.openTimeMs, side: e.type.startsWith("ema") ? (eventTone(e) === "up" ? "buy" : "sell") : "info", label: e.type.startsWith("ema") ? "×" : eventTone(e) === "up" ? "Máx" : "Mín" }));
    return { lines, levels, markers };
  }, [analysis, showAnalysis, firstBar]);

  return (
    <LiveDesk
      live={live}
      overlays={overlays}
      footerExtra={<Switch size="sm" checked={showAnalysis} onChange={setShowAnalysis} label={<span className="font-mono text-xs uppercase tracking-wider text-fg-tertiary">Análise no gráfico</span>} />}
      rail={<AnalysisRail analysis={analysis} loading={loading} error={error} decimals={decimals} unit={asset?.quoteAsset} />}
      widgets={<Widgets quote={quote} candles={live.candles} analysis={analysis} decimals={decimals} unit={asset?.quoteAsset} interval={interval} />}
    />
  );
}
