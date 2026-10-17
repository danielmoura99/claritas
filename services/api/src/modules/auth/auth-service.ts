import { SHORT_SESSION_HOURS, type AuthUser, type LoginRequest, type RegisterRequest } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";
import { AppError } from "../../infrastructure/errors";
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
    private readonly opts: { sessionTtlMs: number; now?: () => number },
  ) {}

  private now() {
    return this.opts.now?.() ?? Date.now();
  }

  async register(input: RegisterRequest): Promise<AuthContext & { token: string }> {
    const passwordHash = await hashPassword(input.password);
    try {
      const user = await this.db.run((p) => p.user.create({ data: { email: input.email, name: input.name, passwordHash } }));
      return { ...(await this.openSession(user.id)), user: toUser(user) };
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
