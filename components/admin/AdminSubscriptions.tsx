"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionDto } from "@claritas/contracts";
import { DataTable, Panel, Select } from "@/design-system";
import { adminApi } from "@/lib/api/commercial";
import { fmtDate, fmtDateTime } from "@/lib/auth/access-copy";
import { LoadError, PageHeader, Pagination, SubscriptionBadges, useAsync } from "./shared";

/** Gestão comercial (Plano 02 §7.5). Concessões são feitas no detalhe do usuário, com motivo e prazo. */
export function AdminSubscriptions() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState("");
  const [source, setSource] = React.useState("");
  const [current, setCurrent] = React.useState("true");
  const { data, error, loading, reload } = useAsync((s) => adminApi.subscriptions({ page, pageSize: 20, status: status || undefined, source: source || undefined, current: current || undefined }, s), [page, status, source, current]);
  const f = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };
  return (
    <>
      <PageHeader eyebrow="Administração" title="Assinaturas">
        Testes, acessos manuais e cortesias concedidos pela equipe. Nada aqui é pagamento: a cobrança depende da integração com o gateway (adiada).
      </PageHeader>
      <Panel padding="var(--space-5) var(--space-6)" bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select size="sm" value={current} onChange={f(setCurrent)} options={[{ value: "true", label: "Concedendo acesso agora" }, { value: "false", label: "Sem acesso agora" }, { value: "", label: "Todas" }]} />
          <Select size="sm" value={status} onChange={f(setStatus)} options={[{ value: "", label: "Todo status" }, { value: "TRIALING", label: "Em teste" }, { value: "ACTIVE", label: "Ativa" }, { value: "CANCELED", label: "Encerrada" }, { value: "EXPIRED", label: "Expirada" }]} />
          <Select size="sm" value={source} onChange={f(setSource)} options={[{ value: "", label: "Toda origem" }, { value: "MANUAL", label: "Manual" }, { value: "COMPLIMENTARY", label: "Cortesia" }]} />
        </div>
        {error ? (
          <LoadError message={error} onRetry={reload} />
        ) : (
          <DataTable<SubscriptionDto>
            caption="Assinaturas"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(s) => s.id}
            onRowClick={(s) => router.push(`/admin/usuarios/${s.userId}`)}
            rowLabel={(s) => `Abrir ${s.userEmail}`}
            empty="Nenhuma assinatura com estes filtros."
            columns={[
              { key: "u", header: "Cliente", width: "28%", render: (s) => <span className="flex min-w-0 flex-col"><span className="truncate text-fg">{s.userName}</span><span className="truncate font-mono text-fg-tertiary">{s.userEmail}</span></span> },
              { key: "p", header: "Plano", render: (s) => `${s.planName} · v${s.planVersion}` },
              { key: "st", header: "Situação", render: (s) => <SubscriptionBadges sub={s} /> },
              { key: "from", header: "Início", mono: true, align: "right", hideBelow: 1000, render: (s) => fmtDate(s.startsAt) },
              { key: "to", header: "Acesso até", mono: true, align: "right", render: (s) => fmtDateTime(s.accessUntil) },
              { key: "end", header: "Encerramento", hideBelow: 1200, render: (s) => (s.endedAt ? `${fmtDate(s.endedAt)} · ${s.endReason ?? ""}` : "—") },
            ]}
          />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </>
  );
}
