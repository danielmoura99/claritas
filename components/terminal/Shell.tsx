"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toChartNumber, type Quote } from "@claritas/contracts";
import { Delta, IconButton, Input, LiveIndicator, PriceTicker, Sparkline, TickerTape, Tooltip, Wordmark, type IconName } from "@/design-system";
import { feedIndicator, displayDecimals } from "@/lib/market/presentation";
import { marketApi } from "@/lib/api/client";
import { useFeaturedAssets } from "@/lib/market/use-assets";
import { useQuotes } from "@/lib/market/use-quotes";
import { useSelection } from "@/lib/market/use-selection";
import { useSparkline } from "@/lib/market/use-sparkline";
import { Clock } from "./Clock";

const NAV: { href: string; icon: IconName; label: string }[] = [
  { href: "/", icon: "chart-candlestick", label: "Pregão ao vivo" },
  { href: "/scanner", icon: "radar", label: "Scanner" },
  { href: "/relatorio", icon: "file-text", label: "Resumo do período" },
];

function MacroQuote({ quote, decimals }: { quote: Quote; decimals: number }) {
  const series = useSparkline(quote.symbol);
  const change = toChartNumber(quote.priceChangePercent);
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-fg-tertiary">{quote.symbol}</span>
          <PriceTicker value={toChartNumber(quote.lastPrice)} decimals={decimals} size="xs" color="var(--text-secondary)" />
        </span>
        <span className="flex items-center gap-1.5">
          <Delta value={change} size="xs" arrow={false} />
          <span className="font-mono text-fg-disabled" style={{ fontSize: "var(--micro-size)" }}>24H</span>
        </span>
      </div>
      {series && <Sparkline data={series} width={64} height={24} color={change >= 0 ? "var(--accent)" : "var(--market-down-text)"} baseline={false} animate={false} area={false} strokeWidth={1.25} />}
    </div>
  );
}

function SearchBox() {
  const [q, setQ] = React.useState("");
  const [notFound, setNotFound] = React.useState(false);
  const { hrefWith } = useSelection();
  const router = useRouter();
  return (
    <form
      className="hidden w-80 md:block"
      onSubmit={async (e) => {
        e.preventDefault();
        const s = q.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (!s) return;
        // Aceita o par completo (ETHUSDT) ou só a base (ETH → melhor correspondência da API).
        const found = await marketApi.assets(s).then((r) => r.data).catch(() => []);
        const target = found.find((a) => a.symbol === s) ?? found[0];
        setNotFound(!target);
        if (target) {
          router.push(hrefWith("/", { symbol: target.symbol }));
          setQ("");
        }
      }}
    >
      <Input icon="search" placeholder="Buscar ativo Binance Spot (ex.: ETH, SOLUSDT)" kbd="↵" size="sm" value={q} onChange={(e) => { setQ(e.target.value); setNotFound(false); }} aria-label="Buscar ativo" error={notFound ? "Nenhum ativo Spot em negociação com esse nome" : undefined} />
    </form>
  );
}

export function TopBar() {
  const { assets } = useFeaturedAssets();
  const macroSymbols = React.useMemo(() => assets.slice(0, 3).map((a) => a.symbol), [assets]);
  const { quotes, status } = useQuotes(macroSymbols);
  const ind = feedIndicator(status);
  return (
    <header className="flex h-15 shrink-0 items-center gap-7 border-b border-line-subtle pl-5 pr-4">
      <Link href="/" className="hover:no-underline" aria-label="Claritas Terminal — início">
        <Wordmark size={22} product="Terminal" />
      </Link>
      <SearchBox />
      <div className="flex-1" />
      <div className="hidden gap-7 xl:flex">
        {assets.slice(0, 3).map((a) => {
          const q = quotes[a.symbol];
          return q ? <MacroQuote key={a.symbol} quote={q} decimals={displayDecimals(Number(q.lastPrice), a.pricePrecision)} /> : null;
        })}
      </div>
      <div className="hidden h-6.5 w-px bg-line xl:block" />
      <LiveIndicator status={ind.status} label={ind.label} detail={<Clock />} />
      <Tooltip content="Dados públicos de mercado da Binance Spot via API Claritas" placement="bottom">
        <span className="cl-label hidden whitespace-nowrap lg:inline">Binance Spot</span>
      </Tooltip>
    </header>
  );
}

export function Rail() {
  const pathname = usePathname();
  const router = useRouter();
  const { hrefWith } = useSelection();
  return (
    <nav aria-label="Telas" className="hidden w-14 shrink-0 flex-col items-center gap-1.5 border-r border-line-subtle py-3 md:flex">
      {NAV.map((n) => (
        <IconButton key={n.href} icon={n.icon} label={n.label} active={pathname === n.href} onClick={() => router.push(hrefWith(n.href))} />
      ))}
      <div className="flex-1" />
      <IconButton icon="layers" label="Design system" onClick={() => router.push("/design-system")} />
    </nav>
  );
}

/** Navegação inferior para telas estreitas (o rail some abaixo de md). */
export function MobileNav() {
  const pathname = usePathname();
  const { hrefWith } = useSelection();
  return (
    <nav aria-label="Telas" className="flex shrink-0 justify-around border-t border-line-subtle bg-app py-1.5 md:hidden">
      {NAV.map((n) => (
        <Link key={n.href} href={hrefWith(n.href)} className={`flex flex-col items-center gap-1 px-3 py-1 text-xs hover:no-underline ${pathname === n.href ? "text-accent" : "text-fg-tertiary"}`}>
          {n.label.split(" ")[0]}
        </Link>
      ))}
    </nav>
  );
}

export function Tape() {
  const { assets } = useFeaturedAssets();
  const symbols = React.useMemo(() => assets.map((a) => a.symbol), [assets]);
  const { quotes } = useQuotes(symbols);
  const router = useRouter();
  const { hrefWith } = useSelection();
  const items = assets
    .map((a) => quotes[a.symbol] && { a, q: quotes[a.symbol]! })
    .filter((x): x is { a: (typeof assets)[number]; q: Quote } => Boolean(x))
    .map(({ a, q }) => ({ symbol: a.symbol, price: toChartNumber(q.lastPrice), change: toChartNumber(q.priceChangePercent), decimals: displayDecimals(Number(q.lastPrice), a.pricePrecision) }));
  if (items.length === 0) return <div className="h-7.5 shrink-0 border-t border-line-subtle" />;
  return <TickerTape items={items} speed={70} height={30} onSelect={(s) => router.push(hrefWith("/", { symbol: s }))} style={{ borderBottom: 0, borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: "var(--border-subtle)", background: "transparent" }} />;
}

export function TerminalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app text-fg">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <main className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-auto p-2.5">{children}</main>
      </div>
      <Tape />
      <MobileNav />
    </div>
  );
}
