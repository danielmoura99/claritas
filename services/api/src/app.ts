import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import type { ApiError } from "@claritas/contracts";
import type { Env } from "./config/env";
import { AppError, isAppError } from "./infrastructure/errors";
import { TtlCache } from "./infrastructure/cache";
import type { MarketDataProvider, MarketStreamSource } from "./providers/market-data-provider";
import { BinanceStreamSource } from "./providers/binance/stream-source";
import { StreamHub } from "./modules/streaming/hub";
import { streamingRoutes } from "./modules/streaming/routes";
import { BinanceSpotProvider } from "./providers/binance/binance-provider";
import { MarketService } from "./modules/market/market-service";
import { marketRoutes } from "./modules/market/routes";
import { AnalysisService } from "./modules/analysis/analysis-service";
import { analysisRoutes } from "./modules/analysis/routes";
import { ScannerService } from "./modules/scanner/scanner-service";
import { scannerRoutes } from "./modules/scanner/routes";
import { ReportService } from "./modules/report/report-service";
import { reportRoutes } from "./modules/report/routes";
import { Database } from "./infrastructure/db";
import { PreferenceRepository, WatchlistRepository } from "./modules/watchlist/repositories";
import { persistenceRoutes } from "./modules/watchlist/routes";
import { AuthService, type SessionVerifier } from "./modules/auth/auth-service";
import { authRoutes } from "./modules/auth/routes";
import { registerAccessGuard } from "./modules/authorization/route-policy";
import { AccessEvents, EntitlementsService, type AccessPolicy } from "./modules/entitlements/entitlements-service";
import { ProductEvents } from "./modules/metrics/product-events";
import { PlanService } from "./modules/plans/plan-service";
import { SubscriptionService } from "./modules/subscriptions/subscription-service";
import { AdminService } from "./modules/admin/admin-service";
import { adminRoutes } from "./modules/admin/routes";
import { meRoutes, publicPlanRoutes } from "./modules/me/routes";
import { StreamTickets } from "./modules/auth/stream-tickets";
import { LoginThrottle } from "./modules/auth/login-throttle";

export interface AppOptions {
  env: Env;
  logger?: FastifyServerOptions["logger"];
  /** Injeção para testes; em produção é criado a partir do env. */
  provider?: MarketDataProvider;
  streamSource?: MarketStreamSource;
  /** Banco injetável para testes; padrão: DATABASE_URL (ou nenhum). */
  database?: Database;
  /** Verificação de sessão injetável (testes sem banco); padrão: sessões do banco. */
  sessions?: SessionVerifier;
  /** Política de entitlements injetável (testes sem banco); padrão: EntitlementsService no banco. */
  access?: AccessPolicy;
  /** Relógio injetável (testes de expiração). */
  now?: () => number;
}

