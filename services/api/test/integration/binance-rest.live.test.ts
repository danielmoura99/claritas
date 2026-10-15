import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { INTERVAL_MS, type Candle } from "@claritas/contracts";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";

// Integração REAL com a Binance Spot pública (rede necessária). Nenhuma fixture aqui.
let app: FastifyInstance;
beforeAll(async () => {
  app = await buildApp({ env: parseEnv({ LOG_LEVEL: "silent" }), logger: false });
});
afterAll(() => app.close());

const getCandles = async (qs: string) => {
  const res = await app.inject(`/api/v1/market/candles?${qs}`);
  expect(res.statusCode, res.body).toBe(200);
  return res.json() as { data: Candle[]; source: string };
};

describe("Binance Spot REST real", () => {
  it("BTCUSDT/5m: 500 candles reais, ordenados, sem duplicidade, OHLC coerente", async () => {
    const { data, source } = await getCandles("symbol=BTCUSDT&interval=5m&limit=500");
    expect(source).toBe("binance_spot");
    expect(data.length).toBe(500);
    for (let i = 0; i < data.length; i++) {
      const c = data[i]!;
      const [o, h, l, cl] = [c.open, c.high, c.low, c.close].map(Number) as [number, number, number, number];
      expect(l).toBeLessThanOrEqual(Math.min(o, cl));
      expect(Math.max(o, cl)).toBeLessThanOrEqual(h);
      expect(c.openTimeMs % INTERVAL_MS["5m"]).toBe(0); // alinhado em UTC
      expect(c.closeTimeMs).toBe(c.openTimeMs + INTERVAL_MS["5m"] - 1);
      if (i > 0) expect(c.openTimeMs).toBe(data[i - 1]!.openTimeMs + INTERVAL_MS["5m"]);
      expect(c.open).toMatch(/^\d+\.\d{8}$/); // precisão original preservada
    }
    // Apenas a última barra pode estar em formação.
    expect(data.slice(0, -1).every((c) => c.isClosed)).toBe(true);
    const last = data.at(-1)!;
    expect(Math.abs(Date.now() - last.openTimeMs)).toBeLessThan(2 * INTERVAL_MS["5m"] + 60_000);
  });

  it("ETHUSDT/15m e 1d respondem com o intervalo pedido", async () => {
    const eth = await getCandles("symbol=ETHUSDT&interval=15m&limit=10");
    expect(eth.data.every((c) => c.interval === "15m" && c.symbol === "ETHUSDT")).toBe(true);
    const d = await getCandles("symbol=BTCUSDT&interval=1d&limit=5");
    expect(d.data.every((c) => c.openTimeMs % INTERVAL_MS["1d"] === 0)).toBe(true);
  });

  it("paginação por intervalo de tempo devolve sequência contínua", async () => {
    const end = Date.now() - 3 * 3_600_000;
    const start = end - 2_500 * 60_000; // ~2500 candles de 1m → 3 páginas
    const candles = await app.market.getCandlesRange("BTCUSDT", "1m", start, end);
    expect(candles.length).toBeGreaterThan(2_400);
    for (let i = 1; i < candles.length; i++) expect(candles[i]!.openTimeMs - candles[i - 1]!.openTimeMs).toBe(60_000);
  });

  it("metadados Spot de BTCUSDT e erro controlado para símbolo inexistente", async () => {
    const asset = await app.inject("/api/v1/market/assets/BTCUSDT");
    expect(asset.json().data).toMatchObject({ id: "BINANCE_SPOT:BTCUSDT", baseAsset: "BTC", quoteAsset: "USDT", status: "TRADING" });
    const bad = await app.inject("/api/v1/market/candles?symbol=ZZZZNOTREALUSDT&interval=5m");
    expect(bad.statusCode).toBe(404);
    expect(bad.json().error.code).toBe("SYMBOL_NOT_FOUND");
  });

  it("cotação 24h real com janela explícita", async () => {
    const res = await app.inject("/api/v1/market/quote?symbol=BTCUSDT");
    const q = res.json().data;
    expect(q.window).toBe("rolling_24h");
    expect(Number(q.lastPrice)).toBeGreaterThan(0);
    expect(Number(q.lowPrice)).toBeLessThanOrEqual(Number(q.highPrice));
  });
});
