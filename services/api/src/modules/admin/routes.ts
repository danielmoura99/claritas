import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AdminAuditQuerySchema,
  AdminStatusChangeSchema,
  AdminSubscriptionsQuerySchema,
  AdminUsersQuerySchema,
  ManualSubscriptionCreateSchema,
  OverrideCreateSchema,
  PlanUpsertSchema,
  RevokeSchema,
  SubscriptionExtendSchema,
} from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { Actor } from "../audit/audit";
import { authOf } from "../auth/routes";
import type { PlanService } from "../plans/plan-service";
import type { SubscriptionService } from "../subscriptions/subscription-service";
import type { AdminService } from "./admin-service";

const IdParams = z.object({ id: z.string().min(1).max(64) });
const OverrideParams = IdParams.extend({ overrideId: z.string().min(1).max(64) });

/**
 * API administrativa. O guarda já exigiu sessão ATIVA + role ADMIN (route-policy: `/api/v1/admin/*`).
 * O autor de cada mudança vem SEMPRE da sessão — nunca do corpo da requisição.
 */
export async function adminRoutes(app: FastifyInstance, { admin, plans, subscriptions, rateLimitPerMinute }: { admin: AdminService; plans: PlanService; subscriptions: SubscriptionService; rateLimitPerMinute: number }) {
  const limited = { config: { rateLimit: { max: rateLimitPerMinute, timeWindow: "1 minute" } } };
  const actorOf = (req: FastifyRequest): Actor & { id: string } => {
    const { user } = authOf(req);
    return { id: user.id, label: user.email };
  };
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get("/summary", limited, async () => ({ data: await admin.summary() }));

  app.get("/users", limited, async (req) => ({ data: await admin.listUsers(parseOrThrow(AdminUsersQuerySchema, req.query)) }));
  app.get("/users/:id", limited, async (req) => ({ data: await admin.userDetail(parseOrThrow(IdParams, req.params).id) }));
  app.get("/users/:id/access", limited, async (req) => ({ data: (await admin.userDetail(parseOrThrow(IdParams, req.params).id)).access }));
  app.patch("/users/:id/status", limited, async (req) => {
    const { id } = parseOrThrow(IdParams, req.params);
    return { data: await admin.setStatus(actorOf(req), id, parseOrThrow(AdminStatusChangeSchema, req.body ?? {}), req.id) };
  });
  app.post("/users/:id/overrides", limited, async (req, reply) => {
    const { id } = parseOrThrow(IdParams, req.params);
    return reply.status(201).send({ data: await admin.createOverride(actorOf(req), id, parseOrThrow(OverrideCreateSchema, req.body ?? {}), req.id) });
  });
  app.delete("/users/:id/overrides/:overrideId", limited, async (req) => {
    const { id, overrideId } = parseOrThrow(OverrideParams, req.params);
    const { reason } = parseOrThrow(RevokeSchema, req.body ?? {});
    return { data: await admin.revokeOverride(actorOf(req), id, overrideId, reason, req.id) };
  });

  app.get("/features", limited, async () => ({ data: await plans.features() }));
  app.get("/plans", limited, async () => ({ data: await plans.list() }));
  app.post("/plans", limited, async (req, reply) => reply.status(201).send({ data: await plans.createDraft(actorOf(req), parseOrThrow(PlanUpsertSchema, req.body ?? {}), req.id) }));
  app.put("/plans/:id", limited, async (req) => ({ data: await plans.updateDraft(actorOf(req), parseOrThrow(IdParams, req.params).id, parseOrThrow(PlanUpsertSchema, req.body ?? {}), req.id) }));
  app.post("/plans/:id/versions", limited, async (req, reply) => reply.status(201).send({ data: await plans.newVersion(actorOf(req), parseOrThrow(IdParams, req.params).id, req.id) }));
  app.post("/plans/:id/publish", limited, async (req) => {
    const { reason } = parseOrThrow(RevokeSchema, req.body ?? {});
    return { data: await plans.publish(actorOf(req), parseOrThrow(IdParams, req.params).id, reason, req.id) };
  });
  app.post("/plans/:id/archive", limited, async (req) => {
    const { reason } = parseOrThrow(RevokeSchema, req.body ?? {});
    return { data: await plans.archive(actorOf(req), parseOrThrow(IdParams, req.params).id, reason, req.id) };
  });

  app.get("/subscriptions", limited, async (req) => ({ data: await subscriptions.list(parseOrThrow(AdminSubscriptionsQuerySchema, req.query)) }));
  app.post("/subscriptions/manual", limited, async (req, reply) => reply.status(201).send({ data: await subscriptions.create(actorOf(req), parseOrThrow(ManualSubscriptionCreateSchema, req.body ?? {}), req.id) }));
  app.post("/subscriptions/:id/extend", limited, async (req) => {
    const body = parseOrThrow(SubscriptionExtendSchema, req.body ?? {});
    return { data: await subscriptions.extend(actorOf(req), parseOrThrow(IdParams, req.params).id, body.accessUntil, body.reason, req.id) };
  });
  app.post("/subscriptions/:id/revoke", limited, async (req) => {
    const { reason } = parseOrThrow(RevokeSchema, req.body ?? {});
    return { data: await subscriptions.revoke(actorOf(req), parseOrThrow(IdParams, req.params).id, reason, req.id) };
  });

  app.get("/audit", limited, async (req) => ({ data: await admin.auditLog(parseOrThrow(AdminAuditQuerySchema, req.query)) }));

  /** Etapa 7 ADIADA: nenhuma integração ativa; mostra só o que estiver gravado (nada, nesta fase). */
  app.get("/integrations/payments", limited, async () => ({
    data: {
      status: "DEFERRED" as const,
      note: "Integração com o gateway próprio adiada por decisão do responsável. Nenhum checkout, webhook ou cobrança está ativo; acessos são concedidos manualmente.",
      events: [],
    },
  }));
}
