import { defineConfig } from "@playwright/test";

/**
 * Projetos:
 *  - setup:  cria/entra com a conta E2E no banco LOCAL de E2E (scripts/e2e-db.mjs) e salva a sessão.
 *  - live:   pilha real (Next + API + Binance Spot pública), já autenticada. Exige rede e `npm run db:local:start`.
 *            `npm run test:e2e -- --project=live`
 *  - visual: regressão visual e estados de erro com dados CONGELADOS (só nos testes): a API Claritas roda
 *            em processo com um provedor de fixtures e responde às requisições do navegador via route().
 * Usa o Google Chrome instalado (channel "chrome"), sem baixar navegadores.
 */
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  timeout: 60_000,
  expect: { timeout: 20_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled", caret: "hide" } },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3000", channel: "chrome", trace: "retain-on-failure", locale: "pt-BR", timezoneId: "America/Sao_Paulo" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "live", testMatch: /live\/.*\.spec\.ts/, dependencies: ["setup"], use: { storageState: "e2e/.auth/user.json" } },
    { name: "visual", testMatch: /visual\/.*\.spec\.ts/ },
  ],
  webServer: [
    // API com DATABASE_URL = banco local de E2E (nunca o Neon do .env). Se uma API já estiver de pé, o
    // projeto setup confere que ela usa esse banco antes de qualquer teste.
    { command: "node scripts/e2e-db.mjs --api", url: "http://127.0.0.1:4000/health", reuseExistingServer: true, timeout: 90_000 },
    { command: "npm run dev:web", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  ],
});
