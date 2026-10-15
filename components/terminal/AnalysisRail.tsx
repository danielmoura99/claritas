"use client";

import * as React from "react";
import type { Analysis, AnalysisEvent, Indicator } from "@claritas/contracts";
import { Badge, LiveIndicator, MetricRow, Panel, SignalCard, Tabs, type IconName } from "@/design-system";
import { formatPrice, formatTime } from "@/lib/market/presentation";
import { UnavailableNote } from "./Unavailable";

const HEADLINE: Record<Analysis["regime"]["state"], string> = {
  alta: "Médias em configuração de alta",
  baixa: "Médias em configuração de baixa",
  indefinido: "Médias sem configuração definida",
  indisponivel: "Barras insuficientes para o regime",
};

const ICON: Record<string, IconName> = {
  change20: "trending-up",
  dist_sma20: "ruler",
  vol20: "activity",
  atr14: "scale",
  rel_volume: "chart-column",
};

const num = (v: string | null | undefined) => (v == null ? null : Number(v));

export function formatIndicator(i: Indicator, decimals: number): string {
  if (i.value == null) return "—";
  const v = Number(i.value);
  if (i.unit === "percent") return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  if (i.unit === "ratio") return `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
  return formatPrice(v, decimals);
}

function relation(a: number | null, b: number | null) {
  if (a == null || b == null) return "sem dado";
  return a > b ? "acima" : a < b ? "abaixo" : "igual";
}

export function eventTone(e: AnalysisEvent): "up" | "down" {
  return e.type === "ema_cross_up" || e.type === "breakout_high" ? "up" : "down";
}

/** Leitura Claritas: só regras determinísticas, com evidência e método visíveis. Nenhuma confiança ou probabilidade. */
export function AnalysisRail({ analysis, loading, error, decimals, unit }: { analysis: Analysis | null; loading: boolean; error: string | null; decimals: number; unit?: string }) {
  const [tab, setTab] = React.useState("sum");
  // Glow sand só quando um evento NOVO aparece (efeito ligado a um evento real, como no template).
  const latestEvent = analysis?.events[0]?.id ?? null;
  const [seenEvent, setSeenEvent] = React.useState<string | null>(null);
  const [glow, setGlow] = React.useState(false);
  if (latestEvent !== seenEvent) {
    setSeenEvent(latestEvent);
    if (seenEvent !== null && latestEvent !== null) setGlow(true);
  }
  React.useEffect(() => {
    if (!glow) return;
    const t = setTimeout(() => setGlow(false), 2_500);
    return () => clearTimeout(t);
  }, [glow]);

  const byId = (id: string) => analysis?.indicators.find((i) => i.id === id);
  const ev = analysis?.regime.evidence;
  const close = num(ev?.close), e9 = num(ev?.ema9), e21 = num(ev?.ema21), s20 = num(ev?.sma20);

  return (
    <Panel padding={false} glow={glow ? "sand" : false} style={{ flex: 1, minWidth: 0, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="flex items-center justify-between px-4.5 pt-4.5">
        <span className="cl-label">Leitura Claritas</span>
        <LiveIndicator status={loading ? "analyzing" : analysis ? "pre" : "closed"} size="sm" label={loading ? "Calculando" : analysis ? "Regras determinísticas" : "Indisponível"} />
      </div>
      {error && !analysis ? (
        <div className="p-4.5"><UnavailableNote title="Sem análise">{error}</UnavailableNote></div>
      ) : !analysis ? (
        <p className="m-0 px-4.5 pt-4 font-mono text-xs text-fg-tertiary">calculando indicadores sobre barras fechadas…</p>
      ) : (
        <>
          <div className="flex items-center gap-3.5 px-4.5 pt-4.5">
            <span className="relative size-3.5 shrink-0 text-accent">
              <span className="absolute inset-0 rounded-full bg-accent" style={{ animation: "cl-breathe 2.4s ease-in-out infinite" }} />
            </span>
            <div className="flex flex-col gap-1.5">
              <span key={analysis.regime.state} className="font-serif text-2xl leading-none text-fg" style={{ animation: "cl-fade 500ms var(--ease-out)" }}>{HEADLINE[analysis.regime.state]}</span>
              <span className="text-xs text-fg-tertiary">{analysis.regime.name} · regra EMA9 × EMA21 + SMA20</span>
            </div>
          </div>
          <p className="m-0 px-4.5 pb-1 pt-3.5 text-sm leading-relaxed text-fg-secondary">
            Fechamento {formatPrice(close ?? undefined, decimals)} {relation(close, s20)} da SMA20 ({formatPrice(s20 ?? undefined, decimals)}); EMA9 ({formatPrice(e9 ?? undefined, decimals)}) {relation(e9, e21)} da EMA21 ({formatPrice(e21 ?? undefined, decimals)}).
            {" "}Base: {analysis.basis.candles} barras fechadas de {analysis.interval}, a última aberta às {formatTime(analysis.basis.lastOpenTimeMs, false)}.
          </p>
          <div className="px-4.5">
            <Tabs size="sm" value={tab} onChange={setTab} items={[{ value: "sum", label: "Resumo" }, { value: "ev", label: "Eventos", count: analysis.events.length }, { value: "method", label: "Método" }]} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4.5 pb-3.5 pt-1.5">
            {tab === "sum" && (
              <>
                {["change20", "dist_sma20", "vol20", "atr14", "rel_volume"].map((id) => {
                  const i = byId(id);
                  if (!i) return null;
                  const v = num(i.value);
                  return (
                    <MetricRow key={id} icon={ICON[id]} label={i.name} value={formatIndicator(i, decimals)} sub={i.unit === "price" ? unit : undefined}
                      tone={i.unit === "percent" && v != null ? (v >= 0 ? "up" : "down") : "neutral"} />
                  );
                })}
                {analysis.levels.map((l) => (
                  <MetricRow key={l.id} icon="crosshair" label={`Nível ${l.label}`} value={formatPrice(Number(l.price), decimals)} sub="canal de Donchian" tone="sand" />
                ))}
              </>
            )}
            {tab === "ev" && (
              <div className="flex flex-col gap-2 pt-1.5">
                {analysis.events.length === 0 && <UnavailableNote title="Sem eventos">Nenhum cruzamento de médias ou rompimento de Donchian na janela carregada.</UnavailableNote>}
                {analysis.events.map((e, i) => (
                  <SignalCard key={e.id} compact={i > 0} kind="pattern" symbol={analysis.symbol} timeframe={analysis.interval} time={formatTime(e.openTimeMs, false)} title={e.title}
                    body={`${e.rule} Fechamento da barra: ${formatPrice(Number(e.price), decimals)} ${unit ?? ""}.`} tags={[eventTone(e) === "up" ? "Alta" : "Baixa", e.type.startsWith("ema") ? "Médias" : "Donchian"]} />
                ))}
              </div>
            )}
            {tab === "method" && (
              <div className="flex flex-col gap-3 pt-2.5">
                <div className="flex flex-col gap-1">
                  <span className="cl-label">{analysis.regime.name}</span>
                  <span className="text-xs leading-relaxed text-fg-secondary">{analysis.regime.rule}</span>
                </div>
                {analysis.indicators.map((i) => (
                  <div key={i.id} className="flex flex-col gap-1 border-t border-line-subtle pt-2.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-medium text-fg">{i.name}</span>
                      <span className="cl-num text-xs text-fg-secondary">{formatIndicator(i, decimals)}</span>
                    </span>
                    <span className="font-mono text-xs text-fg-tertiary">{i.formula}</span>
                    <span className="text-xs text-fg-tertiary">{i.algorithm} · mín. {i.minBars} barras · {i.description}</span>
                  </div>
                ))}
                {analysis.notes.map((n) => <Badge key={n} size="sm">{n}</Badge>)}
                <span className="font-mono text-xs text-fg-disabled">calculado {formatTime(Date.parse(analysis.computedAt))} · fonte Binance Spot</span>
              </div>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
