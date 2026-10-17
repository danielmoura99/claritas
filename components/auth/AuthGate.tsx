"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setUnauthenticatedHandler } from "@/lib/api/client";
import { markSignedOut, useSession } from "@/lib/auth/use-session";

/**
 * Portão das telas do terminal. Quem não tem cookie de sessão nem chega aqui (proxy.ts → /entrar).
 * Com cookie, as telas renderizam na hora (navegação instantânea) e a sessão é conferida na API em
 * paralelo; se ela não valer — ou acabar no meio do uso, com qualquer 401 —, vai para /entrar levando
 * o destino em `next`. Nenhum dado é exibido sem passar pela API, que exige a sessão em toda rota.
 * API ou banco fora: os painéis já mostram o próprio estado de erro; o portão não presume nada.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  React.useEffect(() => {
    setUnauthenticatedHandler(markSignedOut);
    return () => setUnauthenticatedHandler(null);
  }, []);

  React.useEffect(() => {
    if (session.status !== "anonymous") return;
    const next = pathname + (search.size ? `?${search.toString()}` : "");
    router.replace(next === "/" ? "/entrar" : `/entrar?next=${encodeURIComponent(next)}`);
  }, [session.status, pathname, search, router]);

  return children;
}
