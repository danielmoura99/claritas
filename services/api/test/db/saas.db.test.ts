import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { FastifyInstance, InjectOptions } from "fastify";
import WebSocket from "ws";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { Database } from "../../src/infrastructure/db";
import { BinanceSpotProvider } from "../../src/providers/binance/binance-provider";
import { SESSION_COOKIE } from "../../src/modules/auth/session-cookie";
import { EntitlementsService } from "../../src/modules/entitlements/entitlements-service";
import { seedCatalog } from "../../src/modules/plans/seed-catalog";
import { FakeStreamSource } from "../helpers/fake-stream";
import { createTestDatabase } from "../helpers/test-db";
import { FIVE_MIN, T0, exchangeInfo, jsonResponse, kline, ticker } from "../fixtures/binance";

// Plano 02 — matriz de negócio e segurança (§12) contra PostgreSQL REAL e LOCAL (banco descartável).
const H = 3_600_000;
const D = 24 * H;
let clock = Date.now();
let app: FastifyInstance;
let db: Database;
let drop: () => Promise<void>;
let wsBase: string;

const fetchImpl = (async (input: string | URL | Request) => {
  const url = new URL(String(input));
  if (url.pathname === "/api/v3/exchangeInfo") return jsonResponse(exchangeInfo);
  if (url.pathname === "/api/v3/klines") return jsonResponse([kline(0), kline(1), kline(2)]);
  if (url.pathname === "/api/v3/ticker/24hr") return jsonResponse(ticker(url.searchParams.get("symbol") ?? "TESTUSDT"));
  return jsonResponse({});
}) as typeof fetch;

beforeAll(async () => {
  const t = await createTestDatabase("claritas_saas");
  drop = t.drop;
  db = new Database(t.url);
  await seedCatalog(db);
  const provider = new BinanceSpotProvider({ restUrl: "https://binance.test", timeoutMs: 500, fetchImpl, now: () => T0 + 10 * FIVE_MIN });
  const env = parseEnv({ AUTH_RATE_LIMIT_PER_MINUTE: "1000", ADMIN_RATE_LIMIT_PER_MINUTE: "10000", API_RATE_LIMIT_PER_MINUTE: "100000", SUBSCRIPTION_EXPIRY_JOB_MINUTES: "0", CORS_ORIGIN: "http://localhost:3000" });
  app = await buildApp({ env, logger: false, provider, streamSource: new FakeStreamSource(), database: db, now: () => clock });
  await app.listen({ host: "127.0.0.1", port: 0 });
  wsBase = `ws://127.0.0.1:${(app.server.address() as AddressInfo).port}/api/v1/market/stream`;
}, 120_000);
afterAll(async () => {
  await app?.close();
  await db?.close();
  await drop?.();
});

// ─── helpers ───
const api = (cookie: string | null, opts: InjectOptions) => app.inject({ ...opts, headers: { ...(cookie ? { cookie } : {}), ...opts.headers } });
async function signup(name: string, email: string) {
  const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name, email, password: "senha-forte-123" } });
  expect(res.statusCode, res.body).toBe(201);
  const m = String(res.headers["set-cookie"]).match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))!;
  return { cookie: `${SESSION_COOKIE}=${m[1]}`, id: res.json().data.user.id as string };
}
/** SÓ EM TESTE (banco local descartável): promove direto no banco, como o CLI faria. */
const promote = (id: string) => db.require().user.update({ where: { id }, data: { role: "ADMIN" } });
const planId = async (code: string) => (await db.require().plan.findFirstOrThrow({ where: { code }, orderBy: { version: "desc" } })).id;
const iso = (ms: number) => new Date(clock + ms).toISOString();
async function grantPlan(admin: string, userId: string, code: string, kind: "TRIAL" | "MANUAL" | "COMPLIMENTARY", days = 7, extra: object = {}) {
  return api(admin, { method: "POST", url: "/api/v1/admin/subscriptions/manual", payload: { userId, planId: await planId(code), kind, accessUntil: iso(days * D), reason: "teste automatizado de concessão", ...extra } });
}
const access = async (cookie: string) => (await api(cookie, { url: "/api/v1/me/access" })).json().data;

