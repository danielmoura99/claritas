import { expect, test as setup } from "@playwright/test";
import pg from "pg";

import { AUTH_FILE, E2E_DATABASE_URL, E2E_USER } from "./fixtures/e2e-user";

setup("sessão do usuário E2E", async ({ request }) => {
  let res = await request.post("/api/v1/auth/register", { data: E2E_USER });
  if (res.status() === 409) res = await request.post("/api/v1/auth/login", { data: { email: E2E_USER.email, password: E2E_USER.password } });
  expect(res.ok(), await res.text()).toBe(true);

  // Trava de segurança: a API em execução precisa estar usando o banco local de E2E. Se ela foi
  // reaproveitada de um `npm run dev` apontando para o Neon, a conta não aparece aqui e a suíte para.
  const db = new pg.Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  try {
    const found = await db.query<{ id: string }>('SELECT id FROM "User" WHERE email = $1', [E2E_USER.email]);
    expect(found.rowCount, "a API em :4000 não está usando o banco local de E2E — pare o `npm run dev` e rode de novo").toBe(1);
    const userId = found.rows[0]!.id;
    // Deny-by-default (Plano 02): a conta E2E precisa de acesso. SÓ NO BANCO LOCAL DE E2E, concede o plano "pro"
    // por 1 dia como o admin faria (assinatura MANUAL com snapshot do plano), se ainda não houver uma válida.
    const current = await db.query(`SELECT 1 FROM "Subscription" WHERE "userId" = $1 AND status IN ('TRIALING','ACTIVE') AND "accessUntil" > now()`, [userId]);
    if (current.rowCount === 0) {
      await db.query(`UPDATE "Subscription" SET status = 'CANCELED', "endedAt" = now(), "endReason" = 'e2e' WHERE "userId" = $1 AND status IN ('PENDING','TRIALING','ACTIVE','PAST_DUE')`, [userId]);
      await db.query(
        `INSERT INTO "Subscription" (id, "userId", "planId", status, source, "startsAt", "accessUntil", "entitlementSnapshot", reason, "updatedAt")
         SELECT 'e2e_' || md5(random()::text), $1, p.id, 'ACTIVE', 'MANUAL', now() - interval '1 minute', now() + interval '1 day',
                COALESCE(jsonb_object_agg(f.key, jsonb_build_object('enabled', pf.enabled, 'limit', pf."limitValue")), '{}'::jsonb), 'acesso da suíte E2E local', now()
         FROM "Plan" p JOIN "PlanFeature" pf ON pf."planId" = p.id JOIN "Feature" f ON f.id = pf."featureId"
         WHERE p.code = 'pro' AND p.version = (SELECT max(version) FROM "Plan" WHERE code = 'pro')
         GROUP BY p.id`,
        [userId],
      );
    }
  } finally {
    await db.end();
  }
  await request.storageState({ path: AUTH_FILE });
});
