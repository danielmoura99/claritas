"use client";

import * as React from "react";
import { toChartNumber, type Interval } from "@claritas/contracts";
import { marketApi } from "../api/client";

const cache = new Map<string, { at: number; data: Promise<number[]> }>();
const TTL_MS = 5 * 60_000;

/** Fechamentos reais recentes para sparklines (padrão: 24 candles de 1h = últimas 24h). */
export function useSparkline(symbol: string | undefined, interval: Interval = "1h", points = 24) {
  const [data, setData] = React.useState<number[] | null>(null);
  React.useEffect(() => {
    if (!symbol) return;
    let alive = true;
    const key = `${symbol}:${interval}:${points}`;
    let hit = cache.get(key);
    if (!hit || Date.now() - hit.at > TTL_MS) {
      hit = { at: Date.now(), data: marketApi.candles(symbol, interval, points).then((e) => e.data.map((c) => toChartNumber(c.close))) };
      cache.set(key, hit);
      hit.data.catch(() => cache.delete(key));
    }
    hit.data.then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
  }, [symbol, interval, points]);
  return data;
}
