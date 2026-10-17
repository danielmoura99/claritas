# Persistência — PostgreSQL + Prisma (Etapas 8 e 10)

## O que é persistido (e o que não é)

| Tabela | Uso | Observação |
|---|---|---|
| `User` | Conta de acesso (nome, e-mail único em minúsculas, hash scrypt da senha) | A senha nunca é guardada nem registrada em log |
| `Session` | Sessões de login | Só o **SHA-256** do token (o token vive no cookie `HttpOnly`); `expiresAt` absoluto, `lastUsedAt` atualizado no máx. 1×/h |
| `Watchlist` | Uma lista por usuário (`userId` único) | A lista **sem dono** chamada `default` é o modelo copiado para contas novas (seed) |
| `WatchlistItem` | Itens da lista | Identidade **independente do provedor** (`baseAsset`/`quoteAsset`); o símbolo Binance é derivado (`BTC`+`USDT`) |
| `UserSettings` | Último ativo/intervalo e "Análise no gráfico" do usuário | Chave = `userId` |
| `UserPreference` | **Legado** (até out/2026): preferências por id anônimo do navegador | Não é mais lida nem escrita; mantida para não apagar dados. Remover só com ADR |

**Não** se persistem cotações, candles ou ticks (ADR-007). Contas e sessões: ADR-018.

## Versões validadas (15/10/2026)

`prisma` 7.10.0 · `@prisma/client` 7.10.0 · `@prisma/adapter-pg` 7.10.0 · `pg` 8.23.0 · Node 24.11.1. A tag `latest` do CLI apontava para 8.0.0-rc; foi fixada a 7.10.0 estável. Prisma 7: gerador `prisma-client` (saída em `services/api/src/generated/prisma`, fora do Git), URL em `services/api/prisma.config.ts`, conexão por driver adapter.

## Onde fica

- Dono único das migrações: `services/api` (`prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`).
- O frontend não conhece o Prisma: fala só com a API (`/api/v1/auth/*`, `/api/v1/watchlist`, `/api/v1/preferences`), sempre como o usuário da sessão.

## Banco do projeto: Neon (PostgreSQL gerenciado)

O `DATABASE_URL` do `.env` (não versionado) aponta para um banco Neon (`sslmode=require`). Aplicado em 15/10/2026: `prisma migrate deploy` (migração `20261015021142_init`) e `prisma db seed` (watchlist `default` com BTC/ETH/SOL — sem cotações). A API reporta o banco em `/ready → checks.database`.

**Pendente no Neon:** a migração `20261016120000_auth` (contas e sessões). Ela é aditiva — cria `User`, `Session` e `UserSettings`, adiciona `Watchlist.userId` e remove só o índice único de `Watchlist.name`; nenhuma linha é apagada. Ordem para publicar: (1) branch Neon de segurança, (2) `npm run db:migrate` e `npm run db:seed`, (3) deploy da API, (4) deploy da web. A API antiga não deve rodar contra o schema novo (o upsert da lista `default` dependia do índice removido).

```bash
npm run db:migrate   # prisma migrate deploy (não destrutivo; aplica migrações pendentes)
npm run db:seed      # cria a watchlist modelo (sem dono) se não existir; não cria contas
npm run db:generate  # regenera o Prisma Client (também roda no postinstall da API)
```

Nunca rode `prisma migrate reset` / `migrate dev` contra o Neon: são comandos de desenvolvimento que podem apagar dados.

## Banco local para testes (ADR-014)

Os testes de persistência (`npm run test:db`) **nunca** usam o `DATABASE_URL`. Eles usam um cluster PostgreSQL local e isolado (`npm run db:local:start` → `127.0.0.1:5544`, dados em `.data/`, credenciais de desenvolvimento), criam a cada execução um banco **novo e vazio** com nome único, aplicam as migrações com `migrate deploy` (prova de reprodutibilidade em banco vazio), executam os testes e removem apenas esse banco descartável. O teste recusa qualquer host que não seja local.

## Banco local de E2E

`node scripts/e2e-db.mjs` cria `claritas_e2e` no mesmo cluster local (se não existir), aplica `migrate deploy` e o seed; com `--api` sobe a API apontando para ele. É o banco da suíte Playwright `live` (contas de teste) e da verificação manual do login — o setup do Playwright confere que a conta E2E foi gravada nele antes de rodar qualquer teste.

## Falhas

Com login obrigatório, o banco passou a ser necessário para usar o terminal: sem `DATABASE_URL` ou com o banco inacessível, entrar/criar conta e a verificação de sessão respondem `503 DB_UNAVAILABLE` (nunca `401`, para não parecer sessão inválida) e a tela de entrada mostra "Contas indisponíveis no momento". Nada é inventado.

## Backup e rollback (plano)

- **Backup:** o Neon mantém histórico (point-in-time restore) conforme o plano contratado; antes de cada migração em produção, criar um *branch* Neon do banco atual (cópia instantânea) e aplicar a migração primeiro nele.
- **Rollback:** migrações Prisma são só "para frente". Para desfazer, escrever uma nova migração que reverta a anterior (ou restaurar o branch/backup do Neon). As migrações atuais são aditivas: reverter a `auth` = remover `Watchlist.userId`, recriar o índice único de `Watchlist.name` (só possível se não houver nomes repetidos — apagar antes as listas de usuários) e `DROP TABLE` de `UserSettings`, `Session` e `User`. Isso apaga as contas: preferir restaurar o branch Neon.
- **Credenciais:** apenas em `.env`/variáveis do host. `.env` está no `.gitignore`; `.env.example` não contém segredos.
