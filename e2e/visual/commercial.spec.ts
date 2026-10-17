import { expect, test, type Page } from "@playwright/test";
import { useFrozenApi } from "../fixtures/frozen-api";
import { COMPLIMENTARY_PRO, FEATURES, PLANS, PUBLIC_PLANS, SUBSCRIPTIONS_PAGE, SUMMARY, TRIAL_ESSENCIAL, USER_DETAIL, USER_ROWS, testAccess } from "../fixtures/commercial";

// Regressão visual e comportamento da camada comercial (Plano 02) com dados CONGELADOS (fixtures de teste).
// Atualizar baselines: npm run test:e2e -- --project=visual --update-snapshots

const masks = (page: Page) => [page.locator("[role=status]").filter({ hasText: /:/ }), page.locator("text=/atualizado/")];

async function settle(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
}

const ADMIN_FIXTURES = {
  "GET /api/v1/admin/summary": SUMMARY,
  "GET /api/v1/admin/users": { items: USER_ROWS, page: 1, pageSize: 20, total: USER_ROWS.length },
  "GET /api/v1/admin/users/u_ana": USER_DETAIL,
  "GET /api/v1/admin/plans": PLANS,
  "GET /api/v1/admin/features": FEATURES,
  "GET /api/v1/admin/subscriptions": SUBSCRIPTIONS_PAGE,
  "GET /api/v1/admin/audit": { items: SUMMARY.recentAudit, page: 1, pageSize: 30, total: SUMMARY.recentAudit.length },
  "GET /api/v1/admin/integrations/payments": { status: "DEFERRED", note: "Integração com o gateway próprio adiada por decisão do responsável. Nenhum checkout, webhook ou cobrança está ativo; acessos são concedidos manualmente.", events: [] },
};
const ADMIN = { user: { role: "ADMIN" as const, name: "Equipe Claritas", email: "admin@claritas.test" }, fixtures: ADMIN_FIXTURES, access: testAccess({ allowed: ["terminal.access"], subscription: COMPLIMENTARY_PRO }) };

test.describe("administração (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const [name, url, ready] of [
    ["admin-visao-geral", "/admin", "Visão geral da operação."],
    ["admin-usuarios", "/admin/usuarios", "Ana Ribeiro"],
    ["admin-usuario-detalhe", "/admin/usuarios/u_ana", "Funcionalidades liberadas — e por quê"],
    ["admin-planos", "/admin/planos", "Matriz"],
    ["admin-assinaturas", "/admin/assinaturas", "Bruno Lima"],
    ["admin-pagamentos", "/admin/integracoes", "Nenhuma cobrança passa pelo Claritas nesta fase."],
  ] as const) {
    test(name, async ({ page }) => {
      // O shell rola por dentro: viewport alta para a captura cobrir a página inteira.
      if (name === "admin-usuario-detalhe") await page.setViewportSize({ width: 1440, height: 1500 });
      const api = await useFrozenApi(page, ADMIN);
      await page.goto(url);
      if (ready === "Matriz") await expect(page.getByText("Pregão ao vivo").first()).toBeVisible();
      else await expect(page.getByText(ready).first()).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`${name}-1440.png`, { mask: masks(page), fullPage: true });
      await api.close();
    });
  }

  test("receita aparece como pendente, nunca como número inventado", async ({ page }) => {
    const api = await useFrozenApi(page, ADMIN);
    await page.goto("/admin");
    await expect(page.getByText("Pendente — gateway adiado")).toBeVisible();
    await expect(page.getByText(/R\$/)).toHaveCount(0);
    await api.close();
  });

  test("detalhe explica por que cada funcionalidade está liberada ou negada", async ({ page }) => {
    const api = await useFrozenApi(page, ADMIN);
    await page.goto("/admin/usuarios/u_ana");
    await expect(page.getByText("Negado por concessão individual").first()).toBeVisible();
    await expect(page.getByText("Liberado pelo plano").first()).toBeVisible();
    await expect(page.getByText("Ainda não existe no produto").first()).toBeVisible();
    await expect(page.getByText("Cortesia").first()).toBeVisible();
    await api.close();
  });

  test("conceder acesso exige motivo antes de confirmar", async ({ page }) => {
    const api = await useFrozenApi(page, ADMIN);
    await page.goto("/admin/usuarios/u_ana");
    await page.getByRole("button", { name: "Nova exceção" }).click();
    const confirm = page.getByRole("button", { name: "Liberar", exact: true });
    await expect(confirm).toBeDisabled();
    await page.getByLabel("Motivo (vai para a auditoria)").fill("ok");
    await expect(confirm).toBeDisabled();
    await page.getByLabel("Motivo (vai para a auditoria)").fill("demonstração comercial agendada");
    await expect(confirm).toBeEnabled();
    await api.close();
  });
});

