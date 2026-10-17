import { FEATURE_KEYS, type FeatureDto, type FeatureKey, type PlanDto, type PlanUpsert, type PublicPlan } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
import { audit, type Actor } from "../audit/audit";
import type { EntitlementSnapshot } from "../entitlements/evaluate";

type PlanRow = {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  priceMinor: number | null;
  currency: string | null;
  billingPeriod: string | null;
  publishedAt: Date | null;
  features: { enabled: boolean; limitValue: number | null; feature: { key: string } }[];
};

const featureOrder = (k: string) => FEATURE_KEYS.indexOf(k as FeatureKey);

export const planToDto = (p: PlanRow, activeSubscriptions?: number): PlanDto => ({
  id: p.id,
  code: p.code,
  version: p.version,
  name: p.name,
  description: p.description,
  status: p.status,
  priceMinor: p.priceMinor,
  currency: p.currency,
  billingPeriod: p.billingPeriod,
  publishedAt: p.publishedAt?.toISOString() ?? null,
  features: p.features
    .map((f) => ({ key: f.feature.key as FeatureKey, enabled: f.enabled, limit: f.limitValue }))
    .sort((a, b) => featureOrder(a.key) - featureOrder(b.key)),
  ...(activeSubscriptions !== undefined ? { activeSubscriptions } : {}),
});

/** Snapshot congelado na assinatura (D-S04). */
export const snapshotOf = (p: PlanRow): EntitlementSnapshot =>
  Object.fromEntries(p.features.map((f) => [f.feature.key, { enabled: f.enabled, limit: f.limitValue }]));

const includeFeatures = { features: { include: { feature: { select: { key: true } } } } } as const;

/**
 * Catálogo de planos (Plano 02 §7.4). Rascunho é editável; PUBLICADO é imutável (editar = nova versão);
 * publicar exige só features implementadas e limites definidos. Preço é opcional e nunca inventado (D-02).
 */
export class PlanService {
  constructor(private readonly db: Database) {}

  async features(): Promise<FeatureDto[]> {
    const rows = await this.db.run((p) => p.feature.findMany());
    return rows
      .map((f) => ({ key: f.key as FeatureKey, name: f.name, description: f.description, kind: f.kind, window: f.window, implemented: f.implemented }))
      .sort((a, b) => featureOrder(a.key) - featureOrder(b.key));
  }

