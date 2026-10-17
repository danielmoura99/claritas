import type { FeatureKey, ManualSubscriptionCreate, SubscriptionDto } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
import { audit, type Actor } from "../audit/audit";
import { CURRENT_STATUSES, subscriptionGrants, type EntitlementSnapshot } from "../entitlements/evaluate";
import type { AccessEvents } from "../entitlements/entitlements-service";
import type { ProductEvents } from "../metrics/product-events";
import { snapshotOf } from "../plans/plan-service";

type SubWithRefs = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  source: string;
  startsAt: Date;
  accessUntil: Date;
  cancelAtPeriodEnd: boolean;
  endedAt: Date | null;
  endReason: string | null;
  reason: string;
  createdById: string | null;
  createdAt: Date;
  entitlementSnapshot: unknown;
  user: { email: string; name: string };
  plan: { code: string; name: string; version: number };
};

export const subInclude = { user: { select: { email: true, name: true } }, plan: { select: { code: true, name: true, version: true } } } as const;

/** Prazo máximo de uma concessão manual: nenhuma "vitalícia" silenciosa (Plano 02 §6). */
const MAX_MANUAL_DAYS = 3 * 366;

export function subToDto(s: SubWithRefs, now = Date.now()): SubscriptionDto {
  const snap = (s.entitlementSnapshot ?? {}) as EntitlementSnapshot;
  return {
    id: s.id,
    userId: s.userId,
    userEmail: s.user.email,
    userName: s.user.name,
    planId: s.planId,
    planCode: s.plan.code,
    planName: s.plan.name,
    planVersion: s.plan.version,
    status: s.status as SubscriptionDto["status"],
    source: s.source as SubscriptionDto["source"],
    startsAt: s.startsAt.toISOString(),
    accessUntil: s.accessUntil.toISOString(),
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    endedAt: s.endedAt?.toISOString() ?? null,
    endReason: s.endReason,
    reason: s.reason,
    createdById: s.createdById,
    createdAt: s.createdAt.toISOString(),
    current: subscriptionGrants({ status: s.status, startsAt: s.startsAt, accessUntil: s.accessUntil, endReason: s.endReason, snapshot: snap }, now),
    entitlements: Object.entries(snap).map(([key, v]) => ({ key: key as FeatureKey, enabled: v.enabled, limit: v.limit })),
  };
}

/** Estado auditável de uma assinatura (sem nada de pagamento). */
const auditView = (s: { status: string; source: string; planId: string; startsAt: Date; accessUntil: Date; endedAt?: Date | null }) => ({
  status: s.status,
  source: s.source,
  planId: s.planId,
  startsAt: s.startsAt.toISOString(),
  accessUntil: s.accessUntil.toISOString(),
  endedAt: s.endedAt?.toISOString() ?? null,
});

/**
 * Assinaturas MANUAIS (Plano 02 Etapa 5): teste, acesso administrado e cortesia — nunca pagamento.
 * Nenhuma fatura, valor ou "pago" é registrado; a origem OWN_GATEWAY fica reservada para a Etapa 7 (adiada).
 */
export class SubscriptionService {
  constructor(
    private readonly db: Database,
    private readonly events: AccessEvents,
    private readonly product: ProductEvents,
    private readonly now: () => number = Date.now,
  ) {}

