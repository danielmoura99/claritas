import { NextResponse, type NextRequest } from "next/server";

/** Mesmo nome do cookie emitido pela API (services/api/src/modules/auth/session-cookie.ts). */
const SESSION_COOKIE = "claritas_session";

/**
 * Checagem OTIMISTA: sem o cookie de sessão, a página nem começa a carregar — vai direto para /entrar.
 * Não valida a sessão (isso é da API, a cada requisição); um cookie vencido é tratado pelo portão
 * de auth no cliente, que redireciona ao receber 401.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/entrar", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Fora: repasse da API, arquivos do Next, telas públicas (entrar, planos, ajuda) e arquivos com extensão.
  matcher: ["/((?!api/|_next/|entrar|planos|ajuda|favicon\\.ico|.*\\.[A-Za-z0-9]+$).*)"],
};
