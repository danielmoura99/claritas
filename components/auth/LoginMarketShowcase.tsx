"use client";

import { Badge, CandleChart, LiveIndicator, TickerTape, type TapeItem } from "@/design-system";
import { Clock } from "@/components/terminal/Clock";

// ⚠ EXCEÇÃO DOCUMENTADA À REGRA "sem dados fictícios" (ADR-018, decisão do responsável em 16/10/2026):
// este painel é a vitrine ILUSTRATIVA da tela de entrada, fiel ao kit do Claude Design (ui_kits/login →
// MarketSide). Série gerada (seed fixo, determinística), fita B3 e "Leitura Claritas" são mock e existem
// SÓ AQUI. Nenhuma tela do terminal usa estes valores. O guarda services/api/test/unit/no-fake-data.test.ts
// libera este arquivo nominalmente; qualquer outro uso de CandleChart com série gerada falha o teste.

const TAPE: TapeItem[] = [
  { symbol: "IBOV", price: 131420, change: 0.42, decimals: 0 },
  { symbol: "IFIX", price: 3318, change: 0.06, decimals: 0 },
  { symbol: "USDBRL", price: 5.4321, change: -0.21, decimals: 4 },
  { symbol: "DI1F27", price: 13.42, change: 0.05 },
  { symbol: "S&P FUT", price: 5832, change: 0.18, decimals: 0 },
  { symbol: "PETR4", price: 38.42, change: 1.21 },
  { symbol: "VALE3", price: 61.27, change: -0.64 },
  { symbol: "ITUB4", price: 34.18, change: 0.33 },
  { symbol: "WEGE3", price: 52.9, change: 2.08, signal: true },
  { symbol: "BBAS3", price: 27.61, change: -1.12 },
  { symbol: "BBDC4", price: 13.42, change: 0.15 },
  { symbol: "PRIO3", price: 44.8, change: 1.74 },
];

const READING = { tf: "5m", conf: 78, title: "Rompimento confirmado acima da resistência" };

/** Painel de mercado da tela de entrada (≥ 980 px), ilustrativo. */
export function LoginMarketShowcase() {
  return (
    <section aria-label="Vitrine ilustrativa do terminal" className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-l border-line-subtle bg-inset">
      <TickerTape items={TAPE} speed={70} height={36} style={{ borderBottomStyle: "solid", borderBottomWidth: 1, borderBottomColor: "var(--border-subtle)" }} />
      <div className="flex items-start justify-between gap-6 px-12 pt-11">
        <h2 className="m-0 max-w-[32.5rem] text-fg" style={{ font: "var(--weight-regular) var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)", textWrap: "balance" }}>
          O mercado, <span className="italic text-accent">lido</span> enquanto acontece.
        </h2>
        <LiveIndicator status="live" detail={<Clock />} />
      </div>
      <div data-testid="login-showcase-chart" className="min-h-0 flex-1 px-5 pt-2">
        <CandleChart live autoAnalyze field scanning height="100%" window={64} seed={7} start={131.42} decimals={2} ma={[9, 21]} watermark="IBOV · 5m" crosshair={false} />
      </div>
      <div className="absolute bottom-10 left-12 flex w-90 flex-col gap-2.5 rounded-lg border border-line p-4.5 backdrop-blur-md" style={{ background: "color-mix(in srgb, var(--surface-panel) 86%, transparent)" }}>
        <div className="flex items-center gap-2">
          <Badge tone="sand">Leitura Claritas</Badge>
          <span className="font-mono text-xs text-fg-tertiary">{READING.tf} · conf. {READING.conf}%</span>
        </div>
        <span className="text-fg" style={{ font: "var(--weight-regular) var(--display-s-size)/var(--display-s-lh) var(--font-serif)" }}>{READING.title}</span>
      </div>
    </section>
  );
}
