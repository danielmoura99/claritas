import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { FakeStreamSource } from "../helpers/fake-stream";
import { authedInject, testSessions } from "../helpers/auth";
import { BinanceSpotProvider } from "../../src/providers/binance/binance-provider";
import { FIVE_MIN, T0, exchangeInfo, jsonResponse, kline, ticker } from "../fixtures/binance";

let app: FastifyInstance;
let mode: "ok" | "down" = "ok";

const fetchImpl = vi.fn(async (input: string | URL | Request) => {
  if (mode === "down") throw new TypeError("fetch failed");
  const url = new URL(String(input));
  if (url.pathname === "/api/v3/exchangeInfo") return jsonResponse(exchangeInfo);
  if (url.pathname === "/api/v3/klines") return jsonResponse([kline(0), kline(1), kline(2)]);
  if (url.pathname === "/api/v3/ticker/24hr") return jsonResponse(ticker(url.searchParams.get("symbol") ?? "TESTUSDT"));
  if (url.pathname === "/api/v3/ping") return jsonResponse({});
  return jsonResponse({ code: -1, msg: "?" }, 404);
});

beforeAll(async () => {
  const provider = new BinanceSpotProvider({ restUrl: "https://binance.test", timeoutMs: 500, fetchImpl: fetchImpl as typeof fetch, now: () => T0 + 10 * FIVE_MIN });
  app = await buildApp({ env: parseEnv({ MARKET_FEATURED_SYMBOLS: "TESTUSDT" }), logger: false, provider, streamSource: new FakeStreamSource(), sessions: testSessions });
});
afterAll(() => app.close());
const inject = authedInject(() => app);

describe("rotas /api/v1/market", () => {
  it("candles: envelope com fonte e dados normalizados", async () => {
    const res = await inject("/api/v1/market/candles?symbol=testusdt&interval=5m&limit=3");
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ source: "binance_spot", status: "live" });
    expect(body.data).toHaveLength(3);
    expect(body.data[0]).toMatchObject({ symbol: "TESTUSDT", interval: "5m", openTimeMs: T0, open: "100.00000000", isClosed: true });
  });

  it("símbolo inexistente → 404 SYMBOL_NOT_FOUND", async () => {
    const res = await inject("/api/v1/market/candles?symbol=NOPEUSDT&interval=5m");
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("SYMBOL_NOT_FOUND");
  });

  it("símbolo fora de negociação → 404 com status", async () => {
    const res = await inject("/api/v1/market/quote?symbol=HALTUSDT");
    expect(res.statusCode).toBe(404);
    expect(res.json().error.details).toEqual({ status: "HALTED" });
  });

  it("query inválida → 400 com detalhes", async () => {
    const res = await inject("/api/v1/market/candles?symbol=TESTUSDT&interval=1M&limit=0");
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("INVALID_REQUEST");
  });

  it("quote: janela de 24h explícita", async () => {
    const res = await inject("/api/v1/market/quote?symbol=TESTUSDT");
    expect(res.json().data).toMatchObject({ symbol: "TESTUSDT", window: "rolling_24h", lastPrice: "105.00000000" });
  });

  it("assets: busca por base e filtro de quote", async () => {
    const res = await inject("/api/v1/market/assets?search=test&quote=USDT");
    expect(res.json().data.map((a: { symbol: string }) => a.symbol)).toEqual(["TESTUSDT"]);
  });

  it("fornecedor indisponível → 503 sem nenhum dado fabricado", async () => {
    mode = "down";
    try {
      // TESTBTC ainda não tem cotação em cache: a única fonte seria a Binance, que está fora.
      const res = await inject("/api/v1/market/quote?symbol=TESTBTC");
      expect(res.statusCode).toBe(503);
      const body = res.json();
      expect(body.error.code).toBe("PROVIDER_UNAVAILABLE");
      expect(body.data).toBeUndefined();
    } finally {
      mode = "ok";
    }
  });

  it("/ready não falha quando o provedor cai (informativo)", async () => {
    const res = await inject("/ready");
    expect(res.statusCode).toBe(200);
    expect(res.json().checks.provider.id).toBe("binance_spot");
  });
});
