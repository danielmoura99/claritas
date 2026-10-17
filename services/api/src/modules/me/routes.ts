import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ClientProductEventSchema } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { parseOrThrow } from "../../infrastructure/validation";
import { authOf } from "../auth/routes";
import type { AccessPolicy } from "../entitlements/entitlements-service";
import type { ProductEvents } from "../metrics/product-events";
import type { PlanService } from "../plans/plan-service";

/**
 * Dados do PRÓPRIO usuário (identidade sempre da sessão; nenhum parâmetro de id). Leitura apenas: o usuário
 * não altera papel, estado, plano nem assinatura (Plano 02 §5, Etapa 6).
 */
export async function meRoutes(app: FastifyInstance, { access, db, events }: { access: AccessPolicy; db: Database; events: ProductEvents }) {
  app.addHook("onSend", async (_req, reply) => {
    reply.header("cache-control", "no-store");
  });

  app.get("/", async (req) => ({ data: authOf(req).user }));

  /** Snapshot para a interface. NÃO consome quota e não substitui a checagem de cada rota (§3). */
  app.get("/access", async (req) => ({ data: await access.snapshot(authOf(req).user.id) }));

  app.get("/subscription", async (req) => {
    const snap = await access.snapshot(authOf(req).user.id);
    return { data: { state: snap.state, subscription: snap.subscription } };
  });

  app.put("/onboarding", async (req) => {
    const { done } = parseOrThrow(z.object({ done: z.literal(true) }).strict(), req.body ?? {});
    const userId = authOf(req).user.id;
    const row = await db.run((p) => p.userSettings.upsert({ where: { userId }, update: { onboardingDoneAt: new Date() }, create: { userId, onboardingDoneAt: new Date() } }));
    return { data: { done, at: row.onboardingDoneAt?.toISOString() ?? null } };
  });

  app.get("/onboarding", async (req) => {
    const row = await db.run((p) => p.userSettings.findUnique({ where: { userId: authOf(req).user.id }, select: { onboardingDoneAt: true } }));
    return { data: { done: Boolean(row?.onboardingDoneAt), at: row?.onboardingDoneAt?.toISOString() ?? null } };
  });

  /**
   * Portabilidade/acesso (LGPD art. 18, II e V): tudo o que o Claritas guarda sobre a pessoa, em JSON, sem segredos
   * (nenhum hash de senha nem token de sessão). Limite baixo por ser consulta ampla.
   */
  app.get("/export", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
    const userId = authOf(req).user.id;
    const data = await db.run(async (p) => {
      const [user, settings, watchlist, subscriptions, overrides, consents, sessions, events] = await Promise.all([
        p.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true } }),
        p.userSettings.findUnique({ where: { userId } }),
        p.watchlist.findUnique({ where: { userId }, include: { items: { select: { baseAsset: true, quoteAsset: true, position: true, createdAt: true } } } }),
        p.subscription.findMany({ where: { userId }, select: { status: true, source: true, startsAt: true, accessUntil: true, endedAt: true, endReason: true, createdAt: true, plan: { select: { code: true, name: true, version: true } } } }),
        p.featureOverride.findMany({ where: { userId }, select: { featureKey: true, effect: true, limitValue: true, startsAt: true, endsAt: true, revokedAt: true, createdAt: true } }),
        p.consentRecord.findMany({ where: { userId }, select: { documentType: true, documentVersion: true, acceptedAt: true, source: true } }),
        p.session.findMany({ where: { userId }, select: { createdAt: true, expiresAt: true, lastUsedAt: true } }),
        p.productEvent.findMany({ where: { userId }, select: { name: true, occurredAt: true } }),
      ]);
      return { exportedAt: new Date().toISOString(), user, settings, watchlist, subscriptions, overrides, consents, sessions, productEvents: events };
    });
    reply.header("content-disposition", `attachment; filename="claritas-meus-dados.json"`);
    return { data };
  });

  /** Lista fechada de eventos de produto do cliente (D-S16); o resto é registrado no servidor. */
  app.post("/events", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req, reply) => {
    const ev = parseOrThrow(ClientProductEventSchema, req.body ?? {});
    events.record(ev.name, authOf(req).user.id, ev.props);
    return reply.status(202).send({ data: null });
  });
}

/** Ofertas publicadas (público, sem sessão): só versões aprovadas e só features que existem. */
export async function publicPlanRoutes(app: FastifyInstance, { plans }: { plans: PlanService }) {
  app.get("/public", async () => ({ data: await plans.publicPlans() }));
}
