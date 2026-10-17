# Contrato da API Claritas — v1

Base: `http://<host>:4000` (dev). Tipos e schemas Zod canônicos: `packages/contracts/src` (fonte única para API e frontend). O frontend **nunca** recebe campos da Binance (`k.t`, `k.o`…).

O navegador chama o REST na **própria origem do frontend** (`/api/v1/*`), que o Next repassa à API (`next.config.ts → rewrites`, destino `CLARITAS_API_URL`): assim o cookie de sessão é first-party mesmo com web e API em domínios diferentes. O WebSocket vai direto à API, autenticado por ticket (ver §Autenticação).

## Convenções

- Preços/quantidades: **string decimal** com a precisão do provedor (`"81752.01000000"`). Converter para `number` só na borda visual (`toChartNumber`).
- Tempo: UTC epoch ms (`openTimeMs`) ou ISO-8601 UTC (`receivedAt`, `asOf`). O fuso de exibição (America/Sao_Paulo) é decisão da interface.
- Candles: crescentes por `openTimeMs`, sem duplicidade; chave lógica `(provider, symbol, interval, openTimeMs)`. `isClosed=false` = barra em formação.
- Variações de cotação são de **janela móvel de 24h** (`window: "rolling_24h"`), não "do dia".
- Todas as respostas de mercado vêm em envelope:

```ts
{ data: T, source: "binance_spot", receivedAt: string, asOf: string, status: "connecting"|"live"|"stale"|"reconnecting"|"offline" }
```

- Erros:

```ts
{ error: { code: ErrorCode, message: string, details?: unknown, retryAfterSec?: number }, requestId?: string }
```

| code | HTTP | Quando |
|---|---|---|
| `INVALID_REQUEST` | 400 | Query/params inválidos (Zod) — `details` lista os campos |
| `SYMBOL_NOT_FOUND` | 404 | Símbolo inexistente na Binance Spot ou fora de negociação (`details.status`) |
| `NOT_FOUND` | 404 | Rota inexistente |
| `INSUFFICIENT_DATA` | 422 | Barras insuficientes para o cálculo pedido |
| `PROVIDER_BAD_RESPONSE` | 502 | Provedor respondeu fora do formato esperado |
| `PROVIDER_UNAVAILABLE` | 503 | Provedor inacessível / 5xx após retentativas |
| `PROVIDER_RATE_LIMITED` | 503 | 429/418 da Binance ou orçamento de peso esgotado (`retryAfterSec`, header `Retry-After`) |
| `DB_UNAVAILABLE` | 503 | Banco não configurado/inacessível (persistência e verificação de sessão) |
| `UNAUTHENTICATED` | 401 | Sem sessão, sessão vencida/encerrada, ou ticket de stream inválido |
| `INVALID_CREDENTIALS` | 401 | Entrar: e-mail inexistente **ou** senha errada (mesma resposta para os dois) |
| `FORBIDDEN` | 403 | Escrita (`POST/PUT/PATCH/DELETE`) com `Origin` fora de `CORS_ORIGIN` |
| `EMAIL_TAKEN` | 409 | Criar conta com e-mail já cadastrado |
| `RATE_LIMITED` | 429 | Limite por IP (geral ou das rotas de senha) ou 10 senhas erradas para o mesmo e-mail em 15 min (`retryAfterSec`) |
| `PROVIDER_TIMEOUT` | 504 | Tempo esgotado |
| `INTERNAL` | 500 | Erro inesperado |

Toda resposta traz `x-request-id` (aceita um `x-request-id` válido do cliente para correlação).

## REST

| Método | Caminho | Resposta (`data`) |
|---|---|---|
| GET | `/health` | `{ status: "ok", uptimeSec }` — liveness, não toca mercado nem banco |
| GET | `/ready` | `{ status: "ready", checks: { provider: { id, reachable }, stream: { upstreamOpen, channels, clients, byChannel[] }, database? } }` — sempre 200 enquanto o processo serve; estado do provedor é informativo |
| GET | `/api/v1/market/assets?search=BTC&quote=USDT&limit=50` | `MarketAsset[]` (só `TRADING`; sem `search` → ativos em destaque) |
| GET | `/api/v1/market/assets/:symbol` | `MarketAsset` |
| GET | `/api/v1/market/quote?symbol=BTCUSDT` | `Quote` (24h móvel) |
| GET | `/api/v1/market/quotes?symbols=BTCUSDT,ETHUSDT` | `Quote[]` (máx. 40) |
| GET | `/api/v1/market/candles?symbol=BTCUSDT&interval=5m&limit=500[&endTimeMs=]` | `Candle[]` (limit 1–1000; intervalos `1m 3m 5m 15m 30m 1h 4h 1d`) |
| GET | `/api/v1/market/status?symbol=BTCUSDT[&interval=5m]` | `{ data: FeedStatus, upstream: "open"\|"closed" }` |
| GET | `/api/v1/analysis?symbol=&interval=` | ver §Análise (Etapa 5) |
| GET | `/api/v1/scanner?...` | ver §Scanner (Etapa 6) |
| GET | `/api/v1/report?...` | ver §Relatório (Etapa 7) |
| GET | `/api/v1/watchlist` | `Watchlist` do usuário da sessão (na 1ª vez, cópia da lista modelo; itens por base/cotação, símbolo derivado) |
| PUT / DELETE | `/api/v1/watchlist/items/:symbol` | `Watchlist` atualizada (PUT só aceita ativo negociando; idempotente) |
| GET | `/api/v1/preferences` | `Preference` do usuário ou `null` (ainda sem preferências) |
| PUT | `/api/v1/preferences` | `Preference` (upsert parcial: `symbol`, `interval`, `showAnalysis`; campos desconhecidos → 400) |
| POST | `/api/v1/auth/register` | `201` + `Session`; corpo `{ name, email, password }` (e-mail normalizado em minúsculas; senha 8–128) |
| POST | `/api/v1/auth/login` | `Session`; corpo `{ email, password, remember? }` — `remember: false` ("Manter conectado" desmarcado) = cookie sem `Max-Age` e sessão de 12 h |
| POST | `/api/v1/auth/logout` | `null`; encerra a sessão no servidor e limpa o cookie (idempotente) |
| GET | `/api/v1/auth/session` | `Session` atual (`{ user: { id, email, name, createdAt }, expiresAt }`) |
| POST | `/api/v1/auth/stream-ticket` | `{ ticket, expiresAt }` — uso único, 60 s, para abrir o WebSocket |

