"use client";

import * as React from "react";
import { toChartNumber, type MarketAsset } from "@claritas/contracts";
import { Icon, Input, WatchRow } from "@/design-system";
import { useAssetSearch, useFeaturedAssets } from "@/lib/market/use-assets";
import { useQuotes } from "@/lib/market/use-quotes";
import { useWatchlist } from "@/lib/market/use-persistence";

/** Seletor de ativo: a watchlist vive num popover para o gráfico continuar quieto (como no template). */
export function SymbolPicker({ symbol, asset, onSelect, extraSymbols = [] }: { symbol: string; asset: MarketAsset | null; onSelect: (s: string) => void; extraSymbols?: string[] }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const { assets: featured } = useFeaturedAssets();
  const searched = useAssetSearch(q);
  const { watchlist } = useWatchlist();
  // Sem busca: watchlist persistida primeiro, depois os destaques (sem repetir).
  const watchAssets = React.useMemo(() => (watchlist?.items ?? []).map((i) => ({ symbol: i.symbol, displayName: `${i.baseAsset}/${i.quoteAsset}` })), [watchlist]);
  const list: { symbol: string; displayName: string }[] = React.useMemo(
    () => searched ?? [...watchAssets, ...featured.filter((a) => !watchAssets.some((w) => w.symbol === a.symbol))],
    [searched, watchAssets, featured],
  );
  const watchCount = searched ? 0 : watchAssets.length;
  const listSymbols = React.useMemo(() => (open ? [...new Set([...list.map((a) => a.symbol), ...extraSymbols])].slice(0, 30) : []), [open, list, extraSymbols]);
  const { quotes } = useQuotes(listSymbols);

  React.useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((o) => !o)}
        className={`-my-1.5 -ml-1.5 flex items-center gap-2.5 rounded-md border-0 py-1.5 pl-1.5 pr-2.5 text-left ${open ? "bg-hover" : "bg-transparent"} cursor-pointer`}>
        <span className="flex flex-col gap-1.5">
          <span className="font-mono text-lg font-semibold leading-none text-fg">{symbol}</span>
          <span className="whitespace-nowrap text-xs text-fg-tertiary">{asset ? `${asset.baseAsset} / ${asset.quoteAsset} · Binance Spot` : "Binance Spot"}</span>
        </span>
        <Icon name="chevron-down" size={14} color="var(--text-tertiary)" />
      </button>
      {open && (
        <div className="absolute -left-1.5 top-full mt-2.5 w-85 rounded-lg bg-raised p-1.5 shadow-pop" style={{ zIndex: "var(--z-dropdown)", animation: "cl-pop var(--dur-fast) var(--ease-out)" }}>
          <Input icon="search" placeholder="Buscar par Spot (ex.: AVAX)" size="sm" value={q} onChange={(e) => setQ(e.target.value)} autoFocus aria-label="Buscar par" style={{ margin: "var(--space-1) var(--space-1) var(--space-3)" }} />
          <div className="max-h-96 overflow-y-auto" role="listbox">
            {list.map((a, idx) => {
              const quote = quotes[a.symbol];
              const pick = () => { onSelect(a.symbol); setOpen(false); setQ(""); };
              const header = !searched && (idx === 0 || idx === watchCount) ? <div key={`h-${idx}`} className="cl-label px-3.5 pb-1 pt-2.5">{idx < watchCount ? "Watchlist" : "Destaques"}</div> : null;
              // Sem cotação recebida ainda: linha neutra com "—" (nunca um preço fictício).
              if (!quote) {
                return (
                  <React.Fragment key={a.symbol}>{header}
                  <button type="button" onClick={pick} className="flex h-12 w-full cursor-pointer items-center justify-between rounded-md border-0 bg-transparent px-3.5 text-left hover:bg-hover">
                    <span className="flex flex-col gap-1"><span className="font-mono text-xs font-semibold text-fg">{a.symbol}</span><span className="text-xs text-fg-tertiary">{a.displayName}</span></span>
                    <span className="font-mono text-xs text-fg-disabled">—</span>
                  </button>
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={a.symbol}>{header}<WatchRow symbol={a.symbol} name={a.displayName} price={toChartNumber(quote.lastPrice)} change={toChartNumber(quote.priceChangePercent)} selected={a.symbol === symbol} onClick={pick} /></React.Fragment>
              );
            })}
            {list.length === 0 && <div className="px-3 py-4 font-mono text-xs text-fg-tertiary">{q.trim().length >= 2 ? "nenhum par Spot em negociação encontrado" : "carregando ativos…"}</div>}
          </div>
          <p className="m-0 px-3 pb-1 pt-2 font-mono text-fg-disabled" style={{ fontSize: "var(--micro-size)" }}>VARIAÇÃO = JANELA MÓVEL DE 24H</p>
        </div>
      )}
    </div>
  );
}
