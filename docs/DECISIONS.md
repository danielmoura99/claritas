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

## ADR-018 — Autenticação por usuário (resolve ADR-012)
- **Situação:** ADR-012 adiava contas; watchlist e preferências eram anônimas/compartilhadas. Antes de abrir o deploy público, o responsável decidiu (16/10/2026): **login obrigatório** em todo o terminal e **cadastro aberto** (nome, e-mail, senha) na própria tela de entrada.
- **Opções avaliadas:** (a) biblioteca de auth no Next (Auth.js/iron-session) — a sessão viveria no frontend, mas a API (dona do banco e dos dados) precisaria confiar nela; (b) JWT em `localStorage` enviado por `Authorization` — exposto a XSS (ainda sem CSP com nonce) e sem revogação; (c) **sessão opaca emitida pela API** em cookie `HttpOnly`, com hash no banco.
- **Decisão:** (c). Senha com scrypt (`node:crypto`, sem dependência nativa), token de 256 bits só no cookie (`HttpOnly`, `SameSite=Lax`, `Secure` em produção, 30 dias), SHA-256 no banco, revogação ao sair. A API exige sessão em todo `/api/v1` exceto entrar/criar conta/sair.
- **Domínios diferentes (Vercel × Render):** cookie de terceiros é bloqueado por vários navegadores. O Next repassa `/api/v1/*` à API (`rewrites`, destino `CLARITAS_API_URL`): o navegador continua falando só com a API Claritas, agora pela origem do frontend, e o cookie é first-party. O repasse não transporta WebSocket: o WS vai direto à API com **ticket de uso único** (60 s, em memória) obtido por `POST /api/v1/auth/stream-ticket`.
- **Defesas:** limite por IP específico das rotas de senha + 10 falhas por e-mail/15 min; mesma resposta e mesmo custo para e-mail inexistente e senha errada; `403` para escrita com `Origin` de outro site; guarda acoplado por rota *depois* do limite por IP (requisição sem sessão também conta). `proxy.ts` no Next faz só a checagem otimista do cookie (redireciona para `/entrar`); a validação real é da API a cada requisição.
- **Tela de entrada (16/10, kit `ui_kits/login` do Claude Design) — EXCEÇÃO à regra "sem dados fictícios":** por decisão explícita do responsável, o painel de mercado do login é **ilustrativo e mockado**, idêntico ao kit (fita B3, "Ao vivo", `CandleChart` com série gerada, análise automática, campo de probabilidade e "Leitura Claritas · conf. 78%"). Vale **só** para `components/auth/LoginMarketShowcase.tsx`, liberado nominalmente no guarda `no-fake-data.test.ts`, que passou a barrar `<CandleChart>` em qualquer outro arquivo de runtime. Nenhuma tela do terminal usa esses valores. Uma vitrine com dados reais via endpoint público chegou a ser implementada e foi descartada a pedido do responsável, porque não reproduzia o visual do kit; com isso, a API voltou a ser 100% fechada.
- **Formulário do login:** todos os elementos do kit. "Manter conectado" é real (desmarcado = cookie de sessão do navegador + 12 h no servidor). "Esqueci a senha", "SSO corporativo", "Privacidade" e "Suporte" aparecem, mas, sem backend, só informam que ainda não estão disponíveis (nada é simulado). 2FA e a abertura com etapas fictícias ficaram fora. "Criar conta" entra como passo no formato do kit. Componente novo: `TextLink`.
- **Fora do escopo (pendente):** recuperação de senha e verificação de e-mail (exigem serviço de e-mail); 2FA (TOTP) e SSO do kit; listas múltiplas/compartilhadas; tickets/limites em memória precisam ir para o banco se a API tiver mais de uma instância.
- **Data:** 16/10/2026 · **Arquivos:** `services/api/src/modules/auth/*`, `services/api/prisma/migrations/20261016120000_auth`, `packages/contracts/src/auth.ts`, `proxy.ts`, `next.config.ts`, `app/(auth)/entrar`, `components/auth/*`, `lib/auth/*`, `design-system/components/forms/PasswordInput.tsx`.
- **Migração:** aditiva (ver `docs/PERSISTENCE.md`). A watchlist `default` sem dono vira modelo de contas novas; a tabela anônima `UserPreference` fica como legado, sem leitura nem escrita.
