import type { AdminStatusChange, AdminSummary, AdminUserDetail, AdminUserRow, AdminUsersQuery, AuditEntry, MeSubscription, OverrideCreate, OverrideDto } from "@claritas/contracts";
import type { Prisma } from "../../generated/prisma/client";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
import { audit, auditToDto, type Actor } from "../audit/audit";
import { CATALOG_BY_KEY } from "../entitlements/catalog";
import { isOverrideActive } from "../entitlements/evaluate";
import type { AccessEvents, EntitlementsService } from "../entitlements/entitlements-service";
import type { SubscriptionService } from "../subscriptions/subscription-service";

const DAY = 86_400_000;
/** Concessão individual: no máximo ~1 ano, sempre com fim explícito (Plano 02 §6). */
const MAX_OVERRIDE_DAYS = 366;

type OverrideRow = { id: string; featureKey: string; effect: "ALLOW" | "DENY"; limitValue: number | null; startsAt: Date; endsAt: Date; reason: string; createdById: string; createdAt: Date; revokedAt: Date | null; revokeReason: string | null };

const overrideToDto = (o: OverrideRow, now: number): OverrideDto => ({
  id: o.id,
  featureKey: o.featureKey as OverrideDto["featureKey"],
  effect: o.effect,
  limitValue: o.limitValue,
  startsAt: o.startsAt.toISOString(),
  endsAt: o.endsAt.toISOString(),
  reason: o.reason,
  createdById: o.createdById,
  createdAt: o.createdAt.toISOString(),
  revokedAt: o.revokedAt?.toISOString() ?? null,
  revokeReason: o.revokeReason,
  active: isOverrideActive(o, now),
});

const overrideAudit = (o: OverrideRow) => ({ featureKey: o.featureKey, effect: o.effect, limitValue: o.limitValue, startsAt: o.startsAt.toISOString(), endsAt: o.endsAt.toISOString(), revokedAt: o.revokedAt?.toISOString() ?? null });

/** Administração de contas (Plano 02 §7.2–7.3, §7.6, §7.1). Toda mudança: transação + auditoria + revogação imediata. */
export class AdminService {
  constructor(
    private readonly db: Database,
    private readonly entitlements: EntitlementsService,
    private readonly subscriptions: SubscriptionService,
    private readonly events: AccessEvents,
    private readonly now: () => number = Date.now,
  ) {}

