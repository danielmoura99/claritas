"use client";

import * as React from "react";
import type { FeatureDto, PlanDto, PlanFeatureDto } from "@claritas/contracts";
import { Badge, Button, Checkbox, Dialog, Input, Panel, type BadgeTone } from "@/design-system";
import { describeError } from "@/lib/api/client";
import { adminApi } from "@/lib/api/commercial";
import { fmtDate, fmtInt } from "@/lib/auth/access-copy";
import { LoadError, PageHeader, ReasonDialog, useAsync } from "./shared";

const STATUS: Record<PlanDto["status"], { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PUBLISHED: { label: "Publicado", tone: "sand" },
  ARCHIVED: { label: "Arquivado", tone: "neutral" },
};

/** Catálogo de planos (Plano 02 §7.4): rascunho → publicação (imutável) → nova versão. Preço só após aprovação. */
export function AdminPlans() {
  const plans = useAsync((s) => adminApi.plans(s), []);
  const features = useAsync((s) => adminApi.features(s), []);
  const [editing, setEditing] = React.useState<PlanDto | "new" | null>(null);
  const [action, setAction] = React.useState<{ kind: "publish" | "archive"; plan: PlanDto } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const reload = () => {
    plans.reload();
    setError(null);
  };
  if (plans.error) return <LoadError message={plans.error} onRetry={plans.reload} />;
  const catalog = features.data ?? [];

  return (
    <>
      <PageHeader eyebrow="Administração" title="Planos" actions={<Button size="sm" variant="primary" icon="plus" onClick={() => setEditing("new")}>Novo plano</Button>}>
        Publicar aprova o plano para oferta pública e congela a versão. Quem já tem acesso mantém os benefícios concedidos (snapshot). Preços dependem de aprovação comercial.
      </PageHeader>
      {error && <p role="alert" className="m-0 px-1 text-xs text-down-text">{error}</p>}
      <div className="grid gap-2 xl:grid-cols-2">
        {(plans.data ?? []).map((p) => (
          <Panel key={p.id} eyebrow={`${p.code} · versão ${p.version}`} title={p.name}
            actions={<Badge tone={STATUS[p.status].tone} size="sm">{STATUS[p.status].label}</Badge>}
            footer={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-fg-tertiary">
                  {fmtInt(p.activeSubscriptions ?? 0)} assinatura(s) corrente(s){p.publishedAt ? ` · publicado em ${fmtDate(p.publishedAt)}` : ""}
                </span>
                <span className="flex gap-1">
                  {p.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>Editar</Button>}
                  {p.status === "DRAFT" && <Button size="sm" variant="secondary" onClick={() => setAction({ kind: "publish", plan: p })}>Publicar</Button>}
                  {p.status !== "DRAFT" && <Button size="sm" variant="ghost" onClick={() => adminApi.newPlanVersion(p.id).then(reload, (e) => setError(describeError(e)))}>Nova versão</Button>}
                  {p.status !== "ARCHIVED" && <Button size="sm" variant="ghost" onClick={() => setAction({ kind: "archive", plan: p })}>Arquivar</Button>}
                </span>
              </div>
            }>
            {p.description && <p className="mb-3 mt-0 text-sm text-fg-secondary">{p.description}</p>}
            <p className="mb-3 mt-0 text-xs text-fg-tertiary">
              Preço: {p.priceMinor === null ? "a definir (decisão comercial pendente)" : `${(p.priceMinor / 100).toLocaleString("pt-BR", { style: "currency", currency: p.currency ?? "BRL" })} · ${p.billingPeriod}`}
            </p>
            <FeatureMatrix plan={p} catalog={catalog} />
          </Panel>
        ))}
      </div>
      {plans.data?.length === 0 && <p className="px-1 text-xs text-fg-tertiary">Nenhum plano. O seed cria os rascunhos iniciais (Essencial e Pro).</p>}

      {editing && <PlanEditor plan={editing === "new" ? null : editing} catalog={catalog} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {action && (
        <ReasonDialog open title={action.kind === "publish" ? "Publicar plano" : "Arquivar plano"} eyebrow={`${action.plan.name} · v${action.plan.version}`}
          confirmLabel={action.kind === "publish" ? "Publicar" : "Arquivar"} onClose={() => setAction(null)}
          onConfirm={(reason) => (action.kind === "publish" ? adminApi.publishPlan(action.plan.id, reason) : adminApi.archivePlan(action.plan.id, reason)).then(() => { setAction(null); reload(); })}>
          <p className="m-0 text-sm text-fg-secondary">
            {action.kind === "publish"
              ? "A versão fica imutável e aparece em /planos. Só funcionalidades que existem no produto podem ser publicadas. Uma versão publicada anterior deste plano será arquivada."
              : "O plano sai da oferta e não pode mais ser concedido. Assinaturas existentes continuam até o fim do prazo."}
          </p>
        </ReasonDialog>
      )}
    </>
  );
}

function FeatureMatrix({ plan, catalog }: { plan: PlanDto; catalog: FeatureDto[] }) {
  const byKey = new Map(plan.features.map((f) => [f.key, f]));
  return (
    <ul className="m-0 grid list-none gap-1 p-0">
      {catalog.map((f) => {
        const pf = byKey.get(f.key);
        const on = Boolean(pf?.enabled);
        return (
          <li key={f.key} className="flex items-center justify-between gap-3 border-b border-line-subtle py-1 text-xs last:border-b-0">
            <span className={on ? "text-fg" : "text-fg-tertiary"}>{f.name}</span>
            <span className="flex items-center gap-2">
              {!f.implemented && <Badge size="sm" tone="neutral">não implementada</Badge>}
              <span className="font-mono text-fg-secondary">{on ? (pf?.limit !== null && pf?.limit !== undefined ? fmtInt(pf.limit) : "incluída") : "—"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Rascunho: código (só ao criar), nome, descrição e matriz de features/limites. Sem campo de preço (D-02). */
function PlanEditor({ plan, catalog, onClose, onSaved }: { plan: PlanDto | null; catalog: FeatureDto[]; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = React.useState(plan?.code ?? "");
  const [name, setName] = React.useState(plan?.name ?? "");
  const [description, setDescription] = React.useState(plan?.description ?? "");
  const [rows, setRows] = React.useState<Record<string, { enabled: boolean; limit: string }>>(() =>
    Object.fromEntries(catalog.map((f) => {
      const pf = plan?.features.find((x) => x.key === f.key);
      return [f.key, { enabled: Boolean(pf?.enabled), limit: pf?.limit != null ? String(pf.limit) : "" }];
    })),
  );
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const save = async () => {
    setPending(true);
    setError(null);
    const features: PlanFeatureDto[] = catalog
      .filter((f) => rows[f.key]?.enabled)
      .map((f) => ({ key: f.key, enabled: true, limit: f.kind === "BOOLEAN" || !rows[f.key]!.limit ? null : Number(rows[f.key]!.limit) }));
    const body = { code, name, description, features };
    try {
      if (plan) await adminApi.updatePlan(plan.id, body);
      else await adminApi.createPlan(body);
      onSaved();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog open onClose={onClose} title={plan ? `Editar rascunho · v${plan.version}` : "Novo plano (rascunho)"} width={560}
      footer={<><Button variant="ghost" onClick={onClose} disabled={pending}>Cancelar</Button><Button variant="primary" onClick={() => void save()} loading={pending}>Salvar rascunho</Button></>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Código" value={code} onChange={(e) => setCode(e.target.value.toLowerCase())} disabled={Boolean(plan)} hint="Ex.: pro (estável entre versões)" />
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
        <span className="cl-label">Funcionalidades e limites</span>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {catalog.map((f) => (
            <li key={f.key} className="grid grid-cols-[1fr_8rem] items-center gap-3">
              <Checkbox checked={rows[f.key]?.enabled ?? false} disabled={!f.implemented} onChange={(v) => setRows((r) => ({ ...r, [f.key]: { ...r[f.key]!, enabled: v } }))}
                label={f.name} description={f.implemented ? (f.kind === "QUOTA" ? `Quota por ${f.window === "MONTH_UTC" ? "mês" : "dia"} (UTC)` : f.kind === "LIMIT" ? "Quantidade máxima" : undefined) : "Não implementada — não pode ser oferecida"} />
              {f.kind !== "BOOLEAN" && f.implemented && (
                <Input size="sm" mono inputMode="numeric" aria-label={`Limite de ${f.name}`} placeholder="limite" value={rows[f.key]?.limit ?? ""} disabled={!rows[f.key]?.enabled}
                  onChange={(e) => setRows((r) => ({ ...r, [f.key]: { ...r[f.key]!, limit: e.target.value.replace(/\D/g, "") } }))} />
              )}
            </li>
          ))}
        </ul>
        <p className="m-0 text-xs text-fg-tertiary">Preço, moeda e periodicidade ficam em branco até aprovação comercial.</p>
        {error && <p role="alert" className="m-0 text-xs text-down-text">{error}</p>}
      </div>
    </Dialog>
  );
}