let admin: { cookie: string; id: string };
beforeAll(async () => {
  admin = await signup("Admin", "admin@claritas.test");
  await promote(admin.id);
});

describe("Etapa 1 — papéis e estado da conta", () => {
  it("conta nova é USER/ACTIVE e não acessa a administração", async () => {
    const u = await signup("Novo", "novo@claritas.test");
    expect((await api(u.cookie, { url: "/api/v1/me" })).json().data).toMatchObject({ role: "USER", status: "ACTIVE" });
    expect((await api(u.cookie, { url: "/api/v1/admin/users" })).statusCode).toBe(403);
    expect((await api(null, { url: "/api/v1/admin/users" })).statusCode).toBe(401);
    expect((await api(admin.cookie, { url: "/api/v1/admin/users?pageSize=5" })).json().data).toMatchObject({ page: 1, pageSize: 5 });
  });

  it("suspensão revoga sessões na hora, bloqueia login e é auditada; reativação devolve o login", async () => {
    const u = await signup("Susp", "susp@claritas.test");
    const res = await api(admin.cookie, { method: "PATCH", url: `/api/v1/admin/users/${u.id}/status`, payload: { status: "SUSPENDED", reason: "suspeita de compartilhamento de conta" } });
    expect(res.statusCode, res.body).toBe(200);
    expect((await api(u.cookie, { url: "/api/v1/me" })).statusCode).toBe(401); // sessão apagada
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "susp@claritas.test", password: "senha-forte-123" } });
    expect(login.statusCode).toBe(403);
    expect(login.json().error.code).toBe("ACCOUNT_BLOCKED");
    // Senha errada continua genérica: o estado não vaza para quem não sabe a senha.
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "susp@claritas.test", password: "errada-123" } })).json().error.code).toBe("INVALID_CREDENTIALS");
    const logs = await db.require().adminAuditLog.findMany({ where: { targetId: u.id, action: "user.status_suspended" } });
    expect(logs[0]).toMatchObject({ actorId: admin.id, reason: "suspeita de compartilhamento de conta" });
    await api(admin.cookie, { method: "PATCH", url: `/api/v1/admin/users/${u.id}/status`, payload: { status: "ACTIVE", reason: "verificação concluída" } });
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: { email: "susp@claritas.test", password: "senha-forte-123" } })).statusCode).toBe(200);
  });

  it("admin não altera o próprio estado; motivo é obrigatório", async () => {
    expect((await api(admin.cookie, { method: "PATCH", url: `/api/v1/admin/users/${admin.id}/status`, payload: { status: "SUSPENDED", reason: "tentativa de autossuspensão" } })).statusCode).toBe(409);
    expect((await api(admin.cookie, { method: "PATCH", url: `/api/v1/admin/users/${admin.id}/status`, payload: { status: "SUSPENDED" } })).statusCode).toBe(400);
  });
});