/** Monta a instância Fastify (sem escutar porta) — usada pelo servidor e pelos testes via `inject`. */
export async function buildApp({ env, logger, provider: injectedProvider, streamSource, database, sessions, access: injectedAccess, now = Date.now }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger ?? { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie"] },
    genReqId: (req) => {
      const incoming = req.headers["x-request-id"];
      return typeof incoming === "string" && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
    },
    requestIdHeader: false,
    // N saltos = confia nos N proxies mais próximos (mesma semântica do número no proxy-addr).
    trustProxy: typeof env.TRUST_PROXY === "number" ? ((hops: number) => (_addr: string, i: number) => i < hops)(env.TRUST_PROXY) : env.TRUST_PROXY,
  });

  app.addHook("onSend", async (req, reply) => {
    reply.header("x-request-id", req.id);
    // API só de dados JSON: cabeçalhos defensivos básicos.
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    reply.header("x-frame-options", "DENY");
  });

  // Limite por IP: protege a API e, por tabela, o orçamento de peso da Binance. Health/ready ficam de fora.
  await app.register(rateLimit, {
    max: env.API_RATE_LIMIT_PER_MINUTE,
    timeWindow: "1 minute",
    allowList: (req) => req.url === "/health" || req.url === "/ready",
    // O objeto retornado é lançado como erro: AppError passa pelo formato padronizado (ApiError).
    errorResponseBuilder: (_req, ctx) => new AppError("RATE_LIMITED", `Limite de ${ctx.max} requisições por minuto excedido`, { retryAfterSec: Math.ceil(ctx.ttl / 1000) }),
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Sem Origin = chamada servidor-a-servidor/curl; com Origin, só as autorizadas.
      if (!origin || env.CORS_ORIGIN.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    methods: ["GET", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  });

  // Banco antes das rotas: a autenticação depende dele.
  const db = database ?? new Database(env.DATABASE_URL);
  app.addHook("onClose", async () => db.close());
  const sessionTtlMs = env.SESSION_TTL_DAYS * 86_400_000;
  const auth = new AuthService(db, {
    sessionTtlMs,
    now,
    signupTrial: env.SIGNUP_TRIAL_DAYS > 0 ? { planCode: env.SIGNUP_TRIAL_PLAN_CODE, days: env.SIGNUP_TRIAL_DAYS } : undefined,
    onWarning: (msg, data) => app.log.warn(data ?? {}, msg),
  });
  const tickets = new StreamTickets(now);
  // Plano 02: motor central de acesso (deny-by-default) + eventos de revogação imediata.
  const entitlements = new EntitlementsService(db, { now });
  const access: AccessPolicy = injectedAccess ?? entitlements;
  const accessEvents = new AccessEvents();
  const productEvents = new ProductEvents(db, app.log.child({ module: "product-events" }));
  const plans = new PlanService(db);
  const subscriptions = new SubscriptionService(db, accessEvents, productEvents, now);
  const admin = new AdminService(db, entitlements, subscriptions, accessEvents, now);
  app.decorate("subscriptions", subscriptions);
  registerAccessGuard(app, { verifier: sessions ?? auth, tickets, access, allowedOrigins: env.CORS_ORIGIN });

  app.setErrorHandler((err, req, reply) => {
    if (isAppError(err)) {
      if (err.retryAfterSec) reply.header("retry-after", String(err.retryAfterSec));
      req.log.warn({ code: err.code, err: err.message }, "request failed");
      const body: ApiError = {
        error: { code: err.code, message: err.message, details: err.details, retryAfterSec: err.retryAfterSec },
        requestId: req.id,
      };
      return reply.status(err.statusCode).send(body);
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.status(status).send({ error: { code: "INVALID_REQUEST", message: (err as Error).message }, requestId: req.id } satisfies ApiError);
    }
    req.log.error({ err }, "unhandled error");
    return reply.status(500).send({ error: { code: "INTERNAL", message: "Erro interno" }, requestId: req.id } satisfies ApiError);
  });

  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ error: { code: "NOT_FOUND", message: `Rota não encontrada: ${req.method} ${req.url}` }, requestId: req.id } satisfies ApiError),
  );

  const startedAt = Date.now();
  /** Liveness: só diz que o processo responde. Não depende de mercado nem banco. */
  app.get("/health", async () => ({ status: "ok", uptimeSec: Math.round((Date.now() - startedAt) / 1000) }));

  const provider =
    injectedProvider ??
    new BinanceSpotProvider({ restUrl: env.BINANCE_SPOT_REST_URL, timeoutMs: env.BINANCE_HTTP_TIMEOUT_MS, log: app.log.child({ module: "binance-rest" }) });
  const market = new MarketService(provider, env.MARKET_FEATURED_SYMBOLS);
  app.decorate("market", market);

  /** Readiness: a API está pronta para servir. O estado do provedor é informativo — mercado instável não derruba a API. */
  const readinessCache = new TtlCache<boolean>(4);
  app.get("/ready", async () => {
    const providerReachable = await readinessCache.getOrLoad("provider", 15_000, () => provider.ping());
    const database = db.configured ? { configured: true, reachable: await readinessCache.getOrLoad("db", 5_000, () => db.ping()) } : { configured: false, reachable: false };
    return { status: "ready", checks: { provider: { id: provider.id, reachable: providerReachable }, stream: app.hub.stats(), database } };
  });

  await app.register(authRoutes, {
    prefix: "/api/v1/auth",
    auth,
    tickets,
    throttle: new LoginThrottle(),
    cookieSecure: env.SESSION_COOKIE_SECURE ?? env.NODE_ENV === "production",
    sessionTtlMs,
    rateLimitPerMinute: env.AUTH_RATE_LIMIT_PER_MINUTE,
    onSignup: (userId, trialUntil) => {
      productEvents.record("signup_completed", userId);
      if (trialUntil) productEvents.record("trial_started", userId, { source: "signup" });
    },
  });
  await app.register(meRoutes, { prefix: "/api/v1/me", access, db, events: productEvents });
  await app.register(publicPlanRoutes, { prefix: "/api/v1/plans", plans });
  await app.register(adminRoutes, { prefix: "/api/v1/admin", admin, plans, subscriptions, rateLimitPerMinute: env.ADMIN_RATE_LIMIT_PER_MINUTE });
  await app.register(marketRoutes, { prefix: "/api/v1/market", market });
  const analysis = new AnalysisService(market);
  await app.register(analysisRoutes, { prefix: "/api/v1/analysis", analysis });
  const scanner = new ScannerService(market, env.SCANNER_CONCURRENCY);
  await app.register(scannerRoutes, { prefix: "/api/v1/scanner", scanner, access, events: productEvents });
  const report = new ReportService(market);
  await app.register(reportRoutes, { prefix: "/api/v1/report", report });
  await app.register(persistenceRoutes, { prefix: "/api/v1", watchlist: new WatchlistRepository(db), preferences: new PreferenceRepository(db), market, access });

  let clockOffsetMs = 0;
  const refreshClockOffset = async () => {
    try {
      clockOffsetMs = (await provider.estimateClockOffsetMs?.()) ?? 0;
      app.log.info({ clockOffsetMs }, "offset de relógio do provedor");
    } catch (err) {
      app.log.warn({ err: String(err) }, "não foi possível estimar o offset de relógio");
    }
  };
  const hub = new StreamHub({
    clockOffsetMs: () => clockOffsetMs,
    source: streamSource ?? new BinanceStreamSource({ wsUrl: env.BINANCE_SPOT_WS_URL, log: app.log.child({ module: "binance-ws" }) }),
    provider: provider.id,
    staleAfterMs: env.STREAM_STALE_AFTER_MS,
    lingerMs: env.STREAM_UPSTREAM_LINGER_MS,
    log: app.log.child({ module: "stream-hub" }),
    // Backfill pós-reconexão: do último candle conhecido até agora (ou as 50 barras mais recentes).
    fetchRecentCandles: (symbol, interval, since) =>
      since === null ? provider.getCandles({ symbol, interval, limit: 50 }) : market.getCandlesRange(symbol, interval, since, Date.now(), 1000),
  });
  app.decorate("hub", hub);
  await app.register(websocket, { options: { maxPayload: 16 * 1024 } });
  await app.register(streamingRoutes, {
    prefix: "/api/v1/market",
    hub,
    market,
    maxSubscriptionsPerClient: env.STREAM_MAX_SUBSCRIPTIONS_PER_CLIENT,
    allowedOrigins: env.CORS_ORIGIN,
    stillAllowed: async (userId) => (await access.check(userId, "terminal.access")).allowed,
    accessEvents,
  });
  let clockTimer: NodeJS.Timeout | undefined;
  let expiryTimer: NodeJS.Timeout | undefined;
  app.addHook("onReady", async () => {
    hub.start();
    // Normaliza assinaturas vencidas (D-S14). O acesso já é negado pelo relógio; o job só registra o fim.
    if (db.configured && env.SUBSCRIPTION_EXPIRY_JOB_MINUTES > 0) {
      const run = () => void subscriptions.expireDue().then((n) => n && app.log.info({ expired: n }, "assinaturas vencidas normalizadas")).catch((err) => app.log.warn({ err: String(err) }, "job de expiração falhou"));
      run();
      expiryTimer = setInterval(run, env.SUBSCRIPTION_EXPIRY_JOB_MINUTES * 60_000);
      expiryTimer.unref();
    }
    if (!streamSource) {
      void refreshClockOffset();
      clockTimer = setInterval(() => void refreshClockOffset(), 10 * 60_000);
      clockTimer.unref();
    }
  });
  app.addHook("onClose", async () => clearInterval(clockTimer));
  app.addHook("onClose", async () => clearInterval(expiryTimer));
  app.addHook("onClose", async () => hub.stop());

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    market: MarketService;
    hub: StreamHub;
    subscriptions: SubscriptionService;
  }
}
