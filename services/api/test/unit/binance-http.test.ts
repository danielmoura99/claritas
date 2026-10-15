import { describe, expect, it, vi } from "vitest";
import { BinanceHttp } from "../../src/providers/binance/http";
import { BinanceSpotProvider } from "../../src/providers/binance/binance-provider";
import { T0, FIVE_MIN, jsonResponse, kline } from "../fixtures/binance";

const base = "https://binance.test";

describe("BinanceHttp — erros padronizados", () => {
  it("timeout vira PROVIDER_TIMEOUT após as tentativas", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      await new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal!.reason)));
      return jsonResponse({});
    });
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 20, retries: 1, fetchImpl: fetchImpl as typeof fetch });
    await expect(http.get("/api/v3/ping")).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT", statusCode: 504 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("5xx é repetido com backoff e depois vira PROVIDER_UNAVAILABLE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 502));
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 1000, retries: 2, fetchImpl: fetchImpl as typeof fetch });
    await expect(http.get("/x")).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", statusCode: 503 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("429 respeita Retry-After e bloqueia novas chamadas sem tocar a rede", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ code: -1003, msg: "Too many requests" }, 429, { "retry-after": "30" }));
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 1000, fetchImpl: fetchImpl as typeof fetch });
    await expect(http.get("/x")).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSec: 30 });
    await expect(http.get("/x")).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("418 (ban) também bloqueia", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 418, { "retry-after": "120" }));
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 1000, fetchImpl: fetchImpl as typeof fetch });
    await expect(http.get("/x")).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED", retryAfterSec: 120 });
  });

  it("-1121 vira SYMBOL_NOT_FOUND e 4xx não é repetido", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ code: -1121, msg: "Invalid symbol." }, 400));
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 1000, retries: 3, fetchImpl: fetchImpl as typeof fetch });
    await expect(http.get("/api/v3/klines")).rejects.toMatchObject({ code: "SYMBOL_NOT_FOUND" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("registra o peso usado informado pela Binance", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 200, { "x-mbx-used-weight-1m": "123" }));
    const http = new BinanceHttp({ baseUrl: base, timeoutMs: 1000, fetchImpl: fetchImpl as typeof fetch });
    await http.get("/api/v3/ping");
    expect(http.usedWeight).toBe(123);
  });
});

describe("BinanceSpotProvider.getCandles", () => {
  it("descarta linhas malformadas/incoerentes, ordena e deduplica", async () => {
    const rows = [kline(2), kline(0), kline(1), kline(1), ["lixo"], [...kline(3, "100", "95", "90", "105")]];
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      expect(String(url)).toContain("/api/v3/klines?symbol=TESTUSDT&interval=5m&limit=10");
      return jsonResponse(rows);
    });
    const p = new BinanceSpotProvider({ restUrl: base, timeoutMs: 1000, fetchImpl: fetchImpl as typeof fetch, now: () => T0 + 2 * FIVE_MIN + 1 });
    const candles = await p.getCandles({ symbol: "TESTUSDT", interval: "5m", limit: 10 });
    expect(candles.map((c) => c.openTimeMs)).toEqual([T0, T0 + FIVE_MIN, T0 + 2 * FIVE_MIN]);
    expect(candles.at(-1)!.isClosed).toBe(false);
    expect(candles[0]!.isClosed).toBe(true);
  });

  it("recusa limit fora de 1..1000 sem chamar a rede", async () => {
    const fetchImpl = vi.fn();
    const p = new BinanceSpotProvider({ restUrl: base, timeoutMs: 1000, fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(p.getCandles({ symbol: "TESTUSDT", interval: "5m", limit: 1001 })).rejects.toMatchObject({ code: "INVALID_REQUEST" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
