import type { FastifyInstance, FastifyReply, onRequestHookHandler } from "fastify";
import { LoginRequestSchema, RegisterRequestSchema, type Session } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { parseOrThrow } from "../../infrastructure/validation";
import type { AuthContext, AuthService, SessionVerifier } from "./auth-service";
import type { LoginThrottle } from "./login-throttle";
import { clearedSessionCookie, readSessionToken, sessionCookie } from "./session-cookie";
import type { StreamTickets } from "./stream-tickets";

const API_PREFIX = "/api/v1/";
/** Únicas rotas da API v1 acessíveis sem sessão. */
const PUBLIC_PATHS = new Set(["/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/logout"]);
const STREAM_PATH = "/api/v1/market/stream";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const toSession = (ctx: AuthContext): Session => ({ user: ctx.user, expiresAt: ctx.expiresAt.toISOString() });

/**
 * Guarda da API: toda rota em /api/v1 exige sessão, exceto entrar/criar conta/sair.
 * O WebSocket de mercado aceita um ticket de uso único no lugar do cookie.
 * Escritas com Origin de outro site são recusadas (defesa CSRF somada ao SameSite=Lax).
 */
export function registerAuthGuard(app: FastifyInstance, { verifier, tickets, allowedOrigins }: { verifier: SessionVerifier; tickets: StreamTickets; allowedOrigins: string[] }) {
  app.decorateRequest("auth", null);
  const guard: onRequestHookHandler = async (req) => {
    const path = req.routeOptions.url!;
    if (UNSAFE_METHODS.has(req.method)) {
      const origin = req.headers.origin;
      if (origin && !allowedOrigins.includes(origin)) throw new AppError("FORBIDDEN", "Origem não autorizada");
    }
    if (PUBLIC_PATHS.has(path)) return;
    if (path === STREAM_PATH) {
      if (!tickets.consume((req.query as { ticket?: string }).ticket)) throw new AppError("UNAUTHENTICATED", "Ticket de stream ausente, expirado ou já usado");
      return;
    }
    const token = readSessionToken(req.headers.cookie);
    const ctx = token ? await verifier.verify(token) : null;
    if (!ctx) throw new AppError("UNAUTHENTICATED", "Sessão ausente ou expirada");
    req.auth = ctx;
  };
  // Acoplado por rota (e não como hook global) para rodar DEPOIS do limite por IP, que o
  // @fastify/rate-limit também instala por rota: requisição sem sessão conta para o limite.
  // /health e /ready ficam fora do prefixo e seguem públicos.
  app.addHook("onRoute", (route) => {
    if (!route.url.startsWith(API_PREFIX)) return;
    const own = route.onRequest ? (Array.isArray(route.onRequest) ? route.onRequest : [route.onRequest]) : [];
    route.onRequest = [...own, guard];
  });
}

/** Contexto da sessão numa rota protegida (o guarda já garantiu que existe). */
export function authOf(req: { auth: AuthContext | null }): AuthContext {
  if (!req.auth) throw new AppError("UNAUTHENTICATED", "Sessão ausente ou expirada");
  return req.auth;
}

export async function authRoutes(
  app: FastifyInstance,
  { auth, tickets, throttle, cookieSecure, sessionTtlMs, rateLimitPerMinute }: { auth: AuthService; tickets: StreamTickets; throttle: LoginThrottle; cookieSecure: boolean; sessionTtlMs: number; rateLimitPerMinute: number },
) {
  // Limite próprio, bem mais baixo que o geral, nas rotas que recebem senha.
  const strict = { config: { rateLimit: { max: rateLimitPerMinute, timeWindow: "1 minute" } } };
  const setCookie = (reply: FastifyReply, token: string, remember = true) =>
    reply.header("set-cookie", sessionCookie(token, { maxAgeSec: remember ? Math.floor(sessionTtlMs / 1000) : undefined, secure: cookieSecure }));
  // Respostas com sessão nunca vão para cache intermediário.
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.post("/register", strict, async (req, reply) => {
    const input = parseOrThrow(RegisterRequestSchema, req.body ?? {});
    const { token, ...ctx } = await auth.register(input);
    setCookie(reply, token);
    req.log.info({ userId: ctx.user.id }, "conta criada");
    return reply.status(201).send({ data: toSession(ctx) });
  });

  app.post("/login", strict, async (req, reply) => {
    const input = parseOrThrow(LoginRequestSchema, req.body ?? {});
    const wait = throttle.retryAfterSec(input.email);
    if (wait > 0) throw new AppError("RATE_LIMITED", "Muitas tentativas para este e-mail. Aguarde e tente de novo.", { retryAfterSec: wait });
    try {
      const { token, ...ctx } = await auth.login(input);
      throttle.succeed(input.email);
      setCookie(reply, token, input.remember !== false);
      return { data: toSession(ctx) };
    } catch (err) {
      if (err instanceof AppError && err.code === "INVALID_CREDENTIALS") throttle.fail(input.email);
      throw err;
    }
  });

  /** Idempotente: sem sessão também responde 200 e limpa o cookie. */
  app.post("/logout", async (req, reply) => {
    const token = readSessionToken(req.headers.cookie);
    if (token) await auth.logout(token);
    reply.header("set-cookie", clearedSessionCookie(cookieSecure));
    return { data: null };
  });

  app.get("/session", async (req) => ({ data: toSession(authOf(req)) }));

  app.post("/stream-ticket", async (req) => {
    const t = tickets.issue(authOf(req).user.id);
    return { data: { ticket: t.ticket, expiresAt: t.expiresAt.toISOString() } };
  });
}

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}
