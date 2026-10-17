"use client";

import * as React from "react";
import type { MarketStatus, Quote } from "@claritas/contracts";
import { marketApi } from "../api/client";
import { getStreamClient } from "./stream-client";

export interface QuotesState {
  quotes: Record<string, Quote>;
  /** Pior status entre os símbolos assinados (se algum está stale, o conjunto não está "ao vivo"). */
  status: MarketStatus;
  error: boolean;
}

const RANK: Record<MarketStatus, number> = { live: 0, connecting: 1, stale: 2, reconnecting: 3, offline: 4 };

/** Cotações 24h reais: snapshot REST + miniTicker pelo WebSocket Claritas. */
export function useQuotes(symbols: string[]): QuotesState {
  const list = React.useMemo(() => [...new Set(symbols)].sort(), [symbols]);
  const keyStr = list.join(",");
  const [quotes, setQuotes] = React.useState<Record<string, Quote>>({});
  const [statuses, setStatuses] = React.useState<Record<string, MarketStatus>>({});
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (list.length === 0) return;
    const abort = new AbortController();
    let alive = true;
    marketApi
      .quotes(list, abort.signal)
      .then((env) => {
        if (!alive) return;
        setError(false);
        // Snapshot REST só preenche o que o stream ainda não trouxe (o stream é mais recente).
        setQuotes((q) => ({ ...Object.fromEntries(env.data.map((x) => [x.symbol, x])), ...q }));
      })
      .catch((err: unknown) => {
        if (alive && (err as Error).name !== "AbortError") setError(true);
      });
    const client = getStreamClient();
    const offs = list.map((s) =>
      client.subscribeQuote(s, {
        onQuote: (m) => alive && setQuotes((q) => ({ ...q, [m.data.symbol]: m.data })),
        onStatus: (f) => alive && setStatuses((st) => ({ ...st, [f.symbol]: f.status })),
      }),
    );
    return () => {
      alive = false;
      abort.abort();
      offs.forEach((off) => off());
    };
    // keyStr representa `list` de forma estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);

  const values = list.map((s) => statuses[s] ?? "connecting");
  const status = values.reduce<MarketStatus>((worst, s) => (RANK[s] > RANK[worst] ? s : worst), "live");
  return { quotes, status: list.length ? status : "connecting", error };
}