  async list(): Promise<PlanDto[]> {
    const rows = await this.db.run((p) => p.plan.findMany({ include: includeFeatures, orderBy: [{ code: "asc" }, { version: "desc" }] }));
    const counts = await this.db.run((p) =>
      p.subscription.groupBy({ by: ["planId"], where: { status: { in: ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE"] } }, _count: { _all: true } }),
    );
    const byPlan = new Map(counts.map((c) => [c.planId, c._count._all]));
    return rows.map((r) => planToDto(r, byPlan.get(r.id) ?? 0));
  }

  async get(id: string): Promise<PlanRow> {
    const row = await this.db.run((p) => p.plan.findUnique({ where: { id }, include: includeFeatures }));
    if (!row) throw new AppError("NOT_FOUND", "Plano não encontrado");
    return row;
  }

  /** Só publicados e só features implementadas — nunca anunciar o que não existe (§5.1). */
  async publicPlans(): Promise<PublicPlan[]> {
    const [rows, features] = await Promise.all([
      this.db.run((p) => p.plan.findMany({ where: { status: "PUBLISHED" }, include: includeFeatures, orderBy: { code: "asc" } })),
      this.features(),
    ]);
    const implemented = new Set(features.filter((f) => f.implemented).map((f) => f.key));
    return rows.map((r) => {
      const dto = planToDto(r);
      return {
        id: dto.id,
        code: dto.code,
        version: dto.version,
        name: dto.name,
        description: dto.description,
        priceMinor: dto.priceMinor,
        currency: dto.currency,
        billingPeriod: dto.billingPeriod,
        features: dto.features.filter((f) => f.enabled && implemented.has(f.key)),
      };
    });
  }

  private async validateFeatures(input: PlanUpsert) {
    const catalog = await this.features();
    const byKey = new Map(catalog.map((f) => [f.key, f]));
    const seen = new Set<string>();
    for (const f of input.features) {
      const def = byKey.get(f.key);
      if (!def) throw new AppError("INVALID_REQUEST", `Feature desconhecida: ${f.key}`);
      if (seen.has(f.key)) throw new AppError("INVALID_REQUEST", `Feature repetida: ${f.key}`);
      seen.add(f.key);
      if (def.kind === "BOOLEAN" && f.limit !== null) throw new AppError("INVALID_REQUEST", `${f.key} não aceita limite`);
    }
    if ((input.priceMinor ?? null) !== null && (!input.currency || !input.billingPeriod)) {
      throw new AppError("INVALID_REQUEST", "Preço exige moeda e periodicidade");
    }
    return byKey;
  }

  private async featureIds(keys: string[]) {
    const rows = await this.db.run((p) => p.feature.findMany({ where: { key: { in: keys } }, select: { id: true, key: true } }));
    return new Map(rows.map((r) => [r.key, r.id]));
  }

  /** Novo rascunho: código novo (v1) ou próxima versão de um código existente. */
  async createDraft(actor: Actor, input: PlanUpsert, requestId?: string): Promise<PlanDto> {
    await this.validateFeatures(input);
    const ids = await this.featureIds(input.features.map((f) => f.key));
    const created = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const last = await tx.plan.findFirst({ where: { code: input.code }, orderBy: { version: "desc" }, select: { version: true } });
        const draft = await tx.plan.findFirst({ where: { code: input.code, status: "DRAFT" }, select: { id: true } });
        if (draft) throw new AppError("CONFLICT", "Já existe um rascunho deste plano — edite-o");
        const plan = await tx.plan.create({
          data: {
            code: input.code,
            version: (last?.version ?? 0) + 1,
            name: input.name,
            description: input.description ?? "",
            priceMinor: input.priceMinor ?? null,
            currency: input.currency ?? null,
            billingPeriod: input.billingPeriod ?? null,
            features: { create: input.features.map((f) => ({ featureId: ids.get(f.key)!, enabled: f.enabled, limitValue: f.limit })) },
          },
          include: includeFeatures,
        });
        await audit(tx, actor, { action: "plan.draft_created", targetType: "Plan", targetId: plan.id, after: planToDto(plan), requestId });
        return plan;
      }),
    );
    return planToDto(created, 0);
  }

  async updateDraft(actor: Actor, id: string, input: PlanUpsert, requestId?: string): Promise<PlanDto> {
    await this.validateFeatures(input);
    const ids = await this.featureIds(input.features.map((f) => f.key));
    const updated = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const before = await tx.plan.findUnique({ where: { id }, include: includeFeatures });
        if (!before) throw new AppError("NOT_FOUND", "Plano não encontrado");
        if (before.status !== "DRAFT") throw new AppError("CONFLICT", "Versão publicada/arquivada é imutável — crie uma nova versão");
        if (before.code !== input.code) throw new AppError("INVALID_REQUEST", "O código do plano não muda entre versões");
        await tx.planFeature.deleteMany({ where: { planId: id } });
        const plan = await tx.plan.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description ?? "",
            priceMinor: input.priceMinor ?? null,
            currency: input.currency ?? null,
            billingPeriod: input.billingPeriod ?? null,
            features: { create: input.features.map((f) => ({ featureId: ids.get(f.key)!, enabled: f.enabled, limitValue: f.limit })) },
          },
          include: includeFeatures,
        });
        await audit(tx, actor, { action: "plan.draft_updated", targetType: "Plan", targetId: id, before: planToDto(before), after: planToDto(plan), requestId });
        return plan;
      }),
    );
    return planToDto(updated);
  }

  /** Copia uma versão (publicada ou arquivada) para um novo rascunho editável. */
  async newVersion(actor: Actor, id: string, requestId?: string): Promise<PlanDto> {
    const src = await this.get(id);
    const dto = planToDto(src);
    return this.createDraft(actor, { code: dto.code, name: dto.name, description: dto.description, priceMinor: dto.priceMinor, currency: dto.currency, billingPeriod: dto.billingPeriod as PlanUpsert["billingPeriod"], features: dto.features }, requestId);
  }

  /**
   * Publicar = aprovar para oferta pública. Exige features implementadas e limites definidos. A versão publicada
   * anterior do mesmo código é arquivada (assinaturas existentes mantêm o snapshot — nada muda para elas).
   */
  async publish(actor: Actor, id: string, reason: string, requestId?: string): Promise<PlanDto> {
    const catalog = new Map((await this.features()).map((f) => [f.key, f]));
    const published = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const plan = await tx.plan.findUnique({ where: { id }, include: includeFeatures });
        if (!plan) throw new AppError("NOT_FOUND", "Plano não encontrado");
        if (plan.status !== "DRAFT") throw new AppError("CONFLICT", "Só rascunhos podem ser publicados");
        const enabled = plan.features.filter((f) => f.enabled);
        if (enabled.length === 0) throw new AppError("INVALID_REQUEST", "Plano sem nenhuma feature não pode ser publicado");
        for (const f of enabled) {
          const def = catalog.get(f.feature.key as FeatureKey);
          if (!def?.implemented) throw new AppError("INVALID_REQUEST", `Feature ainda não implementada não pode ser oferecida: ${f.feature.key}`);
          if (def.kind !== "BOOLEAN" && f.limitValue === null) throw new AppError("INVALID_REQUEST", `Defina o limite de ${f.feature.key} antes de publicar`);
        }
        const previous = await tx.plan.findMany({ where: { code: plan.code, status: "PUBLISHED" } });
        for (const prev of previous) {
          await tx.plan.update({ where: { id: prev.id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
          await audit(tx, actor, { action: "plan.archived", targetType: "Plan", targetId: prev.id, reason: `substituído pela versão ${plan.version}`, requestId });
        }
        const done = await tx.plan.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() }, include: includeFeatures });
        await audit(tx, actor, { action: "plan.published", targetType: "Plan", targetId: id, reason, after: planToDto(done), requestId });
        return done;
      }),
    );
    return planToDto(published);
  }

  async archive(actor: Actor, id: string, reason: string, requestId?: string): Promise<PlanDto> {
    const archived = await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const plan = await tx.plan.findUnique({ where: { id } });
        if (!plan) throw new AppError("NOT_FOUND", "Plano não encontrado");
        if (plan.status === "ARCHIVED") throw new AppError("CONFLICT", "Plano já arquivado");
        const done = await tx.plan.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() }, include: includeFeatures });
        await audit(tx, actor, { action: "plan.archived", targetType: "Plan", targetId: id, reason, requestId });
        return done;
      }),
    );
    return planToDto(archived);
  }
}
