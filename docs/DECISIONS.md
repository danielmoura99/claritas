# Decisões arquiteturais (ADR) — Claritas Terminal

Formato: situação → opções → trade-off → decisão → data → arquivos afetados → migração. ADR-001 a ADR-012 vêm do plano (§10); aqui ficam as decisões tomadas durante a execução e as alterações de status.

## ADR-011 — Estrutura física do design system (resolvida)
- **Situação:** o plano supunha `components/` e `styles/` na raiz.
- **Verificado:** o design system está em `design-system/` (tokens, components, templates, lib, assets, lint, reference) e `DESIGN.md` é a fonte da verdade dos tokens.
- **Decisão:** manter `design-system/` como pacote de UI; não criar `components/`/`styles/` paralelos. Componentes de produto (composições com dados) ficam em `components/terminal/` na raiz, importando apenas de `@/design-system`.
- **Data:** 14/10/2026 · **Arquivos:** `docs/DESIGN_SYSTEM_AUDIT.md`.

## ADR-013 — Rotas das três telas
- **Situação:** `app/page.tsx` é a página padrão do create-next-app; o plano prevê Pregão ao Vivo na raiz.
- **Decisão:** `/` = Pregão ao Vivo, `/scanner`, `/relatorio`, em `app/(terminal)/` com layout compartilhado (topbar, rail, fita). A página padrão do Next é substituída (não é tela do produto). Showcase `/design-system` permanece como ferramenta interna.
- **Data:** 14/10/2026.

## ADR-014 — Banco local para desenvolvimento e testes
- **Situação:** não há Docker; o PostgreSQL 17 do sistema (porta 5433) pertence ao usuário e as credenciais não estão disponíveis.
- **Opções:** (a) usar o servidor do sistema — exige credenciais e mexe em ambiente alheio; (b) `embedded-postgres` (baixa binários); (c) cluster isolado do projeto criado com os binários PG já instalados (`initdb`/`pg_ctl`) em `.data/postgres`, porta própria.
- **Decisão:** (c) para desenvolvimento/testes locais via `scripts/db-local.mjs` (lê `PG_BIN` ou PATH). Em qualquer outro ambiente basta um `DATABASE_URL` PostgreSQL. A API funciona sem banco (recursos de mercado não dependem dele); rotas de persistência respondem 503 explícito se o banco estiver indisponível.
- **Data:** 14/10/2026.