describe("Etapas 3 e 5 — entitlements e assinaturas manuais", () => {
  it("deny-by-default: conta nova não vê mercado nem scanner", async () => {
    const u = await signup("Sem plano", "semplano@claritas.test");
    const a = await access(u.cookie);
    expect(a).toMatchObject({ state: "NONE", subscription: null });
    expect(a.features["terminal.access"]).toEqual({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" });
    expect(a.features["reports.export"].reason).toBe("FEATURE_UNAVAILABLE");
    const res = await api(u.cookie, { url: "/api/v1/market/candles?symbol=TESTUSDT&interval=5m&limit=3" });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatchObject({ code: "ENTITLEMENT_REQUIRED", details: { feature: "terminal.access", reason: "SUBSCRIPTION_INACTIVE" } });
  });

  it("teste Pro concedido pelo admin libera terminal e scanner, com auditoria e sem pagamento", async () => {
    const u = await signup("Trial", "trial@claritas.test");
    const res = await grantPlan(admin.cookie, u.id, "pro", "TRIAL");
    expect(res.statusCode, res.body).toBe(201);
    expect(res.json().data).toMatchObject({ status: "TRIALING", source: "MANUAL", planCode: "pro", current: true });
    const a = await access(u.cookie);
    expect(a.state).toBe("TRIALING");
    expect(a.features["terminal.access"]).toMatchObject({ allowed: true, reason: "ALLOWED_BY_PLAN" });
    expect(a.features["scanner.scan"]).toMatchObject({ allowed: true, limit: 50, remaining: 50 });
    expect((await api(u.cookie, { url: "/api/v1/market/candles?symbol=TESTUSDT&interval=5m&limit=3" })).statusCode).toBe(200);
    const log = await db.require().adminAuditLog.findFirst({ where: { targetId: res.json().data.id, action: "subscription.created_trial" } });
    expect(log).toMatchObject({ actorId: admin.id });
    expect(await db.require().gatewayEvent.count()).toBe(0); // nenhuma "cobrança" fictícia
  });

  it("uma assinatura corrente por usuário: repetir → 409; substituir troca na mesma operação", async () => {
    const u = await signup("Troca", "troca@claritas.test");
    expect((await grantPlan(admin.cookie, u.id, "essencial", "MANUAL")).statusCode).toBe(201);
    expect((await grantPlan(admin.cookie, u.id, "pro", "MANUAL")).statusCode).toBe(409);
    const swap = await grantPlan(admin.cookie, u.id, "pro", "COMPLIMENTARY", 30, { replaceCurrent: true });
    expect(swap.statusCode).toBe(201);
    const subs = await db.require().subscription.findMany({ where: { userId: u.id }, orderBy: { createdAt: "asc" } });
    expect(subs.map((s) => [s.status, s.source, s.endReason])).toEqual([["CANCELED", "MANUAL", "replaced"], ["ACTIVE", "COMPLIMENTARY", null]]);
  });

  it("concorrência: duas concessões simultâneas → só uma corrente (índice parcial)", async () => {
    const u = await signup("Corrida", "corrida@claritas.test");
    const codes = (await Promise.all([grantPlan(admin.cookie, u.id, "pro", "MANUAL"), grantPlan(admin.cookie, u.id, "essencial", "MANUAL")])).map((r) => r.statusCode).sort();
    expect(codes).toEqual([201, 409]);
  });

  it("expiração pelo relógio mesmo com status antigo; o job só normaliza e audita", async () => {
    const u = await signup("Expira", "expira@claritas.test");
    await grantPlan(admin.cookie, u.id, "essencial", "TRIAL", 1);
    const start = clock;
    try {
      clock = start + D + 1;
      expect((await api(u.cookie, { url: "/api/v1/market/quote?symbol=TESTUSDT" })).statusCode).toBe(403);
      expect((await access(u.cookie)).state).toBe("TRIAL_EXPIRED");
      const sub = await db.require().subscription.findFirstOrThrow({ where: { userId: u.id } });
      expect(sub.status).toBe("TRIALING"); // ainda não normalizado — e mesmo assim negado
      await app.subscriptions.expireDue();
      const after = await db.require().subscription.findUniqueOrThrow({ where: { id: sub.id } });
      expect(after).toMatchObject({ status: "EXPIRED", endReason: "trial_expired" });
      expect(await db.require().adminAuditLog.count({ where: { targetId: sub.id, action: "subscription.expired", actorId: null } })).toBe(1);
      await app.subscriptions.expireDue(); // idempotente
      expect(await db.require().adminAuditLog.count({ where: { targetId: sub.id, action: "subscription.expired" } })).toBe(1);
    } finally {
      clock = start;
    }
  });

  it("override DENY vence o plano; revogar devolve o acesso", async () => {
    const u = await signup("Nega", "nega@claritas.test");
    await grantPlan(admin.cookie, u.id, "pro", "MANUAL");
    const deny = await api(admin.cookie, { method: "POST", url: `/api/v1/admin/users/${u.id}/overrides`, payload: { featureKey: "scanner.access", effect: "DENY", endsAt: iso(D), reason: "abuso de varreduras" } });
    expect(deny.statusCode, deny.body).toBe(201);
    expect((await access(u.cookie)).features["scanner.access"]).toMatchObject({ allowed: false, reason: "FEATURE_EXPLICITLY_DENIED" });
    expect((await api(u.cookie, { url: "/api/v1/scanner" })).json().error.details.reason).toBe("FEATURE_EXPLICITLY_DENIED");
    const rev = await api(admin.cookie, { method: "DELETE", url: `/api/v1/admin/users/${u.id}/overrides/${deny.json().data.id}`, payload: { reason: "situação resolvida" } });
    expect(rev.statusCode).toBe(200);
    expect((await access(u.cookie)).features["scanner.access"].allowed).toBe(true);
  });

  it("concessão pontual ALLOW sem assinatura vale só no período indicado e só para a feature", async () => {
    const u = await signup("Pontual", "pontual@claritas.test");
    const res = await api(admin.cookie, { method: "POST", url: `/api/v1/admin/users/${u.id}/overrides`, payload: { featureKey: "terminal.access", effect: "ALLOW", endsAt: iso(2 * H), reason: "demonstração comercial" } });
    expect(res.statusCode).toBe(201);
    expect((await api(u.cookie, { url: "/api/v1/market/quote?symbol=TESTUSDT" })).statusCode).toBe(200);
    expect((await api(u.cookie, { url: "/api/v1/report?symbol=TESTUSDT" })).statusCode).toBe(403);
    const start = clock;
    try {
      clock = start + 3 * H;
      expect((await api(u.cookie, { url: "/api/v1/market/quote?symbol=TESTUSDT" })).statusCode).toBe(403);
    } finally {
      clock = start;
    }
  });

  it("concessão exige fim, motivo e prazo limitado", async () => {
    const u = await signup("Regras", "regras@claritas.test");
    const url = `/api/v1/admin/users/${u.id}/overrides`;
    expect((await api(admin.cookie, { method: "POST", url, payload: { featureKey: "terminal.access", effect: "ALLOW", reason: "sem data de fim" } })).statusCode).toBe(400);
    expect((await api(admin.cookie, { method: "POST", url, payload: { featureKey: "terminal.access", effect: "ALLOW", endsAt: iso(D) } })).statusCode).toBe(400);
    expect((await api(admin.cookie, { method: "POST", url, payload: { featureKey: "terminal.access", effect: "ALLOW", endsAt: iso(500 * D), reason: "longa demais para concessão" } })).statusCode).toBe(400);
  });

  it("IDOR: revogar concessão de outro usuário pelo caminho errado → 404", async () => {
    const a = await signup("Dono", "dono@claritas.test");
    const b = await signup("Outro", "outro@claritas.test");
    const o = await api(admin.cookie, { method: "POST", url: `/api/v1/admin/users/${a.id}/overrides`, payload: { featureKey: "terminal.access", effect: "ALLOW", endsAt: iso(D), reason: "concessão do dono" } });
    expect((await api(admin.cookie, { method: "DELETE", url: `/api/v1/admin/users/${b.id}/overrides/${o.json().data.id}`, payload: { reason: "tentativa cruzada" } })).statusCode).toBe(404);
  });

  it("quota atômica: 10 consumos simultâneos com limite 3 → exatamente 3; retentativa não conta de novo", async () => {
    const u = await signup("Cota", "cota@claritas.test");
    const plan = await api(admin.cookie, { method: "POST", url: "/api/v1/admin/plans", payload: { code: "cota-teste", name: "Cota", features: [{ key: "scanner.access", enabled: true, limit: null }, { key: "scanner.scan", enabled: true, limit: 3 }] } });
    expect(plan.statusCode, plan.body).toBe(201);
    await api(admin.cookie, { method: "POST", url: "/api/v1/admin/subscriptions/manual", payload: { userId: u.id, planId: plan.json().data.id, kind: "MANUAL", accessUntil: iso(D), reason: "teste de quota concorrente" } });
    const svc = new EntitlementsService(db, { now: () => clock });
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => svc.consume(u.id, "scanner.scan", `chave-${i}`)));
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    expect(results.filter((r) => !r.allowed).every((r) => r.reason === "QUOTA_EXCEEDED")).toBe(true);
    const again = await svc.consume(u.id, "scanner.scan", "chave-0");
    expect(again.allowed).toBe(true); // mesma chave já contada: não consome nem nega
    expect((await db.require().usageCounter.findFirstOrThrow({ where: { userId: u.id } })).used).toBe(3);
    expect((await access(u.cookie)).features["scanner.scan"]).toMatchObject({ allowed: false, reason: "QUOTA_EXCEEDED", remaining: 0 });
  });

  it("watchlist respeita o limite do plano", async () => {
    const u = await signup("Lista", "lista@claritas.test");
    const plan = await api(admin.cookie, { method: "POST", url: "/api/v1/admin/plans", payload: { code: "lista-um", name: "Lista 1", features: [{ key: "terminal.access", enabled: true, limit: null }, { key: "watchlist.max_assets", enabled: true, limit: 1 }] } });
    await api(admin.cookie, { method: "POST", url: "/api/v1/admin/subscriptions/manual", payload: { userId: u.id, planId: plan.json().data.id, kind: "MANUAL", accessUntil: iso(D), reason: "teste de limite da watchlist" } });
    expect((await api(u.cookie, { method: "PUT", url: "/api/v1/watchlist/items/TESTUSDT" })).statusCode).toBe(200);
    const over = await api(u.cookie, { method: "PUT", url: "/api/v1/watchlist/items/TESTBTC" });
    expect(over.statusCode).toBe(429);
    expect(over.json().error).toMatchObject({ code: "QUOTA_EXCEEDED", details: { limit: 1 } });
  });
});

