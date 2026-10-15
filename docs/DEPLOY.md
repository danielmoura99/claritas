# Deploy, segurança e operação (Etapa 9)

> **Status:** artefatos prontos, **nenhum deploy feito.** O responsável vetou publicação externa nesta fase e não há Docker no ambiente de desenvolvimento para validar a imagem. O que falta para publicar está em "Pendências".

## Topologia proposta (ADR-009 — proposta, aguardando decisão de custo/região)

| Peça | Onde | Por quê |
|---|---|---|
| Frontend Next.js | Vercel (ou qualquer host Node) | Páginas client-side; não mantém WebSocket |
| API Claritas (Fastify + WS) | Render "web service" Docker (`render.yaml`) ou Fly.io/VPS | Precisa de **processo contínuo** para o WebSocket upstream e para os clientes — serverless não serve |
| Banco | Neon (já em uso) | PostgreSQL gerenciado, branches para testar migrações |

Região da API: a Binance pública (`data-api.binance.vision`) responde de AWS Tóquio; hospedar a API em Tóquio/Singapura reduz a latência de ~290 ms por requisição (medida a partir do Brasil). O navegador fala só com a API.

## Variáveis por ambiente

| Variável | Onde | Produção |
|---|---|---|
| `NEXT_PUBLIC_CLARITAS_API_URL` / `NEXT_PUBLIC_CLARITAS_WS_URL` | Vercel (build) | `https://api.<domínio>` / `wss://api.<domínio>/api/v1/market/stream` |
| `CORS_ORIGIN` | API | domínio exato do frontend (nunca `*`); também valida o `Origin` do WebSocket |
| `DATABASE_URL` | API | connection string Neon (`sslmode=require`) — segredo |
| `API_RATE_LIMIT_PER_MINUTE` | API | 600 por IP (ajustar ao tráfego) |
| `LOG_LEVEL` | API | `info` |

TLS: Vercel e Render terminam TLS; a API escuta HTTP interno (`API_HOST=0.0.0.0`) e o WebSocket público vira `wss://` automaticamente.

## Passo a passo (quando autorizado)

1. Neon: criar *branch* `pre-release` e rodar `npm run db:migrate` contra ele; depois em produção (o `preDeployCommand` do `render.yaml` já faz `npm run db:migrate`).
2. API: `docker build -f services/api/Dockerfile -t claritas-api .` → validar `GET /health` e `/ready` localmente → criar o serviço pelo Blueprint `render.yaml` e preencher `DATABASE_URL` e `CORS_ORIGIN`.
3. Web: importar o repositório na Vercel com `NEXT_PUBLIC_CLARITAS_API_URL`/`WS_URL` apontando para a API.
4. Smoke test do navegador público: `npm run test:e2e -- --project=live` com `baseURL` apontando para o domínio (ajustar `playwright.config.ts`).

## Segurança e robustez já implementadas

- CORS por lista (`CORS_ORIGIN`) no REST e validação de `Origin` no handshake WebSocket.
- Rate limit por IP (REST, `@fastify/rate-limit`) → `429 RATE_LIMITED` com `Retry-After`; WebSocket: máx. 20 msg/s, 4 KB por mensagem, `STREAM_MAX_SUBSCRIPTIONS_PER_CLIENT`, heartbeat 30 s.
- Validação Zod em toda query/params/body; erros no formato `ApiError` com `requestId`.
- Cabeçalhos: API (`nosniff`, `no-referrer`, `X-Frame-Options: DENY`); Next (`nosniff`, `strict-origin-when-cross-origin`, `SAMEORIGIN`, `Permissions-Policy`).
- Logs JSON (Pino) com `reqId` correlacionável (`x-request-id`), redação de `authorization`/`cookie`; nenhum segredo em log.
- Proteção do orçamento da Binance: cache curto + deduplicação de requisições em voo, bloqueio em 429/418, teto de 90% do peso/min, 1 conexão WS upstream compartilhada.
- Staleness visível: status `live/stale/reconnecting/offline` por canal na interface; nenhum dado de fallback inventado.
- Observabilidade: `/health` (liveness), `/ready` (provedor, stream — canais e consumidores —, banco), `/api/v1/market/status` (último evento, latência medida com offset de relógio).

## Auditoria de dependências (15/10/2026)

`npm audit`: 0 críticas (concurrently atualizado para 10.0.6). Restam 9 "high", todas em ferramentas e sem correção compatível:

| Origem | Alcance | Por que permanece |
|---|---|---|
| `prisma` CLI → `@prisma/config` → `deepmerge-ts`, `mysql2` | CLI de migração (não é o caminho de runtime: a API usa `@prisma/client` + `adapter-pg`; `mysql2` nem é usado com PostgreSQL) | A correção sugerida é rebaixar para Prisma 6; não há patch na linha 7 estável |
| `eslint-config-next` → `braces`, `micromatch`, `fast-glob` | Só lint em desenvolvimento | A correção sugerida é rebaixar para Next 14 |

Reavaliar a cada atualização do Prisma 7.x e do Next 16.x.

## Pendências (não executáveis nesta fase)

| Item | Bloqueio | Como concluir |
|---|---|---|
| Deploy público (web + API) | Vetado pelo responsável; contas Vercel/Render não disponíveis | Seguir o passo a passo acima |
| Validar a imagem Docker | Sem Docker no ambiente | `docker build` + `docker run -p 4000:4000 --env-file .env claritas-api` |
| CSP com nonce no Next | Requer middleware de nonce e revisão dos scripts inline do Next 16 | Implementar via `proxy`/middleware conforme `node_modules/next/dist/docs` |
| Termos de uso/redistribuição de dados Binance | Revisão jurídica/comercial | Revisar os Termos da Binance antes de abrir a terceiros |
| Decisão final do host da API (ADR-009) | Custo e região | Escolher Render/Fly/VPS; preferir região próxima a Tóquio |
