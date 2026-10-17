"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import type { SubscriptionDto, UserStatus } from "@claritas/contracts";
import { AccessNotice, Badge, Button, Dialog, Input, Tabs, type BadgeTone } from "@/design-system";
import { describeError } from "@/lib/api/client";
import { SUB_SOURCE_LABEL, SUB_STATUS_LABEL } from "@/lib/auth/access-copy";
import { useCurrentUser } from "@/lib/auth/use-session";

/** Carregamento com cancelamento e recarga explícita (sem cache: dados administrativos são sempre frescos). */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: React.DependencyList) {
  const [tick, setTick] = React.useState(0);
  // Chave da consulta atual: "carregando" é derivado (resultado de outra chave = ainda carregando).
  const key = JSON.stringify([...deps, tick]);
  const [state, setState] = React.useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
  React.useEffect(() => {
    const abort = new AbortController();
    load(abort.signal)
      .then((data) => !abort.signal.aborted && setState({ key, data, error: null }))
      .catch((err) => !abort.signal.aborted && (err as Error).name !== "AbortError" && setState((s) => ({ key, data: s.data, error: describeError(err) })));
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { data: state.data, error: state.key === key ? state.error : null, loading: state.key !== key, reload };
}

const ADMIN_TABS = [
  { value: "/admin", label: "Visão geral" },
  { value: "/admin/usuarios", label: "Usuários" },
  { value: "/admin/assinaturas", label: "Assinaturas" },
  { value: "/admin/planos", label: "Planos" },
  { value: "/admin/auditoria", label: "Auditoria" },
  { value: "/admin/integracoes", label: "Pagamentos" },
];

/**
 * Área administrativa (Plano 02 §7). O menu e este portão são conveniência de interface: cada chamada da API
 * exige ADMIN no servidor. Sem papel de admin, nada daqui é carregado.
 */
export function AdminFrame({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;
  if (user.role !== "ADMIN") {
    return (
      <div className="flex flex-1 p-1">
        <AccessNotice fill eyebrow="Administração" title="Área restrita à equipe Claritas.">
          Sua conta não tem permissão de administração. Se precisar de algo, fale com o suporte.
        </AccessNotice>
      </div>
    );
  }
  const active = ADMIN_TABS.filter((t) => pathname === t.value || pathname.startsWith(`${t.value}/`)).sort((a, b) => b.value.length - a.value.length)[0]?.value ?? "/admin";
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <nav aria-label="Administração" className="overflow-x-auto">
        <Tabs items={ADMIN_TABS} value={active} onChange={(v) => router.push(v)} />
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-3 [&>*]:shrink-0">{children}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
      <div className="flex max-w-2xl flex-col gap-2">
        <span className="cl-label">{eyebrow}</span>
        <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-m-size)/var(--display-m-lh) var(--font-serif)", letterSpacing: "var(--display-m-track)" }}>{title}</h1>
        {children && <p className="m-0 text-sm text-fg-secondary">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 px-1 text-xs text-fg-tertiary">
      <span className="font-mono">
        {total === 0 ? "0 registros" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total.toLocaleString("pt-BR")}`}
      </span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="ghost" icon="chevron-left" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
        <Button size="sm" variant="ghost" iconRight="chevron-right" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

/** Erro de carregamento com nova tentativa. */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <AccessNotice tone="warn" eyebrow="Erro" title="Não foi possível carregar." actions={<Button size="sm" icon="refresh-cw" onClick={onRetry}>Tentar novamente</Button>}>
      {message}
    </AccessNotice>
  );
}

/**
 * Confirmação de operação sensível com MOTIVO obrigatório (vai para a auditoria). Mostra o efeito antes de
 * confirmar; erros da API aparecem no próprio diálogo.
 */
export function ReasonDialog({
  open,
  title,
  eyebrow,
  confirmLabel,
  children,
  onConfirm,
  onClose,
  canConfirm = true,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  confirmLabel: string;
  children?: React.ReactNode;
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
  canConfirm?: boolean;
}) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const valid = reason.trim().length >= 5;
  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };
  const confirm = async () => {
    if (!valid || !canConfirm) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog open={open} onClose={close} title={title} eyebrow={eyebrow} width={460}
      footer={<><Button variant="ghost" onClick={close} disabled={pending}>Cancelar</Button><Button variant="primary" onClick={() => void confirm()} loading={pending} disabled={!valid || !canConfirm}>{confirmLabel}</Button></>}>
      <div className="flex flex-col gap-4">
        {children}
        <Input label="Motivo (vai para a auditoria)" placeholder="Ex.: teste acordado com o cliente em 17/10" value={reason} onChange={(e) => setReason(e.target.value)} hint="Mínimo de 5 caracteres." autoFocus />
        {error && <p role="alert" className="m-0 text-xs text-down-text">{error}</p>}
      </div>
    </Dialog>
  );
}

const USER_STATUS: Record<UserStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: "Ativa", tone: "neutral" },
  SUSPENDED: { label: "Suspensa", tone: "down" },
  DEACTIVATED: { label: "Desativada", tone: "down" },
  PENDING_VERIFICATION: { label: "Pendente", tone: "warn" },
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const s = USER_STATUS[status];
  return <Badge tone={s.tone} size="sm" dot>{s.label}</Badge>;
}

/** Estado + origem da assinatura, com texto (nunca só cor) e sem sugerir pagamento em cortesia/manual. */
const SHORT_SOURCE: Record<SubscriptionDto["source"], string> = { OWN_GATEWAY: "paga", MANUAL: "manual", COMPLIMENTARY: "cortesia" };

export function SubscriptionBadges({ sub, compact = false }: { sub: Pick<SubscriptionDto, "status" | "source"> & { current?: boolean }; compact?: boolean }) {
  const tone: BadgeTone = sub.current === false ? "neutral" : sub.status === "TRIALING" ? "info" : sub.status === "ACTIVE" ? "sand" : "neutral";
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone={tone} size="sm">{sub.current === false && (sub.status === "ACTIVE" || sub.status === "TRIALING") ? "Vencida" : SUB_STATUS_LABEL[sub.status]}</Badge>
      <span className="text-xs text-fg-tertiary">{compact ? SHORT_SOURCE[sub.source] : SUB_SOURCE_LABEL[sub.source]}</span>
    </span>
  );
}
