# design-system

Biblioteca do design system **Claritas**, portada do export do Claude Design para a stack do projeto
(Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4). O contrato visual e a fonte da verdade
dos tokens é o [`DESIGN.md`](../DESIGN.md) na raiz; esta pasta é a implementação.

Todos os componentes, estados e os dois temas aparecem na rota **`/design-system`**
(template do terminal em tela cheia: **`/design-system/terminal`**).

## Mapa

| Caminho | O que tem |
|---|---|
| `index.ts` | Entrada pública. Sempre `import { Button } from "@/design-system"`. |
| `tokens/` | CSS custom properties. `colors.css` (paletas + semânticos + aliases de componente), `typography.css`, `spacing.css` (espaço, raio, alturas, z-index), `effects.css` (sombras, glows, foco, blur, fundos), `motion.css` (durações, easings, keyframes `cl-*`), `base.css` (defaults de elemento + utilitários `.cl-num` `.cl-label` `.cl-serif` `.cl-up` `.cl-down` `.cl-sand` `.cl-dotgrid`), `theme-light.css` (tema claro derivado), `fonts.css` (`@font-face` locais, usado só pelas referências), `index.css` (entrada do app). |
| `components/<grupo>/` | 35 componentes React tipados, cada um com `Nome.tsx` + `Nome.md` (uso). Grupos: `core` (9), `forms` (5), `navigation` (3), `feedback` (4), `market` (4), `charts` (6), `analysis` (4). Barrel em `components/index.ts`. |
| `templates/terminal/` | Template de composição Claritas Terminal (Pregão ao vivo · Scanner · Relatório), montado só com componentes da biblioteca. `TerminalApp` é a raiz; `data.ts` tem dados fictícios. |
| `lib/` | Helpers compartilhados: `format.ts` (números e hora pt-BR), `random.ts` (RNG determinístico — SSR e hidratação iguais), `useTween.ts`. |
| `assets/fonts/` | Geist, Geist Mono, Instrument Serif (woff2, OFL). |
| `assets/icons/` | 77 SVGs Lucide (`lucide-static@0.460.0`, ISC) — os mesmos paths embutidos em `Icon`. |
| `lint/` | `adherence.oxlintrc.json` (regras de aderência exportadas pelo Claude Design, fonte única) e `eslint-adherence.mjs` (adaptador que as aplica no `npm run lint`). |
| `reference/` | HTMLs de referência visual, standalone (abrem direto do disco, sem servidor nem rede). Ver abaixo. |

### HTMLs de referência (`reference/`)

Não fazem parte do app (ignorados pelo lint, pelo TypeScript e pelo Tailwind). Abra no navegador:

- `reference/guidelines/*.html` — 21 cards de fundação: cores (ink, sand, market, suporte, superfícies, texto), tipo (display, UI, labels, numerais), espaço, raios, elevação, layout, movimento (tokens e assinaturas), fundos, gramática do gráfico, iconografia, voz, wordmark.
- `reference/cards/*.card.html` — 7 cards de componentes por grupo (core, forms, navigation, feedback, market, charts, analysis).
- `reference/terminal/index.html` — UI kit clicável do terminal (os `.jsx` originais estão ao lado; `terminal.js` é a compilação deles — regenere se editar um `.jsx`).
- `reference/thumbnail.html` — thumbnail da marca.

Dependências locais: `reference/styles.css` importa os tokens canônicos de `../tokens` (as referências nunca divergem do app); `reference/vendor/` tem `ds-bundle.js` (build original dos componentes, usado pelos cards e pelo kit) e React 18.3.1 / Babel standalone 7.29.0 (mesmos arquivos do unpkg, conferidos pelo hash SRI).

## Regras

1. Componente novo nasce aqui dentro, não em `app/`. Telas do app compõem componentes da biblioteca.
2. Nenhum valor de cor, fonte, espaçamento ou raio hardcoded no código do app — use `var(--token)` ou os utilitários Tailwind mapeados em `app/globals.css` (`bg-panel`, `bg-raised`, `text-fg`, `text-fg-secondary`, `border-line`, `text-accent`, `bg-up-tint`, `rounded-md`, `shadow-pop`…). A paleta padrão do Tailwind está desligada (`--color-*: initial`).
3. Dentro de `components/` os valores vêm de tokens; números de layout interno (alturas, gaps de um componente) ficam no próprio componente, como no original.
4. Tema: `data-theme="dark"` (canônico, padrão no `<html>`) ou `data-theme="light"` (derivado). Pode ser aplicado num contêiner para criar ilhas de tema.

## Como criar um componente novo

1. Escolha o grupo (`core`, `forms`, `navigation`, `feedback`, `market`, `charts`, `analysis`) ou crie um novo em `components/`.
2. Crie `components/<grupo>/Nome.tsx`:
   - `"use client"` só se usar estado, efeitos ou handlers.
   - Exporte `NomeProps` tipado (unions para variantes: `variant?: "primary" | "secondary"`), com JSDoc curto.
   - Estilo com tokens (`var(--surface-panel)`, `var(--radius-md)`, `var(--font-mono)`, `var(--dur-fast) var(--ease-out)`). Se precisar de uma cor nova, crie o token em `tokens/colors.css` **e** em `tokens/theme-light.css`, e registre-o no `DESIGN.md`.
   - Cubra os estados: default, hover, active, focus (anel `var(--focus-ring)`), disabled, loading, erro, vazio, selecionado — os que fizerem sentido.
   - IDs de SVG com `React.useId()`; nada de `Math.random`/`Date` no render inicial (quebra a hidratação).
3. Crie `components/<grupo>/Nome.md` com uma linha de propósito, exemplo e variantes.
4. Exporte em `components/index.ts`.
5. Adicione as regras de props em `lint/adherence.oxlintrc.json` (seguindo o padrão dos outros componentes) se quiser que o lint valide as props.
6. Mostre todos os estados em `app/design-system/showcase.tsx`, nos dois temas.
7. `npm run lint && npx tsc --noEmit && npm run build`.
