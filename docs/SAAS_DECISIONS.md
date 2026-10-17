# Decisões — Plano 02 (SaaS comercial)

Formato: decisão → justificativa → data. Decisões comerciais pendentes do responsável continuam no Plano 02 §15 (D-01..D-13) e **não** são decididas aqui.

## Decisões do responsável

| ID | Decisão | Data |
|---|---|---|
| R-01 | **Etapa 7 (gateway próprio) ADIADA — aguardando integração futura.** Nada de checkout, pagamento, webhook financeiro, gateway alternativo ou pagamento fictício. Só a estrutura de dados para a integração futura. | 17/10/2026 |
| R-02 | Sistema funciona com assinaturas manuais, períodos de teste e concessões administrativas até a integração. | 17/10/2026 |
| R-03 | Promover usuário a ADMIN, publicar a aplicação e alterar serviços externos exigem autorização explícita (fora do escopo autônomo). | 17/10/2026 |

## Decisões técnicas (agente, baixo risco)

| ID | Decisão | Justificativa |
|---|---|---|
| D-S01 | Reutilizar o login próprio (ADR-018); `role` (`USER`/`ADMIN`) e `status` (`PENDING_VERIFICATION`/`ACTIVE`/`SUSPENDED`/`DEACTIVATED`) entram no `User` existente com padrão `USER`/`ACTIVE` (backfill implícito pelo default). | Sem segundo sistema de identidade; sem perda de contas. |
| D-S02 | Rotas em pt-BR, como as existentes: `/conta`, `/planos`, `/ajuda`, `/admin/*`. API em `/api/v1/me/*`, `/api/v1/admin/*`, `/api/v1/plans/public`. | Coerência com `/scanner`, `/relatorio`, `/entrar` e com o prefixo `/api/v1` já repassado pelo Next. |
| D-S03 | Concessões individuais = `FeatureOverride` (`ALLOW`/`DENY`, `endsAt` **obrigatório**, motivo, autor, revogação suave). Concessão de plano inteiro = assinatura manual (`TRIALING` ou `ACTIVE`, origem `MANUAL`/`COMPLIMENTARY`). | Cobre `AccessGrant` e `UserFeatureOverride` do §6 sem dois modelos com a mesma semântica. |
| D-S04 | A assinatura guarda um **snapshot** dos benefícios do plano no momento da concessão; versões publicadas são imutáveis (editar = nova versão em rascunho). | Mudança de plano nunca altera retroativamente quem já tem acesso (§5.3.4, §7.4). |
| D-S05 | No máximo uma assinatura "corrente" (`PENDING`/`TRIALING`/`ACTIVE`/`PAST_DUE`) por usuário — índice único parcial no PostgreSQL. Troca de plano sem cobrança encerra a corrente e cria outra, na mesma transação. | Integridade sob concorrência (§6.2). |
| D-S06 | **Negação por padrão:** sem assinatura válida nem concessão `ALLOW`, nenhuma feature comercial é liberada. Não há teste automático no cadastro (D-03 pendente). Contas existentes perdem o terminal até um admin conceder acesso. | §4.5 e §5.3.6 — "nunca por omissão de checagem". |
| D-S07 | `ADMIN` não ganha features comerciais automaticamente; precisa de concessão explícita como qualquer conta. | §4.2 e §5.3.10. |
| D-S08 | Quotas em janela **UTC diária**; consumo atômico com um único `INSERT … ON CONFLICT … DO UPDATE … WHERE used < limit`; idempotência por `UsageRecord(userId, featureKey, idempotencyKey)` único (chave = cabeçalho `Idempotency-Key` ou `x-request-id`). `GET /me/access` nunca consome. | §5.4 — sem corrida entre instâncias e sem dupla contagem em retentativas. |
| D-S09 | Pontos de bloqueio: `market/*`, `analysis`, `stream-ticket` e WS → `terminal.access`; `scanner` → `scanner.access` + quota `scanner.scan`; `report` → `reports.access`; inclusão na watchlist → `watchlist.max_assets`. WS revalida a cada 60 s e é fechado na hora em suspensão/revogação feitas pelo admin. | §4.6.5 — não confiar só na abertura. |
| D-S10 | Erros: `401 UNAUTHENTICATED`; `403 ACCOUNT_BLOCKED`; `403 ENTITLEMENT_REQUIRED` (`details.feature`, `details.reason`); `429 QUOTA_EXCEEDED` (`details.limit`, `details.resetsAt`); `403 FORBIDDEN` (admin); `409 CONFLICT`. | §4.6.7 — erro comercial padronizado e estável. |
| D-S11 | ADMIN só por comando de linha (`npm run admin:promote`) para conta **existente**, com confirmação digitada do e-mail, motivo e registro em auditoria. Nenhuma rota/formulário altera `role`. | §4.2. |
| D-S12 | `AdminAuditLog` é append-only também no banco (trigger que recusa `UPDATE`/`DELETE`). | §7.6 — operações sensíveis não apagam o próprio log. |
| D-S13 | Gateway: só estrutura (`GatewayCustomerLink`, `GatewayEvent`, campos externos na `Subscription`, origem `OWN_GATEWAY` reservada). Nenhuma rota, adaptador ou variável de gateway. | R-01. |
| D-S14 | Expiração: verificada **a cada autorização** pelo relógio (`accessUntil`); um job horário só normaliza o status para `EXPIRED` e registra auditoria. | §11 Etapa 5 — o job não é a única defesa. |
| D-S15 | `accessUntil` é o **instante exclusivo** (UTC) em que o acesso termina. | Evita ambiguidade de fuso/fim do dia. |
| D-S16 | Métricas a partir de eventos de produto (`ProductEvent`) gravados no servidor quando possível; o cliente só envia uma lista fechada (`first_chart_viewed`, `upgrade_clicked`), sem PII. Receita/MRR ficam **pendentes** (dependem do gateway). | §11 Etapa 9; nada inventado. |
| D-S17 | Suporte: canal configurável por `NEXT_PUBLIC_CLARITAS_SUPPORT_EMAIL`; sem a variável, a interface diz que o canal ainda não foi publicado. Nenhum e-mail é enviado pelo sistema (D-07). | Não fingir canal inexistente. |
