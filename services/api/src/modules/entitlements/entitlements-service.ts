import { EventEmitter } from "node:events";
import { FEATURE_KEYS, type AccessDecision, type FeatureKey, type MeAccess, type MeSubscription, type Role, type UserStatus } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
import { CATALOG_BY_KEY } from "./catalog";
import {
  CURRENT_STATUSES,
  accessStateOf,
  evaluateFeature,
  quotaWindow,
  type EntitlementSnapshot,
  type EvalFeature,
  type EvalOverride,
  type EvalSubscription,
} from "./evaluate";

/** O que a API precisa para autorizar (injetável nos testes sem banco). */
export interface AccessPolicy {
  /** Decisão para uma feature (nunca consome quota). */
  check(userId: string, feature: FeatureKey): Promise<AccessDecision>;
  /** Consome 1 uso de uma QUOTA de forma atômica e idempotente; nega se esgotada. */
  consume(userId: string, feature: FeatureKey, idempotencyKey: string): Promise<AccessDecision>;
  /** Retrato completo do próprio usuário (GET /me/access). */
  snapshot(userId: string): Promise<MeAccess>;
}

/**
 * Revogação imediata (D-S09): ações administrativas avisam quais usuários mudaram; o WebSocket reavalia na hora.
 * Em processo único (Render free). Com várias instâncias, trocar por pub/sub do banco.
 */
export class AccessEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0); // um ouvinte por WebSocket aberto
  }

  changed(userId: string) {
    this.emit("changed", userId);
  }
}

const FEATURES_TTL_MS = 60_000;

type SubRow = { status: string; startsAt: Date; accessUntil: Date; endReason: string | null; entitlementSnapshot: unknown; source: string; cancelAtPeriodEnd: boolean; plan: { code: string; name: string } };

const toEval = (s: SubRow | null): EvalSubscription | null =>
  s ? { status: s.status, startsAt: s.startsAt, accessUntil: s.accessUntil, endReason: s.endReason, snapshot: (s.entitlementSnapshot ?? {}) as EntitlementSnapshot } : null;

export class EntitlementsService implements AccessPolicy {
  private featureCache: { at: number; map: Map<string, EvalFeature> } | null = null;

  constructor(
    private readonly db: Database,
    private readonly opts: { now?: () => number } = {},
  ) {}

  now() {
    return this.opts.now?.() ?? Date.now();
  }

  /** Catálogo do banco (fonte da verdade para `implemented`); cai para o catálogo em código se o seed não rodou. */
  private async features(): Promise<Map<string, EvalFeature>> {
    if (this.featureCache && this.now() - this.featureCache.at < FEATURES_TTL_MS) return this.featureCache.map;
    const rows = await this.db.run((p) => p.feature.findMany());
    const map = new Map<string, EvalFeature>();
    for (const key of FEATURE_KEYS) {
      const row = rows.find((r) => r.key === key);
      const cat = CATALOG_BY_KEY.get(key)!;
      // Sem linha no banco = não disponível (deny-by-default), mesmo que o catálogo em código diga o contrário.
      map.set(key, row ? { key, kind: row.kind, window: row.window, implemented: row.implemented } : { key, kind: cat.kind, window: cat.window, implemented: false });
    }
    this.featureCache = { at: this.now(), map };
    return map;
  }

  /** Invalida o cache do catálogo (ex.: depois do seed). */
  resetCache() {
    this.featureCache = null;
  }

  /** Assinatura que vale para o usuário: a corrente (se houver) ou a mais recente encerrada. */
  async latestSubscription(userId: string): Promise<SubRow | null> {
    const include = { plan: { select: { code: true, name: true } } } as const;
    const current = await this.db.run((p) =>
      p.subscription.findFirst({ where: { userId, status: { in: [...CURRENT_STATUSES] } }, orderBy: { accessUntil: "desc" }, include }),
    );
    if (current) return current;
    return this.db.run((p) => p.subscription.findFirst({ where: { userId }, orderBy: [{ endedAt: "desc" }, { createdAt: "desc" }], include }));
  }

