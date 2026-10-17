import type { FastifyInstance, InjectOptions } from "fastify";
import { FEATURE_KEYS, type AccessDecision, type AuthUser, type FeatureKey, type MeAccess } from "@claritas/contracts";
import type { AccessPolicy } from "../../src/modules/entitlements/entitlements-service";
import type { SessionVerifier } from "../../src/modules/auth/auth-service";
import { SESSION_COOKIE } from "../../src/modules/auth/session-cookie";

// Sessão de TESTE para as suítes sem banco: um token fixo aceito por um verificador em memória.
export const TEST_SESSION_TOKEN = "sessao-de-teste-0123456789";
export const TEST_USER: AuthUser = { id: "user_teste", email: "analista@claritas.test", name: "Analista de Teste", role: "USER", status: "ACTIVE", createdAt: "2026-10-16T00:00:00.000Z" };

export const testSessions: SessionVerifier = {
  async verify(token) {
    return token === TEST_SESSION_TOKEN ? { user: TEST_USER, expiresAt: new Date(Date.now() + 3_600_000) } : null;
  },
};

export const SESSION_HEADERS = { cookie: `${SESSION_COOKIE}=${TEST_SESSION_TOKEN}` };

/** `app.inject` com o cookie da sessão de teste. */
export function authedInject(app: () => FastifyInstance) {
  return (opts: string | InjectOptions) => {
    const o: InjectOptions = typeof opts === "string" ? { url: opts } : opts;
    return app().inject({ ...o, headers: { ...SESSION_HEADERS, ...o.headers } });
  };
}

/** Ticket de uso único para abrir o WebSocket de mercado. */
export async function streamTicket(app: FastifyInstance): Promise<string> {
  const res = await app.inject({ method: "POST", url: "/api/v1/auth/stream-ticket", headers: SESSION_HEADERS });
  if (res.statusCode !== 200) throw new Error(`ticket: ${res.statusCode} ${res.body}`);
  return res.json().data.ticket;
}

/**
 * Entitlements de TESTE para as suítes sem banco (mercado, scanner, análise…): tudo liberado, com quota ampla.
 * O motor real é coberto por entitlements.test.ts (puro) e pelos testes de banco.
 */
export const allowAllAccess: AccessPolicy = {
  async check(): Promise<AccessDecision> {
    return { allowed: true, reason: "ALLOWED_BY_GRANT", limit: 1_000 };
  },
  async consume(): Promise<AccessDecision> {
    return { allowed: true, reason: "ALLOWED_BY_GRANT", limit: 1_000, remaining: 999 };
  },
  async snapshot(userId): Promise<MeAccess> {
    const features = Object.fromEntries(FEATURE_KEYS.map((k) => [k, { allowed: true, reason: "ALLOWED_BY_GRANT" } satisfies AccessDecision])) as Record<FeatureKey, AccessDecision>;
    return { userId, role: "USER", accountStatus: "ACTIVE", state: "ACTIVE", subscription: null, features, evaluatedAt: new Date().toISOString() };
  },
};
