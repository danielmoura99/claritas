"use client";

import * as React from "react";
import { toChartNumber, type Interval } from "@claritas/contracts";
import { Button, Delta, IconButton, LiveIndicator, MarketChart, Panel, PriceTicker, SegmentedControl, type ChartLevel, type ChartLine, type ChartMarker } from "@/design-system";
import { candleToBar } from "@/lib/market/chart-adapter";
import { displayDecimals, feedIndicator, formatPrice, formatTime, TIME_ZONE } from "@/lib/market/presentation";
import { useAsset } from "@/lib/market/use-assets";
import { useLiveCandles } from "@/lib/market/use-live-candles";
import { useQuotes } from "@/lib/market/use-quotes";
import { UI_INTERVALS, useSelection } from "@/lib/market/use-selection";
import { SymbolPicker } from "./SymbolPicker";

export interface ChartOverlays {
  lines?: ChartLine[];
  levels?: ChartLevel[];
  markers?: ChartMarker[];
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="cl-label" style={{ fontSize: "var(--micro-size)" }}>{k}</span>
      <span className="cl-num text-xs text-fg-secondary">{v}</span>
    </span>
  );
}

/** Palco do gráfico: dados reais da API Claritas; nenhum valor sem origem. */
export function ChartStage({ overlays, footerExtra, live }: { overlays?: ChartOverlays; footerExtra?: React.ReactNode; live: ReturnType<typeof useLiveCandles> }) {
  const { symbol, interval, setSymbol, setInterval } = useSelection();
  const asset = useAsset(symbol);
  const quoteSymbols = React.useMemo(() => [symbol], [symbol]);
  const { quotes } = useQuotes(quoteSymbols);
  const quote = quotes[symbol];
  const { candles, seriesKey, loading, error, status, feed, lastUpdateAt, reload } = live;
  const bars = React.useMemo(() => {
    try {
      return candles.map(candleToBar);
    } catch {
      return [];
    }
  }, [candles]);
  const last = candles[candles.length - 1];
  const lastPrice = last ? toChartNumber(last.close) : quote ? toChartNumber(quote.lastPrice) : undefined;
  const decimals = displayDecimals(lastPrice, asset?.pricePrecision);
  const hi = bars.length ? Math.max(...bars.map((b) => b.high)) : undefined;
  const lo = bars.length ? Math.min(...bars.map((b) => b.low)) : undefined;
  const ind = feedIndicator(status);
  const showOverlay = loading || error || bars.length === 0;

  return (
    <Panel padding={false} style={{ flex: 1, minWidth: 0, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pb-2.5 pl-5.5 pr-4 pt-4.5">
        <SymbolPicker symbol={symbol} asset={asset} onSelect={setSymbol} />
        <div className="flex flex-col gap-1.5" aria-live="polite">
          {lastPrice !== undefined ? <PriceTicker value={lastPrice} decimals={decimals} size="lg" weight={400} prefix={asset?.quoteAsset} /> : <span className="cl-num text-fg-disabled" style={{ fontSize: "var(--num-l-size)" }}>—</span>}
          {quote ? (
            <span className="flex items-center gap-2.5">
              <Delta value={toChartNumber(quote.priceChange)} kind="abs" decimals={decimals} size="sm" arrow={false} />
              <Delta value={toChartNumber(quote.priceChangePercent)} size="sm" arrow={false} />
              <span className="cl-label" style={{ fontSize: "var(--micro-size)" }}>24h</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-fg-disabled">variação 24h indisponível</span>
          )}
        </div>
        <div className="flex-1" />
        <SegmentedControl size="sm" options={UI_INTERVALS} value={interval} onChange={(v) => setInterval(v as Interval)} />
        <IconButton icon="refresh-cw" label="Recarregar histórico" size="sm" onClick={reload} />
      </div>
      <div className="min-h-64 flex-1 px-2.5 md:min-h-0">
        <MarketChart
          seriesKey={seriesKey}
          bars={bars}
          decimals={decimals}
          unit={asset?.quoteAsset}
          timeZone={TIME_ZONE}
          height="100%"
          watermark={`${symbol} · ${interval}`}
          lines={overlays?.lines}
          levels={overlays?.levels}
          markers={overlays?.markers}
          overlay={
            showOverlay ? (
              error ? (
                <div className="flex max-w-sm flex-col items-center gap-3 text-center" role="alert">
                  <span className="font-mono text-xs text-down-text">{error}</span>
                  <Button size="sm" icon="refresh-cw" onClick={reload}>Tentar novamente</Button>
                </div>
              ) : loading ? (
                <span className="font-mono text-xs text-fg-tertiary">carregando histórico real de {symbol} · {interval}…</span>
              ) : (
                <span className="font-mono text-xs text-fg-tertiary">sem candles para {symbol} · {interval}</span>
              )
            ) : undefined
          }
        />
      </div>
      <div className="flex min-h-10 flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-line-subtle px-4 py-2">
        <LiveIndicator status={ind.status} label={ind.label} size="sm" detail={feed?.latencyMs != null && status === "live" ? `${Math.max(0, feed.latencyMs)} ms` : undefined} />
        <span className="font-mono text-xs text-fg-tertiary" title={feed?.reason}>
          Binance Spot · atualizado {formatTime(lastUpdateAt)}
          {feed?.reason && status !== "live" ? ` · ${feed.reason}` : ""}
        </span>
        {footerExtra}
        <div className="min-w-2 flex-1" />
        <Stat k={`Máx ${bars.length}`} v={formatPrice(hi, decimals)} />
        <Stat k={`Mín ${bars.length}`} v={formatPrice(lo, decimals)} />
      </div>
    </Panel>
  );
}

/** Pregão ao Vivo — grade do template: gráfico + leitura Claritas (380) / faixa de 4 widgets (260). */
export function LiveDesk({ live, rail, widgets, overlays, footerExtra }: { live: ReturnType<typeof useLiveCandles>; rail: React.ReactNode; widgets: React.ReactNode; overlays?: ChartOverlays; footerExtra?: React.ReactNode }) {
  return (
    // Abaixo de lg os painéis empilham com altura natural (a página rola); em desktop a grade ocupa a viewport.
    <div className="grid w-full min-w-0 grid-cols-1 content-start gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_23.75rem] lg:grid-rows-[minmax(0,1fr)_16.25rem] lg:content-stretch">
      <div className="flex min-h-[60vh] min-w-0 flex-col lg:min-h-0"><ChartStage live={live} overlays={overlays} footerExtra={footerExtra} /></div>
      <div className="flex min-h-80 min-w-0 flex-col lg:min-h-0">{rail}</div>
      <div className="grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-2 lg:min-h-0 lg:auto-rows-auto xl:grid-cols-4">{widgets}</div>
    </div>
  );
}
