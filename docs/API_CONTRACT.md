# Contrato da API Claritas — v1

Base: `http://<host>:4000` (dev). Tipos e schemas Zod canônicos: `packages/contracts/src` (fonte única para API e frontend). O frontend **nunca** recebe campos da Binance (`k.t`, `k.o`…).

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
| `DB_UNAVAILABLE` | 503 | Banco não configurado/inacessível (rotas de persistência) |
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
| GET/PUT/DELETE | `/api/v1/watchlist...`, `/api/v1/preferences/:clientId` | ver §Persistência (Etapa 8) |

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

- Origem do handshake validada contra `CORS_ORIGIN` (close 1008).
- Máx. 20 mensagens/s por cliente (close 1008), payload máx. 4 KB por mensagem.
- Heartbeat: ping do servidor a cada 30 s; sem pong → conexão encerrada e assinaturas liberadas.
- Assinaturas upstream sem consumidores ficam retidas por `STREAM_UPSTREAM_LINGER_MS` (30 s) para evitar churn em trocas rápidas de ativo/timeframe.
