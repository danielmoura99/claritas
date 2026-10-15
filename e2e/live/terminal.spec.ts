import { expect, test, type Page } from "@playwright/test";

// E2E REAL: Next + API Claritas + Binance Spot pública. Nenhum dado simulado. Exige rede.
test.use({ viewport: { width: 1440, height: 900 } });

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

const footer = (page: Page) => page.getByText(/Binance Spot · atualizado/);
const legendClose = async (page: Page) => (await page.getByText(/^F /).first().innerText()).trim();

test("Pregão: candles reais de BTCUSDT, feed ao vivo e atualização incremental", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/?symbol=BTCUSDT&interval=1m");
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(footer(page)).toContainText(/\d{2}:\d{2}:\d{2}/, { timeout: 30_000 });
  // "Ao vivo" só quando o stream real confirma.
  await expect(page.getByText("Ao vivo").first()).toBeVisible({ timeout: 30_000 });
  // O preço da barra corrente muda com eventos reais (kline 1m a cada ~2s); damos folga generosa.
  const first = await legendClose(page);
  await expect.poll(() => legendClose(page), { timeout: 45_000, intervals: [1_000] }).not.toBe(first);
  // A unidade é a moeda de cotação real (USDT), não BRL.
  await expect(page.getByText("USDT", { exact: true }).first()).toBeVisible();
  // A API recebeu dados reais de mercado: o último preço do BTC é plausível (> 1.000 USDT).
  const price = await page.evaluate(async () => (await (await fetch("http://localhost:4000/api/v1/market/quote?symbol=BTCUSDT")).json()).data.lastPrice);
  expect(Number(price)).toBeGreaterThan(1_000);
  expect(errors, errors.join(" | ")).toEqual([]);
});

test("troca de timeframe e ativo sem misturar séries", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/?symbol=BTCUSDT&interval=5m");
  await expect(page.getByText("BTCUSDT · 5m").first()).toBeVisible();
  await page.getByRole("tab", { name: "15m" }).click();
  await expect(page).toHaveURL(/interval=15m/);
  await expect(page.getByText("BTCUSDT · 15m").first()).toBeVisible();
  await page.getByRole("button", { name: /^BTCUSDT/ }).first().click();
  await page.getByRole("listbox").getByText("ETHUSDT", { exact: true }).click();
  await expect(page).toHaveURL(/symbol=ETHUSDT/);
  await expect(page.getByText("ETHUSDT · 15m").first()).toBeVisible();
  await expect(page.getByText("BTCUSDT · 15m")).toHaveCount(0);
  // A leitura também acompanha a nova seleção.
  await expect(page.getByText(/barras fechadas de 15m/)).toBeVisible({ timeout: 30_000 });
  expect(errors, errors.join(" | ")).toEqual([]);
});

test("Scanner real abre o ativo encontrado no Pregão", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/scanner");
  await expect(page.getByText(/atende(m)? aos critérios/)).toBeVisible({ timeout: 45_000 });
  const row = page.locator("[role=button]").filter({ hasText: /USDT/ }).first();
  const symbol = (await row.innerText()).split(/\s/)[0]!;
  await row.click();
  await expect(page).toHaveURL(new RegExp(`symbol=${symbol}`));
  await expect(page.locator("canvas").first()).toBeVisible();
  expect(errors, errors.join(" | ")).toEqual([]);
});

test("Resumo do período com janela explícita", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/relatorio?symbol=BTCUSDT");
  await expect(page.locator("h1")).toContainText("no período", { timeout: 30_000 });
  await expect(page.getByText(/24h móveis até agora · parcial · \d+ barras de 15m/)).toBeVisible();
  await page.getByRole("tab", { name: "Dia" }).click();
  await expect(page.getByText(/Dia \d{2}\/\d{2}\/\d{4} \(Brasília\)/)).toBeVisible({ timeout: 30_000 });
  expect(errors, errors.join(" | ")).toEqual([]);
});

test("fontes do design system carregadas (Geist, Geist Mono, Instrument Serif)", async ({ page }) => {
  await page.goto("/relatorio?symbol=BTCUSDT");
  await expect(page.locator("h1")).toContainText("no período", { timeout: 30_000 });
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/['"]/g, ""));
  });
  for (const fam of ["Geist", "Geist Mono", "Instrument Serif"]) expect(fonts.some((f) => f.startsWith(fam))).toBe(true);
});

test("teclado: foco visível nos controles", async ({ page }) => {
  await page.goto("/?symbol=BTCUSDT&interval=5m");
  await expect(page.locator("canvas").first()).toBeVisible();
  const tab = page.getByRole("tab", { name: "15m" });
  await tab.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const shadow = await tab.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/interval=15m/);
});

test("prefers-reduced-motion zera as durações longas", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("/?symbol=BTCUSDT&interval=5m");
  const durs = await page.evaluate(() => ["--dur-draw", "--dur-scan", "--dur-slow"].map((v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()));
  expect(durs.map((d) => parseFloat(d))).toEqual([0, 0, 0]); // "0ms" ou "0s" (o CSS processado normaliza)
  await ctx.close();
});

test("sem vazamento de assinaturas após navegar entre telas", async ({ page }) => {
  await page.goto("/?symbol=SOLUSDT&interval=1m");
  await expect(page.getByText("Ao vivo").first()).toBeVisible({ timeout: 30_000 });
  await page.goto("/relatorio?symbol=SOLUSDT");
  await expect(page.locator("h1")).toContainText("no período", { timeout: 30_000 });
  await page.close();
  // A conexão WS da aba fechada é liberada pelo servidor (sem consumidores restantes desta página).
  const ready = await (await fetch("http://127.0.0.1:4000/ready")).json();
  const sol = ready.checks.stream.byChannel.find((c: { key: string }) => c.key === "SOLUSDT:1m");
  expect(sol?.consumers ?? 0).toBe(0);
});
