import type { FastifyInstance, InjectOptions } from "fastify";
import type { AuthUser } from "@claritas/contracts";
import type { SessionVerifier } from "../../src/modules/auth/auth-service";
import { SESSION_COOKIE } from "../../src/modules/auth/session-cookie";

// Sessão de TESTE para as suítes sem banco: um token fixo aceito por um verificador em memória.
export const TEST_SESSION_TOKEN = "sessao-de-teste-0123456789";
export const TEST_USER: AuthUser = { id: "user_teste", email: "analista@claritas.test", name: "Analista de Teste", createdAt: "2026-10-16T00:00:00.000Z" };

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
