"use client";

import * as React from "react";
import { toChartNumber, type Analysis, type Candle, type Quote } from "@claritas/contracts";
import { FlowArea, MetricRow, Panel, SentimentGauge } from "@/design-system";
import { formatCompact, formatPrice, formatTime } from "@/lib/market/presentation";
import { UnavailableNote, UnavailablePanel } from "./Unavailable";
import { eventTone, formatIndicator } from "./AnalysisRail";

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel eyebrow={title} padding="var(--space-2) var(--space-6) var(--space-6)" style={{ flex: 1, minWidth: 0, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column" }}>
      {children}
    </Panel>
  );
}

/** Posição do último preço dentro da faixa mínima–máxima da janela móvel de 24h (0 = mínima, 100 = máxima). */
export function rangePosition(q: Quote): number | null {
  const last = Number(q.lastPrice), lo = Number(q.lowPrice), hi = Number(q.highPrice);
  if (!(hi > lo)) return null;
  return Math.max(0, Math.min(100, ((last - lo) / (hi - lo)) * 100));
}

function RangeWidget({ quote, decimals }: { quote: Quote | undefined; decimals: number }) {
  const pos = quote ? rangePosition(quote) : null;
  if (!quote || pos === null) return <Widget title="Range 24h"><UnavailableNote title="Aguardando">Cotação 24h ainda não recebida.</UnavailableNote></Widget>;
  const word = pos >= 80 ? "perto da máxima" : pos <= 20 ? "perto da mínima" : "no meio da faixa";
  return (
    <Widget title="Range 24h">
      <div className="grid flex-1 place-items-center">
        <SentimentGauge value={pos} size={190} label={word} minLabel={`Mín ${formatPrice(quote.lowPrice, decimals)}`} maxLabel={`Máx ${formatPrice(quote.highPrice, decimals)}`} />
      </div>
      <span className="text-center font-mono text-xs text-fg-disabled">posição do último preço na faixa da janela móvel de 24h</span>
    </Widget>
  );
}

function VolumeWidget({ candles, unit, interval }: { candles: Candle[]; unit?: string; interval: string }) {
  const recent = candles.slice(-40);
  const data = recent.map((c) => toChartNumber(c.volumeQuote ?? c.volumeBase));
  if (data.length < 3) return <Widget title="Volume por barra"><UnavailableNote title="Aguardando">Candles ainda não carregados.</UnavailableNote></Widget>;
  const total = data.reduce((a, b) => a + b, 0);
  const avg = total / data.length;
  const last = data[data.length - 1]!;
  return (
    <Widget title="Volume por barra">
      <span className="text-xs text-fg-tertiary">Últimas {data.length} barras de {interval}, em {unit ?? "moeda de cotação"}</span>
      <span className="cl-num mb-1.5 mt-2.5 text-accent" style={{ fontSize: "var(--num-l-size)", letterSpacing: "var(--num-l-track)" }}>{formatCompact(total)}</span>
      <FlowArea data={data} height={74} grid />
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="flex justify-between rounded-md bg-raised px-2.5 py-2 text-xs text-fg-tertiary">Média<span className="cl-num text-fg">{formatCompact(avg)}</span></div>
        <div className="flex justify-between rounded-md bg-raised px-2.5 py-2 text-xs text-fg-tertiary">Última<span className="cl-num text-fg">{formatCompact(last)}</span></div>
      </div>
    </Widget>
  );
}

function KeySignals({ analysis, decimals }: { analysis: Analysis | null; decimals: number }) {
  if (!analysis) return <Widget title="Sinais-chave"><UnavailableNote title="Aguardando">Análise ainda não calculada.</UnavailableNote></Widget>;
  const cross = analysis.events.find((e) => e.type.startsWith("ema"));
  const brk = analysis.events.find((e) => e.type.startsWith("breakout"));
  const rel = analysis.indicators.find((i) => i.id === "rel_volume");
  const state = analysis.regime.state;
  return (
    <Widget title="Sinais-chave">
      <MetricRow dense icon="activity" label="Regime de médias" value={state === "alta" ? "Alta" : state === "baixa" ? "Baixa" : state === "indefinido" ? "Indefinido" : "—"} tone={state === "alta" ? "up" : state === "baixa" ? "down" : "muted"} />
      <MetricRow dense icon="layers" label="Último cruzamento EMA" value={cross ? `${eventTone(cross) === "up" ? "↑" : "↓"} ${formatTime(cross.openTimeMs, false)}` : "nenhum"} tone="sand" />
      <MetricRow dense icon="target" label="Último rompimento" value={brk ? `${eventTone(brk) === "up" ? "↑" : "↓"} ${formatTime(brk.openTimeMs, false)}` : "nenhum"} tone="sand" />
      <MetricRow dense icon="chart-column" label="Volume relativo" value={rel ? formatIndicator(rel, decimals) : "—"} tone="neutral" style={{ borderBottom: 0 }} />
    </Widget>
  );
}

export function Widgets({ quote, candles, analysis, decimals, unit, interval }: { quote: Quote | undefined; candles: Candle[]; analysis: Analysis | null; decimals: number; unit?: string; interval: string }) {
  return (
    <>
      <RangeWidget quote={quote} decimals={decimals} />
      <VolumeWidget candles={candles} unit={unit} interval={interval} />
      <UnavailablePanel eyebrow="Distribuição de fechamento" reason="Probabilidade de fechamento exige modelo calibrado e validado — não exibida para não sugerir previsão." />
      <KeySignals analysis={analysis} decimals={decimals} />
    </>
  );
}
