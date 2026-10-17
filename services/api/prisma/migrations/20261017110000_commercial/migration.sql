-- Plano 02, Etapa 2: camada comercial (aditiva). Nenhuma tabela existente perde dados.
-- Planos, features, assinaturas manuais, concessões, quotas, auditoria, eventos de produto e a
-- estrutura de dados (sem integração) do gateway próprio — Etapa 7 ADIADA.

-- CreateEnum
CREATE TYPE "FeatureKind" AS ENUM ('BOOLEAN', 'QUOTA', 'LIMIT');

-- CreateEnum
CREATE TYPE "QuotaWindow" AS ENUM ('DAY_UTC', 'MONTH_UTC');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('OWN_GATEWAY', 'MANUAL', 'COMPLIMENTARY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OverrideEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "GatewayEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'PENDING_REVIEW', 'IGNORED');

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "onboardingDoneAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "FeatureKind" NOT NULL,
    "window" "QuotaWindow",
    "implemented" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "priceMinor" INTEGER,
    "currency" TEXT,
    "billingPeriod" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitValue" INTEGER,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "source" "SubscriptionSource" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "accessUntil" TIMESTAMP(3) NOT NULL,
    "entitlementSnapshot" JSONB NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "reason" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gatewayKey" TEXT,
    "externalSubscriptionId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "effect" "OverrideEffect" NOT NULL,
    "limitValue" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "FeatureOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageCounter" (
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("userId","featureKey","windowStart")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("userId","featureKey","idempotencyKey")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "before" JSONB,
    "after" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "props" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayCustomerLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gatewayKey" TEXT NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GatewayCustomerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayEvent" (
    "id" TEXT NOT NULL,
    "gatewayKey" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "GatewayEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payloadRef" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GatewayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_key_key" ON "Feature"("key");

-- CreateIndex
CREATE INDEX "Plan_status_idx" ON "Plan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_version_key" ON "Plan"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureId_key" ON "PlanFeature"("planId", "featureId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_status_accessUntil_idx" ON "Subscription"("status", "accessUntil");

-- CreateIndex
CREATE INDEX "Subscription_source_idx" ON "Subscription"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_gatewayKey_externalSubscriptionId_key" ON "Subscription"("gatewayKey", "externalSubscriptionId");

-- CreateIndex
CREATE INDEX "FeatureOverride_userId_featureKey_idx" ON "FeatureOverride"("userId", "featureKey");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_createdAt_idx" ON "AdminAuditLog"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ProductEvent_name_occurredAt_idx" ON "ProductEvent"("name", "occurredAt");

-- CreateIndex
CREATE INDEX "ProductEvent_userId_name_idx" ON "ProductEvent"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayCustomerLink_gatewayKey_externalCustomerId_key" ON "GatewayCustomerLink"("gatewayKey", "externalCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayCustomerLink_userId_gatewayKey_key" ON "GatewayCustomerLink"("userId", "gatewayKey");

-- CreateIndex
CREATE INDEX "GatewayEvent_status_receivedAt_idx" ON "GatewayEvent"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayEvent_gatewayKey_externalEventId_key" ON "GatewayEvent"("gatewayKey", "externalEventId");

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureOverride" ADD CONSTRAINT "FeatureOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── Integridade além do Prisma (Plano 02 §6.2, docs/SAAS_DECISIONS.md) ─────────────────────────

-- D-S05: no máximo UMA assinatura corrente por usuário.
CREATE UNIQUE INDEX "Subscription_one_current_per_user"
  ON "Subscription"("userId")
  WHERE "status" IN ('PENDING', 'TRIALING', 'ACTIVE', 'PAST_DUE');

-- Períodos coerentes e contadores não negativos.
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_period_check" CHECK ("accessUntil" > "startsAt");
ALTER TABLE "FeatureOverride" ADD CONSTRAINT "FeatureOverride_period_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "FeatureOverride" ADD CONSTRAINT "FeatureOverride_limit_check" CHECK ("limitValue" IS NULL OR "limitValue" >= 0);
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_limit_check" CHECK ("limitValue" IS NULL OR "limitValue" >= 0);
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_used_check" CHECK ("used" >= 0);
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_price_check" CHECK ("priceMinor" IS NULL OR "priceMinor" >= 0);

-- D-S12: trilha administrativa append-only — nem a aplicação consegue alterar ou apagar registros.
CREATE FUNCTION "admin_audit_log_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AdminAuditLog é append-only (operação % recusada)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AdminAuditLog_append_only"
  BEFORE UPDATE OR DELETE ON "AdminAuditLog"
  FOR EACH ROW EXECUTE FUNCTION "admin_audit_log_append_only"();
