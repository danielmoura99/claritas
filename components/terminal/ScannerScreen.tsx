"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Interval, ScannerResult, ScannerRow } from "@claritas/contracts";
import { Badge, Button, Checkbox, Delta, LiveIndicator, Panel, PriceTicker, SegmentedControl, Select, Sparkline, type BadgeTone } from "@/design-system";
import { describeError, scannerApi } from "@/lib/api/client";
import { displayDecimals, formatCompact, formatTime } from "@/lib/market/presentation";
import { useSelection } from "@/lib/market/use-selection";
import { applyCriteria, CRITERIA, type Criterion } from "@/lib/market/scanner-criteria";

const LBL = "cl-label";

import { UnavailableNote } from "./Unavailable";

const TIMEFRAMES: Interval[] = ["5m", "15m", "1h", "4h"];

function setupBadge(r: ScannerRow): { label: string; tone: BadgeTone } {
  const ev = r.lastEvent;
  if (ev && ev.barsAgo < 5) {
    const up = ev.type === "ema_cross_up" || ev.type === "breakout_high";
    return { label: ev.type.startsWith("ema") ? `Cruzamento ${up ? "↑" : "↓"}` : `Rompimento ${up ? "↑" : "↓"}`, tone: up ? "up" : "down" };
  }
  if (r.regime === "alta") return { label: "Regime de alta", tone: "up" };
  if (r.regime === "baixa") return { label: "Regime de baixa", tone: "down" };
  return { label: "Indefinido", tone: "neutral" };
}