  async create(actor: Actor, input: ManualSubscriptionCreate, requestId?: string): Promise<SubscriptionDto> {
    const now = this.now();
    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date(now);
    const accessUntil = new Date(input.accessUntil);
    if (accessUntil.getTime() <= Math.max(now, startsAt.getTime())) throw new AppError("INVALID_REQUEST", "O fim do acesso precisa ser depois de agora e do início");
    if (accessUntil.getTime() - startsAt.getTime() > MAX_MANUAL_DAYS * 86_400_000) throw new AppError("INVALID_REQUEST", `Prazo máximo de uma concessão manual: ${MAX_MANUAL_DAYS} dias`);
    const status = input.kind === "TRIAL" ? "TRIALING" : "ACTIVE";
    const source = input.kind === "COMPLIMENTARY" ? "COMPLIMENTARY" : "MANUAL";

    const created = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } });
        if (!user) throw new AppError("NOT_FOUND", "Usuário não encontrado");
        const plan = await tx.plan.findUnique({ where: { id: input.planId }, include: { features: { include: { feature: { select: { key: true } } } } } });
        if (!plan) throw new AppError("NOT_FOUND", "Plano não encontrado");
        if (plan.status === "ARCHIVED") throw new AppError("CONFLICT", "Plano arquivado não pode ser concedido");
        const current = await tx.subscription.findFirst({ where: { userId: input.userId, status: { in: [...CURRENT_STATUSES] } } });
        if (current) {
          if (!input.replaceCurrent) throw new AppError("CONFLICT", "O usuário já tem uma assinatura corrente — marque a substituição ou revogue antes");
          const ended = await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELED", endedAt: new Date(now), endReason: "replaced" } });
          await audit(tx, actor, { action: "subscription.replaced", targetType: "Subscription", targetId: current.id, reason: input.reason, before: auditView(current), after: auditView(ended), requestId });
        }
        const sub = await tx.subscription.create({
          data: { userId: input.userId, planId: plan.id, status, source, startsAt, accessUntil, entitlementSnapshot: snapshotOf(plan), reason: input.reason, createdById: actor.id },
          include: subInclude,
        });
        await audit(tx, actor, { action: `subscription.created_${input.kind.toLowerCase()}`, targetType: "Subscription", targetId: sub.id, reason: input.reason, after: { ...auditView(sub), userId: sub.userId, planCode: plan.code, planVersion: plan.version }, requestId });
        return sub;
      }),
    ).catch((err) => {
      // Corrida entre duas concessões simultâneas: o índice único parcial garante uma só corrente (D-S05).
      if ((err as { code?: string }).code === "P2002") throw new AppError("CONFLICT", "O usuário já tem uma assinatura corrente");
      throw err;
    });
    this.events.changed(created.userId);
    this.product.record(input.kind === "TRIAL" ? "trial_started" : "subscription_activated", created.userId, { source, plan: created.plan.code });
    return subToDto(created, now);
  }

  async extend(actor: Actor, id: string, accessUntilIso: string, reason: string, requestId?: string): Promise<SubscriptionDto> {
    const now = this.now();
    const accessUntil = new Date(accessUntilIso);
    const updated = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({ where: { id } });
        if (!sub) throw new AppError("NOT_FOUND", "Assinatura não encontrada");
        if (!(CURRENT_STATUSES as readonly string[]).includes(sub.status)) throw new AppError("CONFLICT", "Só assinaturas correntes podem ter o prazo alterado — conceda uma nova");
        if (sub.source === "OWN_GATEWAY") throw new AppError("CONFLICT", "Prazo de assinatura paga vem do gateway, não do admin");
        if (accessUntil.getTime() <= Math.max(now, sub.startsAt.getTime())) throw new AppError("INVALID_REQUEST", "O novo fim precisa ser depois de agora e do início");
        if (accessUntil.getTime() - sub.startsAt.getTime() > MAX_MANUAL_DAYS * 86_400_000) throw new AppError("INVALID_REQUEST", `Prazo máximo de uma concessão manual: ${MAX_MANUAL_DAYS} dias`);
        const done = await tx.subscription.update({ where: { id }, data: { accessUntil }, include: subInclude });
        await audit(tx, actor, { action: "subscription.extended", targetType: "Subscription", targetId: id, reason, before: auditView(sub), after: auditView(done), requestId });
        return done;
      }),
    );
    this.events.changed(updated.userId);
    return subToDto(updated, now);
  }

  /** Revogação imediata (o acesso termina agora; histórico preservado). */
  async revoke(actor: Actor, id: string, reason: string, requestId?: string): Promise<SubscriptionDto> {
    const now = this.now();
    const updated = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const sub = await tx.subscription.findUnique({ where: { id } });
        if (!sub) throw new AppError("NOT_FOUND", "Assinatura não encontrada");
        if (!(CURRENT_STATUSES as readonly string[]).includes(sub.status)) throw new AppError("CONFLICT", "Assinatura já encerrada");
        if (sub.source === "OWN_GATEWAY") throw new AppError("CONFLICT", "Assinatura paga é cancelada pelo gateway (Etapa 7)");
        const done = await tx.subscription.update({ where: { id }, data: { status: "CANCELED", canceledAt: new Date(now), endedAt: new Date(now), endReason: "revoked" }, include: subInclude });
        await audit(tx, actor, { action: "subscription.revoked", targetType: "Subscription", targetId: id, reason, before: auditView(sub), after: auditView(done), requestId });
        return done;
      }),
    );
    this.events.changed(updated.userId);
    this.product.record("subscription_canceled", updated.userId, { source: updated.source, by: "admin" });
    return subToDto(updated, now);
  }

  async list(q: { page: number; pageSize: number; status?: string; source?: string; current?: "true" | "false" }) {
    const now = new Date(this.now());
    const currentWhere = { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] as ("TRIALING" | "ACTIVE" | "PAST_DUE")[] }, startsAt: { lte: now }, accessUntil: { gt: now } };
    const where = {
      ...(q.status ? { status: q.status as "ACTIVE" } : {}),
      ...(q.source ? { source: q.source as "MANUAL" } : {}),
      ...(q.current === "true" ? currentWhere : q.current === "false" ? { NOT: currentWhere } : {}),
    };
    const [total, rows] = await Promise.all([
      this.db.run((p) => p.subscription.count({ where })),
      this.db.run((p) => p.subscription.findMany({ where, include: subInclude, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize })),
    ]);
    return { items: rows.map((r) => subToDto(r, now.getTime())), page: q.page, pageSize: q.pageSize, total };
  }

  async forUser(userId: string) {
    const rows = await this.db.run((p) => p.subscription.findMany({ where: { userId }, include: subInclude, orderBy: { createdAt: "desc" }, take: 50 }));
    return rows.map((r) => subToDto(r, this.now()));
  }

  /**
   * Normaliza status de assinaturas vencidas (D-S14). NÃO é a defesa: o acesso já é negado pelo relógio a cada
   * autorização; aqui só se registra o fim no banco e na auditoria. Idempotente.
   */
  async expireDue(): Promise<number> {
    const now = new Date(this.now());
    const due = await this.db.run((p) => p.subscription.findMany({ where: { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] }, accessUntil: { lte: now } }, take: 500 }));
    for (const s of due) {
      await this.db.run((p) =>
        p.$transaction(async (tx) => {
          const res = await tx.subscription.updateMany({ where: { id: s.id, status: s.status }, data: { status: "EXPIRED", endedAt: s.accessUntil, endReason: s.status === "TRIALING" ? "trial_expired" : "expired" } });
          if (res.count === 1) await audit(tx, { id: null, label: "sistema:expiração" }, { action: "subscription.expired", targetType: "Subscription", targetId: s.id, before: { status: s.status }, after: { status: "EXPIRED", endedAt: s.accessUntil.toISOString() } });
        }),
      );
      this.events.changed(s.userId);
    }
    return due.length;
  }
}