test.describe("acesso negado (1440)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("USER comum em /admin: área restrita e nenhuma chamada administrativa", async ({ page }) => {
    const api = await useFrozenApi(page, { access: testAccess({ allowed: ["terminal.access"] }) });
    const calls: string[] = [];
    page.on("request", (r) => r.url().includes("/api/v1/admin/") && calls.push(r.url()));
    await page.goto("/admin/usuarios");
    await expect(page.getByText("Área restrita à equipe Claritas.")).toBeVisible();
    expect(calls).toEqual([]);
    await api.close();
  });

  test("conta nova sem acesso: Pregão bloqueado e nenhuma chamada de mercado", async ({ page }) => {
    const api = await useFrozenApi(page, { access: testAccess({ allowed: [], deniedReason: "SUBSCRIPTION_INACTIVE", state: "NONE" }) });
    const market: string[] = [];
    page.on("request", (r) => /\/api\/v1\/(market|analysis)/.test(r.url()) && market.push(r.url()));
    await page.goto("/?symbol=BTCUSDT&interval=5m");
    await expect(page.getByText("Sua conta está pronta; o acesso ainda não foi liberado.")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await settle(page);
    expect(market).toEqual([]);
    await expect(page).toHaveScreenshot("pregao-sem-acesso-1440.png", { mask: masks(page) });
    await api.close();
  });

  test("Scanner fora do plano: bloqueio contextual com caminhos claros", async ({ page }) => {
    const api = await useFrozenApi(page, { access: testAccess({ allowed: ["terminal.access", "watchlist.max_assets"], subscription: TRIAL_ESSENCIAL, state: "TRIALING" }) });
    await page.goto("/scanner");
    await expect(page.getByText("Scanner não está incluído no seu acesso atual.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ver planos" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "Minha conta" })).toBeVisible();
    // Teste perto do fim: faixa discreta, sem promessa de cobrança.
    await expect(page.getByText(/Seu teste termina em 2 dias/)).toBeVisible();
    await expect(page.getByText("Nada será cobrado automaticamente.", { exact: false })).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("scanner-bloqueado-1440.png", { mask: masks(page) });
    await api.close();
  });

  test("teste encerrado tem mensagem própria", async ({ page }) => {
    const api = await useFrozenApi(page, { access: testAccess({ allowed: [], deniedReason: "SUBSCRIPTION_INACTIVE", state: "TRIAL_EXPIRED", subscription: { ...TRIAL_ESSENCIAL, accessUntil: new Date(Date.UTC(2026, 9, 1)).toISOString() } }) });
    await page.goto("/relatorio");
    await expect(page.getByText("Seu período de teste terminou.")).toBeVisible();
    await expect(page.getByText("Nada foi cobrado.", { exact: false })).toBeVisible();
    await api.close();
  });
});

test.describe("assinante e público", () => {
  for (const vp of [{ name: "1440", width: 1440, height: 900 }, { name: "390", width: 390, height: 844 }]) {
    test(`minha conta (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const api = await useFrozenApi(page, { access: testAccess({ allowed: ["terminal.access", "watchlist.max_assets"], subscription: TRIAL_ESSENCIAL, state: "TRIALING" }) });
      await page.goto("/conta");
      await expect(page.getByRole("heading", { name: "Em período de teste." })).toBeVisible();
      await expect(page.getByText("Acesso manual, sem cobrança").first()).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot(`conta-${vp.name}.png`, { mask: masks(page), fullPage: true });
      await api.close();
    });
  }

  test("planos sem publicação: diz que estão em definição, sem preço nem checkout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const api = await useFrozenApi(page, { signedIn: false, fixtures: { "GET /api/v1/plans/public": [] } });
    await page.goto("/planos");
    await expect(page.getByText("Os planos comerciais ainda estão sendo definidos.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Assinar|Comprar|Checkout/i })).toHaveCount(0);
    await api.close();
  });

  test("planos publicados (1440)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const api = await useFrozenApi(page, { signedIn: false, fixtures: { "GET /api/v1/plans/public": PUBLIC_PLANS } });
    await page.goto("/planos");
    await expect(page.getByText("Preço a definir")).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("planos-1440.png", { fullPage: true });
    await api.close();
  });

  test("ajuda (1440)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const api = await useFrozenApi(page, { signedIn: false });
    await page.goto("/ajuda");
    await expect(page.getByText("Perguntas frequentes.")).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot("ajuda-1440.png", { fullPage: true });
    await api.close();
  });
});
