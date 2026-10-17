# Deploy, segurança e operação (Etapa 9)

> **Status:** topologia escolhida pelo responsável (ADR-009): **Vercel (web) + Render free em Frankfurt (API) + Neon (banco)**, um único repositório GitHub. `render.yaml` usa runtime Node nativo no plano free; o `Dockerfile` fica como alternativa (não validado — sem Docker no ambiente de desenvolvimento).
>
> **Autenticação (16/10, ADR-018):** o REST passa pela própria Vercel (`/api/v1/*` repassado à API) para o cookie de sessão ser first-party. Antes do próximo deploy, siga a seção **"Publicar a autenticação"** abaixo — a ordem importa.

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
| `CLARITAS_API_URL` | Vercel (build; **não** é pública) | URL da API para o repasse `/api/v1/*`, ex.: `https://<api>.onrender.com`. Aceita também a antiga `NEXT_PUBLIC_CLARITAS_API_URL` como fallback |
| `NEXT_PUBLIC_CLARITAS_WS_URL` | Vercel (build) | `wss://<api>.onrender.com/api/v1/market/stream` (o WS vai direto à API, com ticket) |
| `CORS_ORIGIN` | API | domínio exato do frontend (nunca `*`); valida o `Origin` do WebSocket e recusa escritas (`403`) de outras origens |
| `SESSION_TTL_DAYS` | API | duração da sessão de login (padrão 30) |
| `SESSION_COOKIE_SECURE` | API | padrão: ligado quando `NODE_ENV=production` |
| `AUTH_RATE_LIMIT_PER_MINUTE` | API | por IP em entrar/criar conta (padrão 20) |
| `TRUST_PROXY` | API | saltos de proxy confiáveis para o IP do cliente (padrão `false`). No Render atrás da Vercel: `2` (balanceador do Render + repasse da Vercel) — **conferir nos logs** (`remoteAddress`) após o deploy |
| `DATABASE_URL` | API | connection string Neon (`sslmode=require`) — segredo |
| `API_RATE_LIMIT_PER_MINUTE` | API | 600 por IP (ajustar ao tráfego) |
| `LOG_LEVEL` | API | `info` |

TLS: Vercel e Render terminam TLS; a API escuta HTTP interno (`API_HOST=0.0.0.0`) e o WebSocket público vira `wss://` automaticamente.

## Passo a passo (Vercel + Render free + Neon)

1. **Banco:** as migrações já estão aplicadas no Neon. Em mudanças futuras de schema, rodar `npm run db:migrate` localmente (o plano free do Render não tem `preDeployCommand`).
2. **GitHub:** um repositório só com o monorepo inteiro (`.env` fica fora pelo `.gitignore`).
3. **API no Render:** *New → Blueprint* apontando para o repositório (lê `render.yaml`) e preencher `DATABASE_URL` e `CORS_ORIGIN`. A API usa a variável `PORT` do Render quando `API_PORT` não está definido. Conferir `https://<api>.onrender.com/health` e `/ready`.
4. **Web na Vercel:** importar o mesmo repositório (Root Directory = raiz, preset Next.js) com `CLARITAS_API_URL=https://<api>.onrender.com` e `NEXT_PUBLIC_CLARITAS_WS_URL=wss://<api>.onrender.com/api/v1/market/stream`. São lidas no build: alterou, refaça o deploy.
5. **Fechar o CORS:** `CORS_ORIGIN` no Render = URL exata da Vercel (sem barra final). Domínios de preview da Vercel ficam bloqueados, a menos que sejam adicionados à lista (separada por vírgula).
6. **Limitação do free:** a API dorme após 15 min sem tráfego; o primeiro acesso depois disso leva cerca de 1 min e a interface mostra o feed reconectando até ela acordar.

## Publicar a camada comercial (Plano 02)

Exige autorização do responsável. Siga `docs/SAAS_RUNBOOK.md` → "Antes do primeiro deploy desta versão": backup Neon → `npm run db:migrate` + `npm run db:seed` → promover o primeiro admin (CLI) → **conceder acesso** a quem já usava (deny-by-default) → API → web. Variáveis novas (opcionais): `ADMIN_RATE_LIMIT_PER_MINUTE`, `SUBSCRIPTION_EXPIRY_JOB_MINUTES` (API) e `NEXT_PUBLIC_CLARITAS_SUPPORT_EMAIL` (web).

## Publicar a autenticação (uma vez)

1. **Neon:** criar um branch de segurança do banco atual (backup instantâneo).
2. **Migração:** localmente, `npm run db:migrate` (aplica `20261016120000_auth`, aditiva) e `npm run db:seed` (lista modelo). Não use `migrate reset`/`migrate dev`.
3. **API (Render):** publicar o commit. A API antiga não deve continuar rodando contra o schema novo. Conferir `/ready` e que `GET /api/v1/market/assets` sem cookie responde `401`.
4. **Web (Vercel):** adicionar `CLARITAS_API_URL` (pode remover `NEXT_PUBLIC_CLARITAS_API_URL`) e publicar. Conferir que `/` redireciona para `/entrar`, criar uma conta e ver o pregão ao vivo.
5. **`TRUST_PROXY`:** com o `render.yaml` atual vale `2`. Nos logs da API, o `remoteAddress` das requisições deve ser o IP do visitante, não o da Vercel/Render; se não for, ajuste — sem isso, o limite por IP vira um balde único para todos.

## Segurança e robustez já implementadas

- **Login obrigatório (ADR-018):** sessão opaca em cookie `HttpOnly`/`SameSite=Lax`/`Secure`, hash SHA-256 no banco, senha com scrypt, limite próprio nas rotas de senha + 10 falhas por e-mail/15 min, WebSocket só com ticket de uso único, `403` para escrita de outra origem. Ver `docs/API_CONTRACT.md` → Autenticação.

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
| Deploy público (web + API) | Executado pelo responsável | Seguir o passo a passo acima e "Publicar a autenticação" |
| Recuperação de senha / verificação de e-mail | Exige serviço de e-mail transacional | Escolher provedor e registrar ADR |
| Validar a imagem Docker | Sem Docker no ambiente | `docker build` + `docker run -p 4000:4000 --env-file .env claritas-api` |
| CSP com nonce no Next | Requer middleware de nonce e revisão dos scripts inline do Next 16 | Implementar via `proxy`/middleware conforme `node_modules/next/dist/docs` |
| Termos de uso/redistribuição de dados Binance | Revisão jurídica/comercial | Revisar os Termos da Binance antes de abrir a terceiros |
| Plano pago da API (sem hibernação) | Custo | Trocar `plan: free` por `starter` no `render.yaml` |
