import type { FastifyInstance, FastifyRequest, onRequestHookHandler } from "fastify";
import type { FeatureKey } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import type { AuthContext, SessionVerifier } from "../auth/auth-service";
import { readSessionToken } from "../auth/session-cookie";
import type { StreamTickets } from "../auth/stream-tickets";
import type { AccessPolicy } from "../entitlements/entitlements-service";

/**
 * Política de acesso por rota (Plano 02 §4.4–4.6, deny-by-default):
 *  - public  : sem sessão (entrar/criar conta/sair, planos públicos)
 *  - session : qualquer conta ATIVA (dados do próprio usuário)
 *  - feature : conta ativa + feature liberada pelo motor de entitlements
 *  - admin   : conta ativa + role ADMIN (papel não é plano: não libera features)
 *  - stream  : ticket de uso único + conta ativa + `terminal.access`
 */
export type RoutePolicy =
  | { kind: "public" }
  | { kind: "session" }
  | { kind: "feature"; feature: FeatureKey }
  | { kind: "admin" }
  | { kind: "stream" };

const PUBLIC: RoutePolicy = { kind: "public" };
const SESSION: RoutePolicy = { kind: "session" };
const ADMIN: RoutePolicy = { kind: "admin" };
const feature = (f: FeatureKey): RoutePolicy => ({ kind: "feature", feature: f });

/** Tabela única e auditável (espelhada em docs/SAAS_ROUTES.md). Rota sem entrada = a API não sobe. */
export const ROUTE_POLICIES: Record<string, RoutePolicy> = {
  "POST /api/v1/auth/register": PUBLIC,
  "POST /api/v1/auth/login": PUBLIC,
  "POST /api/v1/auth/logout": PUBLIC,
  "GET /api/v1/auth/session": SESSION,
  "POST /api/v1/auth/stream-ticket": feature("terminal.access"),
  "GET /api/v1/plans/public": PUBLIC,

  "GET /api/v1/me": SESSION,
  "GET /api/v1/me/access": SESSION,
  "GET /api/v1/me/subscription": SESSION,
  "GET /api/v1/me/onboarding": SESSION,
  "PUT /api/v1/me/onboarding": SESSION,
  "POST /api/v1/me/events": SESSION,

  "GET /api/v1/market/assets": feature("terminal.access"),
  "GET /api/v1/market/assets/:symbol": feature("terminal.access"),
  "GET /api/v1/market/quote": feature("terminal.access"),
  "GET /api/v1/market/quotes": feature("terminal.access"),
  "GET /api/v1/market/candles": feature("terminal.access"),
  "GET /api/v1/market/status": feature("terminal.access"),
  "GET /api/v1/market/stream": { kind: "stream" },
  "GET /api/v1/analysis": feature("terminal.access"),
  // A quota `scanner.scan` é consumida no handler, depois desta checagem.
  "GET /api/v1/scanner": feature("scanner.access"),
  "GET /api/v1/report": feature("reports.access"),

  // Dados do próprio usuário. A inclusão na watchlist aplica `watchlist.max_assets` no handler.
  "GET /api/v1/watchlist": SESSION,
  "PUT /api/v1/watchlist/items/:symbol": SESSION,
  "DELETE /api/v1/watchlist/items/:symbol": SESSION,
  "GET /api/v1/preferences": SESSION,
  "PUT /api/v1/preferences": SESSION,
};

const API_PREFIX = "/api/v1/";
const ADMIN_PREFIX = "/api/v1/admin/";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Política de uma rota; `/api/v1/admin/*` é sempre ADMIN. Barra final e HEAD (auto do GET) normalizados. */
export function policyFor(method: string, url: string): RoutePolicy | undefined {
  const path = url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
  if (path.startsWith(ADMIN_PREFIX.slice(0, -1))) return ADMIN;
  return ROUTE_POLICIES[`${method === "HEAD" ? "GET" : method} ${path}`];
}

