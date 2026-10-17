import { z } from "zod";

// Plano 02 — papéis, estado da conta, features, decisões de acesso, planos e assinaturas.
// Sem cobrança: o gateway próprio (Etapa 7) está ADIADO. Nenhum DTO aqui carrega dado de pagamento.

export const RoleSchema = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserStatusSchema = z.enum(["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DEACTIVATED"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/** Chaves estáveis do catálogo (Plano 02 §5.1). Estar aqui não significa estar implementada — ver `implemented`. */
export const FEATURE_KEYS = [
  "terminal.access",
  "terminal.timeframe.advanced",
  "terminal.indicators.advanced",
  "scanner.access",
  "scanner.scan",
  "reports.access",
  "reports.export",
  "watchlist.max_assets",
  "alerts.max_active",
  "history.max_days",
] as const;
export const FeatureKeySchema = z.enum(FEATURE_KEYS);
export type FeatureKey = z.infer<typeof FeatureKeySchema>;

export const FeatureKindSchema = z.enum(["BOOLEAN", "QUOTA", "LIMIT"]);
export const QuotaWindowSchema = z.enum(["DAY_UTC", "MONTH_UTC"]);

/** Motivo de cada decisão (Plano 02 §4.4), mais FEATURE_UNAVAILABLE para o que ainda não existe no produto. */
export const AccessReasonSchema = z.enum([
  "ALLOWED_BY_PLAN",
  "ALLOWED_BY_GRANT",
  "ADMIN_PERMISSION",
  "UNAUTHENTICATED",
  "ACCOUNT_BLOCKED",
  "SUBSCRIPTION_INACTIVE",
  "FEATURE_NOT_INCLUDED",
  "FEATURE_EXPLICITLY_DENIED",
  "FEATURE_UNAVAILABLE",
  "QUOTA_EXCEEDED",
]);
export type AccessReason = z.infer<typeof AccessReasonSchema>;

export const AccessDecisionSchema = z.object({
  allowed: z.boolean(),
  reason: AccessReasonSchema,
  /** Até quando a decisão vale (fim da assinatura ou da concessão), ISO UTC. */
  expiresAt: z.string().optional(),
  /** QUOTA: usos por janela · LIMIT: quantidade máxima. */
  limit: z.number().int().optional(),
  /** Só QUOTA: usos restantes na janela atual (calculado; nunca consome). */
  remaining: z.number().int().optional(),
  /** Só QUOTA: início da próxima janela, ISO UTC. */
  resetsAt: z.string().optional(),
});
export type AccessDecision = z.infer<typeof AccessDecisionSchema>;

export const PlanStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const SubscriptionStatusSchema = z.enum(["PENDING", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED", "SUSPENDED"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export const SubscriptionSourceSchema = z.enum(["OWN_GATEWAY", "MANUAL", "COMPLIMENTARY"]);
export type SubscriptionSource = z.infer<typeof SubscriptionSourceSchema>;

/** Situação do acesso comercial vista pelo próprio usuário. */
export const AccessStateSchema = z.enum([
  /** Assinatura/teste válidos agora. */
  "ACTIVE",
  "TRIALING",
  /** Teve teste/assinatura e o prazo acabou. */
  "TRIAL_EXPIRED",
  "EXPIRED",
  /** Nunca teve acesso comercial (conta nova): aguarda liberação. */
  "NONE",
  /** Conta suspensa/desativada. */
  "BLOCKED",
]);
export type AccessState = z.infer<typeof AccessStateSchema>;

export const MeSubscriptionSchema = z.object({
  planCode: z.string(),
  planName: z.string(),
  status: SubscriptionStatusSchema,
  source: SubscriptionSourceSchema,
  startsAt: z.string(),
  accessUntil: z.string(),
  cancelAtPeriodEnd: z.boolean(),
});
export type MeSubscription = z.infer<typeof MeSubscriptionSchema>;

export const MeAccessSchema = z.object({
  userId: z.string(),
  role: RoleSchema,
  accountStatus: UserStatusSchema,
  state: AccessStateSchema,
  subscription: MeSubscriptionSchema.nullable(),
  features: z.record(FeatureKeySchema, AccessDecisionSchema),
  /** Momento do cálculo (ISO UTC). Revalidar periodicamente: nada aqui é cache autorizador. */
  evaluatedAt: z.string(),
});
export type MeAccess = z.infer<typeof MeAccessSchema>;

export const FeatureDtoSchema = z.object({
  key: FeatureKeySchema,
  name: z.string(),
  description: z.string(),
  kind: FeatureKindSchema,
  window: QuotaWindowSchema.nullable(),
  implemented: z.boolean(),
});
export type FeatureDto = z.infer<typeof FeatureDtoSchema>;

export const PlanFeatureDtoSchema = z.object({ key: FeatureKeySchema, enabled: z.boolean(), limit: z.number().int().nullable() });
export type PlanFeatureDto = z.infer<typeof PlanFeatureDtoSchema>;

export const PlanDtoSchema = z.object({
  id: z.string(),
  code: z.string(),
  version: z.number().int(),
  name: z.string(),
  description: z.string(),
  status: PlanStatusSchema,
  /** Nulos até aprovação comercial (D-02): a interface nunca inventa preço. */
  priceMinor: z.number().int().nullable(),
  currency: z.string().nullable(),
  billingPeriod: z.string().nullable(),
  publishedAt: z.string().nullable(),
  features: z.array(PlanFeatureDtoSchema),
  activeSubscriptions: z.number().int().optional(),
});
export type PlanDto = z.infer<typeof PlanDtoSchema>;

/** Plano público (/planos): só versões publicadas, sem dados internos. */
export const PublicPlanSchema = PlanDtoSchema.omit({ status: true, activeSubscriptions: true, publishedAt: true });
export type PublicPlan = z.infer<typeof PublicPlanSchema>;

// ───────────────────────────── Requisições administrativas ─────────────────────────────

const Reason = z.string().trim().min(5, "Informe o motivo (mín. 5 caracteres)").max(500);
const IsoDate = z.iso.datetime({ offset: true });

export const AdminStatusChangeSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]), reason: Reason }).strict();
export type AdminStatusChange = z.infer<typeof AdminStatusChangeSchema>;

