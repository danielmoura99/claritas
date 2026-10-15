"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Report } from "@claritas/contracts";
import { Badge, Delta, Input, MarketChart, Panel, SegmentedControl, Select, SignalCard, type ChartMarker } from "@/design-system";
import { describeError, reportApi } from "@/lib/api/client";
import { candleToBar } from "@/lib/market/chart-adapter";
import { displayDecimals, formatCompact, formatPrice } from "@/lib/market/presentation";
import { useAsset } from "@/lib/market/use-assets";
import { useSelection } from "@/lib/market/use-selection";
import { SymbolPicker } from "./SymbolPicker";
import { UnavailableNote } from "./Unavailable";
import { eventTone } from "./AnalysisRail";

type Tz = "America/Sao_Paulo" | "UTC";

const pctText = (v: string | number, signed = true) => {
  const n = Number(v);
  const s = Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return signed ? `${n > 0 ? "+" : n < 0 ? "−" : ""}${s}%` : `${s}%`;
};

const fmtWhen = (ms: number, tz: Tz) =>
  new Date(ms).toLocaleString("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Manchete determinística: só fatos calculados (variação, faixa, regime ao fim). */
function headline(r: Report, decimals: number) {
  const pct = Number(r.change.pct);
  const verb = pct > 0 ? "sobe" : pct < 0 ? "cai" : "fica estável";
  const tail =
    r.regimeAtEnd === "alta" ? "terminando com as médias em configuração de alta." : r.regimeAtEnd === "baixa" ? "terminando com as médias em configuração de baixa." : r.regimeAtEnd === "indefinido" ? "sem configuração definida das médias ao fim." : "";
  return { lead: `${r.symbol} ${verb} ${pct === 0 ? "" : pctText(Math.abs(pct), false) + " "}no período, entre ${formatPrice(r.ohlcv.low, decimals)} e ${formatPrice(r.ohlcv.high, decimals)},`, tail };
}

export function ReportScreen() {
  const router = useRouter();
  const { symbol, setSymbol, hrefWith } = useSelection();
  const asset = useAsset(symbol);
  const [windowKind, setWindowKind] = React.useState<"rolling_24h" | "day">("rolling_24h");
  const [tz, setTz] = React.useState<Tz>("America/Sao_Paulo");
  const [date, setDate] = React.useState("");
  const [report, setReport] = React.useState<Report | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const today = React.useMemo(() => (typeof window === "undefined" ? "" : new Date().toLocaleDateString("en-CA", { timeZone: tz })), [tz]);
  const effectiveDate = date || today;
  const requestKey = `${symbol}|${windowKind}|${windowKind === "day" ? effectiveDate : ""}|${tz}`;
  const [shownKey, setShownKey] = React.useState(requestKey);
  if (shownKey !== requestKey) {
    setShownKey(requestKey);
    setLoading(true);
    setError(null);
  }

  React.useEffect(() => {
    if (windowKind === "day" && !effectiveDate) return;
    const abort = new AbortController();
    reportApi
      .get({ symbol, window: windowKind, date: windowKind === "day" ? effectiveDate : undefined, tz }, abort.signal)
      .then((env) => {
        if (env.data.symbol !== symbol) return;
        setReport(env.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setError(describeError(err));
        setLoading(false);
      });
    return () => abort.abort();
  }, [symbol, windowKind, effectiveDate, tz]);

  const r = report && report.symbol === symbol ? report : null;
  const decimals = displayDecimals(r ? Number(r.ohlcv.close) : undefined, asset?.pricePrecision);
  const bars = React.useMemo(() => (r ? r.candles.map(candleToBar) : []), [r]);
  const markers: ChartMarker[] = React.useMemo(
    () => (r ? r.events.slice(0, 6).map((e) => ({ id: e.id, time: e.openTimeMs, side: e.type.startsWith("ema") ? (eventTone(e) === "up" ? "buy" : "sell") : "info", label: e.type.startsWith("ema") ? "×" : eventTone(e) === "up" ? "Máx" : "Mín" })) : []),
    [r],
  );
  const h = r ? headline(r, decimals) : null;
  const kpis = r
    ? [
        { k: "Variação", v: pctText(r.change.pct), d: `${Number(r.change.abs) >= 0 ? "+" : "−"}${formatPrice(Math.abs(Number(r.change.abs)), decimals)} ${asset?.quoteAsset ?? ""}`, tone: Number(r.change.pct) >= 0 ? "up" : "down" },
        { k: "Volume negociado", v: formatCompact(Number(r.ohlcv.volumeQuote)), d: `${asset?.quoteAsset ?? ""} · ${r.ohlcv.trades.toLocaleString("pt-BR")} negócios`, tone: null },
        { k: "Amplitude", v: pctText(r.rangePct, false), d: `máx ${fmtWhen(r.highTimeMs, tz)} · mín ${fmtWhen(r.lowTimeMs, tz)}`, tone: null },
        { k: "Volatilidade realizada", v: r.realizedVolPct ? pctText(r.realizedVolPct, false) : "—", d: `maior queda ${pctText(r.maxDrawdownPct, false)} · maior alta ${pctText(r.maxRunupPct, false)}`, tone: "sand" },
      ]
    : [];

  return (
    <div className="min-h-0 w-full flex-1 overflow-auto">
      <div className="grid max-w-[82.5rem] grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_21.25rem]">
        <Panel padding="var(--space-9)" style={{ gridColumn: "1 / -1" }}>
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="sand" dot>Resumo do período</Badge>
                <span className="font-mono text-xs text-fg-tertiary">
                  {r ? `${r.window.label}${r.window.partial ? " · parcial" : ""} · ${r.bars} barras de ${r.barInterval} · Binance Spot` : "carregando…"}
                </span>
              </div>
              {h ? (
                <h1 key={requestKey} className="m-0 max-w-[51.25rem] font-serif text-fg" style={{ font: "400 var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)", textWrap: "pretty", animation: "cl-fade 500ms var(--ease-out)" }}>
                  {h.lead} <i className="text-accent">{h.tail}</i>
                </h1>
              ) : (
                <h1 className="m-0 font-serif text-4xl text-fg-disabled">{error ? "Resumo indisponível" : "Calculando o resumo…"}</h1>
              )}
              {r && (
                <p className="m-0 max-w-[45rem] text-base leading-relaxed text-fg-secondary">
                  Abriu a {formatPrice(r.ohlcv.open, decimals)} e fechou a {formatPrice(r.ohlcv.close, decimals)} {asset?.quoteAsset}. Máxima às {fmtWhen(r.highTimeMs, tz)} e mínima às {fmtWhen(r.lowTimeMs, tz)} ({tz === "UTC" ? "UTC" : "Brasília"}). {r.events.length > 0 ? `${r.events.length} evento(s) de regra na janela.` : "Nenhum evento de regra na janela."}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-72">
              <SymbolPicker symbol={symbol} asset={asset} onSelect={setSymbol} />
              <SegmentedControl size="sm" fullWidth mono={false} options={[{ value: "rolling_24h", label: "24h móveis" }, { value: "day", label: "Dia" }]} value={windowKind} onChange={(v) => setWindowKind(v as "rolling_24h" | "day")} />
              {windowKind === "day" && <Input type="date" size="sm" label="Data" value={effectiveDate} max={today} onChange={(e) => setDate(e.target.value)} />}
              <Select size="sm" label="Fuso" value={tz} onChange={(v) => setTz(v as Tz)} options={[{ value: "America/Sao_Paulo", label: "Brasília (UTC−3)" }, { value: "UTC", label: "UTC" }]} />
            </div>
          </div>
          {error && <div className="mt-6"><UnavailableNote title="Sem resumo">{error}</UnavailableNote></div>}
          {r && (
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-line-subtle sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((x) => (
                <div key={x.k} className="flex flex-col gap-2 bg-inset px-4.5 py-4">
                  <span className="cl-label">{x.k}</span>
                  <span className={`cl-num ${x.tone === "sand" ? "text-accent" : x.tone === "up" ? "text-up-text" : x.tone === "down" ? "text-down-text" : "text-fg"}`} style={{ fontSize: "var(--num-l-size)", letterSpacing: "var(--num-l-track)" }}>{x.v}</span>
                  <span className="font-mono text-xs text-fg-tertiary">{x.d}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel eyebrow={`${symbol} · ${r?.barInterval ?? "15m"}`} title="O período em uma tela" padding="var(--space-4)">
          <MarketChart seriesKey={requestKey} bars={bars} decimals={decimals} unit={asset?.quoteAsset} height={360} timeZone={tz} markers={markers}
            levels={r ? [{ id: "hi", price: Number(r.ohlcv.high), label: "Máx período", tone: "sand" }, { id: "lo", price: Number(r.ohlcv.low), label: "Mín período", tone: "sand" }] : []}
            watermark={symbol} overlay={loading && !r ? <span className="font-mono text-xs text-fg-tertiary">carregando candles reais do período…</span> : undefined} />
        </Panel>
        <Panel eyebrow="Destaques" title="Maiores altas e baixas 24h" padding={false}>
          {r?.movers ? (
            <>
              {[...r.movers.gainers, ...r.movers.losers].map((m, i) => (
                <button key={m.symbol + i} type="button" onClick={() => router.push(hrefWith("/", { symbol: m.symbol }))}
                  className={`grid h-11.5 w-full cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-3 border-0 bg-transparent px-4 text-left hover:bg-hover ${i === 3 ? "border-t border-line" : i ? "border-t border-line-subtle" : ""}`}>
                  <span className="font-mono text-xs font-semibold text-fg">{m.symbol}</span>
                  <span className="cl-num text-xs text-fg-secondary">{formatPrice(m.lastPrice, displayDecimals(Number(m.lastPrice)))}</span>
                  <Delta value={Number(m.changePct)} size="sm" />
                </button>
              ))}
              <p className="m-0 px-4 py-2 font-mono text-xs text-fg-disabled">{r.movers.universe} · variação 24h móvel</p>
            </>
          ) : (
            <div className="p-4"><UnavailableNote title={r ? "Só em 24h móveis" : "Aguardando"}>{r ? "Altas e baixas por ativo usam o ticker de 24h móveis da Binance; para um dia de calendário seria preciso varrer o histórico de cada ativo." : "Carregando…"}</UnavailableNote></div>
          )}
        </Panel>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:col-span-2">
          {r && r.events.length === 0 && <div className="md:col-span-3"><UnavailableNote title="Sem eventos">Nenhum cruzamento EMA9×EMA21 ou rompimento de Donchian 20 dentro da janela.</UnavailableNote></div>}
          {r?.events.slice(0, 3).map((e) => (
            <SignalCard key={e.id} kind="pattern" symbol={symbol} timeframe={r.barInterval} time={fmtWhen(e.openTimeMs, tz)} title={e.title} tags={[eventTone(e) === "up" ? "Alta" : "Baixa", e.type.startsWith("ema") ? "Médias" : "Donchian"]} />
          ))}
        </div>
        {r && (
          <Panel eyebrow="Método" title="Como os números foram calculados" style={{ gridColumn: "1 / -1" }}>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {r.method.map((m) => <li key={m} className="font-mono text-xs leading-relaxed text-fg-tertiary">· {m}</li>)}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
