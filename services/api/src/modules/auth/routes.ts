import type { FastifyInstance, FastifyReply } from "fastify";
import { LoginRequestSchema, RegisterRequestSchema, type Session } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { parseOrThrow } from "../../infrastructure/validation";
import type { AuthContext, AuthService } from "./auth-service";
import type { LoginThrottle } from "./login-throttle";
import { clearedSessionCookie, readSessionToken, sessionCookie } from "./session-cookie";
import type { StreamTickets } from "./stream-tickets";

const toSession = (ctx: AuthContext): Session => ({ user: ctx.user, expiresAt: ctx.expiresAt.toISOString() });

/** Contexto da sessão numa rota protegida (o guarda já garantiu que existe). */
export function authOf(req: { auth: AuthContext | null }): AuthContext {
  if (!req.auth) throw new AppError("UNAUTHENTICATED", "Sessão ausente ou expirada");
  return req.auth;
}

export async function authRoutes(
  app: FastifyInstance,
  {
    auth,
    tickets,
    throttle,
    cookieSecure,
    sessionTtlMs,
    rateLimitPerMinute,
    onSignup,
  }: { auth: AuthService; tickets: StreamTickets; throttle: LoginThrottle; cookieSecure: boolean; sessionTtlMs: number; rateLimitPerMinute: number; onSignup?: (userId: string, trialUntil: Date | null) => void },
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
    const { token, trialUntil, ...ctx } = await auth.register(input);
    setCookie(reply, token);
    req.log.info({ userId: ctx.user.id, trial: Boolean(trialUntil) }, "conta criada");
    onSignup?.(ctx.user.id, trialUntil);
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
