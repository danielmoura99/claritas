// Operações administrativas por linha de comando — mesmos serviços, validações e auditoria do painel /admin.
// Úteis antes de existir um admin com sessão (primeiro deploy) ou para cargas de catálogo revisáveis em arquivo.
//
//   npm run admin:ops -- grant --email pessoa@exemplo.com --plan pro-anual --kind COMPLIMENTARY --days 365 --reason "fundador"
//   npm run admin:ops -- plans --file scripts/plans/teste-2026-10.json --reason "planos de teste aprovados pelo responsável"
//
// Roda contra o banco do DATABASE_URL do ambiente — o host é exibido antes de qualquer mudança.
import { readFileSync } from "node:fs";
import { userInfo } from "node:os";
import { PlanUpsertSchema, type PlanUpsert } from "@claritas/contracts";
import { z } from "zod";
import { Database } from "../src/infrastructure/db";
import { loadEnvFiles } from "../src/config/env";
import { AccessEvents } from "../src/modules/entitlements/entitlements-service";
import { ProductEvents } from "../src/modules/metrics/product-events";
import { PlanService } from "../src/modules/plans/plan-service";
import { SubscriptionService } from "../src/modules/subscriptions/subscription-service";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

loadEnvFiles();
const url = process.env.DATABASE_URL ?? fail("DATABASE_URL não definido");
console.log(`Banco alvo: ${new URL(url).hostname}`);
const db = new Database(url);
const actor = { id: null, label: `cli:${userInfo().username}` };
const reason = arg("reason")?.trim();
if (!reason || reason.length < 5) fail("Informe --reason com pelo menos 5 caracteres");

try {
  const action = process.argv[2];
  if (action === "grant") {
    const email = arg("email")?.trim().toLowerCase() ?? fail("Informe --email");
    const code = arg("plan") ?? fail("Informe --plan (código)");
    const kind = z.enum(["TRIAL", "MANUAL", "COMPLIMENTARY"]).parse(arg("kind") ?? "MANUAL");
    const days = Number(arg("days") ?? "30");
    if (!Number.isInteger(days) || days < 1) fail("--days inválido");
    const user = (await db.run((p) => p.user.findUnique({ where: { email }, select: { id: true } }))) ?? fail("Conta não encontrada");
    const plan = (await db.run((p) => p.plan.findFirst({ where: { code, status: { not: "ARCHIVED" } }, orderBy: { version: "desc" } }))) ?? fail(`Plano ${code} não encontrado`);
    const subs = new SubscriptionService(db, new AccessEvents(), new ProductEvents(db));
    const sub = await subs.create(actor, { userId: user.id, planId: plan.id, kind, accessUntil: new Date(Date.now() + days * 86_400_000).toISOString(), reason, replaceCurrent: process.argv.includes("--replace") });
    console.log(`✔ ${email}: ${sub.planName} v${sub.planVersion} (${sub.source}, ${sub.status}) até ${sub.accessUntil}`);
  } else if (action === "plans") {
    const file = arg("file") ?? fail("Informe --file");
    const defs = z.array(PlanUpsertSchema).parse(JSON.parse(readFileSync(file, "utf8")));
    const plans = new PlanService(db);
    for (const def of defs) {
      const existing = await db.run((p) => p.plan.findMany({ where: { code: def.code }, orderBy: { version: "desc" } }));
      const draft = existing.find((p) => p.status === "DRAFT");
      const body: PlanUpsert = def;
      const saved = draft ? await plans.updateDraft(actor, draft.id, body) : await plans.createDraft(actor, body);
      const published = await plans.publish(actor, saved.id, reason);
      const price = published.priceMinor === null ? "sem preço" : `${(published.priceMinor / 100).toFixed(2)} ${published.currency}/${published.billingPeriod}`;
      console.log(`✔ ${published.code} v${published.version} publicado (${price})`);
    }
  } else {
    fail("Uso: admin:ops -- <grant|plans> ...");
  }
} finally {
  await db.close();
}
