"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { PublicPlan } from "@claritas/contracts";
import { AccessNotice, Badge, Button, Panel } from "@/design-system";
import { describeError } from "@/lib/api/client";
import { plansApi } from "@/lib/api/commercial";
import { FEATURE_LABEL, SUPPORT_EMAIL, fmtInt } from "@/lib/auth/access-copy";

const PERIOD: Record<string, string> = { MONTHLY: "mês", QUARTERLY: "trimestre", YEARLY: "ano" };

/**
 * Página de planos (Plano 02 §8.2 / Etapa 6). Mostra SÓ versões publicadas e funcionalidades que existem.
 * Sem preço aprovado, diz "a definir". Não há checkout: a Etapa 7 (gateway) está adiada — o contato é humano.
 */
export function PricingScreen() {
  const router = useRouter();
  const [state, setState] = React.useState<{ plans: PublicPlan[] | null; error: string | null }>({ plans: null, error: null });
  React.useEffect(() => {
    const abort = new AbortController();
    plansApi
      .public(abort.signal)
      .then((plans) => setState({ plans, error: null }))
      .catch((err) => !abort.signal.aborted && setState({ plans: null, error: describeError(err) }));
    return () => abort.abort();
  }, []);

  const contact = SUPPORT_EMAIL ? (
    <Button variant="primary" onClick={() => (window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Claritas%20Terminal%20-%20planos`)}>Falar com a equipe</Button>
  ) : (
    <Button variant="secondary" onClick={() => router.push("/ajuda#suporte")}>Ver como pedir acesso</Button>
  );

  return (
    <>
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="cl-label">Planos</span>
        <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)", textWrap: "balance" }}>
          Escolha o quanto do mercado você quer <em>ler</em>.
        </h1>
        <p className="m-0 text-fg-secondary">
          Nesta fase os acessos são liberados pela equipe Claritas, por período definido. Não há cobrança automática nem checkout: fale conosco para combinar teste ou plano.
        </p>
      </header>

      {state.error && <AccessNotice tone="warn" eyebrow="Planos" title="Não foi possível carregar os planos agora.">{state.error}</AccessNotice>}
      {state.plans === null && !state.error && <p className="cl-label" role="status">Carregando…</p>}
      {state.plans?.length === 0 && (
        <AccessNotice tone="info" eyebrow="Em definição" title="Os planos comerciais ainda estão sendo definidos." actions={contact}>
          Enquanto isso, o acesso ao terminal é liberado por convite, com período de teste combinado com a equipe.
        </AccessNotice>
      )}

      {state.plans && state.plans.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {state.plans.map((p) => (
            <Panel key={p.id} eyebrow={`versão ${p.version}`} title={<span style={{ font: "var(--weight-regular) var(--display-s-size)/var(--display-s-lh) var(--font-serif)" }}>{p.name}</span>}
              footer={contact}>
              <div className="flex flex-col gap-4">
                {p.description && <p className="m-0 text-sm text-fg-secondary">{p.description}</p>}
                <p className="m-0 font-mono text-fg">
                  {p.priceMinor === null || !p.currency ? (
                    <span className="text-fg-tertiary">Preço a definir</span>
                  ) : (
                    <>
                      {(p.priceMinor / 100).toLocaleString("pt-BR", { style: "currency", currency: p.currency })}
                      <span className="text-xs text-fg-tertiary"> / {PERIOD[p.billingPeriod ?? ""] ?? p.billingPeriod}</span>
                    </>
                  )}
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {p.features.map((f) => (
                    <li key={f.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-fg">{FEATURE_LABEL[f.key]}</span>
                      {f.limit !== null && <Badge size="sm" tone="neutral">{f.key === "scanner.scan" ? `${fmtInt(f.limit)}/dia` : `até ${fmtInt(f.limit)}`}</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <Panel eyebrow="Transparência" title="Sem renovação automática">
          <p className="m-0 text-sm text-fg-secondary">O acesso termina na data combinada. Nada é cobrado sem o seu acordo.</p>
        </Panel>
        <Panel eyebrow="Dados" title="Binance Spot, ao vivo">
          <p className="m-0 text-sm text-fg-secondary">Candles e cotações reais. Indicadores com fórmula na tela — sem promessa de resultado.</p>
        </Panel>
        <Panel eyebrow="Cancelamento" title="Quando quiser">
          <p className="m-0 text-sm text-fg-secondary">Peça o encerramento ao suporte; seu histórico e preferências ficam salvos.</p>
        </Panel>
      </section>
    </>
  );
}
