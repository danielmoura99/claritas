"use client";

import * as React from "react";
import type { Interval, Watchlist } from "@claritas/contracts";
import { ApiClientError, persistenceApi } from "../api/client";

// ---------------------------------------------------------------- watchlist

type Listener = (w: Watchlist | null, unavailable: boolean) => void;
const listeners = new Set<Listener>();
let current: Watchlist | null = null;
let unavailable = false;
let loading: Promise<void> | null = null;

const emit = () => listeners.forEach((l) => l(current, unavailable));

function load() {
  loading ??= persistenceApi
    .watchlist()
    .then((w) => {
      current = w;
      unavailable = false;
    })
    .catch(() => {
      // Banco fora/sem configuração: a watchlist some da interface com aviso; nada é inventado.
      unavailable = true;
    })
    .finally(() => {
      loading = null;
      emit();
    });
  return loading;
}

/** Watchlist do usuário da sessão (PostgreSQL via API). Estado compartilhado entre os componentes da aba. */
export function useWatchlist() {
  const [state, setState] = React.useState<{ watchlist: Watchlist | null; unavailable: boolean }>({ watchlist: current, unavailable });
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    const l: Listener = (w, u) => setState({ watchlist: w, unavailable: u });
    listeners.add(l);
    if (!current && !unavailable) void load();
    else l(current, unavailable);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const has = (symbol: string) => Boolean(state.watchlist?.items.some((i) => i.symbol === symbol));
  const toggle = async (symbol: string) => {
    setPending(true);
    try {
      current = has(symbol) ? await persistenceApi.remove(symbol) : await persistenceApi.add(symbol);
      unavailable = false;
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "DB_UNAVAILABLE") unavailable = true;
    } finally {
      setPending(false);
      emit();
    }
  };
  return { ...state, has, toggle, pending };
}

// ---------------------------------------------------------------- preferências

/**
 * Preferências do terminal do usuário (banco): restaura o último ativo/intervalo quando a URL não traz
 * seleção e salva (com atraso) as mudanças seguintes.
 */
export function usePreferenceSync(opts: {
  symbol: string;
  interval: Interval;
  showAnalysis: boolean;
  urlHasSelection: boolean;
  restore: (p: { symbol?: string; interval?: Interval; showAnalysis?: boolean }) => void;
}) {
  const { symbol, interval, showAnalysis, urlHasSelection, restore } = opts;
  const [restored, setRestored] = React.useState(false);
  const restoreRef = React.useRef(restore);
  React.useEffect(() => {
    restoreRef.current = restore;
  });

  React.useEffect(() => {
    const abort = new AbortController();
    persistenceApi
      .getPreferences(abort.signal)
      .then((p) => {
        if (!p) return;
        restoreRef.current({
          symbol: !urlHasSelection && p.symbol ? p.symbol : undefined,
          interval: !urlHasSelection && p.interval ? p.interval : undefined,
          showAnalysis: p.showAnalysis,
        });
      })
      .catch(() => {})
      .finally(() => !abort.signal.aborted && setRestored(true));
    return () => abort.abort();
    // Restaura uma única vez por montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!restored) return;
    const t = setTimeout(() => void persistenceApi.putPreferences({ symbol, interval, showAnalysis }).catch(() => {}), 1_000);
    return () => clearTimeout(t);
  }, [restored, symbol, interval, showAnalysis]);
}
