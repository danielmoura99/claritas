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
import { ensureTemplateWatchlist } from "../../src/modules/watchlist/repositories";
import { SESSION_COOKIE } from "../../src/modules/auth/session-cookie";
import { allowAllAccess } from "../helpers/auth";

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
  // Entitlements liberados: esta suíte testa persistência; o motor de acesso é coberto por saas.db.test.ts.
  app = await buildApp({ env: parseEnv({ AUTH_RATE_LIMIT_PER_MINUTE: "1000" }), logger: false, provider, streamSource: new FakeStreamSource(), database: db, access: allowAllAccess });
}, 120_000);
afterAll(async () => {
  await app?.close();
  await db?.close();
  // Remove só o banco descartável criado por esta execução.
  await adminQuery(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
});

/** Cookie de sessão devolvido por entrar/criar conta, pronto para o cabeçalho Cookie. */
function sessionOf(res: { headers: Record<string, unknown> }) {
  const raw = String(res.headers["set-cookie"] ?? "");
  const m = raw.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!m) throw new Error(`sem cookie de sessão: ${raw}`);
  return { cookie: `${SESSION_COOKIE}=${m[1]}`, token: m[1]!, raw };
}

async function register(name: string, email: string, password = "senha-forte-123") {
  const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name, email, password, acceptTerms: true } });
  expect(res.statusCode, res.body).toBe(201);
  return sessionOf(res);
}

describe("contas e sessões (PostgreSQL real)", () => {
  it("criar conta: 201, cookie HttpOnly/SameSite=Lax e sessão válida", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: " Ana ", email: " Ana@Claritas.TEST ", password: "senha-forte-123", acceptTerms: true } });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.user).toMatchObject({ name: "Ana", email: "ana@claritas.test" });
    expect(res.json().data.user.passwordHash).toBeUndefined();
    const { cookie, raw } = sessionOf(res);
    expect(raw).toMatch(/HttpOnly/);
    expect(raw).toMatch(/SameSite=Lax/);
    expect(raw).toMatch(/Max-Age=2592000/); // 30 dias
    const me = await app.inject({ url: "/api/v1/auth/session", headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json().data.user.email).toBe("ana@claritas.test");
  });

  it("aceite dos termos é obrigatório e fica registrado com a versão (LGPD)", async () => {
    const no = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "Sem aceite", email: "semaceite@claritas.test", password: "senha-forte-123" } });
    expect(no.statusCode).toBe(400);
    expect(no.json().error.details[0].path).toBe("acceptTerms");
    const user = await db.require().user.findUniqueOrThrow({ where: { email: "ana@claritas.test" }, include: { consents: true } });
    expect(user.consents.map((c) => [c.documentType, c.documentVersion, c.source]).sort()).toEqual([["PRIVACY", "2026-10-17", "register"], ["TERMS", "2026-10-17", "register"]]);
    expect(await db.require().user.count({ where: { email: "semaceite@claritas.test" } })).toBe(0);
  });

  it("exportação dos próprios dados (LGPD art. 18) sem hash de senha nem token", async () => {
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "ana@claritas.test", password: "senha-forte-123" } });
    const res = await app.inject({ url: "/api/v1/me/export", headers: { cookie: sessionOf(login).cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    const data = res.json().data;
    expect(data.user.email).toBe("ana@claritas.test");
    expect(data.consents).toHaveLength(2);
    expect(res.body).not.toMatch(/scrypt\$|passwordHash|tokenHash/);
  });

  it("e-mail repetido → 409 EMAIL_TAKEN (sem diferenciar maiúsculas)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "Outra", email: "ANA@claritas.test", password: "outra-senha-123", acceptTerms: true } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("EMAIL_TAKEN");
  });

  it("senha fraca ou igual ao e-mail → 400 com o campo", async () => {
    const short = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "Bia", email: "bia@claritas.test", password: "curta", acceptTerms: true } });
    expect(short.statusCode).toBe(400);
    expect(short.json().error.details[0].path).toBe("password");
    const same = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "Bia", email: "bia@claritas.test", password: "bia@claritas.test", acceptTerms: true } });
    expect(same.statusCode).toBe(400);
  });

  it("senha guardada só como hash scrypt e token só como SHA-256", async () => {
    const { token } = await register("Caio", "caio@claritas.test");
    const p = db.require();
    const user = await p.user.findUniqueOrThrow({ where: { email: "caio@claritas.test" }, include: { sessions: true } });
    expect(user.passwordHash).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(user.passwordHash).not.toContain("senha-forte-123");
    expect(user.sessions[0]!.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(user.sessions.some((s) => s.tokenHash === token)).toBe(false);
  });

  it("entrar: credencial errada e e-mail inexistente têm a mesma resposta; certa abre sessão", async () => {
    const wrong = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "caio@claritas.test", password: "errada-123" } });
    const ghost = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "ninguem@claritas.test", password: "errada-123" } });
    expect(wrong.statusCode).toBe(401);
    expect(ghost.statusCode).toBe(401);
    expect(wrong.json().error).toEqual(ghost.json().error);
    expect(wrong.json().error.code).toBe("INVALID_CREDENTIALS");
    const ok = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "CAIO@claritas.test", password: "senha-forte-123" } });
    expect(ok.statusCode).toBe(200);
    expect((await app.inject({ url: "/api/v1/auth/session", headers: { cookie: sessionOf(ok).cookie } })).statusCode).toBe(200);
  });

  it("'Manter conectado' desmarcado: cookie sem Max-Age e sessão de 12 h no servidor", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "caio@claritas.test", password: "senha-forte-123", remember: false } });
    expect(res.statusCode).toBe(200);
    const { raw } = sessionOf(res);
    expect(raw).not.toMatch(/Max-Age/);
    const hours = (Date.parse(res.json().data.expiresAt) - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(11.9);
    expect(hours).toBeLessThanOrEqual(12);
  });

  it("sair invalida a sessão no servidor e limpa o cookie", async () => {
    const { cookie } = await register("Duda", "duda@claritas.test");
    const out = await app.inject({ method: "POST", url: "/api/v1/auth/logout", headers: { cookie } });
    expect(out.statusCode).toBe(200);
    expect(String(out.headers["set-cookie"])).toMatch(/Max-Age=0/);
    const after = await app.inject({ url: "/api/v1/auth/session", headers: { cookie } });
    expect(after.statusCode).toBe(401);
    expect(after.json().error.code).toBe("UNAUTHENTICATED");
  });

  it("sessão vencida é recusada", async () => {
    const { cookie } = await register("Enzo", "enzo@claritas.test");
    const user = await db.require().user.findUniqueOrThrow({ where: { email: "enzo@claritas.test" } });
    await db.require().session.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await app.inject({ url: "/api/v1/market/assets", headers: { cookie } })).statusCode).toBe(401);
  });
});

