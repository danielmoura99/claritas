import Link from "next/link";
import { Badge } from "@/design-system";
import { fmtDate } from "@/lib/auth/access-copy";
import type { LegalDocument } from "./legal-content";

/** Documento legal no idioma visual das páginas públicas: leitura longa, serif no título, versão explícita. */
export function LegalScreen({ doc }: { doc: LegalDocument }) {
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="cl-label">Documento legal · versão {fmtDate(`${doc.version}T12:00:00Z`)}</span>
        <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)" }}>{doc.title}</h1>
        <p className="m-0 text-fg-secondary">{doc.summary}</p>
        <span className="flex flex-wrap items-center gap-2 text-xs text-fg-tertiary">
          <Badge tone="warn" size="sm">Versão preliminar</Badge>
          Texto em revisão jurídica; trechos entre colchetes serão completados com os dados da empresa.
        </span>
      </header>
      {doc.sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-3">
          <h2 className="m-0 text-fg" style={{ font: "var(--text-heading)" }}>{s.title}</h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="m-0 text-sm leading-relaxed text-fg-secondary">{p}</p>
          ))}
        </section>
      ))}
      <footer className="border-t border-line-subtle pt-4 text-xs text-fg-tertiary">
        Veja também: {doc.slug === "termos" ? <Link href="/privacidade" className="text-accent">Política de Privacidade</Link> : <Link href="/termos" className="text-accent">Termos de Uso</Link>} · <Link href="/ajuda" className="text-accent">Ajuda</Link>
      </footer>
    </article>
  );
}
