# Segurança — Plano 02 (SaaS)

## Modelo

- **Identidade:** login próprio (ADR-018) — scrypt, sessão opaca em cookie `HttpOnly`/`SameSite=Lax`/`Secure` (produção), hash SHA-256 no banco. Nunca há `userId`/`role` vindos de corpo, query ou cabeçalho controlado pelo cliente: a identidade é sempre a da sessão.
- **Papel ≠ plano:** `ADMIN` só administra; features comerciais exigem plano ou concessão também para admins (D-S07).
- **Deny-by-default:** rota sem política não sobe; feature sem regra válida é negada; QUOTA/LIMIT sem limite definido é negada; feature `implemented=false` é negada e não pode ser publicada.
- **Conta bloqueada:** `SUSPENDED`/`DEACTIVATED`/`PENDING_VERIFICATION` → 403 em tudo que não é público; suspensão apaga todas as sessões e fecha streams (`4403`) na hora; login só revela o bloqueio a quem acerta a senha.
- **Expiração pelo relógio:** cada autorização compara `now` com `[startsAt, accessUntil)`; o job horário só normaliza o status.
- **Streams:** ticket de uso único (60 s) exige `terminal.access`; revalidação a cada 60 s e imediata em ações administrativas; banco fora não derruba quem já estava autorizado (documentado).
- **Quotas:** consumo atômico (UPSERT condicional) e idempotente (`UsageRecord`), seguro entre requisições e instâncias concorrentes; `GET /me/access` nunca consome.
- **Auditoria:** toda mudança administrativa grava `AdminAuditLog` na mesma transação; trigger no PostgreSQL recusa `UPDATE`/`DELETE` (append-only até para a aplicação). Sem senha, hash, token ou segredo nos registros.
- **IDOR:** rotas do usuário não recebem id; rotas admin conferem pertencimento (ex.: concessão precisa ser do usuário do caminho → 404).
- **Promoção a ADMIN:** só pelo CLI `npm run admin:role` (conta existente e ativa, confirmação digitada, motivo, auditoria, nunca remove o último admin).
- **Rate limit:** geral por IP (`API_RATE_LIMIT_PER_MINUTE`), senha (`AUTH_RATE_LIMIT_PER_MINUTE` + 10 falhas/e-mail/15 min), admin (`ADMIN_RATE_LIMIT_PER_MINUTE`), eventos de produto (30/min). Atenção a `TRUST_PROXY` em produção (`docs/DEPLOY.md`).
- **CSRF:** `SameSite=Lax` + `Origin` verificado em escritas.
- **Dados de pagamento:** nenhum. O Claritas não coleta cartão; a Etapa 7 (gateway) está adiada e só existe estrutura de dados.

## Testes que provam (Plano 02 §12)

| Cenário | Teste |
|---|---|
| sem login em admin → 401; USER → 403; ADMIN → 200 | `route-policy.test.ts`, `saas.db.test.ts` |
| `role=ADMIN` no cadastro → rejeitado | `route-policy.test.ts` |
| USER sem assinatura chama Scanner/mercado direto → 403 com motivo | `route-policy.test.ts`, `saas.db.test.ts` |
| sem acesso → sem ticket de WS; WS ativo fecha ao suspender | `saas.db.test.ts` |
| concessão por prazo libera só a feature e o período | `saas.db.test.ts` |
| DENY + plano ALLOW → bloqueado | `entitlements.test.ts`, `saas.db.test.ts` |
| suspenso com assinatura → bloqueado (sessões revogadas, login 403) | `saas.db.test.ts` |
| status ACTIVE antigo com prazo vencido → bloqueado pelo relógio | `entitlements.test.ts`, `saas.db.test.ts` |
| 10 consumos concorrentes, limite 3 → exatamente 3; retentativa não reconta | `saas.db.test.ts` |
| cortesia/manual não gera pagamento nem receita | `saas.db.test.ts`, `commercial.spec.ts` |
| admin não suspende a si mesmo | `saas.db.test.ts` |
| IDOR em concessão de outro usuário → 404 | `saas.db.test.ts` |
| plano publicado imutável; feature inexistente não publica; snapshot preserva quem já assinou | `saas.db.test.ts` |
| auditoria append-only no banco | `saas.db.test.ts` |
| UI: admin restrito a ADMIN sem chamadas; bloqueio sem chamar mercado; motivo obrigatório | `e2e/visual/commercial.spec.ts` |

**Pendentes por dependerem da Etapa 7 (adiada):** webhook autêntico/replay/fora de ordem, conciliação, estorno/chargeback, checkout externo.

## Riscos residuais

- Tickets de stream, limitador de login e eventos de revogação em memória (processo único no Render free). Com várias instâncias: mover para o banco/pub-sub.
- Sem recuperação de senha, verificação de e-mail ou MFA (dependem de serviço de e-mail — D-07). Recomendado MFA para admins antes do lançamento.
- `TRUST_PROXY=2` no Render ainda não conferido nos logs de produção.
