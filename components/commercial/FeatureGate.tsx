"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { FeatureKey } from "@claritas/contracts";
import { AccessNotice, Button } from "@/design-system";
import { meApi } from "@/lib/api/commercial";
import { FEATURE_LABEL, SUPPORT_EMAIL, gateCopy, gateStateOf } from "@/lib/auth/access-copy";
import { useAccess } from "@/lib/auth/use-access";

/** Ações do bloqueio: planos, conta e suporte — nunca um checkout inexistente (Etapa 7 adiada). */
export function UpgradeActions({ feature, showPlans = true }: { feature?: FeatureKey; showPlans?: boolean }) {
  const router = useRouter();
  return (
    <>
      {showPlans && (
        <Button variant="primary" size="sm" iconRight="arrow-up-right" onClick={() => { void meApi.event({ name: "upgrade_clicked", props: feature ? { feature } : undefined }); router.push("/planos"); }}>
          Ver planos
        </Button>
      )}
      <Button variant="secondary" size="sm" icon="user" onClick={() => router.push("/conta")}>Minha conta</Button>
      {SUPPORT_EMAIL ? (
        <Button variant="ghost" size="sm" onClick={() => (window.location.href = `mailto:${SUPPORT_EMAIL}`)}>Falar com o suporte</Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => router.push("/ajuda")}>Ajuda</Button>
      )}
    </>
  );
}

/**
 * Bloqueio de feature (Plano 02 §8.3). Só APRESENTA a decisão do servidor — a API nega a operação de qualquer
 * jeito. Carregando não é autorizado: nada protegido aparece antes da resposta.
 */
export function FeatureGate({ feature, children }: { feature: FeatureKey; children: React.ReactNode }) {
  const access = useAccess();
  if (access.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center" role="status">
        <span className="cl-label">Verificando acesso…</span>
      </div>
    );
  }
  if (access.status === "error") {
    return (
      <div className="flex flex-1 p-1">
        <AccessNotice fill tone="warn" eyebrow="Acesso" title="Não foi possível confirmar seu acesso agora." actions={<Button size="sm" icon="refresh-cw" onClick={() => window.location.reload()}>Tentar novamente</Button>}>
          {access.message}
        </AccessNotice>
      </div>
    );
  }
  const decision = access.access.features[feature];
  if (decision.allowed) return children;
  const gate = gateStateOf(decision, access.access.state);
  const copy = gateCopy(gate, FEATURE_LABEL[feature]);
  return (
    <div className="flex flex-1 p-1" data-gate={gate}>
      <AccessNotice fill tone={gate === "QUOTA_REACHED" || gate === "ACCOUNT_SUSPENDED" ? "warn" : "lock"} eyebrow={copy.eyebrow} title={copy.title}
        actions={gate === "FEATURE_UNAVAILABLE" ? undefined : <UpgradeActions feature={feature} showPlans={gate !== "ACCOUNT_SUSPENDED"} />}>
        {copy.body}
      </AccessNotice>
    </div>
  );
}
