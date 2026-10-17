"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/design-system";
import { useSession } from "@/lib/auth/use-session";

/** Moldura das páginas públicas (planos, ajuda): mesma identidade, menos densa que o terminal (Plano 02 §2.2). */
export function PublicShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={`text-sm hover:no-underline ${pathname === href ? "text-accent" : "text-fg-secondary hover:text-fg"}`}>{label}</Link>
  );
  return (
    <div className="min-h-dvh bg-app text-fg">
      <header className="flex items-center gap-6 border-b border-line-subtle px-5 py-4 sm:px-10">
        <Link href="/" className="hover:no-underline" aria-label="Claritas Terminal">
          <Wordmark size={22} product="Terminal" />
        </Link>
        <nav aria-label="Páginas" className="ml-auto flex items-center gap-5">
          {link("/planos", "Planos")}
          {link("/ajuda", "Ajuda")}
          {session.status === "authenticated" ? link("/", "Abrir terminal") : link("/entrar", "Entrar")}
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-10">{children}</main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-xs text-fg-tertiary sm:px-10">
        Ferramenta de análise gráfica com dados públicos da Binance Spot. Não é recomendação de investimento nem executa ordens.
      </footer>
    </div>
  );
}
