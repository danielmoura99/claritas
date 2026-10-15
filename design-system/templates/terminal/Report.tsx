"use client";

import * as React from "react";
import { Panel, Badge, Button, Delta, CandleChart, SignalCard, Sparkline, type Annotation } from "../../components";
import type { Quote } from "./data";

export function ReportScreen({ quotes, onOpen }: { quotes: Quote[]; onOpen: (s: string) => void }) {
  const series = React.useMemo(() => CandleChart.generateSeries({ seed: 3, start: 130870, count: 84, vol: 0.0011 }), []);
  const marks: Annotation[] = [
    { id: "m1", type: "marker", t: series[14].t, side: "buy", label: "PETR4 ↑" },
    { id: "m2", type: "marker", t: series[38].t, side: "sell", label: "MGLU3 ↓" },
    { id: "m3", type: "marker", t: series[61].t, side: "buy", label: "WEGE3 ↑" },
    { id: "z1", type: "zone", from: series[30].l, to: series[30].h * 1.0006, label: "Lateralização 12h–14h" },
  ];
  const sorted = [...quotes].sort((a, b) => b.change - a.change);
  const movers = [...sorted.slice(0, 3), ...sorted.slice(-3)];
  const kpis: [string, string, string, "up" | "sand" | null][] = [["Ibovespa", "131.420", "+0,42%", "up"], ["Volume financeiro", "R$ 24,1 bi", "+8% vs. média", null], ["Sinais emitidos", "37", "12 compra · 9 venda", null], ["Taxa de acerto", "68%", "25 de 37 no alvo", "sand"]];
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: "var(--panel-gap)", maxWidth: 1320 }}>
        <Panel padding={28} style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge tone="sand" dot>Relatório Claritas</Badge>
                <span style={{ font: "400 11px/1 var(--font-mono)", color: "var(--text-tertiary)" }}>Sexta, 9 de outubro de 2026 · fechamento 17:00</span>
              </div>
              <h1 style={{ margin: 0, font: "400 var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)", color: "var(--text-primary)", maxWidth: 820, textWrap: "pretty" }}>
                Ibovespa fecha em alta de 0,42%, puxado por petróleo e <i style={{ color: "var(--accent)" }}>uma tarde de rompimentos.</i>
              </h1>
              <p style={{ margin: 0, maxWidth: 720, font: "400 15px/1.6 var(--font-sans)", color: "var(--text-secondary)", textWrap: "pretty" }}>
                A manhã foi lateral, entre 130.900 e 131.200 pontos. Depois das 14h o fluxo comprador voltou com PETR4 e PRIO3, e o índice renovou a máxima às 16:20. Varejo seguiu pressionado pelos juros futuros.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" icon="share-2" size="sm">Compartilhar</Button>
              <Button icon="download" size="sm">Exportar PDF</Button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginTop: 24, background: "var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {kpis.map(([k, v, d, t]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 18px", background: "var(--surface-inset)" }}>
                <span style={{ font: "var(--text-label)", letterSpacing: "var(--label-track)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{k}</span>
                <span style={{ font: "500 26px/1 var(--font-mono)", letterSpacing: "-0.02em", color: t === "sand" ? "var(--accent)" : "var(--text-primary)" }}>{v}</span>
                <span style={{ font: "400 12px/1 var(--font-mono)", color: t === "up" ? "var(--market-up-text)" : "var(--text-tertiary)" }}>{d}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel eyebrow="IBOV · 5m" title="O dia em uma tela" padding={8}>
          <CandleChart data={series} annotations={marks} height={360} decimals={0} ma={[9]} crosshair watermark="IBOV" />
        </Panel>
        <Panel eyebrow="Destaques" title="Maiores altas e baixas" padding={false}>
          {movers.map((q, i) => (
            <div key={q.symbol} onClick={() => onOpen(q.symbol)} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px", alignItems: "center", gap: 10, height: 46, padding: "0 16px", cursor: "pointer", borderTop: i === 3 ? "1px solid var(--border-default)" : i ? "1px solid var(--border-subtle)" : 0 }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 12px/1 var(--font-mono)", color: "var(--text-primary)" }}>{q.symbol}</span>
                <span style={{ font: "var(--text-caption)", color: "var(--text-tertiary)" }}>{q.sector}</span>
              </span>
              <Sparkline data={q.series} width={70} height={22} baseline={false} animate={false} />
              <span style={{ textAlign: "right" }}><Delta value={q.change} size="sm" /></span>
            </div>
          ))}
        </Panel>
        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "var(--panel-gap)" }}>
          <SignalCard kind="buy" symbol="PETR4" timeframe="15m" time="14:05" title="Rompimento de R$ 38,10 — alvo atingido às 16:20" confidence={81} tags={["Alvo ✓"]} />
          <SignalCard kind="pattern" symbol="WEGE3" timeframe="1h" time="15:10" title="Bandeira de alta confirmou no fechamento" confidence={66} tags={["Padrão"]} />
          <SignalCard kind="sell" symbol="MGLU3" timeframe="5m" time="11:42" title="Perda da VWAP — stop acionado, sinal invalidado" confidence={58} tags={["Stop"]} />
        </div>
      </div>
    </div>
  );
}
