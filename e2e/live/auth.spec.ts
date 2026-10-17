import { expect, test } from "@playwright/test";
import { E2E_USER } from "../fixtures/e2e-user";

// E2E REAL de acesso: Next + API Claritas + PostgreSQL LOCAL de E2E. Começa sem sessão.
test.use({ viewport: { width: 1440, height: 900 }, storageState: { cookies: [], origins: [] } });

test("sem sessão vai para /entrar; senha errada é recusada; a certa volta ao destino", async ({ page }) => {
  await page.goto("/scanner");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fscanner$/);
  await page.getByLabel("E-mail").fill(E2E_USER.email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
  await page.getByLabel("Senha", { exact: true }).fill(E2E_USER.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/scanner$/);
  await expect(page.getByText(E2E_USER.name)).toBeVisible();
  // O cookie de sessão é HttpOnly: inacessível a scripts da página.
  expect(await page.evaluate(() => document.cookie)).not.toContain("claritas_session");
});

test("criar conta entra no terminal com 7 dias de teste; Sair encerra a sessão no servidor", async ({ page }) => {
  const email = `e2e+${Date.now()}@claritas.test`;
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome").fill("Conta Nova E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("uma-frase-longa-de-senha");
  // Sem o aceite dos Termos/Privacidade, a conta não é criada.
  await page.getByRole("button", { name: "Criar conta e entrar" }).click();
  await expect(page.getByText("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade")).toBeVisible();
  await page.getByText("Li e aceito os").click();
  await page.getByRole("button", { name: "Criar conta e entrar" }).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);
  await expect(page.getByText("Conta Nova E2E")).toBeVisible();
  // Degustação (17/10/2026): conta nova entra com 7 dias de teste do Pro — gráfico real liberado.
  await expect(page.getByRole("main").locator("canvas").first()).toBeVisible();
  expect((await page.request.get("/api/v1/market/quote?symbol=BTCUSDT")).status()).toBe(200);
  await page.goto("/conta");
  await expect(page.getByRole("heading", { name: "Em período de teste." })).toBeVisible();
  await expect(page.getByText("7", { exact: true })).toBeVisible(); // dias restantes
  // E-mail repetido é avisado no campo.
  const dup = await page.request.post("/api/v1/auth/register", { data: { name: "X", email, password: "outra-frase-longa", acceptTerms: true } });
  expect(dup.status()).toBe(409);

  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/entrar$/);
  expect((await page.request.get("/api/v1/auth/session")).status()).toBe(401);
});
