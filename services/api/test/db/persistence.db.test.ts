import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import pg from "pg";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { Database } from "../../src/infrastructure/db";
import { BinanceSpotProvider } from "../../src/providers/binance/binance-provider";
import { FakeStreamSource } from "../helpers/fake-stream";
import { exchangeInfo, jsonResponse } from "../fixtures/binance";

// PostgreSQL REAL e LOCAL (`npm run db:local:start`). NUNCA usa DATABASE_URL, que pode ser o banco real (Neon).
// Cada execução cria um banco NOVO e vazio com nome único, aplica as migrações (migrate deploy) e o remove no fim.
// Sem `migrate reset` e sem apagar dados existentes.
const ADMIN_URL = process.env.DATABASE_URL_TEST_ADMIN ?? "postgresql://claritas:claritas_dev@127.0.0.1:5544/postgres";
const TEST_DB = `claritas_test_${Date.now()}`;
const TEST_URL = (() => {
  const u = new URL(ADMIN_URL);
  if (!["127.0.0.1", "localhost"].includes(u.hostname)) throw new Error("Testes de banco só rodam contra PostgreSQL local");
  u.pathname = `/${TEST_DB}`;
  return u.toString();
})();
const API_DIR = resolve(__dirname, "../..");

let app: FastifyInstance;
let db: Database;

async function adminQuery(sql: string) {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    await admin.query(sql);
  } finally {
    await admin.end();
  }
}

beforeAll(async () => {
  await adminQuery(`CREATE DATABASE "${TEST_DB}"`);
  // Banco vazio → migrações do zero: prova que são reproduzíveis.
  execSync("npx prisma migrate deploy", { cwd: API_DIR, env: { ...process.env, DATABASE_URL: TEST_URL, PRISMA_HIDE_UPDATE_MESSAGE: "1" }, stdio: "pipe" });
  db = new Database(TEST_URL);
  // Provedor com fixtures (ativos fictícios) — o foco aqui é a persistência.
  const provider = new BinanceSpotProvider({ restUrl: "https://binance.test", timeoutMs: 500, fetchImpl: (async () => jsonResponse(exchangeInfo)) as unknown as typeof fetch });
  app = await buildApp({ env: parseEnv({}), logger: false, provider, streamSource: new FakeStreamSource(), database: db });
}, 120_000);
afterAll(async () => {
  await app?.close();
  await db?.close();
  // Remove só o banco descartável criado por esta execução.
  await adminQuery(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
});

describe("persistência (PostgreSQL real)", () => {
  it("watchlist default nasce vazia e cresce em ordem, de forma idempotente", async () => {
    expect((await app.inject("/api/v1/watchlist")).json().data.items).toEqual([]);
    await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/TESTUSDT" });
    await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/TESTBTC" });
    const again = await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/testusdt" });
    expect(again.statusCode).toBe(200);
    const items = again.json().data.items;
    expect(items.map((i: { symbol: string; position: number }) => [i.symbol, i.position])).toEqual([["TESTUSDT", 0], ["TESTBTC", 1]]);
    expect(items[0]).toMatchObject({ baseAsset: "TEST", quoteAsset: "USDT" }); // identidade independente do provedor
  });

  it("não aceita ativo fora de negociação, mas permite remover", async () => {
    expect((await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/HALTUSDT" })).statusCode).toBe(404);
    const del = await app.inject({ method: "DELETE", url: "/api/v1/watchlist/items/TESTBTC" });
    expect(del.json().data.items.map((i: { symbol: string }) => i.symbol)).toEqual(["TESTUSDT"]);
  });

  it("preferências: upsert parcial, leitura e validação", async () => {
    const url = "/api/v1/preferences/cliente-teste-01";
    expect((await app.inject(url)).json()).toEqual({ data: null }); // sem preferências ainda: estado normal
    await app.inject({ method: "PUT", url, payload: { symbol: "TESTUSDT", interval: "15m" } });
    const r = await app.inject({ method: "PUT", url, payload: { showAnalysis: false } });
    expect(r.json().data).toMatchObject({ symbol: "TESTUSDT", interval: "15m", showAnalysis: false });
    expect((await app.inject({ method: "PUT", url, payload: { interval: "2h" } })).statusCode).toBe(400);
    expect((await app.inject({ method: "PUT", url: "/api/v1/preferences/x", payload: {} })).statusCode).toBe(400);
  });

  it("/ready informa o banco", async () => {
    expect((await app.inject("/ready")).json().checks.database).toEqual({ configured: true, reachable: true });
  });

  it("banco inacessível → 503 DB_UNAVAILABLE (nada inventado)", async () => {
    const down = new Database("postgresql://claritas:x@127.0.0.1:1/nada");
    const provider = new BinanceSpotProvider({ restUrl: "https://binance.test", timeoutMs: 500, fetchImpl: (async () => jsonResponse(exchangeInfo)) as unknown as typeof fetch });
    const a = await buildApp({ env: parseEnv({}), logger: false, provider, streamSource: new FakeStreamSource(), database: down });
    const res = await a.inject("/api/v1/watchlist");
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("DB_UNAVAILABLE");
    await a.close();
  });
});
