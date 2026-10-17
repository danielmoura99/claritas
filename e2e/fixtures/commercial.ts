// FIXTURES DE TESTE — dados comerciais FICTÍCIOS e determinísticos, usados SOMENTE pela suíte visual
// (telas de admin/conta/planos que dependem do banco). Nada aqui é importado pelo runtime da aplicação.
import { FEATURE_KEYS, type AccessDecision, type AccessReason, type AccessState, type AdminSummary, type AdminUserDetail, type AdminUserRow, type FeatureDto, type FeatureKey, type MeAccess, type MeSubscription, type PlanDto, type PublicPlan, type SubscriptionDto } from "@claritas/contracts";
import type { AccessPolicy } from "../../services/api/src/modules/entitlements/entitlements-service";
import { FROZEN_NOW } from "./frozen-api";

const iso = (deltaMs: number) => new Date(FROZEN_NOW + deltaMs).toISOString();
const D = 86_400_000;

/** Política de acesso de teste: features liberadas, motivo das negadas e estado comercial. */
export function testAccess(opts: { allowed: FeatureKey[]; deniedReason?: AccessReason; state?: AccessState; subscription?: MeSubscription | null; accountStatus?: MeAccess["accountStatus"] }): AccessPolicy {
  const decide = (k: FeatureKey): AccessDecision =>
    opts.allowed.includes(k)
      ? { allowed: true, reason: "ALLOWED_BY_PLAN", expiresAt: opts.subscription?.accessUntil, ...(k === "scanner.scan" ? { limit: 50, remaining: 38, resetsAt: iso(D) } : k === "watchlist.max_assets" ? { limit: 50 } : {}) }
      : { allowed: false, reason: ["reports.export", "alerts.max_active", "history.max_days", "terminal.timeframe.advanced", "terminal.indicators.advanced"].includes(k) ? "FEATURE_UNAVAILABLE" : (opts.deniedReason ?? "FEATURE_NOT_INCLUDED") };
  return {
    async check(_u, k) {
      return decide(k);
    },
    async consume(_u, k) {
      return decide(k);
    },
    async snapshot(userId) {
      return {
        userId,
        role: "USER",
        accountStatus: opts.accountStatus ?? "ACTIVE",
        state: opts.state ?? "ACTIVE",
        subscription: opts.subscription ?? null,
        features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, decide(k)])) as Record<FeatureKey, AccessDecision>,
        evaluatedAt: iso(0),
      };
    },
  };
}

export const TRIAL_ESSENCIAL: MeSubscription = { planCode: "essencial", planName: "Essencial", status: "TRIALING", source: "MANUAL", startsAt: iso(-5 * D), accessUntil: iso(2 * D), cancelAtPeriodEnd: false };
export const COMPLIMENTARY_PRO: MeSubscription = { planCode: "pro", planName: "Pro", status: "ACTIVE", source: "COMPLIMENTARY", startsAt: iso(-10 * D), accessUntil: iso(50 * D), cancelAtPeriodEnd: false };

export const FEATURES: FeatureDto[] = [
  { key: "terminal.access", name: "Pregão ao vivo", description: "", kind: "BOOLEAN", window: null, implemented: true },
  { key: "terminal.timeframe.advanced", name: "Períodos avançados", description: "", kind: "BOOLEAN", window: null, implemented: false },
  { key: "terminal.indicators.advanced", name: "Indicadores avançados", description: "", kind: "BOOLEAN", window: null, implemented: false },
  { key: "scanner.access", name: "Scanner", description: "", kind: "BOOLEAN", window: null, implemented: true },
  { key: "scanner.scan", name: "Varreduras do Scanner", description: "", kind: "QUOTA", window: "DAY_UTC", implemented: true },
  { key: "reports.access", name: "Resumo do período", description: "", kind: "BOOLEAN", window: null, implemented: true },
  { key: "reports.export", name: "Exportar relatórios", description: "", kind: "QUOTA", window: "MONTH_UTC", implemented: false },
  { key: "watchlist.max_assets", name: "Ativos na watchlist", description: "", kind: "LIMIT", window: null, implemented: true },
  { key: "alerts.max_active", name: "Alertas ativos", description: "", kind: "LIMIT", window: null, implemented: false },
  { key: "history.max_days", name: "Histórico acessível", description: "", kind: "LIMIT", window: null, implemented: false },
];

export const PLANS: PlanDto[] = [
  { id: "plan_ess_1", code: "essencial", version: 1, name: "Essencial", description: "Pregão ao vivo com gráfico, leitura determinística e watchlist.", status: "DRAFT", priceMinor: null, currency: null, billingPeriod: null, publishedAt: null, activeSubscriptions: 3, features: [{ key: "terminal.access", enabled: true, limit: null }, { key: "watchlist.max_assets", enabled: true, limit: 10 }] },
  { id: "plan_pro_1", code: "pro", version: 1, name: "Pro", description: "Essencial + Scanner e Resumo do período, com limites maiores.", status: "PUBLISHED", priceMinor: null, currency: null, billingPeriod: null, publishedAt: iso(-20 * D), activeSubscriptions: 5, features: [{ key: "terminal.access", enabled: true, limit: null }, { key: "scanner.access", enabled: true, limit: null }, { key: "scanner.scan", enabled: true, limit: 50 }, { key: "reports.access", enabled: true, limit: null }, { key: "watchlist.max_assets", enabled: true, limit: 50 }] },
];

export const PUBLIC_PLANS: PublicPlan[] = [{ id: "plan_pro_1", code: "pro", version: 1, name: "Pro", description: "Essencial + Scanner e Resumo do período, com limites maiores.", priceMinor: null, currency: null, billingPeriod: null, features: PLANS[1]!.features }];

