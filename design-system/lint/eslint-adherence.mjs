// Adapts the design-system adherence rules (adherence.oxlintrc.json, exported by Claude Design for oxlint)
// to ESLint flat config, so `npm run lint` enforces them. The JSON stays the single source of truth:
// edit it, not this file. Rules apply to app code; the design-system internals are the implementation
// of the tokens (they may hold raw values) and are excluded.
import fs from "node:fs";

const source = JSON.parse(fs.readFileSync(new URL("./adherence.oxlintrc.json", import.meta.url), "utf8"));

const INTERNALS = ["design-system/components/**", "design-system/templates/**", "design-system/lib/**", "design-system/reference/**"];

// oxlint paths are relative to the original export root ("components/core/**", "ui_kits/terminal/**").
const toProjectGlobs = (group) => {
  const rel = group.replace(/\/\*\*$/, "").replace(/^ui_kits\/terminal$/, "templates/terminal");
  return [`@/design-system/${rel}/*`, `**/design-system/${rel}/*`];
};

const [importsLevel, importsOpts] = source.rules["no-restricted-imports"];
const restrictedImports = [
  importsLevel,
  {
    patterns: importsOpts.patterns.map((p) => ({
      group: p.group.flatMap(toProjectGlobs),
      message: "Import design-system components from '@/design-system', not component internals.",
    })),
  },
];

const [syntaxLevel, ...selectors] = source.rules["no-restricted-syntax"];

/** @type {import("eslint").Linter.Config[]} */
const adherence = [
  {
    name: "claritas/design-system-adherence",
    // UI code only: the API, contracts and scripts have no visual surface.
    files: ["app/**/*.{js,jsx,mjs,ts,tsx}", "components/**/*.{js,jsx,mjs,ts,tsx}", "lib/**/*.{js,jsx,mjs,ts,tsx}"],
    ignores: INTERNALS,
    rules: {
      "react/forbid-elements": source.rules["react/forbid-elements"],
      "no-restricted-imports": restrictedImports,
      "no-restricted-syntax": [syntaxLevel, ...selectors],
    },
  },
  {
    name: "claritas/design-system-barrels",
    files: ["design-system/**/index.ts"],
    rules: { "no-restricted-imports": "off" },
  },
];

export default adherence;
