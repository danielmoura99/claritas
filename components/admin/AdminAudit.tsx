"use client";

import * as React from "react";
import type { AuditEntry } from "@claritas/contracts";
import { AccessNotice, DataTable, Input, Panel } from "@/design-system";
import { adminApi } from "@/lib/api/commercial";
import { fmtDateTime } from "@/lib/auth/access-copy";
import { LoadError, PageHeader, Pagination, useAsync } from "./shared";

/** Auditoria (Plano 02 §7.6): append-only — nada aqui edita ou apaga registros. */
export function AdminAudit() {
  const [page, setPage] = React.useState(1);
  const [action, setAction] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [q, setQ] = React.useState({ action: "", target: "" });
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQ({ action: action.trim(), target: target.trim() });
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [action, target]);
  const { data, error, loading, reload } = useAsync((s) => adminApi.audit({ page, pageSize: 30, action: q.action || undefined, targetId: q.target || undefined }, s), [page, q]);
  return (
    <>
      <PageHeader eyebrow="Administração" title="Auditoria">Quem alterou o quê, quando e por quê. Registros não podem ser editados nem apagados — nem pela aplicação.</PageHeader>
      <Panel padding="var(--space-5) var(--space-6)" bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input size="sm" icon="filter" placeholder="Ação (ex.: subscription, user.status, plan)" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filtrar por ação" />
          <Input size="sm" icon="search" mono placeholder="ID do alvo" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Filtrar por alvo" />
        </div>
        {error ? (
          <LoadError message={error} onRetry={reload} />
        ) : (
          <DataTable<AuditEntry>
            caption="Registros de auditoria"
            dense
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(a) => a.id}
            empty="Nenhum registro com estes filtros."
            columns={[
              { key: "t", header: "Quando (Brasília)", mono: true, width: "9.5rem", render: (a) => fmtDateTime(a.createdAt) },
              { key: "a", header: "Ação", width: "22%", render: (a) => <span className="text-fg">{a.action}</span> },
              { key: "who", header: "Autor", width: "20%", render: (a) => a.actorLabel },
              { key: "target", header: "Alvo", mono: true, hideBelow: 900, render: (a) => `${a.targetType} ${a.targetId}` },
              { key: "why", header: "Motivo", render: (a) => a.reason ?? "—" },
              { key: "req", header: "requestId", mono: true, hideBelow: 1300, render: (a) => a.requestId ?? "—" },
            ]}
          />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </>
  );
}

/** Pagamentos (Etapa 7 ADIADA): diz a verdade — nenhuma integração ativa. */
export function AdminPayments() {
  const { data, error, reload } = useAsync((s) => adminApi.payments(s), []);
  if (error) return <LoadError message={error} onRetry={reload} />;
  return (
    <>
      <PageHeader eyebrow="Administração" title="Pagamentos">Integração com o gateway próprio.</PageHeader>
      <AccessNotice tone="info" eyebrow="Etapa 7 · adiada" title="Nenhuma cobrança passa pelo Claritas nesta fase.">
        {data?.note ?? "Carregando…"} A estrutura para vincular clientes e registrar eventos verificados já existe no banco; checkout, webhook e conciliação serão feitos quando o contrato do gateway for auditado.
      </AccessNotice>
    </>
  );
}
