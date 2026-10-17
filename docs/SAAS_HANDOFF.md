# Handoff — Plano 02 (SaaS comercial)

> Atualizado a cada etapa. Leia também `PLANO_02_CLARITAS_SAAS_COMERCIAL.md` §18, `docs/SAAS_AUDIT.md` e `docs/SAAS_DECISIONS.md`.

## 1. Onde estamos

- **Data:** 17/10/2026 · **Branch:** `feat/saas-comercial` (a partir de `master@ecae57d`) · commits locais, **sem push** (publicar exige autorização — R-03).
- **Planos:** `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md` (raiz) e `PLANO_02_CLARITAS_SAAS_COMERCIAL.md` (raiz), lidos na íntegra.
- **Etapa 7 (gateway próprio): ADIADA — aguardando integração futura** (decisão do responsável). Só estrutura de dados.

## 2. Resultado da auditoria (resumo — detalhes em `SAAS_AUDIT.md`)

Login próprio na API (scrypt + sessão opaca em cookie HttpOnly, ADR-018), Prisma 7 em `services/api/prisma`, Fastify com guarda por rota, Next 16 com `proxy.ts` + repasse `/api/v1`, design system com 32 componentes. Nada de papéis, planos, assinaturas ou admin existia.

## 3. Etapas verificadamente concluídas

Ver tabela do §18 do Plano 02 (fonte da verdade). Backend das Etapas 1, 2, 3 e 5 concluído e testado; frontend em andamento.

## 4. Última verificação

| Comando | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npx vitest run --project api --project contracts --project web` | 139/139 |
| `npm run test:db` (PostgreSQL local) | 36/36 |

## 5. Migrações

`20261017100000_roles` e `20261017110000_commercial` — **aplicadas só em bancos locais descartáveis**. Neon (produção) **não foi alterado**: tem 1 usuário real; aplicar exige autorização e branch de backup. Atenção: com a regra deny-by-default, esse usuário perde o terminal até receber acesso (ver `SAAS_RUNBOOK.md`).

## 6. Variáveis novas (só nomes)

API: `ADMIN_RATE_LIMIT_PER_MINUTE`, `SUBSCRIPTION_EXPIRY_JOB_MINUTES`. Web: `NEXT_PUBLIC_CLARITAS_SUPPORT_EMAIL` (opcional). Nenhuma variável de gateway (Etapa 7 adiada).

## 7. Bloqueios externos

- Contrato do gateway próprio (D-11..D-13) — Etapa 7 adiada.
- Preços/planos/trial/carência (D-02..D-05), e-mail transacional (D-07), fiscal/LGPD (D-08), licença Binance (D-09).

## 8. Próximo passo exato

Frontend: componentes `DataTable` e `AccessNotice` no design system → `lib/auth/use-access.ts` → `FeatureGate` em Pregão/Scanner/Resumo → `/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/plans`, `/admin/subscriptions`, `/admin/audit`, `/admin/integrations` → `/conta`, `/planos`, `/ajuda` → onboarding → E2E/visual.

## 9. Problemas conhecidos

- O teste de integração de queda forçada do upstream Binance é intermitente (depende de tempo de reconexão real).
- `alerts`, exportação, períodos/indicadores avançados e limite de histórico **não existem** — estão no catálogo como não implementados e não podem ser publicados.
