# Provedor de dados — Binance Spot (dados públicos)

Implementação: `services/api/src/providers/binance/` (`binance-provider.ts`, `http.ts`, `stream-source.ts`, `schemas.ts`, `normalize.ts`). Verificado em 14/10/2026 contra a documentação oficial e contra os endpoints reais desta máquina.

## Endpoints usados

| Uso | Endpoint | Peso (doc oficial) | Cache Claritas |
|---|---|---|---|
| Metadados/validação de símbolos | `GET /api/v3/exchangeInfo?permissions=SPOT&showPermissionSets=false` (~6,7 MB, 3.689 símbolos) | 20 | 1 h |
| Histórico OHLCV | `GET /api/v3/klines?symbol&interval&limit[&startTime&endTime]` (máx. 1000) | 2 | 2 s (mais recentes) / 5 min (janela fechada) |
| Cotação 24h | `GET /api/v3/ticker/24hr?symbol` · `?symbols=[...]` (lotes de 20) · sem parâmetro (todos) | 2 / 2 (≤20) / 80 | 2 s / — / 60 s |
| Relógio | `GET /api/v3/time` (offset para medir latência) | 1 | 10 min |
| Readiness | `GET /api/v3/ping` | 1 | 15 s |
| Tempo real | `wss://data-stream.binance.vision:443/stream` + `SUBSCRIBE` de `<symbol>@kline_<interval>` e `<symbol>@miniTicker` | — | — |

Hosts `data-api.binance.vision` e `data-stream.binance.vision` são exclusivos de dados de mercado públicos: **não exigem API key** e não servem dados de conta.

## Mapeamento para o contrato

| Binance | Claritas `Candle` |
|---|---|
| REST `[0]` / WS `k.t` | `openTimeMs` |
| REST `[6]` / WS `k.T` | `closeTimeMs` |
| `[1..4]` / `k.o k.h k.l k.c` | `open high low close` (string, precisão preservada) |
| `[5]` / `k.v` | `volumeBase` |
| `[7]` / `k.q` | `volumeQuote` |
| `[8]` / `k.n` | `trades` |
| WS `k.x` | `isClosed` (REST: `closeTime < agora`) |
| WS `E` | `eventTimeMs` da mensagem |

Intervalos são case-sensitive (`1m` minuto ≠ `1M` mês); só `1m 3m 5m 15m 30m 1h 4h 1d` são aceitos. Linhas malformadas ou com OHLC incoerente (`low ≤ min(o,c) ≤ max(o,c) ≤ high`, volume ≥ 0) são descartadas com log.

## Robustez implementada

- **HTTP:** timeout (`BINANCE_HTTP_TIMEOUT_MS`), 2 retentativas com backoff exponencial + jitter (crypto) só para rede/5xx; 4xx nunca repete; `-1121` → `SYMBOL_NOT_FOUND`; 429/418 → bloqueio local até `Retry-After` (sem novas chamadas); acompanha `X-MBX-USED-WEIGHT-1M` e recusa chamadas acima de 90% de 6000/min.
- **WebSocket:** uma conexão para todas as assinaturas; mensagens de controle espaçadas ≥ 250 ms (limite oficial: 5 msgs/s contando ping/pong); até 100 streams por mensagem (limite: 1024 por conexão); pong automático aos pings da Binance (a cada 20 s); reconexão com backoff + jitter (teto 30 s); reciclagem preventiva antes de 24 h (limite oficial de duração); `serverShutdown` → reconexão imediata; 30 s de silêncio com assinaturas ativas → conexão considerada morta e reciclada.
- **Reconciliação:** após reconectar, cada canal de candles busca via REST desde o último `openTimeMs` conhecido, deduplica e só volta a `live` com o primeiro evento novo.
- **Sem fallback fictício:** falha do provedor = erro 5xx na API e status `reconnecting/offline` no stream. Nenhum número é inventado.

## O que estes dados NÃO permitem afirmar

Candles e ticker 24h não contêm livro de ofertas, identidade de participantes nem fluxo agressor completo. Portanto **não** derivamos fluxo institucional/varejo, sentimento, order flow, liquidez profunda nem probabilidades — esses painéis do protótipo ficam indisponíveis nas telas reais.

## Termos de uso e redistribuição (pendente antes de uso público/comercial)

O uso atual é desenvolvimento/validação técnica. Antes de abrir para terceiros é obrigatório revisar os Termos de Uso da Binance e as condições de redistribuição de dados de mercado (atribuição, uso comercial, limites). Registrado como pendência da Etapa 9.

## Referências

- https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md
- https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md
- https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
