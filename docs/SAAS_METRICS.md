# Métricas — Plano 02, Etapa 9

Endpoint: `GET /api/v1/admin/summary` (painel `/admin`). Tudo calculado no servidor, a partir de dados reais. Fuso: janelas em dias corridos a partir de agora (UTC no banco).

| Indicador | Fórmula |
|---|---|
| Usuários | `count(User)` |
| Ativas / bloqueadas / admins | `count(User)` por `status` (`SUSPENDED`+`DEACTIVATED` = bloqueadas) / `role=ADMIN` |
| Novos em 7/30 dias | `User.createdAt ≥ agora − N dias` |
| Ativos em 7/30 dias | usuários com alguma `Session.lastUsedAt ≥ agora − N dias` (atualizado no máx. 1×/h por sessão — aproximação documentada) |
| Com acesso ao terminal | conta `ACTIVE` e (assinatura `TRIALING/ACTIVE/PAST_DUE` com `startsAt ≤ agora < accessUntil` **ou** exceção `ALLOW terminal.access` vigente) e sem `DENY terminal.access` vigente — mesma regra do motor |
| Em teste / acesso manual / cortesias | assinaturas concedendo acesso agora por `status=TRIALING` / `source=MANUAL` ativa / `source=COMPLIMENTARY` |
| Vencem em 7 dias | assinaturas concedendo acesso com `accessUntil ≤ agora + 7 dias` |
| Encerrados em 30 dias | `EXPIRED` com `endedAt` nos últimos 30 dias, mais correntes cujo `accessUntil` já passou nos últimos 30 dias (antes do job normalizar) |
| Abriram o gráfico | usuários distintos com `ProductEvent first_chart_viewed` em 30 dias (1 por conta) |
| Varreduras / usuários do Scanner | `ProductEvent scanner_used` em 30 dias (total / usuários distintos) |
| Cliques em planos | `ProductEvent upgrade_clicked` em 30 dias |
| **Receita recorrente (MRR/ARR)** | **PENDENTE** — exige pagamentos reais e conciliados do gateway (Etapa 7 adiada). Testes, cortesias e acessos manuais **nunca** entram. |
| **Teste → pago, churn pago** | **PENDENTE** — mesma razão. |

## Eventos de produto (`ProductEvent`)

`signup_completed` (servidor, 1×/conta), `first_chart_viewed` (cliente → servidor, 1×/conta), `scanner_used` (servidor, por varredura consumida), `trial_started` / `subscription_activated` / `subscription_canceled` (servidor, ações administrativas), `upgrade_clicked` (cliente). Sem e-mail, IP, cookies ou dados bancários; só o id interno e propriedades curtas (plano, origem, período).
