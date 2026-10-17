import { describe, expect, it } from "vitest";
import { accessStateOf, evaluateFeature, quotaWindow, type EvalFeature, type EvalOverride, type EvalSubscription } from "../../src/modules/entitlements/evaluate";
import { FEATURE_CATALOG } from "../../src/modules/entitlements/catalog";

const NOW = Date.UTC(2026, 9, 17, 15, 0, 0);
const H = 3_600_000;
const D = 24 * H;
const at = (ms: number) => new Date(NOW + ms);

const BOOL: EvalFeature = { key: "scanner.access", kind: "BOOLEAN", window: null, implemented: true };
const QUOTA: EvalFeature = { key: "scanner.scan", kind: "QUOTA", window: "DAY_UTC", implemented: true };
const LIMIT: EvalFeature = { key: "watchlist.max_assets", kind: "LIMIT", window: null, implemented: true };

const sub = (over: Partial<EvalSubscription> = {}): EvalSubscription => ({
  status: "ACTIVE",
  startsAt: at(-D),
  accessUntil: at(10 * D),
  endReason: null,
  snapshot: { "scanner.access": { enabled: true, limit: null }, "scanner.scan": { enabled: true, limit: 5 }, "watchlist.max_assets": { enabled: true, limit: 10 } },
  ...over,
});
const ov = (over: Partial<EvalOverride> = {}): EvalOverride => ({ effect: "ALLOW", limitValue: null, startsAt: at(-H), endsAt: at(D), revokedAt: null, ...over });
const ev = (over: Partial<Parameters<typeof evaluateFeature>[0]> = {}) => evaluateFeature({ now: NOW, accountStatus: "ACTIVE", feature: BOOL, subscription: sub(), overrides: [], ...over });

