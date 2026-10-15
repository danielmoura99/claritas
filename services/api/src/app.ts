import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import type { ApiError } from "@claritas/contracts";
import type { Env } from "./config/env";
import { isAppError } from "./infrastructure/errors";
import { TtlCache } from "./infrastructure/cache";
import type { MarketDataProvider, MarketStreamSource } from "./providers/market-data-provider";
import { BinanceStreamSource } from "./providers/binance/stream-source";
import { StreamHub } from "./modules/streaming/hub";
import { streamingRoutes } from "./modules/streaming/routes";
import { BinanceSpotProvider } from "./providers/binance/binance-provider";
import { MarketService } from "./modules/market/market-service";
import { marketRoutes } from "./modules/market/routes";

export interface AppOptions {
  env: Env;
  logger?: FastifyServerOptions["logger"];
  /** Injeção para testes; em produção é criado a partir do env. */
  provider?: MarketDataProvider;
  streamSource?: MarketStreamSource;
}

/** Monta a instância Fastify (sem escutar porta) — usada pelo servidor e pelos testes via `inject`. */
export async function buildApp({ env, logger, provider: injectedProvider, streamSource }: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger ?? { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie"] },
    genReqId: (req) => {
      const incoming = req.headers["x-request-id"];
      return typeof incoming === "string" && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
    },
    requestIdHeader: false,
  });

  app.addHook("onSend", async (req, reply) => {
    reply.header("x-request-id", req.id);
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Sem Origin = chamada servidor-a-servidor/curl; com Origin, só as autorizadas.
      if (!origin || env.CORS_ORIGIN.includes(origin)) cb(null, true);
      else cb(null, false);
    },
    methods: ["GET", "PUT", "POST", "DELETE"],
  });

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
    return { status: "ready", checks: { provider: { id: provider.id, reachable: providerReachable }, stream: app.hub.stats() } };
  });

  await app.register(marketRoutes, { prefix: "/api/v1/market", market });

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
  });
  let clockTimer: NodeJS.Timeout | undefined;
  app.addHook("onReady", async () => {
    hub.start();
    if (!streamSource) {
      void refreshClockOffset();
      clockTimer = setInterval(() => void refreshClockOffset(), 10 * 60_000);
      clockTimer.unref();
    }
  });
  app.addHook("onClose", async () => clearInterval(clockTimer));
  app.addHook("onClose", async () => hub.stop());

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    market: MarketService;
    hub: StreamHub;
  }
}
