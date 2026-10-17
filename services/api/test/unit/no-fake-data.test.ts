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
  [/<CandleChart\b/, "CandleChart (gera série própria; dados reais usam MarketChart)"],
];

/**
 * Exceções NOMINAIS, decididas pelo responsável e registradas em ADR. Cada uma libera só os padrões listados
 * e só naquele arquivo. Vitrine ilustrativa da tela de entrada (ADR-018, 16/10/2026): fiel ao kit do Claude Design.
 */
const ALLOWED: Record<string, string[]> = {
  "components/auth/LoginMarketShowcase.tsx": ["CandleChart (gera série própria; dados reais usam MarketChart)"],
};

function walk(dir: string): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const p = join(dir, name);
    // node_modules e o Prisma Client gerado são código de terceiros, não runtime escrito aqui.
    if (name === "node_modules" || name === "generated" || name.endsWith(".test.ts")) return [];
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
      const offenders = files
        .filter((f) => pattern.test(readFileSync(f, "utf8")))
        .map((f) => relative(ROOT, f).replace(/\\/g, "/"))
        .filter((f) => !ALLOWED[f]?.includes(label));
      expect(offenders).toEqual([]);
    });
  }
});

describe("exceções do guarda", () => {
  it("cada exceção aponta para um arquivo que existe e ainda precisa dela", () => {
    for (const [file, labels] of Object.entries(ALLOWED)) {
      const text = readFileSync(join(ROOT, file), "utf8");
      for (const label of labels) expect(FORBIDDEN.find(([, l]) => l === label)?.[0].test(text), `${file}: ${label}`).toBe(true);
    }
  });
});