describe("watchlist e preferências por usuário (PostgreSQL real)", () => {
  let fe: string;
  let gil: string;
  beforeAll(async () => {
    await ensureTemplateWatchlist(db, [["TEST", "USDT"]]);
    fe = (await register("Fê", "fe@claritas.test")).cookie;
    gil = (await register("Gil", "gil@claritas.test")).cookie;
  });

  it("conta nova nasce com a cópia da lista modelo", async () => {
    const items = (await app.inject({ url: "/api/v1/watchlist", headers: { cookie: fe } })).json().data.items;
    expect(items.map((i: { symbol: string }) => i.symbol)).toEqual(["TESTUSDT"]);
  });

  it("cresce em ordem, de forma idempotente, e só para o dono", async () => {
    await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/TESTBTC", headers: { cookie: fe } });
    const again = await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/testbtc", headers: { cookie: fe } });
    expect(again.statusCode).toBe(200);
    const items = again.json().data.items;
    expect(items.map((i: { symbol: string; position: number }) => [i.symbol, i.position])).toEqual([["TESTUSDT", 0], ["TESTBTC", 1]]);
    expect(items[1]).toMatchObject({ baseAsset: "TEST", quoteAsset: "BTC" }); // identidade independente do provedor
    const other = (await app.inject({ url: "/api/v1/watchlist", headers: { cookie: gil } })).json().data.items;
    expect(other.map((i: { symbol: string }) => i.symbol)).toEqual(["TESTUSDT"]);
    // A lista modelo não muda com as listas dos usuários.
    expect(await ensureTemplateWatchlist(db, [])).toEqual(["TESTUSDT"]);
  });

  it("não aceita ativo fora de negociação, mas permite remover", async () => {
    expect((await app.inject({ method: "PUT", url: "/api/v1/watchlist/items/HALTUSDT", headers: { cookie: fe } })).statusCode).toBe(404);
    const del = await app.inject({ method: "DELETE", url: "/api/v1/watchlist/items/TESTBTC", headers: { cookie: fe } });
    expect(del.json().data.items.map((i: { symbol: string }) => i.symbol)).toEqual(["TESTUSDT"]);
  });

  it("preferências: upsert parcial por usuário, leitura e validação", async () => {
    const url = "/api/v1/preferences";
    expect((await app.inject({ url, headers: { cookie: fe } })).json()).toEqual({ data: null }); // sem preferências ainda: estado normal
    await app.inject({ method: "PUT", url, headers: { cookie: fe }, payload: { symbol: "TESTUSDT", interval: "15m" } });
    const r = await app.inject({ method: "PUT", url, headers: { cookie: fe }, payload: { showAnalysis: false } });
    expect(r.json().data).toMatchObject({ symbol: "TESTUSDT", interval: "15m", showAnalysis: false });
    expect((await app.inject({ url, headers: { cookie: gil } })).json()).toEqual({ data: null });
    expect((await app.inject({ method: "PUT", url, headers: { cookie: fe }, payload: { interval: "2h" } })).statusCode).toBe(400);
  });

  it("sem sessão nada de persistência é acessível", async () => {
    expect((await app.inject("/api/v1/watchlist")).statusCode).toBe(401);
    expect((await app.inject({ method: "PUT", url: "/api/v1/preferences", payload: {} })).statusCode).toBe(401);
  });
});

describe("infraestrutura do banco", () => {
  it("/ready informa o banco", async () => {
    expect((await app.inject("/ready")).json().checks.database).toEqual({ configured: true, reachable: true });
  });

  it("banco inacessível → 503 DB_UNAVAILABLE (nada inventado)", async () => {
    const down = new Database("postgresql://claritas:x@127.0.0.1:1/nada");
    const provider = new BinanceSpotProvider({ restUrl: "https://binance.test", timeoutMs: 500, fetchImpl: (async () => jsonResponse(exchangeInfo)) as unknown as typeof fetch });
    const a = await buildApp({ env: parseEnv({}), logger: false, provider, streamSource: new FakeStreamSource(), database: down });
    const login = await a.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "x@claritas.test", password: "qualquer" } });
    expect(login.statusCode).toBe(503);
    expect(login.json().error.code).toBe("DB_UNAVAILABLE");
    // Com cookie, a verificação da sessão também depende do banco: 503 explícito, não 401.
    const res = await a.inject({ url: "/api/v1/watchlist", headers: { cookie: `${SESSION_COOKIE}=${"x".repeat(43)}` } });
    expect(res.statusCode).toBe(503);
    await a.close();
  });
});
