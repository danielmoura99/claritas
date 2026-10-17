"use client";

import { FEATURE_KEYS } from "@claritas/contracts";
import { AccessNotice, Badge, Button, Panel, StatTile } from "@/design-system";
import { FEATURE_LABEL, REASON_LABEL, STATE_LABEL, SUB_SOURCE_LABEL, SUB_STATUS_LABEL, SUPPORT_EMAIL, daysUntil, fmtDate, fmtDateTime, fmtInt } from "@/lib/auth/access-copy";
import { useAccess } from "@/lib/auth/use-access";
import { signOut, useCurrentUser } from "@/lib/auth/use-session";
import { UpgradeActions } from "./FeatureGate";

/**
 * Minha conta (Plano 02 §8.1 / Etapa 6): o que a pessoa tem, até quando e por quê — somente leitura.
 * Cortesia e acesso manual aparecem como tais (nunca como pagamento); não há checkout (Etapa 7 adiada).
 */
/** Download do JSON de exportação (arquivo da API, não navegação de página). */
function downloadMyData() {
  const a = document.createElement("a");
  a.href = "/api/v1/me/export";
  a.download = "claritas-meus-dados.json";
  a.click();
}

export function AccountScreen() {
  const user = useCurrentUser();
  const access = useAccess();
  if (!user) return null;
  if (access.status !== "ready") {
    return access.status === "error" ? (
      <AccessNotice tone="warn" eyebrow="Conta" title="Não foi possível carregar seu acesso agora.">{access.message}</AccessNotice>
    ) : (
      <p className="cl-label px-1" role="status">Carregando…</p>
    );
  }
  const a = access.access;
  const sub = a.subscription;
  const valid = a.state === "ACTIVE" || a.state === "TRIALING";
  const days = sub && valid ? daysUntil(sub.accessUntil) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 [&>*]:shrink-0">
      <header className="flex flex-col gap-2 px-1 pt-1">
        <span className="cl-label">Minha conta</span>
        <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-m-size)/var(--display-m-lh) var(--font-serif)", letterSpacing: "var(--display-m-track)" }}>{STATE_LABEL[a.state]}.</h1>
        <p className="m-0 text-sm text-fg-secondary">{user.name} · <span className="font-mono">{user.email}</span></p>
      </header>

      <section aria-label="Resumo do acesso" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Plano" kind="text" value={sub ? sub.planName : null} hint={sub ? SUB_STATUS_LABEL[sub.status] : "nenhum plano concedido"} />
        <StatTile label="Origem" kind="text" value={sub ? SUB_SOURCE_LABEL[sub.source] : null} hint={sub && sub.source !== "OWN_GATEWAY" ? "nada é cobrado" : undefined} />
        <StatTile label="Acesso até" value={sub ? fmtDate(sub.accessUntil) : null} hint={sub ? `${fmtDateTime(sub.accessUntil)} (Brasília)` : undefined} />
        <StatTile label="Dias restantes" value={days === null ? null : fmtInt(days)} tone={days !== null && days <= 3 ? "sand" : "default"} hint={valid ? "sem renovação automática" : undefined} />
      </section>

      {!valid && (
        <AccessNotice eyebrow="Acesso" title={a.state === "BLOCKED" ? "Sua conta está sem acesso no momento." : a.state === "NONE" ? "Sua conta ainda não tem acesso liberado." : "Seu acesso terminou."} actions={<UpgradeActions showPlans={a.state !== "BLOCKED"} />}>
          {a.state === "NONE"
            ? "Nesta fase o acesso é liberado pela equipe Claritas — por teste ou plano combinado. Nada é cobrado automaticamente."
            : a.state === "BLOCKED"
              ? "Fale com o suporte para entender o motivo."
              : "Sua watchlist e preferências continuam salvas. Fale com o suporte para renovar."}
        </AccessNotice>
      )}

      <Panel eyebrow="Benefícios" title="O que está liberado para você agora">
        <ul className="m-0 grid list-none gap-1 p-0">
          {FEATURE_KEYS.filter((k) => a.features[k].reason !== "FEATURE_UNAVAILABLE").map((k) => {
            const d = a.features[k];
            return (
              <li key={k} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle py-1.5 text-sm last:border-b-0">
                <span className={d.allowed ? "text-fg" : "text-fg-tertiary"}>{FEATURE_LABEL[k]}</span>
                <span className="flex items-center gap-2 text-xs">
                  {d.limit !== undefined && <span className="font-mono text-fg-secondary">{d.remaining !== undefined ? `${fmtInt(d.remaining)} de ${fmtInt(d.limit)} hoje` : `até ${fmtInt(d.limit)}`}</span>}
                  {d.allowed ? <Badge tone="sand" size="sm" dot>Liberado</Badge> : <Badge tone="neutral" size="sm">{REASON_LABEL[d.reason]}</Badge>}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid gap-2 lg:grid-cols-2">
        <Panel eyebrow="Assinatura" title="Cobrança e cancelamento">
          <p className="m-0 text-sm text-fg-secondary">
            O Claritas ainda não processa pagamentos: acessos são liberados manualmente pela equipe, por prazo definido, e terminam sozinhos ao fim do período — sem renovação nem cobrança automática.
            Para encerrar antes ou mudar de plano, fale com o suporte.
          </p>
        </Panel>
        <Panel eyebrow="Segurança e privacidade" title="Sessão e seus dados" footer={<div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" icon="log-out" onClick={() => void signOut()}>Sair deste navegador</Button><Button size="sm" variant="ghost" icon="download" onClick={downloadMyData}>Baixar meus dados</Button>{SUPPORT_EMAIL && <Button size="sm" variant="ghost" onClick={() => (window.location.href = `mailto:${SUPPORT_EMAIL}`)}>Falar com o suporte</Button>}</div>}>
          <p className="m-0 text-sm text-fg-secondary">Troca de senha e recuperação por e-mail ainda não estão disponíveis (dependem de um serviço de e-mail). &quot;Baixar meus dados&quot; gera um arquivo com tudo o que guardamos sobre você (LGPD, art. 18). Exclusão da conta: peça ao suporte. Veja a Política de Privacidade.</p>
        </Panel>
      </div>
    </div>
  );
}
