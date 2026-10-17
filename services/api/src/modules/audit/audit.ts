import type { AuditEntry } from "@claritas/contracts";
import type { Prisma } from "../../generated/prisma/client";

/** Quem executou: admin autenticado (id + e-mail) ou o sistema (job, CLI). */
export interface Actor {
  id: string | null;
  label: string;
}

export interface AuditInput {
  action: string;
  targetType: "User" | "Subscription" | "FeatureOverride" | "Plan";
  targetId: string;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
  requestId?: string | null;
}

const json = (v: unknown) => (v === undefined || v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));

/**
 * Registro append-only (D-S12) gravado NA MESMA transação da mudança: sem log, sem mudança.
 * Nunca registrar senha, hash, token ou segredo — os chamadores passam só campos de negócio.
 */
export function audit(tx: Prisma.TransactionClient, actor: Actor, input: AuditInput) {
  return tx.adminAuditLog.create({
    data: {
      actorId: actor.id,
      actorLabel: actor.label,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason ?? null,
      before: json(input.before),
      after: json(input.after),
      requestId: input.requestId ?? null,
    },
  });
}

export const auditToDto = (a: { id: string; actorId: string | null; actorLabel: string; action: string; targetType: string; targetId: string; reason: string | null; before: unknown; after: unknown; requestId: string | null; createdAt: Date }): AuditEntry => ({
  id: a.id,
  actorId: a.actorId,
  actorLabel: a.actorLabel,
  action: a.action,
  targetType: a.targetType,
  targetId: a.targetId,
  reason: a.reason,
  before: a.before ?? null,
  after: a.after ?? null,
  requestId: a.requestId,
  createdAt: a.createdAt.toISOString(),
});
