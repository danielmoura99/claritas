import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import designSystemAdherence from "./design-system/lint/eslint-adherence.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Claritas design system: tokens only, components from "@/design-system" (see DESIGN.md).
  ...designSystemAdherence,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone reference HTMLs + vendored UMD scripts (not app code).
    "design-system/reference/**",
    // Prisma Client gerado (prisma generate).
    "services/api/src/generated/**",
    // Relatórios e artefatos do Playwright (gerados).
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
