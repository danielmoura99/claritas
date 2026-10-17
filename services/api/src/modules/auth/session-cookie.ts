import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "claritas_session";

/** Token opaco de 256 bits; só o navegador o conhece. */
export const newSessionToken = () => randomBytes(32).toString("base64url");

/** O banco guarda apenas o SHA-256 do token: um vazamento da tabela não entrega sessões válidas. */
export const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

const TOKEN_SHAPE = /^[A-Za-z0-9_-]{20,128}$/;

/** Lê o token do cabeçalho Cookie (ignora valores fora do formato). */
export function readSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i < 0 || part.slice(0, i).trim() !== SESSION_COOKIE) continue;
    const value = part.slice(i + 1).trim();
    return TOKEN_SHAPE.test(value) ? value : null;
  }
  return null;
}

/**
 * HttpOnly (fora do alcance de scripts), SameSite=Lax (não viaja em POST de outro site) e Path=/.
 * Chega ao navegador pelo domínio do frontend, que repassa /api/v1 para a API (cookie first-party).
 * Sem `maxAgeSec` = cookie de sessão do navegador ("Manter conectado" desmarcado): some ao fechar o navegador.
 */
export function sessionCookie(token: string, opts: { maxAgeSec?: number; secure: boolean }): string {
  return [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", ...(opts.maxAgeSec !== undefined ? [`Max-Age=${opts.maxAgeSec}`] : []), ...(opts.secure ? ["Secure"] : [])].join("; ");
}

export const clearedSessionCookie = (secure: boolean) => sessionCookie("", { maxAgeSec: 0, secure });
