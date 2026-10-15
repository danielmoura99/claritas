import { defineConfig } from "vitest/config";

// Projetos: unidades rodam offline e determinísticas; "integration" fala com a Binance real (rede necessária).
export default defineConfig({
  test: {
    projects: [
      { test: { name: "contracts", include: ["packages/contracts/test/**/*.test.ts"] } },
      { test: { name: "api", include: ["services/api/test/unit/**/*.test.ts"], testTimeout: 15_000 } },
      { test: { name: "web", include: ["lib/**/*.test.ts", "components/**/*.test.ts"] } },
      // PostgreSQL real (npm run db:local:start); separado para não exigir banco nas unidades.
      { test: { name: "db", include: ["services/api/test/db/**/*.test.ts"], testTimeout: 60_000, hookTimeout: 120_000, fileParallelism: false } },
      { test: { name: "integration", include: ["services/api/test/integration/**/*.test.ts"], testTimeout: 60_000 } },
    ],
  },
});
