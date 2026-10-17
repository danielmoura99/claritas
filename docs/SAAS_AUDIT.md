# Auditoria SaaS — Etapa 0 (Plano 02)

**Data:** 17/10/2026 · **Commit auditado:** `ecae57d` (`master`) · **Auditor:** Claude (Claude Code)
**Fontes lidas na íntegra:** `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md` (Plano 01, seções 0–16) e `PLANO_02_CLARITAS_SAAS_COMERCIAL.md` (seções 0–21).
**Método:** leitura do código real e dos testes do repositório; contagem de linhas no Neon (somente leitura, sem PII). Nada foi alterado antes deste documento.

## 1. Stack e layout reais

| Item | Situação real |
|---|---|
| Gerenciador / runtime | npm workspaces (`packages/*`, `services/*`), Node ≥ 24.11 |
| Frontend | Next.js 16.4.1 (App Router, `cacheComponents`, Turbopack), React 19.3, Tailwind v4 mapeado a tokens, na raiz (`app/`, `components/`, `lib/`) |
| Backend | Fastify 5.12 em `services/api` (`modules/{auth,market,streaming,analysis,scanner,report,watchlist}`), executado com `tsx` (ADR-017) |
| Contratos | Zod 4 em `packages/contracts/src` (fonte única API ↔ web) |
| Banco | PostgreSQL via Prisma 7.10 + `@prisma/adapter-pg`; schema e migrações em `services/api/prisma`; produção no **Neon** |
| Deploy | Web na Vercel (`claritas-fawn.vercel.app`), API no Render free/Frankfurt (`claritas-api-74ui.onrender.com`), publicados por push no `master` |
| Testes | Vitest (projetos `contracts`, `api`, `web`, `db` com PostgreSQL local descartável, `integration` com Binance real) e Playwright (`setup`, `live`, `visual`) |

## 2. Autenticação existente (ADR-018) — EXISTE, reutilizar

- **Solução própria** na API (sem biblioteca externa): `services/api/src/modules/auth/*`.
- **Senha:** scrypt `N=2^15,r=8,p=1`, sal 16 B, parâmetros no hash; mesmo custo para e-mail inexistente.
- **Sessão:** token opaco de 256 bits no cookie `claritas_session` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção, 30 dias ou sessão do navegador com "Manter conectado" desmarcado = 12 h); banco guarda só SHA-256 (`Session.tokenHash`); logout apaga a sessão no servidor.
- **Guarda:** hook por rota em todo `/api/v1/*` (depois do rate limit), exceto `auth/register|login|logout`; `401 UNAUTHENTICATED` sem sessão; `403 FORBIDDEN` para escrita com `Origin` fora de `CORS_ORIGIN`.
- **WebSocket:** ticket de uso único (60 s, memória) via `POST /api/v1/auth/stream-ticket`; **sem revalidação depois da abertura** (lacuna para o Plano 02).
- **Next:** `proxy.ts` (checagem otimista do cookie → `/entrar`), `AuthGate` não bloqueante (401 → `/entrar`), repasse `/api/v1/*` → API (cookie first-party).
- **Faltam:** papel (`role`), estado da conta (`status`), revogação de sessões por suspensão, recuperação de senha e verificação de e-mail (sem serviço de e-mail — D-07).

## 3. Prisma — modelos reais

| Modelo | Situação | Observação para o Plano 02 |
|---|---|---|
| `User` | EXISTE (`id,email,name,passwordHash,timestamps`) | **AJUSTAR:** `role`, `status` com backfill (`USER`/`ACTIVE`) |
| `Session` | EXISTE (`tokenHash,expiresAt,lastUsedAt`) | reutilizar para revogação e "último acesso" (`max(lastUsedAt)`) |
| `Watchlist` / `WatchlistItem` | EXISTE (1 por usuário + modelo sem dono) | limite `watchlist.max_assets` aplicável ao `PUT /watchlist/items` |
| `UserSettings` | EXISTE (preferências por usuário) | pode receber o estado do onboarding |
| `UserPreference` | LEGADO (anônimo, sem uso) | não tocar |
| Plan, Feature, PlanFeature, Subscription, overrides, UsageCounter, AdminAuditLog, Gateway* | **FALTA** | criar por migração aditiva |

**Dados reais no Neon (17/10, contagem):** `User` 1 · `Session` 1 · `Watchlist` 2 · `WatchlistItem` 6 · `UserSettings` 1 · `UserPreference` 19. Migrações aplicadas: `20261015021142_init`, `20261016120000_auth`. **Risco de migração:** baixo (aditiva), mas a nova regra *deny-by-default* retira o acesso ao terminal do único usuário existente até um admin conceder acesso — ver `SAAS_DECISIONS.md` D-S06.

## 4. Rotas Fastify reais e autorização atual

| Rota | Autenticação hoje | Feature do Plano 02 |
|---|---|---|
| `GET /health`, `GET /ready` | pública | — |
| `POST /api/v1/auth/{register,login,logout}` | pública + rate limit próprio | — |
| `GET /api/v1/auth/session`, `POST /api/v1/auth/stream-ticket` | sessão | stream-ticket → `terminal.access` |
| `GET /api/v1/market/{assets,assets/:symbol,quote,quotes,candles,status}` | sessão | `terminal.access` |
| `GET /api/v1/market/stream` (WS) | ticket | `terminal.access` (abertura **e** revalidação) |
| `GET /api/v1/analysis` | sessão | `terminal.access` |
| `GET /api/v1/scanner` | sessão | `scanner.access` + quota `scanner.scan` |
| `GET /api/v1/report` | sessão | `reports.access` |
| `GET/PUT/DELETE /api/v1/watchlist…` | sessão | leitura livre ao dono; inclusão limitada por `watchlist.max_assets` |
| `GET/PUT /api/v1/preferences` | sessão | dono |
| Admin, `/me/access`, planos, assinaturas | **FALTA** | criar |

