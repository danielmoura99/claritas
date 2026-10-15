import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

// Carrega .env (raiz do repositório ou services/api) sem dependência extra; o ambiente real tem prioridade.
for (const file of [resolve(import.meta.dirname, ".env"), resolve(import.meta.dirname, "../../.env")]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