  private async context(userId: string) {
    const user = await this.db.run((p) => p.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } }));
    if (!user) throw new AppError("UNAUTHENTICATED", "Conta não encontrada");
    const now = this.now();
    const [sub, overrides, features] = await Promise.all([
      this.latestSubscription(userId),
      this.db.run((p) => p.featureOverride.findMany({ where: { userId, revokedAt: null, endsAt: { gt: new Date(now) } } })),
      this.features(),
    ]);
    return { user: user as { id: string; role: Role; status: UserStatus }, sub, overrides, features, now };
  }

  private async usedNow(userId: string, feature: EvalFeature, now: number) {
    if (feature.kind !== "QUOTA") return 0;
    const win = quotaWindow(feature.window ?? "DAY_UTC", now);
    const row = await this.db.run((p) => p.usageCounter.findUnique({ where: { userId_featureKey_windowStart: { userId, featureKey: feature.key, windowStart: win.start } } }));
    return row?.used ?? 0;
  }

  private decide(ctx: Awaited<ReturnType<EntitlementsService["context"]>>, key: FeatureKey, used: number) {
    return evaluateFeature({
      now: ctx.now,
      accountStatus: ctx.user.status,
      feature: ctx.features.get(key)!,
      subscription: toEval(ctx.sub),
      overrides: ctx.overrides.filter((o) => o.featureKey === key) as EvalOverride[],
      used,
    });
  }

  async check(userId: string, key: FeatureKey): Promise<AccessDecision> {
    const ctx = await this.context(userId);
    return this.decide(ctx, key, await this.usedNow(userId, ctx.features.get(key)!, ctx.now));
  }

  async snapshot(userId: string): Promise<MeAccess> {
    const ctx = await this.context(userId);
    const features = {} as Record<FeatureKey, AccessDecision>;
    for (const key of FEATURE_KEYS) features[key] = this.decide(ctx, key, await this.usedNow(userId, ctx.features.get(key)!, ctx.now));
    const s = ctx.sub;
    const subscription: MeSubscription | null = s
      ? { planCode: s.plan.code, planName: s.plan.name, status: s.status as MeSubscription["status"], source: s.source as MeSubscription["source"], startsAt: s.startsAt.toISOString(), accessUntil: s.accessUntil.toISOString(), cancelAtPeriodEnd: s.cancelAtPeriodEnd }
      : null;
    return { userId, role: ctx.user.role, accountStatus: ctx.user.status, state: accessStateOf(ctx.user.status, toEval(s), ctx.now), subscription, features, evaluatedAt: new Date(ctx.now).toISOString() };
  }

  /**
   * Consumo atômico (D-S08): numa transação, registra a chave de idempotência (repetida = já contada, não conta
   * de novo) e incrementa o contador SÓ se `used < limit` — um único UPSERT condicional, seguro entre requisições
   * e instâncias concorrentes. Esgotado → desfaz a transação inteira e nega. Tabelas qualificadas com `public.`:
   * no pooler do Neon (PgBouncer em modo transação) uma conexão pode herdar `search_path` vazio de outra sessão.
   */
  async consume(userId: string, key: FeatureKey, idempotencyKey: string): Promise<AccessDecision> {
    const ctx = await this.context(userId);
    const feature = ctx.features.get(key)!;
    const used = await this.usedNow(userId, feature, ctx.now);
    const before = this.decide(ctx, key, used);
    if (feature.kind !== "QUOTA") return before;
    const win = quotaWindow(feature.window ?? "DAY_UTC", ctx.now);
    // Retentativa de operação JÁ contada (mesma chave na mesma janela): foi autorizada antes — aceita sem recontar,
    // desde que o direito à feature continue valendo (sem assinatura/concessão válida, nega normalmente).
    const base = this.decide(ctx, key, 0);
    if (base.allowed && base.limit !== undefined) {
      const seen = await this.db.run((p) => p.usageRecord.findUnique({ where: { userId_featureKey_idempotencyKey: { userId, featureKey: key, idempotencyKey } }, select: { windowStart: true } }));
      if (seen && seen.windowStart.getTime() === win.start.getTime()) return { ...base, remaining: Math.max(0, base.limit - used) };
    }
    if (!before.allowed || before.limit === undefined) return before;
    const limit = before.limit;
    const EXHAUSTED = Symbol("exhausted");
    try {
      const used = await this.db.run((p) =>
        p.$transaction(async (tx) => {
          const fresh = await tx.$queryRaw<{ ok: number }[]>`
            INSERT INTO public."UsageRecord" ("userId", "featureKey", "idempotencyKey", "windowStart")
            VALUES (${userId}, ${key}, ${idempotencyKey}, ${win.start})
            ON CONFLICT DO NOTHING RETURNING 1 AS ok`;
          if (fresh.length === 0) {
            // Retentativa da mesma operação: já contada — devolve o estado atual sem novo consumo.
            const row = await tx.usageCounter.findUnique({ where: { userId_featureKey_windowStart: { userId, featureKey: key, windowStart: win.start } } });
            return row?.used ?? 0;
          }
          const rows = await tx.$queryRaw<{ used: number }[]>`
            INSERT INTO public."UsageCounter" ("userId", "featureKey", "windowStart", "used", "updatedAt")
            VALUES (${userId}, ${key}, ${win.start}, 1, now())
            ON CONFLICT ("userId", "featureKey", "windowStart")
            DO UPDATE SET "used" = "UsageCounter"."used" + 1, "updatedAt" = now()
            WHERE "UsageCounter"."used" < ${limit}
            RETURNING "used"`;
          if (rows.length === 0) throw EXHAUSTED;
          return rows[0]!.used;
        }),
      );
      return { ...before, remaining: Math.max(0, limit - used) };
    } catch (err) {
      if (err === EXHAUSTED) return { ...before, allowed: false, reason: "QUOTA_EXCEEDED", remaining: 0 };
      throw err;
    }
  }
}
