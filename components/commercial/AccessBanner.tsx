"use client";

import Link from "next/link";
import { Icon } from "@/design-system";
import { daysUntil, fmtDate } from "@/lib/auth/access-copy";
import { useAccess } from "@/lib/auth/use-access";

const WARN_DAYS = 3;

/**
 * Faixa discreta sob o topo (Plano 02 Etapa 8): só quando o acesso está perto do fim. Estados sem acesso são
 * explicados pelo FeatureGate de cada tela — aqui não há modal nem pressão comercial.
 */
export function AccessBanner() {
  const s = useAccess();
  if (s.status !== "ready") return null;
  const sub = s.access.subscription;
  if (!sub || (s.access.state !== "TRIALING" && s.access.state !== "ACTIVE")) return null;
  const days = daysUntil(sub.accessUntil);
  if (days > WARN_DAYS) return null;
  const what = s.access.state === "TRIALING" ? "Seu teste" : "Seu acesso";
  const when = days === 0 ? "termina hoje" : days === 1 ? "termina amanhã" : `termina em ${days} dias`;
  return (
    <div role="status" className="flex shrink-0 items-center gap-2.5 border-b border-line-subtle bg-warn-tint px-5 py-1.5 text-xs text-fg-secondary">
      <Icon name="clock" size={13} color="var(--status-warn)" />
      <span>
        {what} {when} ({fmtDate(sub.accessUntil)}). Nada será cobrado automaticamente.
      </span>
      <Link href="/conta" className="ml-auto whitespace-nowrap text-accent hover:no-underline">
        Ver minha conta
      </Link>
    </div>
  );
}
