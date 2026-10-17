# Rotas e política de acesso — Plano 02

Fonte de verdade no código: `services/api/src/modules/authorization/route-policy.ts` (`ROUTE_POLICIES`). **Rota em `/api/v1` sem política declarada impede a API de subir** (teste `route-policy.test.ts`). `/api/v1/admin/*` é sempre ADMIN.

| Política | Significado | Erros |
|---|---|---|
| `public` | sem sessão | — |
| `session` | conta ATIVA com sessão | 401 `UNAUTHENTICATED`, 403 `ACCOUNT_BLOCKED` |
| `feature:X` | conta ativa + feature X liberada pelo motor | + 403 `ENTITLEMENT_REQUIRED` (`details.feature`, `details.reason`), 429 `QUOTA_EXCEEDED` |
| `admin` | conta ativa + `role=ADMIN` (não libera features) | + 403 `FORBIDDEN` |
| `stream` | ticket de uso único + conta ativa + `terminal.access`; revalida a cada 60 s e na hora em ação do admin (close `4403`) | 401 antes do upgrade |

Escritas (`POST/PUT/PATCH/DELETE`) com `Origin` fora de `CORS_ORIGIN` → 403 `FORBIDDEN` (todas as políticas).

## API

| Método | Rota | Política | Observação |
|---|---|---|---|
| POST | `/api/v1/auth/register` · `login` · `logout` | public | login recusa conta não ativa (`ACCOUNT_BLOCKED`, só após senha correta); `login` aceita `remember` |
| GET | `/api/v1/auth/session` | session | |
| POST | `/api/v1/auth/stream-ticket` | feature `terminal.access` | |
| GET | `/api/v1/plans/public` | public | só PUBLICADOS e só features implementadas |
| GET | `/api/v1/me` | session | identidade, papel, estado |
| GET | `/api/v1/me/access` | session | snapshot de decisões; **não consome quota** |
| GET | `/api/v1/me/subscription` | session | estado comercial do próprio usuário |
| GET/PUT | `/api/v1/me/onboarding` | session | `PUT { done: true }` |
| POST | `/api/v1/me/events` | session | lista fechada: `first_chart_viewed`, `upgrade_clicked` (30/min) |
| GET | `/api/v1/market/{assets,assets/:symbol,quote,quotes,candles,status}` | feature `terminal.access` | |
| WS | `/api/v1/market/stream` | stream | |
| GET | `/api/v1/analysis` | feature `terminal.access` | |
| GET | `/api/v1/scanner` | feature `scanner.access` | + consome `scanner.scan` (quota diária UTC, `Idempotency-Key` opcional; cabeçalhos `x-quota-limit/remaining`) |
| GET | `/api/v1/report` | feature `reports.access` | |
| GET | `/api/v1/watchlist` · PUT/DELETE `items/:symbol` | session | inclusão limitada por `watchlist.max_assets` (429 acima do limite) |
| GET/PUT | `/api/v1/preferences` | session | |
| GET | `/api/v1/admin/summary` | admin | indicadores; receita `PENDING_GATEWAY` |
| GET | `/api/v1/admin/users` | admin | paginação/filtros: `search,status,role,plan,access,sort,page,pageSize` |
| GET | `/api/v1/admin/users/:id` · `/access` | admin | detalhe, acesso efetivo com motivo, assinaturas, concessões, linha do tempo |
| PATCH | `/api/v1/admin/users/:id/status` | admin | `{status, reason}`; não altera a própria conta; não bloqueia o último admin; revoga sessões |
| POST | `/api/v1/admin/users/:id/overrides` | admin | `{featureKey, effect, endsAt, reason, limitValue?, startsAt?}` (≤ 366 dias) |
| DELETE | `/api/v1/admin/users/:id/overrides/:overrideId` | admin | `{reason}`; revogação suave; pertencimento verificado |
| GET | `/api/v1/admin/features` · `plans` | admin | |
| POST | `/api/v1/admin/plans` | admin | rascunho (código novo ou próxima versão) |
| PUT | `/api/v1/admin/plans/:id` | admin | só rascunho |
| POST | `/api/v1/admin/plans/:id/versions` · `publish` · `archive` | admin | publicar exige features implementadas e limites; arquiva a versão publicada anterior |
| GET | `/api/v1/admin/subscriptions` | admin | filtros `status,source,current` |
| POST | `/api/v1/admin/subscriptions/manual` | admin | `{userId, planId, kind: TRIAL|MANUAL|COMPLIMENTARY, accessUntil, reason, replaceCurrent?}` |
| POST | `/api/v1/admin/subscriptions/:id/extend` · `revoke` | admin | só correntes e não-gateway |
| GET | `/api/v1/admin/audit` | admin | filtros `targetId,actorId,action,from,to` |
| GET | `/api/v1/admin/integrations/payments` | admin | `DEFERRED` (Etapa 7 adiada) |

Todas as rotas administrativas: limite `ADMIN_RATE_LIMIT_PER_MINUTE` por IP, `cache-control: no-store`, autor sempre da sessão.

## Telas (Next)

| Rota | Acesso na interface (o servidor decide de verdade) |
|---|---|
| `/entrar` | pública |
| `/planos`, `/ajuda` | públicas (fora do `proxy.ts`) |
| `/`, `/scanner`, `/relatorio` | sessão + `FeatureGate` (`terminal.access`, `scanner.access`, `reports.access`) |
| `/conta` | sessão |
| `/admin`, `/admin/usuarios`, `/admin/usuarios/[id]`, `/admin/assinaturas`, `/admin/planos`, `/admin/auditoria`, `/admin/integracoes` | sessão + `AdminFrame` (role ADMIN) |