export const OverrideCreateSchema = z
  .object({
    featureKey: FeatureKeySchema,
    effect: z.enum(["ALLOW", "DENY"]),
    limitValue: z.number().int().min(0).max(1_000_000).nullable().optional(),
    startsAt: IsoDate.optional(),
    /** Obrigatório: nenhuma concessão infinita silenciosa (Plano 02 §6). */
    endsAt: IsoDate,
    reason: Reason,
  })
  .strict();
export type OverrideCreate = z.infer<typeof OverrideCreateSchema>;

export const RevokeSchema = z.object({ reason: Reason }).strict();

export const ManualSubscriptionCreateSchema = z
  .object({
    userId: z.string().min(1),
    planId: z.string().min(1),
    /** TRIAL = teste (status TRIALING) · MANUAL = acesso administrado sem cobrança · COMPLIMENTARY = cortesia. */
    kind: z.enum(["TRIAL", "MANUAL", "COMPLIMENTARY"]),
    startsAt: IsoDate.optional(),
    accessUntil: IsoDate,
    reason: Reason,
    /** Encerra a assinatura corrente na mesma operação (troca de plano sem cobrança). */
    replaceCurrent: z.boolean().optional(),
  })
  .strict();
export type ManualSubscriptionCreate = z.infer<typeof ManualSubscriptionCreateSchema>;

export const SubscriptionExtendSchema = z.object({ accessUntil: IsoDate, reason: Reason }).strict();

const PlanCode = z.string().trim().regex(/^[a-z][a-z0-9-]{1,30}$/, "Código: minúsculas, números e hífen (2–31)");
export const PlanUpsertSchema = z
  .object({
    code: PlanCode,
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(400).default(""),
    priceMinor: z.number().int().min(0).nullable().optional(),
    currency: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
    billingPeriod: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).nullable().optional(),
    features: z.array(PlanFeatureDtoSchema).max(50),
  })
  .strict();
export type PlanUpsert = z.infer<typeof PlanUpsertSchema>;

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export const AdminUsersQuerySchema = PageQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  status: UserStatusSchema.optional(),
  role: RoleSchema.optional(),
  plan: z.string().trim().max(31).optional(),
  access: z.enum(["WITH_ACCESS", "WITHOUT_ACCESS"]).optional(),
  sort: z.enum(["createdAt:desc", "createdAt:asc", "email:asc"]).default("createdAt:desc"),
});
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;

