import type { AccessDecision, AccessState, UserStatus } from "@claritas/contracts";

/** Benefícios congelados na assinatura: { [featureKey]: { enabled, limit } } (D-S04). */
export type EntitlementSnapshot = Record<string, { enabled: boolean; limit: number | null }>;

export const CURRENT_STATUSES = ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE"] as const;
/** Status que concedem acesso dentro do período. PENDING não concede (aguarda confirmação). */
const GRANTING_STATUSES = new Set(["TRIALING", "ACTIVE", "PAST_DUE"]);

export interface EvalSubscription {
  status: string;
  startsAt: Date;
  accessUntil: Date;
  endReason: string | null;
  snapshot: EntitlementSnapshot;
}

export interface EvalOverride {
  effect: "ALLOW" | "DENY";
  limitValue: number | null;
  startsAt: Date;
  endsAt: Date;
  revokedAt: Date | null;
}

export interface EvalFeature {
  key: string;
  kind: "BOOLEAN" | "QUOTA" | "LIMIT";
  window: "DAY_UTC" | "MONTH_UTC" | null;
  implemented: boolean;
}

export const isOverrideActive = (o: EvalOverride, now: number) => !o.revokedAt && o.startsAt.getTime() <= now && now < o.endsAt.getTime();

/** Assinatura concede acesso AGORA: status que concede e dentro de [startsAt, accessUntil). O relógio manda (D-S14). */
export const subscriptionGrants = (s: EvalSubscription | null, now: number): boolean =>
  Boolean(s && GRANTING_STATUSES.has(s.status) && s.startsAt.getTime() <= now && now < s.accessUntil.getTime());

/** Janela UTC de uma quota: [start, end). */
export function quotaWindow(window: "DAY_UTC" | "MONTH_UTC", now: number): { start: Date; end: Date } {
  const d = new Date(now);
  if (window === "DAY_UTC") {
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return { start: new Date(start), end: new Date(start + 86_400_000) };
  }
  return { start: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)), end: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)) };
}

/**
 * Regra central de acesso (Plano 02 §5.3), pura e determinística:
 * conta bloqueada → feature inexistente → DENY explícito → ALLOW individual → plano da assinatura válida →
 * sem assinatura válida → não incluída. Quotas: decisão informa limite/restante sem consumir.
 */
export function evaluateFeature(input: {
  now: number;
  accountStatus: UserStatus;
  feature: EvalFeature;
  subscription: EvalSubscription | null;
  overrides: EvalOverride[];
  /** Usos na janela atual (QUOTA). */
  used?: number;
}): AccessDecision {
  const { now, accountStatus, feature, subscription } = input;
  if (accountStatus !== "ACTIVE") return { allowed: false, reason: "ACCOUNT_BLOCKED" };
  if (!feature.implemented) return { allowed: false, reason: "FEATURE_UNAVAILABLE" };

  const active = input.overrides.filter((o) => isOverrideActive(o, now));
  const deny = active.find((o) => o.effect === "DENY");
  if (deny) return { allowed: false, reason: "FEATURE_EXPLICITLY_DENIED", expiresAt: deny.endsAt.toISOString() };

  const allow = active.filter((o) => o.effect === "ALLOW").sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];
  const validSub = subscriptionGrants(subscription, now) ? subscription : null;
  const fromPlan = validSub?.snapshot[feature.key];
  const planAllows = Boolean(fromPlan?.enabled);

  let base: AccessDecision;
  let limit: number | null = null;
  if (allow) {
    limit = allow.limitValue ?? (planAllows ? (fromPlan?.limit ?? null) : null);
    base = { allowed: true, reason: "ALLOWED_BY_GRANT", expiresAt: allow.endsAt.toISOString() };
  } else if (planAllows && validSub) {
    limit = fromPlan?.limit ?? null;
    base = { allowed: true, reason: "ALLOWED_BY_PLAN", expiresAt: validSub.accessUntil.toISOString() };
  } else if (!validSub) {
    return { allowed: false, reason: "SUBSCRIPTION_INACTIVE" };
  } else {
    return { allowed: false, reason: "FEATURE_NOT_INCLUDED" };
  }

  if (feature.kind === "BOOLEAN") return base;
  // QUOTA/LIMIT sem limite definido = negar (nunca liberar consumo ilimitado por omissão).
  if (limit === null) return { allowed: false, reason: "FEATURE_NOT_INCLUDED" };
  if (feature.kind === "LIMIT") return { ...base, allowed: limit > 0, limit, ...(limit > 0 ? {} : { reason: "QUOTA_EXCEEDED" as const }) };

  const win = quotaWindow(feature.window ?? "DAY_UTC", now);
  const remaining = Math.max(0, limit - (input.used ?? 0));
  return { ...base, allowed: remaining > 0, ...(remaining > 0 ? {} : { reason: "QUOTA_EXCEEDED" as const }), limit, remaining, resetsAt: win.end.toISOString() };
}

/** Situação comercial para a interface (não autoriza nada). */
export function accessStateOf(accountStatus: UserStatus, latest: EvalSubscription | null, now: number): AccessState {
  if (accountStatus !== "ACTIVE") return "BLOCKED";
  if (!latest) return "NONE";
  if (subscriptionGrants(latest, now)) return latest.status === "TRIALING" ? "TRIALING" : "ACTIVE";
  return latest.status === "TRIALING" || latest.endReason === "trial_expired" ? "TRIAL_EXPIRED" : "EXPIRED";
}