describe("evaluateFeature — precedência (Plano 02 §5.3)", () => {
  it("plano válido libera com motivo e validade", () => {
    expect(ev()).toEqual({ allowed: true, reason: "ALLOWED_BY_PLAN", expiresAt: at(10 * D).toISOString() });
  });

  it("conta suspensa nega mesmo com assinatura e concessão", () => {
    for (const s of ["SUSPENDED", "DEACTIVATED", "PENDING_VERIFICATION"] as const) {
      expect(ev({ accountStatus: s, overrides: [ov()] })).toMatchObject({ allowed: false, reason: "ACCOUNT_BLOCKED" });
    }
  });

  it("feature não implementada nunca é liberada (nem por concessão)", () => {
    expect(ev({ feature: { ...BOOL, implemented: false }, overrides: [ov()] })).toMatchObject({ allowed: false, reason: "FEATURE_UNAVAILABLE" });
  });

  it("DENY explícito vence plano e ALLOW", () => {
    expect(ev({ overrides: [ov(), ov({ effect: "DENY" })] })).toMatchObject({ allowed: false, reason: "FEATURE_EXPLICITLY_DENIED" });
  });

  it("ALLOW individual libera sem assinatura, só até o fim da concessão", () => {
    expect(ev({ subscription: null, overrides: [ov()] })).toEqual({ allowed: true, reason: "ALLOWED_BY_GRANT", expiresAt: at(D).toISOString() });
    expect(ev({ subscription: null, overrides: [ov()], now: NOW + D })).toMatchObject({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" });
  });

  it("concessão revogada ou futura não vale", () => {
    expect(ev({ subscription: null, overrides: [ov({ revokedAt: at(-1) })] })).toMatchObject({ allowed: false });
    expect(ev({ subscription: null, overrides: [ov({ startsAt: at(H) })] })).toMatchObject({ allowed: false });
    expect(ev({ overrides: [ov({ effect: "DENY", startsAt: at(H) })] })).toMatchObject({ allowed: true });
  });

  it("feature fora do plano → FEATURE_NOT_INCLUDED; sem assinatura → SUBSCRIPTION_INACTIVE", () => {
    expect(ev({ feature: { ...BOOL, key: "reports.access" } })).toMatchObject({ allowed: false, reason: "FEATURE_NOT_INCLUDED" });
    expect(ev({ subscription: null })).toMatchObject({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" });
  });

  it("feature desligada no snapshot não é incluída", () => {
    expect(ev({ subscription: sub({ snapshot: { "scanner.access": { enabled: false, limit: null } } }) })).toMatchObject({ allowed: false, reason: "FEATURE_NOT_INCLUDED" });
  });
});

describe("evaluateFeature — relógio manda (D-S14, D-S15)", () => {
  it("status ACTIVE antigo com prazo vencido é negado", () => {
    expect(ev({ subscription: sub({ accessUntil: at(-1) }) })).toMatchObject({ allowed: false, reason: "SUBSCRIPTION_INACTIVE" });
  });

  it("accessUntil é exclusivo: vale até o instante anterior", () => {
    expect(ev({ now: NOW + 10 * D - 1 }).allowed).toBe(true);
    expect(ev({ now: NOW + 10 * D }).allowed).toBe(false);
  });

  it("início no futuro ainda não concede; PENDING, CANCELED e EXPIRED nunca concedem", () => {
    expect(ev({ subscription: sub({ startsAt: at(H) }) }).allowed).toBe(false);
    for (const status of ["PENDING", "CANCELED", "EXPIRED", "SUSPENDED"]) expect(ev({ subscription: sub({ status }) }).allowed).toBe(false);
    for (const status of ["TRIALING", "ACTIVE", "PAST_DUE"]) expect(ev({ subscription: sub({ status }) }).allowed).toBe(true);
  });
});

describe("evaluateFeature — quotas e limites", () => {
  it("quota informa limite, restante e próxima janela sem consumir", () => {
    expect(ev({ feature: QUOTA, used: 2 })).toMatchObject({ allowed: true, limit: 5, remaining: 3, resetsAt: new Date(Date.UTC(2026, 9, 18)).toISOString() });
    expect(ev({ feature: QUOTA, used: 5 })).toMatchObject({ allowed: false, reason: "QUOTA_EXCEEDED", remaining: 0 });
  });

  it("limite da concessão substitui o do plano", () => {
    expect(ev({ feature: QUOTA, used: 5, overrides: [ov({ limitValue: 20 })] })).toMatchObject({ allowed: true, reason: "ALLOWED_BY_GRANT", limit: 20, remaining: 15 });
  });

  it("QUOTA/LIMIT sem limite definido é negado (nunca ilimitado por omissão)", () => {
    expect(ev({ feature: QUOTA, subscription: sub({ snapshot: { "scanner.scan": { enabled: true, limit: null } } }) })).toMatchObject({ allowed: false });
    expect(ev({ feature: LIMIT, subscription: null, overrides: [ov()] })).toMatchObject({ allowed: false });
  });

  it("LIMIT devolve a quantidade máxima", () => {
    expect(ev({ feature: LIMIT })).toMatchObject({ allowed: true, limit: 10 });
  });

  it("janelas UTC diária e mensal", () => {
    expect(quotaWindow("DAY_UTC", Date.UTC(2026, 9, 17, 23, 59))).toEqual({ start: new Date(Date.UTC(2026, 9, 17)), end: new Date(Date.UTC(2026, 9, 18)) });
    expect(quotaWindow("MONTH_UTC", Date.UTC(2026, 11, 31, 12))).toEqual({ start: new Date(Date.UTC(2026, 11, 1)), end: new Date(Date.UTC(2027, 0, 1)) });
  });
});

describe("accessStateOf", () => {
  it("estados vistos pelo usuário", () => {
    expect(accessStateOf("ACTIVE", null, NOW)).toBe("NONE");
    expect(accessStateOf("ACTIVE", sub(), NOW)).toBe("ACTIVE");
    expect(accessStateOf("ACTIVE", sub({ status: "TRIALING" }), NOW)).toBe("TRIALING");
    expect(accessStateOf("ACTIVE", sub({ status: "TRIALING", accessUntil: at(-1) }), NOW)).toBe("TRIAL_EXPIRED");
    expect(accessStateOf("ACTIVE", sub({ status: "EXPIRED", endReason: "trial_expired" }), NOW)).toBe("TRIAL_EXPIRED");
    expect(accessStateOf("ACTIVE", sub({ status: "EXPIRED", endReason: "expired" }), NOW)).toBe("EXPIRED");
    expect(accessStateOf("SUSPENDED", sub(), NOW)).toBe("BLOCKED");
  });
});

describe("catálogo", () => {
  it("só marca como implementado o que existe no código (docs/SAAS_AUDIT.md §5)", () => {
    const implemented = FEATURE_CATALOG.filter((f) => f.implemented).map((f) => f.key).sort();
    expect(implemented).toEqual(["reports.access", "scanner.access", "scanner.scan", "terminal.access", "watchlist.max_assets"]);
  });
});