Toda autorização atual é **só autenticação** (qualquer conta usa tudo). Não há rota que aceite `userId`/`role` do cliente (identidade sempre da sessão) — sem IDOR conhecido.

## 5. Funcionalidades reais × catálogo de features (§5.1)

| Chave | Existe no código? | Estado no catálogo |
|---|---|---|
| `terminal.access` | sim (Pregão: candles, cotações, análise, WS) | implementada |
| `terminal.timeframe.advanced` | timeframes existem, mas "avançado" não está definido comercialmente | **NOT_IMPLEMENTED** (não vendável) |
| `terminal.indicators.advanced` | indicadores atuais são o motor determinístico básico (EMA/SMA/ATR/Donchian) | **NOT_IMPLEMENTED** |
| `scanner.access` | sim | implementada |
| `scanner.scan` | sim (varredura real; cache 30 s no servidor) | implementada — quota diária UTC |
| `reports.access` | sim (Resumo do período) | implementada |
| `reports.export` | **não existe** exportação | **NOT_IMPLEMENTED** |
| `watchlist.max_assets` | sim (watchlist por usuário) | implementada — limite |
| `alerts.max_active` | **não existe** alerta | **NOT_IMPLEMENTED** |
| `history.max_days` | não há limite de histórico por usuário | **NOT_IMPLEMENTED** |

## 6. Design system — EXISTE, reutilizar

- Fonte da verdade: `DESIGN.md` + `design-system/tokens/*` (ink/sand/market/status, Geist, Geist Mono, Instrument Serif, espaço, raio, sombras, motion com `prefers-reduced-motion`).
- 32 componentes em `design-system/components/{core,forms,navigation,feedback,market,charts,analysis}` (inclui `Panel`, `Badge`, `Button`, `IconButton`, `Input`, `PasswordInput`, `Select`, `Checkbox`, `Switch`, `SegmentedControl`, `Tabs`, `TextLink`, `Dialog`, `Toast`, `Tooltip`, `LiveIndicator`).
- **Faltam para o SaaS:** tabela de dados genérica e estado de acesso bloqueado (a tabela do Scanner é composição local; `UnavailableNote` é composição do terminal). Serão criados **dentro** do design system.
- Lint de aderência (`design-system/lint`) bloqueia cores/espaços crus no app; showcase em `/design-system`.
- **Baseline visual:** 13 capturas Playwright em `e2e/visual/screens.spec.ts-snapshots` (Pregão, Scanner, Resumo em 1440/1366/390; `/entrar` em 3 viewports + erros) — servem de referência antes/depois.

## 7. Telas existentes

`/entrar` (login/cadastro, kit Claude Design), `/` Pregão ao vivo, `/scanner`, `/relatorio` (Resumo do período), `/design-system` (showcase interno). Shell comum (`components/terminal/Shell.tsx`): topbar com conta e "Sair", rail de navegação, fita de cotações. **Não existem:** `/admin`, conta, preços, onboarding.

## 8. Gestão de usuários, planos, cobrança, admin

**Nada existe.** Nenhum papel, plano, assinatura, painel, cobrança ou checkout. Não há código de gateway no repositório; o contrato do gateway próprio **não foi fornecido** (Etapa 7 adiada por decisão do responsável).

## 9. Riscos identificados

1. **Deny-by-default retira acesso** dos usuários atuais até concessão administrativa (mitigação: runbook + bootstrap de admin + concessão manual antes do deploy).
2. **WebSocket sem revalidação** depois da abertura → implementar revalidação periódica + revogação imediata em ações administrativas.
3. **Promoção de admin**: não existe caminho; criar comando CLI auditado, nunca rota pública.
4. **Tickets e limites em memória** (processo único no Render free) — aceitável; documentado.
5. **Sem e-mail transacional** → sem recuperação de senha/notificações (D-07).
6. **Licença comercial dos dados Binance** não revisada (D-09) → bloqueio de venda pública, não de implementação.

## 10. Matriz EXISTE / FALTA / AJUSTAR / DESCONHECIDO

| Área | EXISTE | AJUSTAR | FALTA | DESCONHECIDO |
|---|---|---|---|---|
| Login/sessão | ✔ | revogar sessões em suspensão; bloquear conta não ativa | recuperação de senha, verificação de e-mail | — |
| RBAC | — | — | `role`, `authorizeAdmin`, bootstrap | — |
| Estado da conta | — | — | `status`, suspensão/reativação | — |
| Entitlements | — | guarda por rota | motor central, `/me/access`, quotas, WS | — |
| Planos/assinaturas | — | — | catálogo, manual/cortesia/teste, expiração | preços, trial, carência (D-02..D-05) |
| Admin | — | — | painel completo + auditoria | — |
| Conta/preços | — | — | `/conta`, `/planos` | preços aprovados |
| Gateway | — | — | estrutura de dados (sem integração) | **contrato inteiro (D-11..D-13)** |
| Métricas | sessões (`lastUsedAt`) | — | eventos de produto, painel | receita (depende do gateway) |
| Design system | ✔ 32 comp. | — | tabela, aviso de acesso | — |
