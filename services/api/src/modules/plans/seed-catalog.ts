import type { Database } from "../../infrastructure/db";
import { DRAFT_PLANS, FEATURE_CATALOG } from "../entitlements/catalog";

/**
 * Seed idempotente SÓ do catálogo interno (Plano 02 Etapa 2): features (sincronizadas com o código) e planos
 * iniciais em RASCUNHO, criados apenas se o código ainda não existir. Nunca cria assinatura, admin, preço
 * ou publicação.
 */
export async function seedCatalog(db: Database) {
  await db.run(async (p) => {
    for (const f of FEATURE_CATALOG) {
      const data = { name: f.name, description: f.description, kind: f.kind, window: f.window, implemented: f.implemented };
      await p.feature.upsert({ where: { key: f.key }, update: data, create: { key: f.key, ...data } });
    }
  });
  const ids = new Map((await db.run((p) => p.feature.findMany({ select: { id: true, key: true } }))).map((f) => [f.key, f.id]));
  const created: string[] = [];
  for (const plan of DRAFT_PLANS) {
    const exists = await db.run((p) => p.plan.findFirst({ where: { code: plan.code }, select: { id: true } }));
    if (exists) continue;
    await db.run((p) =>
      p.plan.create({
        data: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          features: { create: plan.features.map((f) => ({ featureId: ids.get(f.key)!, enabled: true, limitValue: f.limit })) },
        },
      }),
    );
    created.push(plan.code);
  }
  return { features: FEATURE_CATALOG.length, draftPlansCreated: created };
}
