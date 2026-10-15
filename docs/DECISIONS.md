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
- **Atualização 15/10/2026:** por decisão do responsável, o banco do projeto passa a ser um **PostgreSQL gerenciado no Neon** (`DATABASE_URL` no `.env`). O cluster local fica restrito aos testes automatizados (`npm run test:db`), que criam e removem um banco descartável próprio e recusam hosts não locais — nenhum teste toca o Neon. `prisma migrate reset` não é usado (o Prisma o bloqueia para agentes de IA sem consentimento explícito, e ele apagaria dados).

## ADR-015 — Semântica do "Relatório de Fechamento" para cripto 24/7
- **Situação:** a tela original era "Relatório de fechamento" de pregão B3; a Binance Spot negocia 24/7 e não há fechamento.
- **Decisão:** a tela passa a se chamar **"Resumo do período"**, com janela sempre explícita: `rolling_24h` (24h móveis até agora, marcada parcial) ou `day` (dia de calendário em `America/Sao_Paulo` ou `UTC`, parcial se ainda não terminou). Barras de 15m; métricas e método listados na própria tela. "Maiores altas/baixas" só na janela de 24h móveis (usa o ticker 24h; para dias passados exigiria varrer o histórico de cada ativo).
- **Rota:** `/relatorio` mantida (identidade das 3 telas). **Data:** 14/10/2026.

## ADR-016 — Painéis do protótipo sem fonte real
- **Decisão:** Sentimento → Range 24h (posição real do preço na faixa 24h); Fluxo líquido → Volume por barra (volume real); Distribuição de fechamento → indisponível; confiança % → removida; avatar/usuário fictício e botões sem função (alertas, exportar PDF, compartilhar) → removidos. Ver `docs/ANALYSIS_METHODS.md`. **Data:** 14/10/2026.

## ADR-017 — Execução da API em produção com `tsx`
- **Situação:** contratos são publicados como TypeScript fonte (workspace) e a API importa-os diretamente.
- **Opções:** compilar com `tsc` (exige build separado dos contratos e reescrita de extensões), empacotar com esbuild, ou executar com `tsx`.
- **Decisão:** `tsx` em dev e produção (`npm run start:api`); `tsc --noEmit` garante tipos. Custo: ~0,5 s a mais na inicialização. Revisitar se o tempo de boot importar (ex.: serverless).
- **Data:** 14/10/2026.