export function ScannerScreen() {
  const router = useRouter();
  const { hrefWith } = useSelection();
  const [size, setSize] = React.useState(30);
  const [timeframe, setTimeframe] = React.useState<Interval>("15m");
  const [selected, setSelected] = React.useState<Set<Criterion>>(new Set());
  const [minVolume, setMinVolume] = React.useState(0);
  const [result, setResult] = React.useState<ScannerResult | null>(null);
  const [running, setRunning] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [runTick, setRunTick] = React.useState(0);
  const [hoverRow, setHoverRow] = React.useState<string | null>(null);

  const startScan = () => {
    setRunning(true);
    setError(null);
    setRunTick((t) => t + 1);
  };

  React.useEffect(() => {
    const abort = new AbortController();
    scannerApi
      .scan(size, timeframe, abort.signal)
      .then((env) => {
        setResult(env.data);
        setRunning(false);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setError(describeError(err));
        setRunning(false);
      });
    return () => abort.abort();
  }, [size, timeframe, runTick]);

  const rows = result && result.timeframe === timeframe ? applyCriteria(result.results, selected, result.params.recentBars, minVolume) : [];
  const toggle = (id: Criterion, on: boolean) => setSelected((s) => {
    const n = new Set(s);
    if (on) n.add(id);
    else n.delete(id);
    return n;
  });
  const col = "grid-cols-[minmax(0,1.3fr)_7rem_6rem_5.5rem_minmax(0,1.2fr)_5.5rem_5.5rem]";

  return (
    <div className="flex w-full flex-col gap-2 lg:min-h-0 lg:flex-1 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col lg:w-65">
      <Panel eyebrow="Critérios" title="Scanner" style={{ flex: 1, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column", gap: 18 }}
        footer={<Button variant="primary" icon="radar" fullWidth loading={running} onClick={startScan}>{running ? "Varrendo…" : "Varrer novamente"}</Button>}>
        <Select label="Universo" value={String(size)} onChange={(v) => { setSize(Number(v)); setRunning(true); }}
          options={[{ value: "30", label: "Top 30 USDT por volume 24h" }, { value: "50", label: "Top 50 USDT por volume 24h" }]} />
        <div className="flex flex-col gap-2">
          <span className={LBL}>Tempo gráfico</span>
          <SegmentedControl size="sm" fullWidth options={TIMEFRAMES} value={timeframe} onChange={(v) => { setTimeframe(v as Interval); setRunning(true); }} />
        </div>
        <div className="flex flex-col gap-3">
          <span className={LBL}>Setups (todos marcados devem valer)</span>
          {CRITERIA.map((c) => <Checkbox key={c.id} label={c.label} description={c.description} checked={selected.has(c.id)} onChange={(on) => toggle(c.id, on)} />)}
        </div>
        <Checkbox label="Só volume 24h ≥ 100 mi" description="Em moeda de cotação (USDT)" checked={minVolume > 0} onChange={(on) => setMinVolume(on ? 100_000_000 : 0)} />
      </Panel>
      </div>
      <div className="flex min-h-[80vh] min-w-0 flex-1 flex-col lg:min-h-0">
      <Panel padding={false} style={{ flex: 1, minWidth: 0, minHeight: 0 }} bodyStyle={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="relative overflow-hidden border-b border-line-subtle px-5 pb-4 pt-4.5">
          {/* Feixe de varredura só enquanto a varredura real está em andamento. */}
          {running && <div className="pointer-events-none absolute inset-y-0 w-1/5 border-r" style={{ background: "var(--scan-beam)", borderColor: "var(--scan-edge)", animation: "cl-scan 1.6s linear infinite" }} />}
          <div className="relative flex flex-wrap items-end gap-5">
            <div className="flex flex-1 flex-col gap-2">
              <LiveIndicator status={running ? "analyzing" : error ? "closed" : "pre"} label={running ? `Varrendo top ${size} USDT · ${timeframe}` : error ? "Varredura falhou" : "Varredura concluída"}
                detail={result && !running ? `${result.results.length}/${result.universe.size} ativos · ${formatTime(Date.parse(result.scannedAt))}` : undefined} />
              <span className="font-serif text-3xl leading-tight text-fg">{running && !result ? "Lendo o universo…" : `${rows.length} ${rows.length === 1 ? "ativo atende" : "ativos atendem"} aos critérios`}</span>
            </div>
            <span className="cl-num text-accent" style={{ fontSize: "var(--num-l-size)", letterSpacing: "var(--num-l-track)" }}>{result ? `${rows.length}/${result.results.length}` : "—"}</span>
          </div>
          {result && result.skipped.length > 0 && <p className="relative m-0 mt-2 font-mono text-xs text-fg-tertiary">{result.skipped.length} ativo(s) sem dados nesta varredura: {result.skipped.map((s) => s.symbol).join(", ")}</p>}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="min-w-[52rem]">
            <div className={`grid ${col} gap-4 border-b border-line-subtle px-5 py-2.5`}>
              {["Ativo", `Últimas 30 · ${timeframe}`, "Último", "Var. 24h", "Setup", "Vol. rel.", "Evento"].map((h, i) => (
                <span key={h} className={`${LBL} ${i === 2 || i === 3 || i >= 5 ? "text-right" : ""}`}>{h}</span>
              ))}
            </div>
            {error && <div className="p-5"><UnavailableNote title="Sem resultados">{error}</UnavailableNote></div>}
            {!error && result && rows.length === 0 && !running && <div className="p-5"><UnavailableNote title="Nenhum ativo">Nenhum ativo do universo atende a todos os critérios marcados agora. Desmarque algum critério ou mude o tempo gráfico.</UnavailableNote></div>}
            {rows.map((r) => {
              const decimals = displayDecimals(Number(r.lastPrice), r.pricePrecision);
              const badge = setupBadge(r);
              const closes = r.closes.map(Number);
              return (
                <div key={r.symbol} role="button" tabIndex={0} onClick={() => router.push(hrefWith("/", { symbol: r.symbol, interval: timeframe }))}
                  onKeyDown={(e) => { if (e.key === "Enter") router.push(hrefWith("/", { symbol: r.symbol, interval: timeframe })); }}
                  onMouseEnter={() => setHoverRow(r.symbol)} onMouseLeave={() => setHoverRow(null)}
                  className={`grid ${col} h-13 cursor-pointer items-center gap-4 border-b border-line-subtle px-5 ${hoverRow === r.symbol ? "bg-hover" : ""}`} style={{ animation: "cl-rise var(--dur-slow) var(--ease-out)" }}>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-xs font-semibold text-fg">{r.symbol} <span className="font-normal text-fg-disabled">#{r.rank}</span></span>
                    <span className="truncate text-xs text-fg-tertiary">{r.displayName} · vol. {formatCompact(Number(r.quoteVolume24h))}</span>
                  </span>
                  <Sparkline data={closes} width={110} height={26} animate={false} />
                  <span className="text-right"><PriceTicker value={Number(r.lastPrice)} decimals={decimals} size="sm" /></span>
                  <span className="text-right"><Delta value={Number(r.change24hPct)} size="xs" /></span>
                  <span><Badge tone={badge.tone} variant="outline">{badge.label}</Badge></span>
                  <span className="cl-num text-right text-xs text-fg-secondary">{r.relVolume ? `${Number(r.relVolume).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×` : "—"}</span>
                  <span className="text-right font-mono text-xs text-fg-tertiary">{r.lastEvent ? `há ${r.lastEvent.barsAgo} b` : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p className="m-0 border-t border-line-subtle px-5 py-2 font-mono text-xs text-fg-disabled">
          Dados reais Binance Spot · universo por volume 24h · métricas sobre {result?.params.barsAnalyzed ?? 120} barras fechadas · critérios descritivos, não recomendações · clique para abrir no Pregão
        </p>
      </Panel>
      </div>
    </div>
  );
}
