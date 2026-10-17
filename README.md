This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Claritas Terminal

Terminal de análise gráfica com **dados reais da Binance Spot** (REST histórico + WebSocket ao vivo), no visual do design system Claritas. Três telas: **Pregão ao vivo** (`/`), **Scanner** (`/scanner`) e **Resumo do período** (`/relatorio`), atrás de **login obrigatório** (`/entrar`: entrar ou criar conta; watchlist e preferências por usuário — ADR-018).

**Arquitetura:** Next.js 16 na raiz (frontend) → **API Claritas** independente (Node 24 + Fastify 5, `services/api`) → Binance Spot pública. Contratos Zod compartilhados em `packages/contracts`. Persistência (contas, sessões, watchlist, preferências) em PostgreSQL (Neon) via Prisma 7. O navegador só fala com a API Claritas: o REST pela própria origem do frontend (`/api/v1/*` repassado pelo Next, cookie de sessão first-party) e o WebSocket direto, com ticket de sessão.

### Como executar

```bash
npm install                 # Node >= 24.11 (ver .nvmrc); gera o Prisma Client
cp .env.example .env        # só na primeira vez; ajuste DATABASE_URL (Neon). Sem ela a API sobe sem persistência
npm run db:migrate          # aplica migrações pendentes no banco do DATABASE_URL (não destrutivo)
npm run db:seed             # watchlist default (opcional)
npm run dev                 # web (localhost:3000) + API (localhost:4000) juntos
```

Abra `http://localhost:3000`: sem sessão, a tela de entrada pede login ou a criação de uma conta.

> Para testar o login sem tocar no Neon: `npm run db:local:start` e `node scripts/e2e-db.mjs --api` (API apontando para o banco local `claritas_e2e`) com `npm run dev:web` em outro terminal.

Produção local: `npm run build && npm run start` (web) e `npm run start:api` (API).

### Qualidade

| Comando | O que roda |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint (inclui aderência ao design system) / TypeScript em web, API e contratos |
| `npm test` | Unitários (contratos, API, frontend) — offline |
| `npm run test:integration` | Integração contra a **Binance real** (rede) |
| `npm run test:db` | Persistência em PostgreSQL **local descartável** (`npm run db:local:start`); nunca toca o `DATABASE_URL` |
| `npm run test:e2e` | Playwright: `setup` (conta E2E), `live` (pilha real, autenticada; exige `npm run db:local:start` e **não** reaproveita uma API ligada ao Neon) e `visual` (regressão visual com dados congelados só nos testes) |

### Documentação

[`PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md`](PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md) (plano e estado) · [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) · [`docs/DATA_PROVIDER_BINANCE.md`](docs/DATA_PROVIDER_BINANCE.md) · [`docs/ANALYSIS_METHODS.md`](docs/ANALYSIS_METHODS.md) · [`docs/PERSISTENCE.md`](docs/PERSISTENCE.md) · [`docs/DEPLOY.md`](docs/DEPLOY.md) · [`docs/DECISIONS.md`](docs/DECISIONS.md) · [`docs/DESIGN_SYSTEM_AUDIT.md`](docs/DESIGN_SYSTEM_AUDIT.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Design system

The UI follows the Claritas design system:

- [`DESIGN.md`](DESIGN.md) — visual contract and source of truth for the tokens.
- [`design-system/`](design-system/README.md) — the component library, tokens, assets, templates, lint rules and standalone reference HTMLs.
- [http://localhost:3000/design-system](http://localhost:3000/design-system) — showcase with every component, state and both themes; [`/design-system/terminal`](http://localhost:3000/design-system/terminal) renders the terminal template.

Import components from `@/design-system` and use tokens instead of hardcoded colors, fonts, spacing or radii — `npm run lint` checks it.
