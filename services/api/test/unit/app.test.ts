import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { FakeStreamSource } from "../helpers/fake-stream";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ env: parseEnv({ CORS_ORIGIN: "http://localhost:3000" }), logger: false, streamSource: new FakeStreamSource() });
});
afterAll(() => app.close());

describe("app base", () => {
  it("GET /health responde ok sem depender de mercado", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("propaga x-request-id válido do cliente", async () => {
    const res = await app.inject({ method: "GET", url: "/health", headers: { "x-request-id": "abc-123" } });
    expect(res.headers["x-request-id"]).toBe("abc-123");
  });

  it("404 no formato ApiError", async () => {
    const res = await app.inject({ method: "GET", url: "/nao-existe" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("CORS só libera origens configuradas", async () => {
    const ok = await app.inject({ method: "GET", url: "/health", headers: { origin: "http://localhost:3000" } });
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    const bad = await app.inject({ method: "GET", url: "/health", headers: { origin: "https://evil.example" } });
    expect(bad.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("config", () => {
  it("aplica defaults e rejeita valores inválidos", () => {
    const env = parseEnv({});
    expect(env.API_PORT).toBe(4000);
    expect(env.MARKET_DEFAULT_SYMBOL).toBe("BTCUSDT");
    expect(env.CORS_ORIGIN).toEqual(["http://localhost:3000"]);
    expect(() => parseEnv({ API_PORT: "abc" })).toThrow(/API_PORT/);
    expect(() => parseEnv({ MARKET_DEFAULT_INTERVAL: "2h" })).toThrow();
  });
});

describe("sem banco configurado", () => {
  it("rotas de persistência respondem 503 DB_UNAVAILABLE e o resto da API segue de pé", async () => {
    const res = await app.inject("/api/v1/watchlist");
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("DB_UNAVAILABLE");
    expect((await app.inject("/health")).statusCode).toBe(200);
  });
});