describe("Etapa 5 — catálogo de planos", () => {
  it("não publica feature inexistente; publicado é imutável; nova versão arquiva a anterior; público só vê publicados", async () => {
    const bad = await api(admin.cookie, { method: "POST", url: "/api/v1/admin/plans", payload: { code: "fachada", name: "Fachada", features: [{ key: "reports.export", enabled: true, limit: 10 }] } });
    expect(bad.statusCode).toBe(201); // rascunho pode existir...
    const pub = await api(admin.cookie, { method: "POST", url: `/api/v1/admin/plans/${bad.json().data.id}/publish`, payload: { reason: "tentativa de publicar" } });
    expect(pub.statusCode).toBe(400); // ...mas não ser oferecido
    expect(pub.json().error.message).toMatch(/não implementada/);

    const v1 = await api(admin.cookie, { method: "POST", url: "/api/v1/admin/plans", payload: { code: "basico", name: "Básico", features: [{ key: "terminal.access", enabled: true, limit: null }, { key: "reports.export", enabled: false, limit: null }] } });
    expect((await api(admin.cookie, { method: "POST", url: `/api/v1/admin/plans/${v1.json().data.id}/publish`, payload: { reason: "aprovado no comitê" } })).statusCode).toBe(200);
    expect((await api(admin.cookie, { method: "PUT", url: `/api/v1/admin/plans/${v1.json().data.id}`, payload: { code: "basico", name: "Básico 2", features: [] } })).statusCode).toBe(409);
    const v2 = await api(admin.cookie, { method: "POST", url: `/api/v1/admin/plans/${v1.json().data.id}/versions` });
    expect(v2.json().data).toMatchObject({ code: "basico", version: 2, status: "DRAFT" });
    await api(admin.cookie, { method: "POST", url: `/api/v1/admin/plans/${v2.json().data.id}/publish`, payload: { reason: "segunda versão aprovada" } });
    expect((await db.require().plan.findUniqueOrThrow({ where: { id: v1.json().data.id } })).status).toBe("ARCHIVED");
    const pubList = (await app.inject("/api/v1/plans/public")).json().data;
    expect(pubList.map((p: { code: string; version: number }) => `${p.code}@${p.version}`)).toEqual(["basico@2"]);
    expect(pubList[0].features.map((f: { key: string }) => f.key)).toEqual(["terminal.access"]); // desligada/inexistente não aparece
  });

  it("assinatura mantém o snapshot: editar o plano depois não muda quem já tem acesso", async () => {
    const u = await signup("Snap", "snap@claritas.test");
    const draft = await api(admin.cookie, { method: "POST", url: "/api/v1/admin/plans", payload: { code: "snap", name: "Snap", features: [{ key: "terminal.access", enabled: true, limit: null }, { key: "watchlist.max_assets", enabled: true, limit: 5 }] } });
    await api(admin.cookie, { method: "POST", url: "/api/v1/admin/subscriptions/manual", payload: { userId: u.id, planId: draft.json().data.id, kind: "MANUAL", accessUntil: iso(D), reason: "teste de snapshot do plano" } });
    await api(admin.cookie, { method: "PUT", url: `/api/v1/admin/plans/${draft.json().data.id}`, payload: { code: "snap", name: "Snap", features: [{ key: "watchlist.max_assets", enabled: true, limit: 1 }] } });
    const a = await access(u.cookie);
    expect(a.features["terminal.access"].allowed).toBe(true);
    expect(a.features["watchlist.max_assets"].limit).toBe(5);
  });
});

