"use client";

import * as React from "react";
import type { Analysis, Interval } from "@claritas/contracts";
import { analysisApi, describeError } from "../api/client";

export interface AnalysisState {
  analysis: Analysis | null;
  loading: boolean;
  error: string | null;
}

/**
 * Análise determinística da API para (símbolo, intervalo). Recalcula quando a última barra FECHADA muda
 * (`lastClosedOpenTimeMs`) — não a cada tick. Troca de seleção descarta o resultado anterior na hora.
 */
export function useAnalysis(symbol: string, interval: Interval, lastClosedOpenTimeMs: number | null): AnalysisState {
  const key = `${symbol}:${interval}`;
  const [state, setState] = React.useState<AnalysisState & { key: string }>({ key, analysis: null, loading: true, error: null });
  if (state.key !== key) setState({ key, analysis: null, loading: true, error: null });

  React.useEffect(() => {
    if (lastClosedOpenTimeMs === null) return;
    const abort = new AbortController();
    analysisApi
      .get(symbol, interval, abort.signal)
      .then((env) => {
        // Resposta tardia de outra seleção é ignorada.
        if (env.data.symbol !== symbol || env.data.interval !== interval) return;
        setState((s) => (s.key !== key ? s : { key, analysis: env.data, loading: false, error: null }));
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setState((s) => (s.key !== key ? s : { ...s, loading: false, error: describeError(err) }));
      });
    return () => abort.abort();
  }, [symbol, interval, key, lastClosedOpenTimeMs]);

  return { analysis: state.analysis, loading: state.loading, error: state.error };
}
