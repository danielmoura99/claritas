import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type { AccessDecision, AuthUser } from "@claritas/contracts";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import type { SessionVerifier } from "../../src/modules/auth/auth-service";
import { SESSION_COOKIE } from "../../src/modules/auth/session-cookie";
import { StreamTickets } from "../../src/modules/auth/stream-tickets";
import { ROUTE_POLICIES, policyFor, registerAccessGuard } from "../../src/modules/authorization/route-policy";
import { FakeStreamSource } from "../helpers/fake-stream";
import { allowAllAccess } from "../helpers/auth";

// Sessões de teste com papéis/estados diferentes (sem banco).
const users: Record<string, AuthUser> = {
  "token-user-0123456789ab": { id: "u_user", email: "user@claritas.test", name: "User", role: "USER", status: "ACTIVE", createdAt: "2026-10-17T00:00:00.000Z" },
  "token-admin-0123456789a": { id: "u_admin", email: "admin@claritas.test", name: "Admin", role: "ADMIN", status: "ACTIVE", createdAt: "2026-10-17T00:00:00.000Z" },
  "token-susp-01234567890a": { id: "u_susp", email: "susp@claritas.test", name: "Susp", role: "ADMIN", status: "SUSPENDED", createdAt: "2026-10-17T00:00:00.000Z" },
};
const verifier: SessionVerifier = { verify: async (t) => (users[t] ? { user: users[t]!, expiresAt: new Date(Date.now() + 3_600_000) } : null) };
const cookie = (token: string) => ({ cookie: `${SESSION_COOKIE}=${token}` });

/** Acesso de teste: só `u_user` tem `terminal.access`; ninguém tem `scanner.access`. */
const access = {
  ...allowAllAccess,
  async check(userId: string, key: string): Promise<AccessDecision> {
    if (key === "terminal.access" && userId === "u_user") return { allowed: true, reason: "ALLOWED_BY_PLAN" };
    return { allowed: false, reason: key === "scanner.access" ? "FEATURE_NOT_INCLUDED" : "SUBSCRIPTION_INACTIVE" };
  },
};

let app: FastifyInstance;
beforeAll(async () => {
  app = await buildApp({ env: parseEnv({ CORS_ORIGIN: "http://localhost:3000" }), logger: false, streamSource: new FakeStreamSource(), sessions: verifier, access });
});
afterAll(() => app.close());

describe("política de rotas (deny-by-default)", () => {
  it("rota nova sem política impede a API de subir", async () => {
    const bare = Fastify();
    registerAccessGuard(bare, { verifier, tickets: new StreamTickets(), access, allowedOrigins: [] });
    expect(() => bare.get("/api/v1/nova-rota", async () => ({}))).toThrow(/sem política de acesso/);
    await bare.close();
  });

  it("toda rota /api/v1/admin/* é ADMIN; HEAD e barra final seguem o GET", () => {
    expect(policyFor("GET", "/api/v1/admin/qualquer")).toEqual({ kind: "admin" });
    expect(policyFor("HEAD", "/api/v1/market/candles")).toEqual(ROUTE_POLICIES["GET /api/v1/market/candles"]);
    expect(policyFor("GET", "/api/v1/scanner/")).toEqual({ kind: "feature", feature: "scanner.access" });
  });

  it("APIs de mercado, análise, scanner e relatório exigem feature — não basta estar logado", () => {
    for (const k of ["GET /api/v1/market/candles", "GET /api/v1/market/quotes", "GET /api/v1/analysis", "POST /api/v1/auth/stream-ticket"]) expect(ROUTE_POLICIES[k]).toEqual({ kind: "feature", feature: "terminal.access" });
    expect(ROUTE_POLICIES["GET /api/v1/scanner"]).toEqual({ kind: "feature", feature: "scanner.access" });
    expect(ROUTE_POLICIES["GET /api/v1/report"]).toEqual({ kind: "feature", feature: "reports.access" });
  });
});

describe("matriz de acesso (Plano 02 §12)", () => {
  it("sem login: admin → 401", async () => {
    const res = await app.inject("/api/v1/admin/users");
    expect(res.statusCode).toBe(401);
  });

  it("USER autenticado chama API admin → 403 FORBIDDEN", async () => {
    const res = await app.inject({ url: "/api/v1/admin/users", headers: cookie("token-user-0123456789ab") });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
  });

  it("conta suspensa (mesmo ADMIN) não usa admin nem terminal → 403 ACCOUNT_BLOCKED", async () => {
    for (const url of ["/api/v1/admin/users", "/api/v1/market/assets", "/api/v1/me/access"]) {
      const res = await app.inject({ url, headers: cookie("token-susp-01234567890a") });
      expect(res.statusCode, url).toBe(403);
      expect(res.json().error.code).toBe("ACCOUNT_BLOCKED");
    }
  });

  it("USER sem a feature chama o Scanner direto → 403 ENTITLEMENT_REQUIRED com motivo estável", async () => {
    const res = await app.inject({ url: "/api/v1/scanner", headers: cookie("token-user-0123456789ab") });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toMatchObject({ code: "ENTITLEMENT_REQUIRED", details: { feature: "scanner.access", reason: "FEATURE_NOT_INCLUDED" } });
  });

  it("ADMIN não ganha features comerciais por ser admin (D-S07)", async () => {
    const res = await app.inject({ url: "/api/v1/market/assets", headers: cookie("token-admin-0123456789a") });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.details.reason).toBe("SUBSCRIPTION_INACTIVE");
  });

  it("sem terminal.access não há ticket de WebSocket", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/stream-ticket", headers: cookie("token-admin-0123456789a") });
    expect(res.statusCode).toBe(403);
  });

  it("cadastro não aceita role no corpo (escalonamento rejeitado)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "X", email: "x@claritas.test", password: "uma-senha-longa", role: "ADMIN" } });
    expect(res.statusCode).toBe(400);
  });

  it("/plans/public é público; /me exige sessão", async () => {
    expect((await app.inject("/api/v1/me")).statusCode).toBe(401);
    expect((await app.inject({ url: "/api/v1/me", headers: cookie("token-user-0123456789ab") })).json().data).toMatchObject({ id: "u_user", role: "USER" });
  });
});
