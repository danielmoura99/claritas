import { LEGAL_VERSIONS, SHORT_SESSION_HOURS, type AuthUser, type LoginRequest, type RegisterRequest } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
import { audit } from "../audit/audit";
import { snapshotOf } from "../plans/plan-service";
import { dummyHash, hashPassword, verifyPassword } from "./password";
import { hashSessionToken, newSessionToken } from "./session-cookie";

export interface AuthContext {
  user: AuthUser;
  expiresAt: Date;
}

/** O que o guarda de rotas precisa: resolver um token de sessão. Injetável nos testes. */
export interface SessionVerifier {
  verify(token: string): Promise<AuthContext | null>;
}

const toUser = (u: { id: string; email: string; name: string; role: AuthUser["role"]; status: AuthUser["status"]; createdAt: Date }): AuthUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt.toISOString(),
});

/** `lastUsedAt` é atualizado no máximo uma vez por hora (evita uma escrita por requisição). */
const TOUCH_EVERY_MS = 60 * 60_000;

export class AuthService implements SessionVerifier {
  constructor(
    private readonly db: Database,
    private readonly opts: {
      sessionTtlMs: number;
      now?: () => number;
      /** Teste automático no cadastro (decisão do responsável, 17/10/2026). Ausente ou `days=0` = sem teste. */
      signupTrial?: { planCode: string; days: number };
      /** Avisos operacionais (ex.: plano do teste não publicado). */
      onWarning?: (msg: string, data?: object) => void;
    },
  ) {}

  private now() {
    return this.opts.now?.() ?? Date.now();
  }

  async register(input: RegisterRequest): Promise<AuthContext & { token: string; trialUntil: Date | null }> {
    const passwordHash = await hashPassword(input.password);
    try {
      // Conta + registro do aceite (versões vigentes) na mesma transação: sem aceite, sem conta.
      const user = await this.db.run((p) =>
        p.$transaction(async (tx) => {
          const u = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash } });
          await tx.consentRecord.createMany({
            data: [
              { userId: u.id, documentType: "TERMS", documentVersion: LEGAL_VERSIONS.terms, source: "register" },
              { userId: u.id, documentType: "PRIVACY", documentVersion: LEGAL_VERSIONS.privacy, source: "register" },
            ],
          });
          // Degustação: teste do plano configurado (versão PUBLICADA mais recente), sem cobrança, com fim explícito.
          // Sem plano publicado → conta criada sem teste (nunca quebra o cadastro) e aviso operacional.
          let trialUntil: Date | null = null;
          const t = this.opts.signupTrial;
          if (t && t.days > 0) {
            const plan = await tx.plan.findFirst({ where: { code: t.planCode, status: "PUBLISHED" }, orderBy: { version: "desc" }, include: { features: { include: { feature: { select: { key: true } } } } } });
            if (plan) {
              const now = this.now();
              trialUntil = new Date(now + t.days * 86_400_000);
              const sub = await tx.subscription.create({
                data: { userId: u.id, planId: plan.id, status: "TRIALING", source: "MANUAL", startsAt: new Date(now), accessUntil: trialUntil, entitlementSnapshot: snapshotOf(plan), reason: `teste automático de ${t.days} dias no cadastro` },
              });
              await audit(tx, { id: null, label: "sistema:cadastro" }, { action: "subscription.created_trial", targetType: "Subscription", targetId: sub.id, reason: `teste automático de ${t.days} dias no cadastro`, after: { userId: u.id, planCode: plan.code, planVersion: plan.version, status: "TRIALING", accessUntil: trialUntil.toISOString() } });
            } else {
              this.opts.onWarning?.("plano do teste automático não está publicado — conta criada sem teste", { planCode: t.planCode });
            }
          }
          return { ...u, trialUntil };
        }),
      );
      return { ...(await this.openSession(user.id)), user: toUser(user), trialUntil: user.trialUntil };
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") throw new AppError("EMAIL_TAKEN", "Já existe uma conta com este e-mail");
      throw err;
    }
  }

  /** Mensagem única para e-mail inexistente e senha errada: não revela quais contas existem. */
  async login(input: LoginRequest): Promise<AuthContext & { token: string }> {
    const user = await this.db.run((p) => p.user.findUnique({ where: { email: input.email } }));
    const ok = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !ok) throw new AppError("INVALID_CREDENTIALS", "E-mail ou senha incorretos");
    // Só depois da senha correta: o estado da conta não é revelado a quem não a conhece.
    if (user.status !== "ACTIVE") throw new AppError("ACCOUNT_BLOCKED", "Conta suspensa ou desativada. Fale com o suporte.", { details: { status: user.status } });
    // Limpeza oportunista das sessões vencidas desta conta.
    await this.db.run((p) => p.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date(this.now()) } } }));
    const ttlMs = input.remember === false ? SHORT_SESSION_HOURS * 3_600_000 : this.opts.sessionTtlMs;
    return { ...(await this.openSession(user.id, ttlMs)), user: toUser(user) };
  }

  async logout(token: string): Promise<void> {
    await this.db.run((p) => p.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } }));
  }

  async verify(token: string): Promise<AuthContext | null> {
    const session = await this.db.run((p) => p.session.findUnique({ where: { tokenHash: hashSessionToken(token) }, include: { user: true } }));
    const now = this.now();
    if (!session || session.expiresAt.getTime() <= now) return null;
    if (now - session.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
      await this.db.run((p) => p.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date(now) } }));
    }
    return { user: toUser(session.user), expiresAt: session.expiresAt };
  }

  private async openSession(userId: string, ttlMs = this.opts.sessionTtlMs) {
    const token = newSessionToken();
    const expiresAt = new Date(this.now() + ttlMs);
    await this.db.run((p) => p.session.create({ data: { tokenHash: hashSessionToken(token), userId, expiresAt } }));
    return { token, expiresAt };
  }
}
