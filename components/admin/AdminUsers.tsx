"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AdminUserRow } from "@claritas/contracts";
import { Badge, DataTable, Input, Panel, Select } from "@/design-system";
import { adminApi } from "@/lib/api/commercial";
import { fmtDate } from "@/lib/auth/access-copy";
import { LoadError, PageHeader, Pagination, SubscriptionBadges, UserStatusBadge, useAsync } from "./shared";

const PAGE_SIZE = 20;

/** Gestão de usuários (Plano 02 §7.2): paginação e filtros no servidor; PII mínima. */
export function AdminUsers() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [role, setRole] = React.useState("");
  const [accessFilter, setAccessFilter] = React.useState("");
  const [sort, setSort] = React.useState("createdAt:desc");
  const [page, setPage] = React.useState(1);

  // Busca com pequeno atraso para não disparar uma requisição por tecla.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, loading, reload } = useAsync(
    (signal) => adminApi.users({ page, pageSize: PAGE_SIZE, search: query || undefined, status: status || undefined, role: role || undefined, access: accessFilter || undefined, sort }, signal),
    [page, query, status, role, accessFilter, sort],
  );
  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader eyebrow="Administração" title="Usuários">Contas cadastradas, estado, acesso efetivo ao terminal e último acesso.</PageHeader>
      <Panel padding="var(--space-5) var(--space-6)" bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
          <Input icon="search" size="sm" placeholder="Buscar por e-mail ou nome" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar usuário" />
          <Select size="sm" value={status} onChange={filter(setStatus)} options={[{ value: "", label: "Todo estado" }, { value: "ACTIVE", label: "Ativas" }, { value: "SUSPENDED", label: "Suspensas" }, { value: "DEACTIVATED", label: "Desativadas" }]} />
          <Select size="sm" value={accessFilter} onChange={filter(setAccessFilter)} options={[{ value: "", label: "Todo acesso" }, { value: "WITH_ACCESS", label: "Com acesso" }, { value: "WITHOUT_ACCESS", label: "Sem acesso" }]} />
          <Select size="sm" value={role} onChange={filter(setRole)} options={[{ value: "", label: "Todo papel" }, { value: "USER", label: "Usuários" }, { value: "ADMIN", label: "Admins" }]} />
          <Select size="sm" value={sort} onChange={filter(setSort)} options={[{ value: "createdAt:desc", label: "Mais recentes" }, { value: "createdAt:asc", label: "Mais antigos" }, { value: "email:asc", label: "E-mail (A–Z)" }]} />
        </div>
        {error ? (
          <LoadError message={error} onRetry={reload} />
        ) : (
          <DataTable<AdminUserRow>
            caption="Usuários"
            loading={loading}
            rows={data?.items ?? []}
            rowKey={(u) => u.id}
            onRowClick={(u) => router.push(`/admin/usuarios/${u.id}`)}
            rowLabel={(u) => `Abrir ${u.email}`}
            empty="Nenhum usuário com estes filtros."
            columns={[
              { key: "who", header: "Usuário", width: "30%", render: (u) => (
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-fg">{u.name}{u.role === "ADMIN" && <Badge tone="sand" size="sm" style={{ marginLeft: 6 }}>Admin</Badge>}</span>
                  <span className="truncate font-mono text-fg-tertiary">{u.email}</span>
                </span>
              ) },
              { key: "status", header: "Conta", render: (u) => <UserStatusBadge status={u.status} />, hideBelow: 640 },
              { key: "plan", header: "Plano", render: (u) => (u.subscription ? <span className="flex flex-col"><span className="text-fg">{u.subscription.planName}</span><SubscriptionBadges compact sub={{ ...u.subscription, current: u.hasTerminalAccess ? undefined : false }} /></span> : <span className="text-fg-tertiary">—</span>) },
              { key: "access", header: "Terminal", render: (u) => (u.hasTerminalAccess ? <Badge tone="sand" size="sm" dot>Com acesso</Badge> : <Badge tone="neutral" size="sm">Sem acesso</Badge>), hideBelow: 900 },
              { key: "until", header: "Acesso até", mono: true, align: "right", render: (u) => fmtDate(u.subscription?.accessUntil), hideBelow: 1100 },
              { key: "seen", header: "Último acesso", mono: true, align: "right", render: (u) => fmtDate(u.lastSeenAt), hideBelow: 1100 },
              { key: "created", header: "Cadastro", mono: true, align: "right", render: (u) => fmtDate(u.createdAt), hideBelow: 760 },
            ]}
          />
        )}
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />}
      </Panel>
    </>
  );
}
