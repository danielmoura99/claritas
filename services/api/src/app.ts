import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import type { ApiError } from "@claritas/contracts";
import type { Env } from "./config/env";
import { isAppError } from "./infrastructure/errors";

export interface AppOptions {
  env: Env;
  logger?: FastifyServerOptions["logger"];
}

/** Monta a instância Fastify (sem escutar porta) — usada pelo servidor e pelos testes via `inject`. */
export async function buildApp({ env, logger }: AppOptions): Promise<FastifyInstance> {
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

  return app;
}
