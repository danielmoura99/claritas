import {
  AdminSummarySchema,
  AdminUserDetailSchema,
  AdminUserRowSchema,
  AuditEntrySchema,
  FeatureDtoSchema,
  MeAccessSchema,
  OverrideDtoSchema,
  PageSchema,
  PlanDtoSchema,
  PublicPlanSchema,
  SubscriptionDtoSchema,
  z,
  type AdminStatusChange,
  type ClientProductEvent,
  type ManualSubscriptionCreate,
  type OverrideCreate,
  type PlanUpsert,
} from "@claritas/contracts";
import { apiGet, apiSend } from "./client";

const dataOf = <T extends z.ZodType>(t: T) => z.object({ data: t });
const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();

/** Dados do próprio usuário (identidade sempre da sessão no servidor). */
export const meApi = {
  access: (signal?: AbortSignal) => apiGet("/api/v1/me/access", dataOf(MeAccessSchema), { signal }).then((r) => r.data),
  onboarding: (signal?: AbortSignal) => apiGet("/api/v1/me/onboarding", dataOf(z.object({ done: z.boolean(), at: z.string().nullable() })), { signal }).then((r) => r.data),
  completeOnboarding: () => apiSend("PUT", "/api/v1/me/onboarding", dataOf(z.object({ done: z.boolean(), at: z.string().nullable() })), { done: true }).then((r) => r.data),
  /** Métrica de produto (lista fechada, sem PII). Falha silenciosa: nunca atrapalha o uso. */
  event: (ev: ClientProductEvent) => apiSend("POST", "/api/v1/me/events", dataOf(z.null()), ev).catch(() => null),
};

export const plansApi = {
  public: (signal?: AbortSignal) => apiGet("/api/v1/plans/public", dataOf(z.array(PublicPlanSchema)), { signal }).then((r) => r.data),
};

const Paged = <T extends z.ZodType>(t: T) => dataOf(PageSchema(t));
const PaymentsStatusSchema = z.object({ status: z.literal("DEFERRED"), note: z.string(), events: z.array(z.unknown()) });

/** API administrativa — o servidor exige ADMIN em cada chamada; esconder telas não é proteção. */
export const adminApi = {
  summary: (signal?: AbortSignal) => apiGet("/api/v1/admin/summary", dataOf(AdminSummarySchema), { signal }).then((r) => r.data),
  users: (q: { page: number; pageSize: number; search?: string; status?: string; role?: string; plan?: string; access?: string; sort?: string }, signal?: AbortSignal) =>
    apiGet(`/api/v1/admin/users?${qs(q)}`, Paged(AdminUserRowSchema), { signal }).then((r) => r.data),
  user: (id: string, signal?: AbortSignal) => apiGet(`/api/v1/admin/users/${encodeURIComponent(id)}`, dataOf(AdminUserDetailSchema), { signal }).then((r) => r.data),
  setStatus: (id: string, body: AdminStatusChange) => apiSend("PATCH", `/api/v1/admin/users/${encodeURIComponent(id)}/status`, dataOf(AdminUserDetailSchema), body).then((r) => r.data),
  grant: (id: string, body: OverrideCreate) => apiSend("POST", `/api/v1/admin/users/${encodeURIComponent(id)}/overrides`, dataOf(OverrideDtoSchema), body).then((r) => r.data),
  revokeGrant: (id: string, overrideId: string, reason: string) =>
    apiSend("DELETE", `/api/v1/admin/users/${encodeURIComponent(id)}/overrides/${encodeURIComponent(overrideId)}`, dataOf(OverrideDtoSchema), { reason }).then((r) => r.data),
  features: (signal?: AbortSignal) => apiGet("/api/v1/admin/features", dataOf(z.array(FeatureDtoSchema)), { signal }).then((r) => r.data),
  plans: (signal?: AbortSignal) => apiGet("/api/v1/admin/plans", dataOf(z.array(PlanDtoSchema)), { signal }).then((r) => r.data),
  createPlan: (body: PlanUpsert) => apiSend("POST", "/api/v1/admin/plans", dataOf(PlanDtoSchema), body).then((r) => r.data),
  updatePlan: (id: string, body: PlanUpsert) => apiSend("PUT", `/api/v1/admin/plans/${encodeURIComponent(id)}`, dataOf(PlanDtoSchema), body).then((r) => r.data),
  newPlanVersion: (id: string) => apiSend("POST", `/api/v1/admin/plans/${encodeURIComponent(id)}/versions`, dataOf(PlanDtoSchema)).then((r) => r.data),
  publishPlan: (id: string, reason: string) => apiSend("POST", `/api/v1/admin/plans/${encodeURIComponent(id)}/publish`, dataOf(PlanDtoSchema), { reason }).then((r) => r.data),
  archivePlan: (id: string, reason: string) => apiSend("POST", `/api/v1/admin/plans/${encodeURIComponent(id)}/archive`, dataOf(PlanDtoSchema), { reason }).then((r) => r.data),
  subscriptions: (q: { page: number; pageSize: number; status?: string; source?: string; current?: string }, signal?: AbortSignal) =>
    apiGet(`/api/v1/admin/subscriptions?${qs(q)}`, Paged(SubscriptionDtoSchema), { signal }).then((r) => r.data),
  createSubscription: (body: ManualSubscriptionCreate) => apiSend("POST", "/api/v1/admin/subscriptions/manual", dataOf(SubscriptionDtoSchema), body).then((r) => r.data),
  extendSubscription: (id: string, accessUntil: string, reason: string) => apiSend("POST", `/api/v1/admin/subscriptions/${encodeURIComponent(id)}/extend`, dataOf(SubscriptionDtoSchema), { accessUntil, reason }).then((r) => r.data),
  revokeSubscription: (id: string, reason: string) => apiSend("POST", `/api/v1/admin/subscriptions/${encodeURIComponent(id)}/revoke`, dataOf(SubscriptionDtoSchema), { reason }).then((r) => r.data),
  audit: (q: { page: number; pageSize: number; targetId?: string; action?: string; actorId?: string }, signal?: AbortSignal) =>
    apiGet(`/api/v1/admin/audit?${qs(q)}`, Paged(AuditEntrySchema), { signal }).then((r) => r.data),
  payments: (signal?: AbortSignal) => apiGet("/api/v1/admin/integrations/payments", dataOf(PaymentsStatusSchema), { signal }).then((r) => r.data),
};
