import { expect, test, type Page } from "@playwright/test";
import { FrozenProvider, useFrozenApi } from "../fixtures/frozen-api";

// Regressão visual com dados CONGELADOS (fixtures de teste). Atualizar baselines: npm run test:e2e -- --project=visual --update-snapshots
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1366", width: 1366, height: 768 },
  { name: "390", width: 390, height: 844 },
];

/** Elementos que dependem de relógio de parede ou animação contínua não entram na comparação. */
const masks = (page: Page) => [page.locator("[role=status]"), page.locator("text=/atualizado/"), page.locator("text=/calculado/")];

/** Gráfico animado da vitrine ilustrativa do login. */
const showcaseChart = (page: Page) => page.getByTestId("login-showcase-chart");

async function settle(page: Page) {
  // Indicador do modo dev do Next não faz parte do produto.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("pregão ao vivo", async ({ page }) => {
      const api = await useFrozenApi(page);
      await page.goto("/?symbol=BTCUSDT&interval=5m");
      await expect(page.locator("canvas").first()).toBeVisible();
      await expect(page.getByText(/Médias (em|sem)/)).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`pregao-${vp.name}.png`, { mask: masks(page) });
      await api.close();
    });

    test("scanner", async ({ page }) => {
      const api = await useFrozenApi(page);
      await page.goto("/scanner");
      await expect(page.getByText(/atende(m)? aos critérios/)).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`scanner-${vp.name}.png`, { mask: masks(page) });
      await api.close();
    });

    test("resumo do período", async ({ page }) => {
      const api = await useFrozenApi(page);
      await page.goto("/relatorio?symbol=BTCUSDT");
      await expect(page.locator("h1")).toContainText("no período");
      await settle(page);
      await expect(page).toHaveScreenshot(`resumo-${vp.name}.png`, { mask: masks(page), fullPage: vp.name === "1440" });
      await api.close();
    });

    test("entrar", async ({ page }) => {
      const api = await useFrozenApi(page, { signedIn: false });
      await page.goto("/entrar");
      await expect(page.getByRole("heading", { name: "Entre no seu terminal." })).toBeVisible();
      // Vitrine ILUSTRATIVA (mock só do login): o gráfico anima continuamente, então fica fora da comparação.
      if (vp.width >= 980) await expect(page.getByText("Leitura Claritas")).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`entrar-${vp.name}.png`, { mask: [...masks(page), showcaseChart(page)] });
      await api.close();
    });
  });
}

test.describe("acesso (dados congelados)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("sem cookie de sessão, qualquer tela leva a /entrar com o destino", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    await page.goto("/relatorio?symbol=ETHUSDT");
    await expect(page).toHaveURL(/\/entrar\?next=%2Frelatorio%3Fsymbol%3DETHUSDT$/);
    await api.close();
  });

  test("criar conta valida os campos antes de chamar a API", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    const calls: string[] = [];
    page.on("request", (r) => r.url().includes("/api/v1/auth/register") && calls.push(r.url()));
    await page.goto("/entrar?modo=criar");
    await expect(page.getByRole("heading", { name: "Crie seu acesso." })).toBeVisible();
    await page.getByLabel("E-mail").fill("não-é-email");
    await page.getByLabel("Senha", { exact: true }).fill("curta");
    await page.getByRole("button", { name: "Criar conta e entrar" }).click();
    await expect(page.getByText("Informe seu nome")).toBeVisible();
    await expect(page.getByText("E-mail inválido")).toBeVisible();
    await expect(page.getByText("A senha precisa de ao menos 8 caracteres")).toBeVisible();
    await expect(page.getByText("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade")).toBeVisible();
    expect(calls).toEqual([]);
    await settle(page);
    await expect(page).toHaveScreenshot("entrar-criar-erros-1440.png", { mask: [...masks(page), showcaseChart(page)] });
    await api.close();
  });

  test("mostrar/ocultar senha", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    await page.goto("/entrar");
    const field = page.getByLabel("Senha", { exact: true });
    await field.fill("segredo-123");
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(field).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar senha" }).click();
    await expect(field).toHaveAttribute("type", "password");
    await api.close();
  });

  test("terminal mostra a conta da sessão e a opção Sair", async ({ page }) => {
    const api = await useFrozenApi(page);
    await page.goto("/scanner");
    await expect(page.getByText("Analista de Teste")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    await api.close();
  });
});

