"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IntervalSchema, SymbolSchema, type Interval } from "@claritas/contracts";

export const DEFAULT_SYMBOL = "BTCUSDT";
export const DEFAULT_INTERVAL: Interval = "5m";
export const UI_INTERVALS: Interval[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

/** Ativo/intervalo selecionados vivem na URL (?symbol=&interval=): compartilháveis e consistentes entre telas. */
export function useSelection() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const symbolParsed = SymbolSchema.safeParse(params.get("symbol") ?? DEFAULT_SYMBOL);
  const intervalParsed = IntervalSchema.safeParse(params.get("interval") ?? DEFAULT_INTERVAL);
  const symbol = symbolParsed.success ? symbolParsed.data : DEFAULT_SYMBOL;
  const interval = intervalParsed.success ? intervalParsed.data : DEFAULT_INTERVAL;

  const update = React.useCallback(
    (next: { symbol?: string; interval?: Interval }, path = pathname) => {
      const sp = new URLSearchParams(params.toString());
      if (next.symbol) sp.set("symbol", next.symbol);
      if (next.interval) sp.set("interval", next.interval);
      router.replace(`${path}?${sp.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const hrefWith = React.useCallback(
    (path: string, next: { symbol?: string; interval?: Interval } = {}) => {
      const sp = new URLSearchParams({ symbol: next.symbol ?? symbol, interval: next.interval ?? interval });
      return `${path}?${sp.toString()}`;
    },
    [symbol, interval],
  );

  return { symbol, interval, setSymbol: (s: string) => update({ symbol: s }), setInterval: (i: Interval) => update({ interval: i }), update, hrefWith };
}