  /** Onde "tem acesso ao terminal agora" vira filtro SQL (mesma regra do motor: assinatura válida que inclui, ou ALLOW ativo). */
  private terminalAccessWhere(now: Date): Prisma.UserWhereInput {
    return {
      status: "ACTIVE",
      OR: [
        { subscriptions: { some: { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] }, startsAt: { lte: now }, accessUntil: { gt: now } } } },
        { featureOverrides: { some: { featureKey: "terminal.access", effect: "ALLOW", revokedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } } },
      ],
      NOT: { featureOverrides: { some: { featureKey: "terminal.access", effect: "DENY", revokedAt: null, startsAt: { lte: now }, endsAt: { gt: now } } } },
    };
  }

  async listUsers(q: AdminUsersQuery) {
    const now = new Date(this.now());
    const and: Prisma.UserWhereInput[] = [];
    if (q.search) and.push({ OR: [{ email: { contains: q.search.toLowerCase() } }, { name: { contains: q.search, mode: "insensitive" } }] });
    if (q.status) and.push({ status: q.status });
    if (q.role) and.push({ role: q.role });
    if (q.plan) and.push({ subscriptions: { some: { status: { in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE"] }, plan: { code: q.plan } } } });
    if (q.access === "WITH_ACCESS") and.push(this.terminalAccessWhere(now));
    if (q.access === "WITHOUT_ACCESS") and.push({ NOT: this.terminalAccessWhere(now) });
    const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};
    const [field, dir] = q.sort.split(":") as ["createdAt" | "email", "asc" | "desc"];
    const [total, users] = await Promise.all([
      this.db.run((p) => p.user.count({ where })),
      this.db.run((p) =>
        p.user.findMany({
          where,
          orderBy: { [field]: dir },
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
          // PII mínima: nunca hash de senha nem dados de sessão (§7.2).
          select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
        }),
      ),
    ]);
    const ids = users.map((u) => u.id);
    const [lastSeen, withAccess] = await Promise.all([
      this.db.run((p) => p.session.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _max: { lastUsedAt: true } })),
      this.db.run((p) => p.user.findMany({ where: { AND: [{ id: { in: ids } }, this.terminalAccessWhere(now)] }, select: { id: true } })),
    ]);
    const seen = new Map(lastSeen.map((s) => [s.userId, s._max.lastUsedAt]));
    const access = new Set(withAccess.map((u) => u.id));
    const items: AdminUserRow[] = [];
    for (const u of users) {
      const sub = await this.entitlements.latestSubscription(u.id);
      const subscription: MeSubscription | null = sub
        ? { planCode: sub.plan.code, planName: sub.plan.name, status: sub.status as MeSubscription["status"], source: sub.source as MeSubscription["source"], startsAt: sub.startsAt.toISOString(), accessUntil: sub.accessUntil.toISOString(), cancelAtPeriodEnd: sub.cancelAtPeriodEnd }
        : null;
      items.push({ ...u, createdAt: u.createdAt.toISOString(), lastSeenAt: seen.get(u.id)?.toISOString() ?? null, subscription, hasTerminalAccess: access.has(u.id) });
    }
    return { items, page: q.page, pageSize: q.pageSize, total };
  }

  async userDetail(id: string): Promise<AdminUserDetail> {
    const now = this.now();
    const user = await this.db.run((p) =>
      p.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, status: true, statusReason: true, statusChangedAt: true, createdAt: true } }),
    );
    if (!user) throw new AppError("NOT_FOUND", "Usuário não encontrado");
    const [sessions, overrides, timeline, access, subscriptions] = await Promise.all([
      this.db.run((p) => p.session.aggregate({ where: { userId: id, expiresAt: { gt: new Date(now) } }, _count: { _all: true }, _max: { lastUsedAt: true } })),
      this.db.run((p) => p.featureOverride.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 })),
      this.timelineFor(id),
      this.entitlements.snapshot(id),
      this.subscriptions.forUser(id),
    ]);
    return {
      user: { ...user, createdAt: user.createdAt.toISOString(), statusChangedAt: user.statusChangedAt?.toISOString() ?? null, lastSeenAt: sessions._max.lastUsedAt?.toISOString() ?? null, activeSessions: sessions._count._all },
      access,
      subscriptions,
      overrides: overrides.map((o) => overrideToDto(o, now)),
      timeline,
    };
  }

  /** Linha do tempo do usuário: ações sobre ele, suas assinaturas e suas concessões. */
  private async timelineFor(userId: string): Promise<AuditEntry[]> {
    const [subs, ovs] = await Promise.all([
      this.db.run((p) => p.subscription.findMany({ where: { userId }, select: { id: true } })),
      this.db.run((p) => p.featureOverride.findMany({ where: { userId }, select: { id: true } })),
    ]);
    const rows = await this.db.run((p) =>
      p.adminAuditLog.findMany({ where: { targetId: { in: [userId, ...subs.map((s) => s.id), ...ovs.map((o) => o.id)] } }, orderBy: { createdAt: "desc" }, take: 100 }),
    );
    return rows.map(auditToDto);
  }

  /** Suspender/reativar/desativar (§4.3). Bloqueio revoga TODAS as sessões e fecha streams na hora. */
  async setStatus(actor: Actor & { id: string }, targetId: string, input: AdminStatusChange, requestId?: string) {
    if (actor.id === targetId) throw new AppError("CONFLICT", "Um admin não altera o estado da própria conta");
    await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: targetId }, select: { id: true, status: true, role: true } });
        if (!user) throw new AppError("NOT_FOUND", "Usuário não encontrado");
        if (user.status === input.status) throw new AppError("CONFLICT", "A conta já está neste estado");
        if (user.role === "ADMIN" && input.status !== "ACTIVE") {
          const admins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
          if (admins <= 1) throw new AppError("CONFLICT", "Não é possível bloquear o último admin ativo");
        }
        await tx.user.update({ where: { id: targetId }, data: { status: input.status, statusReason: input.reason, statusChangedAt: new Date(this.now()) } });
        let revoked = 0;
        if (input.status !== "ACTIVE") revoked = (await tx.session.deleteMany({ where: { userId: targetId } })).count;
        await audit(tx, actor, { action: `user.status_${input.status.toLowerCase()}`, targetType: "User", targetId, reason: input.reason, before: { status: user.status }, after: { status: input.status, sessionsRevoked: revoked }, requestId });
      }),
    );
    this.events.changed(targetId);
    return this.userDetail(targetId);
  }

  async createOverride(actor: Actor & { id: string }, userId: string, input: OverrideCreate, requestId?: string) {
    const now = this.now();
    const startsAt = input.startsAt ? new Date(input.startsAt) : new Date(now);
    const endsAt = new Date(input.endsAt);
    if (!CATALOG_BY_KEY.has(input.featureKey)) throw new AppError("INVALID_REQUEST", "Feature desconhecida");
    if (endsAt.getTime() <= Math.max(now, startsAt.getTime())) throw new AppError("INVALID_REQUEST", "O fim precisa ser depois de agora e do início");
    if (endsAt.getTime() - startsAt.getTime() > MAX_OVERRIDE_DAYS * DAY) throw new AppError("INVALID_REQUEST", `Prazo máximo de uma concessão individual: ${MAX_OVERRIDE_DAYS} dias`);
    const kind = CATALOG_BY_KEY.get(input.featureKey)!.kind;
    if (kind === "BOOLEAN" && input.limitValue != null) throw new AppError("INVALID_REQUEST", "Esta feature não aceita limite");
    if (input.effect === "DENY" && input.limitValue != null) throw new AppError("INVALID_REQUEST", "Negação não leva limite");
    const created = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user) throw new AppError("NOT_FOUND", "Usuário não encontrado");
        const o = await tx.featureOverride.create({
          data: { userId, featureKey: input.featureKey, effect: input.effect, limitValue: input.limitValue ?? null, startsAt, endsAt, reason: input.reason, createdById: actor.id },
        });
        await audit(tx, actor, { action: input.effect === "ALLOW" ? "override.granted" : "override.denied", targetType: "FeatureOverride", targetId: o.id, reason: input.reason, after: { userId, ...overrideAudit(o) }, requestId });
        return o;
      }),
    );
    this.events.changed(userId);
    return overrideToDto(created, now);
  }

  async revokeOverride(actor: Actor & { id: string }, userId: string, overrideId: string, reason: string, requestId?: string) {
    const now = this.now();
    const done = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const o = await tx.featureOverride.findUnique({ where: { id: overrideId } });
        // Pertencimento verificado: a concessão precisa ser do usuário do caminho (sem IDOR entre contas).
        if (!o || o.userId !== userId) throw new AppError("NOT_FOUND", "Concessão não encontrada");
        if (o.revokedAt) throw new AppError("CONFLICT", "Concessão já revogada");
        const r = await tx.featureOverride.update({ where: { id: overrideId }, data: { revokedAt: new Date(now), revokedById: actor.id, revokeReason: reason } });
        await audit(tx, actor, { action: "override.revoked", targetType: "FeatureOverride", targetId: overrideId, reason, before: overrideAudit(o), after: overrideAudit(r), requestId });
        return r;
      }),
    );
    this.events.changed(userId);
    return overrideToDto(done, now);
  }

  async auditLog(q: { page: number; pageSize: number; targetId?: string; actorId?: string; action?: string; from?: string; to?: string }) {
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(q.targetId ? { targetId: q.targetId } : {}),
      ...(q.actorId ? { actorId: q.actorId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lt: new Date(q.to) } : {}) } } : {}),
    };
    const [total, rows] = await Promise.all([
      this.db.run((p) => p.adminAuditLog.count({ where })),
      this.db.run((p) => p.adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize })),
    ]);
    return { items: rows.map(auditToDto), page: q.page, pageSize: q.pageSize, total };
  }

  /**
   * Indicadores verificáveis (§7.1, Etapa 9). Fórmulas em docs/SAAS_METRICS.md. Receita: PENDENTE — sem gateway
   * não há pagamento real a somar (cortesias e testes nunca entram em MRR).
   */
  async summary(): Promise<AdminSummary> {
    const nowMs = this.now();
    const now = new Date(nowMs);
    const ago = (d: number) => new Date(nowMs - d * DAY);
    const granting = { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] as ("TRIALING" | "ACTIVE" | "PAST_DUE")[] }, startsAt: { lte: now }, accessUntil: { gt: now } };
    const q = <T>(fn: (p: Parameters<Parameters<Database["run"]>[0]>[0]) => Promise<T>) => this.db.run(fn);
    const distinctUsers = async (name: string) => (await q((p) => p.productEvent.groupBy({ by: ["userId"], where: { name, occurredAt: { gte: ago(30) }, userId: { not: null } } }))).length;
    const [total, active, suspended, admins, s7, s30, seen7, seen30, withAccess, trialing, manual, complimentary, expiring, expired30, firstChart, scans, scanUsers, upgrade, recent] = await Promise.all([
      q((p) => p.user.count()),
      q((p) => p.user.count({ where: { status: "ACTIVE" } })),
      q((p) => p.user.count({ where: { status: { in: ["SUSPENDED", "DEACTIVATED"] } } })),
      q((p) => p.user.count({ where: { role: "ADMIN" } })),
      q((p) => p.user.count({ where: { createdAt: { gte: ago(7) } } })),
      q((p) => p.user.count({ where: { createdAt: { gte: ago(30) } } })),
      q((p) => p.user.count({ where: { sessions: { some: { lastUsedAt: { gte: ago(7) } } } } })),
      q((p) => p.user.count({ where: { sessions: { some: { lastUsedAt: { gte: ago(30) } } } } })),
      q((p) => p.user.count({ where: this.terminalAccessWhere(now) })),
      q((p) => p.subscription.count({ where: { ...granting, status: "TRIALING" } })),
      q((p) => p.subscription.count({ where: { ...granting, source: "MANUAL", status: { in: ["ACTIVE", "PAST_DUE"] } } })),
      q((p) => p.subscription.count({ where: { ...granting, source: "COMPLIMENTARY" } })),
      q((p) => p.subscription.count({ where: { ...granting, accessUntil: { gt: now, lte: new Date(nowMs + 7 * DAY) } } })),
      q((p) => p.subscription.count({ where: { OR: [{ status: "EXPIRED", endedAt: { gte: ago(30) } }, { status: { in: ["TRIALING", "ACTIVE", "PAST_DUE"] }, accessUntil: { gte: ago(30), lte: now } }] } })),
      distinctUsers("first_chart_viewed"),
      q((p) => p.productEvent.count({ where: { name: "scanner_used", occurredAt: { gte: ago(30) } } })),
      distinctUsers("scanner_used"),
      q((p) => p.productEvent.count({ where: { name: "upgrade_clicked", occurredAt: { gte: ago(30) } } })),
      q((p) => p.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 })),
    ]);
    return {
      users: { total, active, suspended, admins, signupsLast7d: s7, signupsLast30d: s30, seenLast7d: seen7, seenLast30d: seen30 },
      access: { withTerminalAccess: withAccess, trialing, manual, complimentary, expiringIn7d: expiring, expiredLast30d: expired30 },
      usage: { firstChartViewedUsers30d: firstChart, scansLast30d: scans, scannerUsers30d: scanUsers, upgradeClicks30d: upgrade },
      revenue: { status: "PENDING_GATEWAY", note: "Receita e MRR dependem da integração com o gateway próprio (Etapa 7 adiada). Testes, cortesias e acessos manuais não são receita." },
      recentAudit: recent.map(auditToDto),
      generatedAt: now.toISOString(),
    };
  }
}