describe("Etapa 10 — auditoria, streams e indicadores", () => {
  it("trilha administrativa é append-only no próprio banco", async () => {
    const row = await db.require().adminAuditLog.findFirstOrThrow();
    await expect(db.require().$executeRawUnsafe(`UPDATE "AdminAuditLog" SET reason = 'x' WHERE id = '${row.id}'`)).rejects.toThrow(/append-only/);
    await expect(db.require().$executeRawUnsafe(`DELETE FROM "AdminAuditLog" WHERE id = '${row.id}'`)).rejects.toThrow(/append-only/);
  });

  it("WebSocket ativo é fechado quando o admin suspende a conta", async () => {
    const u = await signup("Stream", "stream@claritas.test");
    await grantPlan(admin.cookie, u.id, "essencial", "MANUAL");
    const ticket = (await api(u.cookie, { method: "POST", url: "/api/v1/auth/stream-ticket" })).json().data.ticket;
    const ws = new WebSocket(`${wsBase}?ticket=${ticket}`, { headers: { origin: "http://localhost:3000" } });
    await new Promise<void>((res, rej) => {
      ws.once("open", () => res());
      ws.once("error", rej);
    });
    const closed = new Promise<number>((res) => ws.once("close", (code) => res(code)));
    await api(admin.cookie, { method: "PATCH", url: `/api/v1/admin/users/${u.id}/status`, payload: { status: "SUSPENDED", reason: "teste de revogação do stream" } });
    expect(await closed).toBe(4403);
  });

  it("sem acesso não há WebSocket: ticket negado", async () => {
    const u = await signup("Sem stream", "semstream@claritas.test");
    expect((await api(u.cookie, { method: "POST", url: "/api/v1/auth/stream-ticket" })).statusCode).toBe(403);
  });

  it("indicadores: contagens reais; receita pendente (sem gateway); cortesia não é receita", async () => {
    const s = (await api(admin.cookie, { url: "/api/v1/admin/summary" })).json().data;
    expect(s.users.total).toBeGreaterThanOrEqual(15);
    expect(s.users.admins).toBe(1);
    expect(s.access.complimentary).toBeGreaterThanOrEqual(1);
    expect(s.revenue.status).toBe("PENDING_GATEWAY");
    expect(s.recentAudit.length).toBeGreaterThan(0);
    const detail = (await api(admin.cookie, { url: `/api/v1/admin/users/${admin.id}` })).json().data;
    expect(detail.user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(detail)).not.toMatch(/scrypt\$/);
  });

  it("integração de pagamentos: ADIADA, sem eventos", async () => {
    expect((await api(admin.cookie, { url: "/api/v1/admin/integrations/payments" })).json().data).toMatchObject({ status: "DEFERRED", events: [] });
  });
});
