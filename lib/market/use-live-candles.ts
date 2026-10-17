"use client";

import * as React from "react";
import type { Candle, FeedStatus, Interval, MarketStatus } from "@claritas/contracts";
import { describeError, marketApi } from "../api/client";
import { mergeCandles, upsertCandle } from "./chart-adapter";
import { getStreamClient } from "./stream-client";

export interface LiveCandlesState {
  /** Série da seleção ATUAL (vazia enquanto carrega ou em erro). */
  candles: Candle[];
  /** Chave da série exibida — muda junto com os dados, nunca antes. */
  seriesKey: string;
  loading: boolean;
  error: string | null;
  /** Status do feed em tempo real. Só "live" autoriza exibir "Ao vivo". */
  status: MarketStatus;
  feed: FeedStatus | null;
  /** Horário (ms, relógio local) da última atualização recebida — REST ou WS. */
  lastUpdateAt: number | null;
  source: "binance_spot" | null;
  reload: () => void;
}

/**
 * Histórico REST + atualizações WS para (símbolo, intervalo).
 * - Respostas tardias de uma seleção anterior são descartadas (AbortController + token).
 * - Upserts que chegam antes do histórico ficam em buffer e são mesclados por openTimeMs.
 * - Reconexão do WebSocket do cliente → recarrega o histórico (reconciliação) antes de seguir.
 */
export function useLiveCandles(symbol: string, interval: Interval, limit = 500): LiveCandlesState {
  const key = `${symbol}:${interval}`;
  const initial = (k: string): Omit<LiveCandlesState, "reload"> => ({ candles: [], seriesKey: k, loading: true, error: null, status: "connecting", feed: null, lastUpdateAt: null, source: null });
  const [state, setState] = React.useState(() => initial(key));
  // Troca de seleção: reset no próprio render — dados da seleção anterior nunca aparecem sob a nova chave.
  if (state.seriesKey !== key) setState(initial(key));
  const [reloadTick, setReloadTick] = React.useState(0);
  const reload = React.useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setReloadTick((t) => t + 1);
  }, []);

  React.useEffect(() => {
    const client = getStreamClient();
    const abort = new AbortController();
    let historyLoaded = false;
    let pending: Candle[] = [];
    let alive = true;

    const loadHistory = () => {
      marketApi
        .candles(symbol, interval, limit, abort.signal)
        .then((env) => {
          if (!alive) return;
          historyLoaded = true;
          const merged = mergeCandles(env.data, pending);
          pending = [];
          setState((s) => (s.seriesKey !== key ? s : { ...s, candles: merged, loading: false, error: null, lastUpdateAt: Date.now(), source: env.source }));
        })
        .catch((err: unknown) => {
          if (!alive || (err as Error).name === "AbortError") return;
          setState((s) => ({ ...s, loading: false, error: describeError(err) }));
        });
    };
    loadHistory();

    const unsubscribe = client.subscribeCandles(symbol, interval, {
      onUpsert: (m) => {
        if (!alive || m.data.symbol !== symbol || m.data.interval !== interval) return;
        if (!historyLoaded) {
          pending.push(m.data);
          return;
        }
        setState((s) => {
          const next = upsertCandle(s.candles, m.data);
          return next === s.candles ? s : { ...s, candles: next, lastUpdateAt: Date.now() };
        });
      },
      onStatus: (feed) => {
        if (!alive) return;
        setState((s) => ({ ...s, status: feed.status, feed }));
      },
    });

    const offConn = client.onConnectionState((conn, { reconnected }) => {
      if (!alive) return;
      if (conn === "closed") setState((s) => ({ ...s, status: "reconnecting", feed: s.feed ? { ...s.feed, status: "reconnecting", reason: "conexão com a API Claritas caiu" } : null }));
      if (conn === "open" && reconnected) {
        historyLoaded = false;
        loadHistory(); // reconcilia barras perdidas enquanto o socket do cliente estava fora
      }
    });

    return () => {
      alive = false;
      abort.abort();
      unsubscribe();
      offConn();
    };
  }, [symbol, interval, limit, key, reloadTick]);

  return { ...state, reload };
}