test.describe("estados (dados congelados)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("feed offline nunca exibe 'Ao vivo'", async ({ page }) => {
    const api = await useFrozenApi(page, { wsStatus: "offline" });
    await page.goto("/?symbol=BTCUSDT&interval=5m");
    await expect(page.locator("canvas").first()).toBeVisible();
    const footer = page.getByText(/Binance Spot · atualizado/).locator("..");
    await expect(footer.getByText("Offline")).toBeVisible();
    await expect(footer.getByText("Ao vivo")).toHaveCount(0);
    await expect(page.getByText("simulado no teste")).toBeVisible();
    await api.close();
  });

  test("feed parado aparece como 'Sem atualização'", async ({ page }) => {
    const api = await useFrozenApi(page, { wsStatus: "stale" });
    await page.goto("/?symbol=BTCUSDT&interval=5m");
    await expect(page.getByText("Sem atualização").first()).toBeVisible();
    await api.close();
  });

  test("provedor fora: erro explícito, sem gráfico inventado, e retry", async ({ page }) => {
    const provider = new FrozenProvider();
    provider.failCandles = true;
    const api = await useFrozenApi(page, { provider });
    await page.goto("/?symbol=ETHUSDT&interval=15m");
    // (o Next também tem um announcer com role=alert, vazio — filtramos pelo nosso)
    const alert = page.getByRole("alert").filter({ hasText: /Falha|indisponível|Erro interno/i });
    await expect(alert).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
    provider.failCandles = false;
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(alert).toHaveCount(0);
    await expect(page.locator("canvas").first()).toBeVisible();
    await api.close();
  });

  test("troca rápida de ativo ignora a resposta tardia do anterior", async ({ page }) => {
    const provider = new FrozenProvider();
    provider.delays.SOLUSDT = 2_500; // SOL demora; o usuário já trocou para ETH
    const api = await useFrozenApi(page, { provider });
    await page.goto("/?symbol=SOLUSDT&interval=5m");
    // Troca DENTRO do app (sem recarregar) enquanto o histórico de SOL ainda não chegou.
    await page.getByRole("button", { name: /SOLUSDT/ }).first().click();
    await page.getByRole("listbox").getByText("ETHUSDT", { exact: true }).click();
    await expect(page.getByText("ETHUSDT · 5m").first()).toBeVisible();
    await page.waitForTimeout(3_000); // a resposta de SOL chega depois
    await expect(page.getByText("SOLUSDT · 5m")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^ETHUSDT/ }).first()).toBeVisible();
    await api.close();
  });
});

test.describe("tela de entrada (kit do Claude Design)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("vitrine ilustrativa só no login; o terminal nunca mostra confiança em %", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    await page.goto("/entrar");
    const side = page.getByRole("region", { name: "Vitrine ilustrativa do terminal" });
    await expect(side.getByText("Leitura Claritas")).toBeVisible();
    await expect(side.getByText(/conf\. \d+%/)).toBeVisible();
    await api.close();
    const signed = await useFrozenApi(page);
    await page.goto("/?symbol=BTCUSDT&interval=5m");
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.getByText(/conf\. \d+%/)).toHaveCount(0);
    await expect(page.getByText("IBOV")).toHaveCount(0);
    await signed.close();
  });

  test("'Manter conectado' vai no login; recursos sem backend avisam em vez de simular", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    const bodies: unknown[] = [];
    page.on("request", (r) => r.url().endsWith("/api/v1/auth/login") && bodies.push(r.postDataJSON()));
    await page.goto("/entrar");
    await page.getByRole("button", { name: "SSO corporativo" }).click();
    await expect(page.getByText("SSO corporativo ainda não está disponível")).toBeVisible();
    await page.getByRole("button", { name: "Esqueci a senha" }).click();
    await expect(page.getByText(/Recuperação de senha ainda não está disponível/)).toBeVisible();
    await page.getByLabel("E-mail").fill("analista@claritas.test");
    await page.getByLabel("Senha", { exact: true }).fill("uma-senha-qualquer");
    await page.getByText("Manter conectado neste dispositivo").click();
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0]).toMatchObject({ email: "analista@claritas.test", remember: false });
    await api.close();
  });

  test("'Criar conta' e '← Já tenho conta' alternam os passos", async ({ page }) => {
    const api = await useFrozenApi(page, { signedIn: false });
    await page.goto("/entrar");
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Crie seu acesso." })).toBeVisible();
    await expect(page.getByLabel("Nome")).toBeVisible();
    await page.getByRole("button", { name: "← Já tenho conta" }).click();
    await expect(page.getByRole("heading", { name: "Entre no seu terminal." })).toBeVisible();
    await api.close();
  });
});
