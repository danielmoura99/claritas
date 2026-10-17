"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FEATURE_KEYS, type AdminUserDetail as Detail, type FeatureKey, type OverrideDto, type SubscriptionDto } from "@claritas/contracts";
import { Badge, Button, Checkbox, DataTable, Input, Panel, Select } from "@/design-system";
import { adminApi } from "@/lib/api/commercial";
import { FEATURE_LABEL, REASON_LABEL, STATE_LABEL, fmtDate, fmtDateTime, fmtInt } from "@/lib/auth/access-copy";
import { useCurrentUser } from "@/lib/auth/use-session";
import { LoadError, PageHeader, ReasonDialog, SubscriptionBadges, UserStatusBadge, useAsync } from "./shared";

const DAY = 86_400_000;
const DURATIONS = [
  { value: "1", label: "1 dia" },
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "180", label: "180 dias" },
  { value: "365", label: "365 dias" },
];
const untilIso = (days: string) => new Date(Date.now() + Number(days) * DAY).toISOString();

type Dialog =
  | { kind: "status"; status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" }
  | { kind: "grantPlan" }
  | { kind: "extend"; sub: SubscriptionDto }
  | { kind: "revokeSub"; sub: SubscriptionDto }
  | { kind: "override" }
  | { kind: "revokeOverride"; ov: OverrideDto }
  | null;

/** Detalhe do usuário (Plano 02 §7.3). Toda alteração exige motivo e é auditada; o servidor revalida tudo. */
export function AdminUserDetail({ id }: { id: string }) {
  const router = useRouter();
  const me = useCurrentUser();
  const { data, error, reload } = useAsync((signal) => adminApi.user(id, signal), [id]);
  const plans = useAsync((signal) => adminApi.plans(signal), []);
  const features = useAsync((signal) => adminApi.features(signal), []);
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const done = () => {
    setDialog(null);
    reload();
  };

  if (error) return <LoadError message={error} onRetry={reload} />;
  if (!data) return <p className="cl-label px-1" role="status">Carregando…</p>;
  const { user, access, subscriptions, overrides, timeline } = data;
  const self = me?.id === user.id;
  const current = subscriptions.find((s) => ["PENDING", "TRIALING", "ACTIVE", "PAST_DUE"].includes(s.status));

  return (
    <>
      <PageHeader eyebrow="Usuário" title={user.name} actions={<Button size="sm" variant="ghost" icon="chevron-left" onClick={() => router.push("/admin/usuarios")}>Usuários</Button>}>
        <span className="font-mono">{user.email}</span>
      </PageHeader>

      <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel eyebrow="Conta" title="Identidade e estado" actions={!self && <StatusActions status={user.status} onPick={(status) => setDialog({ kind: "status", status })} />}>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-fg-tertiary">Estado</dt>
            <dd className="m-0"><UserStatusBadge status={user.status} />{user.statusReason && <span className="ml-2 text-fg-tertiary">{user.statusReason}</span>}</dd>
            <dt className="text-fg-tertiary">Papel</dt>
            <dd className="m-0">{user.role === "ADMIN" ? <Badge tone="sand" size="sm">Admin</Badge> : "Usuário"} <span className="text-fg-tertiary">— alterado só pelo comando auditado</span></dd>
            <dt className="text-fg-tertiary">Acesso comercial</dt>
            <dd className="m-0 text-fg">{STATE_LABEL[access.state]}</dd>
            <dt className="text-fg-tertiary">Cadastro</dt>
            <dd className="m-0 font-mono">{fmtDateTime(user.createdAt)}</dd>
            <dt className="text-fg-tertiary">Último acesso</dt>
            <dd className="m-0 font-mono">{fmtDateTime(user.lastSeenAt)}</dd>
            <dt className="text-fg-tertiary">Sessões ativas</dt>
            <dd className="m-0 font-mono">{fmtInt(user.activeSessions)}</dd>
          </dl>
          {self && <p className="mb-0 mt-3 text-xs text-fg-tertiary">Esta é a sua conta: o estado não pode ser alterado por você mesmo.</p>}
        </Panel>

        <Panel eyebrow="Acesso efetivo" title="Funcionalidades liberadas — e por quê">
          <DataTable
            dense
            caption="Funcionalidades"
            rows={FEATURE_KEYS.map((k) => ({ key: k, d: access.features[k] }))}
            rowKey={(r) => r.key}
            columns={[
              { key: "f", header: "Funcionalidade", width: "30%", render: (r) => FEATURE_LABEL[r.key as FeatureKey] },
              { key: "ok", header: "Situação", width: "15%", render: (r) => (r.d.allowed ? <Badge tone="sand" size="sm" dot>Liberada</Badge> : <Badge tone="neutral" size="sm">Negada</Badge>) },
              { key: "why", header: "Motivo", wrap: true, render: (r) => REASON_LABEL[r.d.reason] },
              { key: "lim", header: "Limite", mono: true, align: "right", hideBelow: 900, render: (r) => (r.d.limit === undefined ? "—" : r.d.remaining === undefined ? fmtInt(r.d.limit) : `${fmtInt(r.d.remaining)}/${fmtInt(r.d.limit)}`) },
              { key: "exp", header: "Até", mono: true, align: "right", hideBelow: 1100, render: (r) => fmtDate(r.d.expiresAt) },
            ]}
          />
        </Panel>
      </div>

      <Panel eyebrow="Assinaturas" title="Planos concedidos" actions={<Button size="sm" variant="primary" icon="plus" onClick={() => setDialog({ kind: "grantPlan" })}>Conceder acesso</Button>}>
        <p className="mb-3 mt-0 text-xs text-fg-tertiary">Concessões manuais não são pagamento: nada é cobrado e nada entra em receita. Pagamentos dependem da integração com o gateway (adiada).</p>
        <DataTable
          caption="Assinaturas"
          rows={subscriptions}
          rowKey={(s) => s.id}
          empty="Nenhuma assinatura. Sem plano ou concessão, o acesso comercial fica negado."
          columns={[
            { key: "plan", header: "Plano", width: "20%", render: (s) => `${s.planName} · v${s.planVersion}` },
            { key: "st", header: "Situação", render: (s) => <SubscriptionBadges sub={s} /> },
            { key: "from", header: "Início", mono: true, align: "right", hideBelow: 900, render: (s) => fmtDate(s.startsAt) },
            { key: "to", header: "Acesso até", mono: true, align: "right", render: (s) => fmtDateTime(s.accessUntil) },
            { key: "why", header: "Motivo", wrap: true, hideBelow: 1100, render: (s) => <span title={s.reason}>{s.endReason ? `${s.reason} · fim: ${s.endReason}` : s.reason}</span> },
            { key: "act", header: "", align: "right", width: "11.25rem", render: (s) => (s.id === current?.id && s.source !== "OWN_GATEWAY" ? (
              <span className="inline-flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "extend", sub: s })}>Prazo</Button>
                <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "revokeSub", sub: s })}>Revogar</Button>
              </span>
            ) : null) },
          ]}
        />
      </Panel>

      <Panel eyebrow="Concessões individuais" title="Exceções por funcionalidade" actions={<Button size="sm" variant="secondary" icon="plus" onClick={() => setDialog({ kind: "override" })}>Nova exceção</Button>}>
        <p className="mb-3 mt-0 text-xs text-fg-tertiary">Sempre com prazo e motivo. Uma negação vence o plano e qualquer liberação.</p>
        <DataTable
          caption="Concessões"
          rows={overrides}
          rowKey={(o) => o.id}
          empty="Nenhuma exceção registrada."
          columns={[
            { key: "f", header: "Funcionalidade", width: "24%", render: (o) => FEATURE_LABEL[o.featureKey] },
            { key: "e", header: "Efeito", render: (o) => (o.effect === "ALLOW" ? <Badge tone="sand" size="sm">Libera{o.limitValue !== null ? ` · ${fmtInt(o.limitValue)}` : ""}</Badge> : <Badge tone="down" size="sm">Nega</Badge>) },
            { key: "v", header: "Vigência", mono: true, render: (o) => `${fmtDate(o.startsAt)} → ${fmtDate(o.endsAt)}` },
            { key: "s", header: "Situação", render: (o) => (o.revokedAt ? `Revogada (${o.revokeReason ?? ""})` : o.active ? "Em vigor" : Date.parse(o.endsAt) <= Date.now() ? "Encerrada" : "Agendada") },
            { key: "r", header: "Motivo", wrap: true, hideBelow: 1100, render: (o) => o.reason },
            { key: "a", header: "", align: "right", width: "7rem", render: (o) => (!o.revokedAt && Date.parse(o.endsAt) > Date.now() ? <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "revokeOverride", ov: o })}>Revogar</Button> : null) },
          ]}
        />
      </Panel>

      <Panel eyebrow="Linha do tempo" title="Alterações registradas">
        {timeline.length === 0 ? (
          <p className="m-0 text-xs text-fg-tertiary">Nenhuma ação administrativa sobre esta conta.</p>
        ) : (
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {timeline.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 text-xs">
                <span className="font-mono text-fg-tertiary">{fmtDateTime(a.createdAt)}</span>
                <span className="text-fg">{a.action}</span>
                <span className="text-fg-tertiary">por {a.actorLabel}</span>
                {a.reason && <span className="text-fg-secondary">— {a.reason}</span>}
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Dialogs dialog={dialog} detail={data} plans={plans.data ?? []} features={features.data ?? []} hasCurrent={Boolean(current)} onClose={() => setDialog(null)} onDone={done} />
    </>
  );
}

function StatusActions({ status, onPick }: { status: string; onPick: (s: "ACTIVE" | "SUSPENDED" | "DEACTIVATED") => void }) {
  if (status === "ACTIVE")
    return (
      <span className="inline-flex gap-1">
        <Button size="sm" variant="secondary" onClick={() => onPick("SUSPENDED")}>Suspender</Button>
        <Button size="sm" variant="ghost" onClick={() => onPick("DEACTIVATED")}>Desativar</Button>
      </span>
    );
  return <Button size="sm" variant="secondary" onClick={() => onPick("ACTIVE")}>Reativar</Button>;
}

function Dialogs({
  dialog,
  detail,
  plans,
  features,
  hasCurrent,
  onClose,
  onDone,
}: {
  dialog: Dialog;
  detail: Detail;
  plans: Awaited<ReturnType<typeof adminApi.plans>>;
  features: Awaited<ReturnType<typeof adminApi.features>>;
  hasCurrent: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const uid = detail.user.id;
  const usable = plans.filter((p) => p.status !== "ARCHIVED");
  const [planId, setPlanId] = React.useState("");
  const [kind, setKind] = React.useState<"TRIAL" | "MANUAL" | "COMPLIMENTARY">("TRIAL");
  const [days, setDays] = React.useState("14");
  const [replace, setReplace] = React.useState(false);
  const [featureKey, setFeatureKey] = React.useState<FeatureKey>("terminal.access");
  const [effect, setEffect] = React.useState<"ALLOW" | "DENY">("ALLOW");
  const [limit, setLimit] = React.useState("");
  const implemented = features.filter((f) => f.implemented);
  const featureDef = features.find((f) => f.key === featureKey);
  const plan = usable.find((p) => p.id === (planId || usable[0]?.id));

  if (!dialog) return null;
  switch (dialog.kind) {
    case "status": {
      const verb = dialog.status === "ACTIVE" ? "Reativar" : dialog.status === "SUSPENDED" ? "Suspender" : "Desativar";
      return (
        <ReasonDialog open title={`${verb} a conta`} eyebrow={detail.user.email} confirmLabel={verb} onClose={onClose} onConfirm={(reason) => adminApi.setStatus(uid, { status: dialog.status, reason }).then(onDone)}>
          <p className="m-0 text-sm text-fg-secondary">
            {dialog.status === "ACTIVE" ? "A pessoa volta a poder entrar. O acesso comercial continua dependendo de plano ou concessão." : "Todas as sessões são encerradas agora, streams abertos são fechados e o login fica bloqueado."}
          </p>
        </ReasonDialog>
      );
    }
    case "grantPlan":
      return (
        <ReasonDialog open title="Conceder acesso" eyebrow={detail.user.email} confirmLabel="Conceder" onClose={onClose} canConfirm={Boolean(plan) && (!hasCurrent || replace)}
          onConfirm={(reason) => adminApi.createSubscription({ userId: uid, planId: plan!.id, kind, accessUntil: untilIso(days), reason, replaceCurrent: hasCurrent ? replace : undefined }).then(onDone)}>
          {usable.length === 0 ? (
            <p className="m-0 text-sm text-fg-secondary">Nenhum plano disponível. Crie um em Planos.</p>
          ) : (
            <>
              <Select label="Plano" value={plan?.id ?? ""} onChange={setPlanId} options={usable.map((p) => ({ value: p.id, label: `${p.name} · v${p.version}${p.status === "DRAFT" ? " (rascunho)" : ""}` }))} />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Modalidade" value={kind} onChange={(v) => setKind(v as typeof kind)} options={[{ value: "TRIAL", label: "Teste" }, { value: "MANUAL", label: "Acesso manual" }, { value: "COMPLIMENTARY", label: "Cortesia" }]} />
                <Select label="Duração" value={days} onChange={setDays} options={DURATIONS.slice(1)} />
              </div>
              <p className="m-0 text-xs text-fg-tertiary">Sem cobrança. Acesso até {fmtDateTime(untilIso(days))} (Brasília); depois disso o terminal é bloqueado automaticamente.</p>
              {hasCurrent && <Checkbox checked={replace} onChange={setReplace} label="Substituir a assinatura atual" description="Encerra a atual agora e inicia esta (troca de plano sem cobrança)." />}
            </>
          )}
        </ReasonDialog>
      );
    case "extend":
      return (
        <ReasonDialog open title="Alterar prazo" eyebrow={`${dialog.sub.planName} · ${detail.user.email}`} confirmLabel="Salvar prazo" onClose={onClose}
          onConfirm={(reason) => adminApi.extendSubscription(dialog.sub.id, untilIso(days), reason).then(onDone)}>
          <Select label="Novo fim, a partir de agora" value={days} onChange={setDays} options={DURATIONS} />
          <p className="m-0 text-xs text-fg-tertiary">Atual: {fmtDateTime(dialog.sub.accessUntil)} → novo: {fmtDateTime(untilIso(days))}.</p>
        </ReasonDialog>
      );
    case "revokeSub":
      return (
        <ReasonDialog open title="Revogar assinatura" eyebrow={`${dialog.sub.planName} · ${detail.user.email}`} confirmLabel="Revogar agora" onClose={onClose}
          onConfirm={(reason) => adminApi.revokeSubscription(dialog.sub.id, reason).then(onDone)}>
          <p className="m-0 text-sm text-fg-secondary">O acesso do plano termina imediatamente. O histórico é preservado.</p>
        </ReasonDialog>
      );
    case "override":
      return (
        <ReasonDialog open title="Nova exceção" eyebrow={detail.user.email} confirmLabel={effect === "ALLOW" ? "Liberar" : "Negar"} onClose={onClose}
          onConfirm={(reason) => adminApi.grant(uid, { featureKey, effect, endsAt: untilIso(days), reason, limitValue: effect === "ALLOW" && featureDef?.kind !== "BOOLEAN" && limit ? Number(limit) : undefined }).then(onDone)}>
          <Select label="Funcionalidade" value={featureKey} onChange={(v) => setFeatureKey(v as FeatureKey)} options={implemented.map((f) => ({ value: f.key, label: f.name }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Efeito" value={effect} onChange={(v) => setEffect(v as "ALLOW" | "DENY")} options={[{ value: "ALLOW", label: "Liberar" }, { value: "DENY", label: "Negar" }]} />
            <Select label="Duração" value={days} onChange={setDays} options={DURATIONS} />
          </div>
          {effect === "ALLOW" && featureDef && featureDef.kind !== "BOOLEAN" && (
            <Input label={featureDef.kind === "QUOTA" ? "Limite por janela" : "Quantidade máxima"} mono inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} hint="Vazio = usa o limite do plano (se houver)." />
          )}
          <p className="m-0 text-xs text-fg-tertiary">Vale até {fmtDateTime(untilIso(days))}. {effect === "DENY" ? "Negação vence o plano." : ""}</p>
        </ReasonDialog>
      );
    case "revokeOverride":
      return (
        <ReasonDialog open title="Revogar exceção" eyebrow={`${FEATURE_LABEL[dialog.ov.featureKey]} · ${detail.user.email}`} confirmLabel="Revogar" onClose={onClose}
          onConfirm={(reason) => adminApi.revokeGrant(uid, dialog.ov.id, reason).then(onDone)}>
          <p className="m-0 text-sm text-fg-secondary">A exceção deixa de valer agora. O registro permanece na auditoria.</p>
        </ReasonDialog>
      );
  }
}
