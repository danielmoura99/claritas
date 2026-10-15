"use client";

import * as React from "react";
import type { MarketAsset } from "@claritas/contracts";
import { marketApi } from "../api/client";

let featuredCache: Promise<MarketAsset[]> | null = null;

/** Ativos em destaque configurados na API (MARKET_FEATURED_SYMBOLS), validados contra a Binance. */
export function useFeaturedAssets() {
  const [assets, setAssets] = React.useState<MarketAsset[]>([]);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    featuredCache ??= marketApi.assets().then((e) => e.data);
    featuredCache
      .then((a) => alive && setAssets(a))
      .catch(() => {
        featuredCache = null;
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { assets, error };
}

const assetCache = new Map<string, Promise<MarketAsset>>();

/** Metadados de um ativo (precisão de preço, base/quote). */
export function useAsset(symbol: string) {
  const [asset, setAsset] = React.useState<MarketAsset | null>(null);
  React.useEffect(() => {
    let alive = true;
    let p = assetCache.get(symbol);
    if (!p) {
      p = marketApi.asset(symbol).then((e) => e.data);
      assetCache.set(symbol, p);
      p.catch(() => assetCache.delete(symbol));
    }
    p.then((a) => alive && setAsset(a)).catch(() => alive && setAsset(null));
    return () => {
      alive = false;
    };
  }, [symbol]);
  return asset?.symbol === symbol ? asset : null;
}

/** Busca de ativos com debounce, para o seletor. */
export function useAssetSearch(query: string) {
  const [results, setResults] = React.useState<MarketAsset[] | null>(null);
  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const abort = new AbortController();
    const t = setTimeout(() => {
      marketApi.assets(q, abort.signal).then((e) => setResults(e.data)).catch(() => {});
    }, 250);
    return () => {
      clearTimeout(t);
      abort.abort();
    };
  }, [query]);
  return query.trim().length < 2 ? null : results;
}
