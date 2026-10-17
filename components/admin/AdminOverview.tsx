"use client";

import Link from "next/link";
import { Panel, StatTile } from "@/design-system";
import { adminApi } from "@/lib/api/commercial";
import { fmtDateTime, fmtInt } from "@/lib/auth/access-copy";
import { LoadError, PageHeader, useAsync } from "./shared";

/** Visão geral (Plano 02 §7.1 e Etapa 9): só números verificáveis; receita pendente até o gateway. */
export function AdminOverview() {
  const { data, error, reload } = useAsync((signal) => adminApi.summary(signal), []);
  if (error) return <LoadError message={error} onRetry={reload} />;
  const s = data;
  const n = (v: number | undefined) => (v === undefined ? "…" : fmtInt(v));
  return (
    <>
      <PageHeader eyebrow="Administração" title="Visão geral da operação.">
        Contas, acessos concedidos e uso real do produto. Fórmulas em <code className="font-mono text-xs">docs/SAAS_METRICS.md</code>.
      </PageHeader>
      <section aria-label="Usuários" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Usuários" value={n(s?.users.total)} hint={s ? `${fmtInt(s.users.signupsLast7d)} novos em 7 dias` : undefined} />
        <StatTile label="Com acesso ao terminal" value={n(s?.access.withTerminalAccess)} tone="sand" hint="assinatura válida ou concessão" />
        <StatTile label="Ativos em 7 dias" value={n(s?.users.seenLast7d)} hint={s ? `${fmtInt(s.users.seenLast30d)} em 30 dias` : undefined} />
        <StatTile label="Contas bloqueadas" value={n(s?.users.suspended)} hint="suspensas ou desativadas" />
      </section>
      <section aria-label="Acessos" className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile label="Em teste" value={n(s?.access.trialing)} />
        <StatTile label="Acesso manual" value={n(s?.access.manual)} hint="sem cobrança" />
        <StatTile label="Cortesias" value={n(s?.access.complimentary)} />
        <StatTile label="Vencem em 7 dias" value={n(s?.access.expiringIn7d)} />
        <StatTile label="Encerrados em 30 dias" value={n(s?.access.expiredLast30d)} />
      </section>
      <section aria-label="Uso e receita" className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatTile label="Abriram o gráfico" value={n(s?.usage.firstChartViewedUsers30d)} hint="usuários, 30 dias" />
        <StatTile label="Varreduras" value={n(s?.usage.scansLast30d)} hint={s ? `${fmtInt(s.usage.scannerUsers30d)} usuários, 30 dias` : undefined} />
        <StatTile label="Cliques em planos" value={n(s?.usage.upgradeClicks30d)} hint="30 dias" />
        <StatTile label="Receita recorrente" value={null} hint="Pendente — gateway adiado" />
        <StatTile label="Teste → pago" value={null} hint="Pendente — sem pagamentos" />
      </section>
      <Panel eyebrow="Auditoria" title="Atividade administrativa recente" actions={<Link href="/admin/auditoria" className="text-xs text-accent hover:no-underline">Ver tudo</Link>}>
        {s && s.recentAudit.length === 0 && <p className="m-0 text-xs text-fg-tertiary">Nenhuma ação administrativa registrada ainda.</p>}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {s?.recentAudit.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
              <span className="font-mono text-fg-tertiary">{fmtDateTime(a.createdAt)}</span>
              <span className="text-fg">{a.action}</span>
              <span className="text-fg-tertiary">por {a.actorLabel}</span>
              {a.reason && <span className="text-fg-secondary">— {a.reason}</span>}
            </li>
          ))}
        </ul>
      </Panel>
      {s && <p className="m-0 px-1 text-xs text-fg-tertiary">{s.revenue.note} Atualizado em {fmtDateTime(s.generatedAt)}.</p>}
    </>
  );
}
