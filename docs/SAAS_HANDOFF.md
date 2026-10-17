# Handoff — Plano 02 (SaaS comercial)

> Atualizado ao fim da execução de 17/10/2026. Leia também `PLANO_02_CLARITAS_SAAS_COMERCIAL.md` §18/§20, `SAAS_AUDIT.md`, `SAAS_DECISIONS.md`, `SAAS_ROUTES.md`, `SAAS_SECURITY.md`, `SAAS_RUNBOOK.md`, `SAAS_METRICS.md`.

## 1. Onde estamos

- **Data:** 17/10/2026 · **Branch:** `feat/saas-comercial` (a partir de `master@ecae57d`) · commits **locais, sem push** (publicar exige autorização — R-03).
- **Planos:** `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md` e `PLANO_02_CLARITAS_SAAS_COMERCIAL.md`, na raiz.
- **MVP comercial P0 concluído** (Etapas 0–5 + proteções da 10), mais Etapas 6, 8 e 9 nas partes independentes do gateway.
- **Etapa 7 (gateway próprio): ADIADA — aguardando integração futura.** O SaaS **não está pronto para cobrar automaticamente.**

## 2. Auditoria (resumo)

Login próprio na API (ADR-018), Prisma 7 em `services/api/prisma`, Fastify, Next 16 com `proxy.ts` e repasse `/api/v1`, design system com 32 componentes (agora 35). Nada de papéis/planos/admin existia antes.

## 3. O que existe agora

- **Backend:** política de rotas deny-by-default (`modules/authorization/route-policy.ts`), `EntitlementsService` + avaliador puro, quotas atômicas/idempotentes, planos versionados com snapshot, assinaturas manuais (teste/manual/cortesia) com expiração pelo relógio + job, concessões com prazo, auditoria append-only (trigger), eventos de produto, CLI `admin:role`, revalidação de WebSocket.
- **Frontend:** `FeatureGate` em Pregão/Scanner/Resumo, `AccessBanner`, `/conta`, `/planos`, `/ajuda`, `/admin` (visão geral, usuários, detalhe, assinaturas, planos, auditoria, pagamentos-adiado), onboarding de 3 passos.

## 4. Última verificação (17/10)

| Comando | Resultado |
|---|---|
| `npm run lint` · `npm run typecheck` | OK |
| `npm test` | 139/139 |
| `npm run test:db` (PostgreSQL local) | 36/36 |
| `npm run test:integration` (Binance real) | 13/13 |
| `npx playwright test --project=visual` | 41/41 |
| `npm run build` | OK (19 rotas) |
| `npx playwright test` (setup + live + visual) | 54/54 — `live` na pilha real com a API no banco local de E2E |

## 5. Migrações

`20261017100000_roles`, `20261017110000_commercial` — **somente bancos locais**. **Neon não alterado** (1 usuário real). Consequência: o `npm run dev` local ligado ao Neon **não funciona com este branch** até a migração ser aplicada (colunas `role`/`status` ausentes). Para desenvolver sem tocar o Neon: `npm run db:local:start` + `node scripts/e2e-db.mjs --api` + `npm run dev:web`.

## 6. Variáveis (só nomes)

API: `ADMIN_RATE_LIMIT_PER_MINUTE`, `SUBSCRIPTION_EXPIRY_JOB_MINUTES`. Web: `NEXT_PUBLIC_CLARITAS_SUPPORT_EMAIL` (opcional). Nenhuma variável de gateway.

## 7. Bloqueios externos

Contrato do gateway (D-11..D-13, Etapa 7); preços/trial/carência (D-02..D-05); e-mail transacional (D-07: recuperação de senha, MFA, notificações); fiscal/LGPD/termos (D-08); licença comercial dos dados Binance (D-09).

## 8. Próximo passo exato

1. (Com autorização) Seguir `SAAS_RUNBOOK.md` → "Antes do primeiro deploy": backup Neon → `npm run db:migrate` + `npm run db:seed` → `npm run admin:role -- promote …` → conceder acesso em `/admin` → deploy API → deploy web.
2. Parar o `npm run dev` ligado ao Neon e rodar `npm run test:e2e` (sobe a API local de E2E; o setup concede o plano Pro à conta E2E só no banco local).
3. Etapa 7: auditar o contrato do gateway (Plano 02 §9.2) e gerar `docs/OWN_GATEWAY_INTEGRATION_AUDIT.md`.

## 9. Problemas conhecidos

- Teste de integração de queda forçada do upstream Binance é intermitente (tempo real de reconexão).
- 1920×1080 não tem baseline visual (1440, 1366 e 390 têm).
- Features no catálogo e **não implementadas** (não publicáveis): períodos/indicadores avançados, exportação, alertas, limite de histórico.
