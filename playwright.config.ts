import { defineConfig } from "@playwright/test";

/**
 * Dois projetos:
 *  - live:   pilha real (Next + API + Binance Spot pública). Exige rede. `npm run test:e2e -- --project=live`
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
    { name: "live", testMatch: /live\/.*\.spec\.ts/ },
    { name: "visual", testMatch: /visual\/.*\.spec\.ts/ },
  ],
  webServer: [
    { command: "npm run dev:api", url: "http://127.0.0.1:4000/health", reuseExistingServer: true, timeout: 60_000 },
    { command: "npm run dev:web", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  ],
});