## Autenticação (ADR-018)

- **Toda rota em `/api/v1` exige sessão**, exceto `auth/register`, `auth/login` e `auth/logout`. `/health` e `/ready` seguem públicos. Sem sessão → `401 UNAUTHENTICATED`.
- **Sessão:** cookie `claritas_session` — token opaco de 256 bits, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` em produção, `Max-Age` = `SESSION_TTL_DAYS` (30 dias, sem renovação automática). O banco guarda só o SHA-256 do token; sair apaga a sessão no servidor.
- **Senha:** scrypt (`N=2^15, r=8, p=1`, sal de 16 bytes; parâmetros no próprio hash). Política: 8–128 caracteres, sem regras de composição, diferente do e-mail. Entrar com e-mail inexistente custa o mesmo tempo que com senha errada.
- **Força bruta:** `AUTH_RATE_LIMIT_PER_MINUTE` (20) por IP em entrar/criar conta, somado a 10 senhas erradas por e-mail em 15 min. O limite geral por IP vale também para requisições sem sessão.
- **CSRF:** `SameSite=Lax` + recusa de escritas com `Origin` fora de `CORS_ORIGIN` (`403 FORBIDDEN`).
- **WebSocket:** o handshake exige `?ticket=` válido (de `POST /auth/stream-ticket`); sem ticket → `401` antes do upgrade. O cliente pede um ticket novo a cada (re)conexão. Tickets ficam em memória (API em processo único).

`FeedStatus`: `{ symbol, interval?, status, source, lastEventAt: ISO|null, lastReceivedAt: ISO|null, latencyMs: number|null, reason? }`. `latencyMs` = `receivedAt + offsetDeRelógio − eventTime`, com o offset estimado pelo método de Cristian sobre `GET /api/v3/time` (renovado a cada 10 min).

## WebSocket — `/api/v1/market/stream` (protocolo 1)

Uma conexão por aba do navegador; várias assinaturas por conexão (máx. `STREAM_MAX_SUBSCRIPTIONS_PER_CLIENT`, padrão 40). Mensagens JSON.

### Cliente → servidor

```jsonc
{ "type": "subscribe", "channel": "candles", "symbol": "BTCUSDT", "interval": "5m" }
{ "type": "unsubscribe", "channel": "candles", "symbol": "BTCUSDT", "interval": "5m" }
{ "type": "subscribe_quote", "channel": "quote", "symbol": "ETHUSDT" }
{ "type": "unsubscribe_quote", "channel": "quote", "symbol": "ETHUSDT" }
{ "type": "ping", "id": "opcional" }
```

### Servidor → cliente

| type | Conteúdo | Observação |
|---|---|---|
| `hello` | `{ serverTime, protocol: 1 }` | Ao conectar |
| `subscribed` / `unsubscribed` | `{ channel, symbol, interval? }` | Confirmação |
| `status` | `{ data: FeedStatus }` | Sempre que o estado do canal muda. **A UI só exibe "Ao vivo" com `status === "live"`.** |
| `candle.upsert` | `{ data: Candle, source, receivedAt, eventTimeMs }` | Atualiza pela chave `openTimeMs`. Nunca retrocede: eventos mais antigos que o último conhecido e reabertura de barra fechada são descartados no servidor |
| `quote.update` | `{ data: Quote, source, receivedAt, eventTimeMs }` | 24h móvel (miniTicker), ~1/s |
| `error` | `{ code, message }` | `INVALID_REQUEST`, `SYMBOL_NOT_FOUND`, `SUBSCRIPTION_LIMIT`, `RATE_LIMITED`… |
| `pong` | `{ id?, serverTime }` | Resposta a `ping` |

Ao assinar um canal já aberto por outro cliente, o servidor envia imediatamente o último `status` e o último `candle.upsert`/`quote.update` conhecidos (snapshot).

### Estados do canal

`connecting` (assinado, sem evento ainda) → `live` (eventos chegando) → `stale` (sem eventos há `STREAM_STALE_AFTER_MS`, padrão 15 s, ou barra que não fechou no horário) → `live` de novo ao chegar evento.
Queda do upstream → `reconnecting` → (reconexão) reconciliação REST das barras perdidas → `reconnecting` até o primeiro evento novo → `live`. Upstream fora por mais de 60 s → `offline`.

### Limites e proteção

- Ticket de sessão obrigatório no handshake (`401` sem upgrade se ausente, vencido ou já usado).
- Origem do handshake validada contra `CORS_ORIGIN` (close 1008).
- Máx. 20 mensagens/s por cliente (close 1008), payload máx. 4 KB por mensagem.
- Heartbeat: ping do servidor a cada 30 s; sem pong → conexão encerrada e assinaturas liberadas.
- Assinaturas upstream sem consumidores ficam retidas por `STREAM_UPSTREAM_LINGER_MS` (30 s) para evitar churn em trocas rápidas de ativo/timeframe.