const audit = (i: number, action: string, reason: string) => ({ id: `aud_${i}`, actorId: "u_admin", actorLabel: "admin@claritas.test", action, targetType: "Subscription", targetId: `sub_${i}`, reason, before: null, after: null, requestId: `req-${i}`, createdAt: iso(-i * 3_600_000) });

export const SUMMARY: AdminSummary = {
  users: { total: 128, active: 124, suspended: 4, admins: 2, signupsLast7d: 9, signupsLast30d: 31, seenLast7d: 57, seenLast30d: 96 },
  access: { withTerminalAccess: 42, trialing: 11, manual: 19, complimentary: 12, expiringIn7d: 6, expiredLast30d: 8 },
  usage: { firstChartViewedUsers30d: 88, scansLast30d: 1_204, scannerUsers30d: 27, upgradeClicks30d: 15 },
  revenue: { status: "PENDING_GATEWAY", note: "Receita e MRR dependem da integração com o gateway próprio (Etapa 7 adiada). Testes, cortesias e acessos manuais não são receita." },
  recentAudit: [audit(1, "subscription.created_trial", "teste acordado em reunião"), audit(2, "override.granted", "demonstração para parceiro"), audit(3, "user.status_suspended", "compartilhamento de conta")],
  generatedAt: iso(0),
};

export const USER_ROWS: AdminUserRow[] = [
  { id: "u_ana", name: "Ana Ribeiro", email: "ana@exemplo.com", role: "USER", status: "ACTIVE", createdAt: iso(-12 * D), lastSeenAt: iso(-2 * 3_600_000), subscription: COMPLIMENTARY_PRO, hasTerminalAccess: true },
  { id: "u_bruno", name: "Bruno Lima", email: "bruno@exemplo.com", role: "USER", status: "ACTIVE", createdAt: iso(-6 * D), lastSeenAt: iso(-D), subscription: TRIAL_ESSENCIAL, hasTerminalAccess: true },
  { id: "u_carla", name: "Carla Mendes", email: "carla@exemplo.com", role: "USER", status: "SUSPENDED", createdAt: iso(-40 * D), lastSeenAt: iso(-20 * D), subscription: null, hasTerminalAccess: false },
  { id: "u_admin", name: "Equipe Claritas", email: "admin@claritas.test", role: "ADMIN", status: "ACTIVE", createdAt: iso(-60 * D), lastSeenAt: iso(-600_000), subscription: null, hasTerminalAccess: false },
];

const SUB_DTO: SubscriptionDto = {
  id: "sub_1", userId: "u_ana", userEmail: "ana@exemplo.com", userName: "Ana Ribeiro", planId: "plan_pro_1", planCode: "pro", planName: "Pro", planVersion: 1, status: "ACTIVE", source: "COMPLIMENTARY",
  startsAt: COMPLIMENTARY_PRO.startsAt, accessUntil: COMPLIMENTARY_PRO.accessUntil, cancelAtPeriodEnd: false, endedAt: null, endReason: null, reason: "parceiro de validação do produto", createdById: "u_admin", createdAt: COMPLIMENTARY_PRO.startsAt, current: true, entitlements: PLANS[1]!.features,
};

export const SUBSCRIPTIONS_PAGE = { items: [SUB_DTO, { ...SUB_DTO, id: "sub_2", userId: "u_bruno", userEmail: "bruno@exemplo.com", userName: "Bruno Lima", planId: "plan_ess_1", planCode: "essencial", planName: "Essencial", status: "TRIALING" as const, source: "MANUAL" as const, accessUntil: TRIAL_ESSENCIAL.accessUntil, reason: "teste de 7 dias" }], page: 1, pageSize: 20, total: 2 };

export const USER_DETAIL: AdminUserDetail = {
  user: { id: "u_ana", name: "Ana Ribeiro", email: "ana@exemplo.com", role: "USER", status: "ACTIVE", createdAt: iso(-12 * D), lastSeenAt: iso(-2 * 3_600_000), statusReason: null, statusChangedAt: null, activeSessions: 2 },
  access: {
    userId: "u_ana", role: "USER", accountStatus: "ACTIVE", state: "ACTIVE", subscription: COMPLIMENTARY_PRO, evaluatedAt: iso(0),
    features: Object.fromEntries(FEATURE_KEYS.map((k) => [k, FEATURES.find((f) => f.key === k)!.implemented ? (k === "scanner.access" ? { allowed: false, reason: "FEATURE_EXPLICITLY_DENIED", expiresAt: iso(3 * D) } : { allowed: true, reason: "ALLOWED_BY_PLAN", expiresAt: COMPLIMENTARY_PRO.accessUntil, ...(k === "scanner.scan" ? { limit: 50, remaining: 41, resetsAt: iso(D) } : k === "watchlist.max_assets" ? { limit: 50 } : {}) }) : { allowed: false, reason: "FEATURE_UNAVAILABLE" }])) as Record<FeatureKey, AccessDecision>,
  },
  subscriptions: [SUB_DTO, { ...SUB_DTO, id: "sub_0", planId: "plan_ess_1", planCode: "essencial", planName: "Essencial", status: "CANCELED", source: "MANUAL", startsAt: iso(-30 * D), accessUntil: iso(-10 * D), endedAt: iso(-10 * D), endReason: "replaced", reason: "teste inicial", current: false }],
  overrides: [{ id: "ov_1", featureKey: "scanner.access", effect: "DENY", limitValue: null, startsAt: iso(-D), endsAt: iso(3 * D), reason: "varreduras automatizadas acima do uso normal", createdById: "u_admin", createdAt: iso(-D), revokedAt: null, revokeReason: null, active: true }],
  timeline: [audit(4, "override.denied", "varreduras automatizadas acima do uso normal"), audit(5, "subscription.created_complimentary", "parceiro de validação do produto")],
};