export const AdminSubscriptionsQuerySchema = PageQuerySchema.extend({
  status: SubscriptionStatusSchema.optional(),
  source: SubscriptionSourceSchema.optional(),
  current: z.enum(["true", "false"]).optional(),
});

export const AdminAuditQuerySchema = PageQuerySchema.extend({
  targetId: z.string().max(64).optional(),
  actorId: z.string().max(64).optional(),
  action: z.string().max(64).optional(),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
});

// ───────────────────────────── Respostas administrativas ─────────────────────────────

export const AdminUserRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: RoleSchema,
  status: UserStatusSchema,
  createdAt: z.string(),
  lastSeenAt: z.string().nullable(),
  subscription: MeSubscriptionSchema.nullable(),
  /** Tem acesso ao terminal agora (decisão real do motor de entitlements). */
  hasTerminalAccess: z.boolean(),
});
export type AdminUserRow = z.infer<typeof AdminUserRowSchema>;

export const PageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), page: z.number().int(), pageSize: z.number().int(), total: z.number().int() });

export const OverrideDtoSchema = z.object({
  id: z.string(),
  featureKey: FeatureKeySchema,
  effect: z.enum(["ALLOW", "DENY"]),
  limitValue: z.number().int().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string(),
  createdById: z.string(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
  revokeReason: z.string().nullable(),
  /** Vale agora (não revogada e dentro do período). */
  active: z.boolean(),
});
export type OverrideDto = z.infer<typeof OverrideDtoSchema>;

export const SubscriptionDtoSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  planId: z.string(),
  planCode: z.string(),
  planName: z.string(),
  planVersion: z.number().int(),
  status: SubscriptionStatusSchema,
  source: SubscriptionSourceSchema,
  startsAt: z.string(),
  accessUntil: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  endedAt: z.string().nullable(),
  endReason: z.string().nullable(),
  reason: z.string(),
  createdById: z.string().nullable(),
  createdAt: z.string(),
  /** Concede acesso agora (status corrente e dentro do período). */
  current: z.boolean(),
  entitlements: z.array(PlanFeatureDtoSchema),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  actorId: z.string().nullable(),
  actorLabel: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  reason: z.string().nullable(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  requestId: z.string().nullable(),
  createdAt: z.string(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AdminUserDetailSchema = z.object({
  user: AdminUserRowSchema.omit({ subscription: true, hasTerminalAccess: true }).extend({ statusReason: z.string().nullable(), statusChangedAt: z.string().nullable(), activeSessions: z.number().int() }),
  access: MeAccessSchema,
  subscriptions: z.array(SubscriptionDtoSchema),
  overrides: z.array(OverrideDtoSchema),
  timeline: z.array(AuditEntrySchema),
});
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;

/** Indicadores verificáveis (Plano 02 §7.1). Receita fica pendente até o gateway (Etapa 7 adiada). */
export const AdminSummarySchema = z.object({
  users: z.object({ total: z.number().int(), active: z.number().int(), suspended: z.number().int(), admins: z.number().int(), signupsLast7d: z.number().int(), signupsLast30d: z.number().int(), seenLast7d: z.number().int(), seenLast30d: z.number().int() }),
  access: z.object({ withTerminalAccess: z.number().int(), trialing: z.number().int(), manual: z.number().int(), complimentary: z.number().int(), expiringIn7d: z.number().int(), expiredLast30d: z.number().int() }),
  usage: z.object({ firstChartViewedUsers30d: z.number().int(), scansLast30d: z.number().int(), scannerUsers30d: z.number().int(), upgradeClicks30d: z.number().int() }),
  revenue: z.object({ status: z.literal("PENDING_GATEWAY"), note: z.string() }),
  recentAudit: z.array(AuditEntrySchema),
  generatedAt: z.string(),
});
export type AdminSummary = z.infer<typeof AdminSummarySchema>;

/** Eventos de produto que o cliente pode registrar (lista fechada, sem PII). */
export const ClientProductEventSchema = z.object({ name: z.enum(["first_chart_viewed", "upgrade_clicked"]), props: z.record(z.string(), z.string().max(40)).optional() }).strict();
export type ClientProductEvent = z.infer<typeof ClientProductEventSchema>;
