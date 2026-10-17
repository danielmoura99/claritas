import { z } from "zod";
import { RoleSchema, UserStatusSchema } from "./commercial";

/** E-mail normalizado (minúsculas, sem espaços nas pontas) — é a identidade de login. */
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail longo demais")
  .pipe(z.email("E-mail inválido"));

/** Política de senha: comprimento, sem regras de composição (NIST SP 800-63B). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `A senha precisa de ao menos ${PASSWORD_MIN} caracteres`)
  .max(PASSWORD_MAX, `A senha aceita no máximo ${PASSWORD_MAX} caracteres`);

export const DisplayNameSchema = z.string().trim().min(1, "Informe seu nome").max(80, "Nome longo demais");

export const RegisterRequestSchema = z
  .object({ name: DisplayNameSchema, email: EmailSchema, password: PasswordSchema })
  .strict()
  .refine((r) => r.password.toLowerCase() !== r.email, { path: ["password"], message: "A senha não pode ser o próprio e-mail" });
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/** Validade da sessão quando "Manter conectado" está desmarcado (o cookie também some ao fechar o navegador). */
export const SHORT_SESSION_HOURS = 12;

/**
 * No login a senha só é limitada no tamanho: a política vale para contas novas, não para quem já entra.
 * `remember` (padrão true) = "Manter conectado neste dispositivo".
 */
export const LoginRequestSchema = z
  .object({ email: EmailSchema, password: z.string().min(1, "Informe a senha").max(PASSWORD_MAX), remember: z.boolean().optional() })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Usuário como a interface o vê — nunca inclui hash de senha nem dados de sessão. */
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: RoleSchema,
  status: UserStatusSchema,
  createdAt: z.string(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SessionSchema = z.object({
  user: AuthUserSchema,
  /** Fim da sessão (ISO 8601 UTC). */
  expiresAt: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

/** Ticket de uso único e curta duração para abrir o WebSocket de mercado (WS não carrega o cookie entre domínios). */
export const StreamTicketSchema = z.object({ ticket: z.string(), expiresAt: z.string() });
export type StreamTicket = z.infer<typeof StreamTicketSchema>;
