import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/** Proteção contra regressão: o runtime de produção não pode gerar nem importar dados fictícios. */
const ROOT = join(__dirname, "../../../..");
const RUNTIME_DIRS = ["services/api/src", "packages/contracts/src", "lib", "components", "app/(terminal)"];
const FORBIDDEN: [RegExp, string][] = [
  [/Math\.random\s*\(/, "Math.random"],
  [/generateSeries/, "série gerada (CandleChart.generateSeries)"],
  [/CL_DATA|templates\/terminal/, "dados/telas fictícias do template"],
  [/test\/fixtures|__fixtures__/, "fixtures de teste"],
];

function walk(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const p = join(dir, name);
    if (name === "node_modules" || name.endsWith(".test.ts")) return [];
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|js)$/.test(name) ? [p] : [];
  });
}

describe("sem dados fictícios no runtime", () => {
  const files = RUNTIME_DIRS.flatMap((d) => walk(join(ROOT, d)));

  it("encontra arquivos de runtime para verificar", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const [pattern, label] of FORBIDDEN) {
    it(`nenhum uso de ${label}`, () => {
      const offenders = files.filter((f) => pattern.test(readFileSync(f, "utf8"))).map((f) => relative(ROOT, f));
      expect(offenders).toEqual([]);
    });
  }
});
