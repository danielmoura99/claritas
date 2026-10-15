import { defineConfig } from "vitest/config";

// Projetos: unidades rodam offline e determinísticas; "integration" fala com a Binance real (rede necessária).
export default defineConfig({
  test: {
    projects: [
      { test: { name: "contracts", include: ["packages/contracts/test/**/*.test.ts"] } },
      { test: { name: "api", include: ["services/api/test/unit/**/*.test.ts"], testTimeout: 15_000 } },
      { test: { name: "web", include: ["lib/**/*.test.ts", "components/**/*.test.ts"] } },
      { test: { name: "integration", include: ["services/api/test/integration/**/*.test.ts"], testTimeout: 60_000 } },
    ],
  },
});
