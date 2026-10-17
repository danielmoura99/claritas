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
    const found = await db.query('SELECT 1 FROM "User" WHERE email = $1', [E2E_USER.email]);
    expect(found.rowCount, "a API em :4000 não está usando o banco local de E2E — pare o `npm run dev` e rode de novo").toBe(1);
  } finally {
    await db.end();
  }
  await request.storageState({ path: AUTH_FILE });
});