export interface GuardDeps {
  verifier: SessionVerifier;
  tickets: StreamTickets;
  access: AccessPolicy;
  allowedOrigins: string[];
}

/** Bloqueio de conta (suspensa/desativada/pendente): nega tudo que não é público. */
function assertActive(ctx: AuthContext) {
  if (ctx.user.status !== "ACTIVE") throw new AppError("ACCOUNT_BLOCKED", "Conta sem acesso no momento. Fale com o suporte.", { details: { status: ctx.user.status } });
}

/** Feature liberada ou erro comercial estável (D-S10). */
export async function requireFeature(access: AccessPolicy, userId: string, key: FeatureKey) {
  const d = await access.check(userId, key);
  if (d.allowed) return d;
  if (d.reason === "ACCOUNT_BLOCKED") throw new AppError("ACCOUNT_BLOCKED", "Conta sem acesso no momento. Fale com o suporte.");
  if (d.reason === "QUOTA_EXCEEDED") throw new AppError("QUOTA_EXCEEDED", "Limite do seu plano atingido", { details: { feature: key, limit: d.limit, resetsAt: d.resetsAt } });
  throw new AppError("ENTITLEMENT_REQUIRED", "Recurso não incluído no seu acesso atual", { details: { feature: key, reason: d.reason } });
}

/**
 * Guarda de toda a API v1, acoplado por rota DEPOIS do limite por IP (o @fastify/rate-limit também instala
 * hooks por rota): requisição negada também conta para o limite. Rota sem política → erro na inicialização.
 */
export function registerAccessGuard(app: FastifyInstance, deps: GuardDeps) {
  app.decorateRequest("auth", null);
  app.decorateRequest("streamUserId", null);

  const guardFor = (policy: RoutePolicy): onRequestHookHandler =>
    async function accessGuard(req: FastifyRequest) {
      if (UNSAFE_METHODS.has(req.method)) {
        const origin = req.headers.origin;
        if (origin && !deps.allowedOrigins.includes(origin)) throw new AppError("FORBIDDEN", "Origem não autorizada");
      }
      if (policy.kind === "public") return;

      if (policy.kind === "stream") {
        const userId = deps.tickets.consume((req.query as { ticket?: string }).ticket);
        if (!userId) throw new AppError("UNAUTHENTICATED", "Ticket de stream ausente, expirado ou já usado");
        await requireFeature(deps.access, userId, "terminal.access");
        req.streamUserId = userId;
        return;
      }

      const token = readSessionToken(req.headers.cookie);
      const ctx = token ? await deps.verifier.verify(token) : null;
      if (!ctx) throw new AppError("UNAUTHENTICATED", "Sessão ausente ou expirada");
      assertActive(ctx);
      req.auth = ctx;

      if (policy.kind === "admin") {
        // authorizeAdmin: papel vindo do banco pela sessão — nunca de corpo, query ou cabeçalho do cliente.
        if (ctx.user.role !== "ADMIN") throw new AppError("FORBIDDEN", "Acesso restrito à administração");
        return;
      }
      if (policy.kind === "feature") await requireFeature(deps.access, ctx.user.id, policy.feature);
    };

  app.addHook("onRoute", (route) => {
    if (!route.url.startsWith(API_PREFIX)) return; // /health e /ready seguem públicos
    for (const method of Array.isArray(route.method) ? route.method : [route.method]) {
      const policy = policyFor(method, route.url);
      if (!policy) throw new Error(`Rota sem política de acesso (deny-by-default): ${method} ${route.url} — declare em ROUTE_POLICIES`);
      const own = route.onRequest ? (Array.isArray(route.onRequest) ? route.onRequest : [route.onRequest]) : [];
      route.onRequest = [...own, guardFor(policy)];
      return; // uma política por definição de rota (HEAD herda a do GET)
    }
  });
}

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext | null;
    /** Só no handshake do WebSocket: dono do ticket já validado. */
    streamUserId: string | null;
  }
}
