# Persistência — PostgreSQL + Prisma (Etapa 8)

## O que é persistido (e o que não é)

| Tabela | Uso | Observação |
|---|---|---|
| `Watchlist` | Lista `default` de ativos acompanhados | Sem autenticação nesta fase: uma lista compartilhada |
| `WatchlistItem` | Itens da lista | Identidade **independente do provedor** (`baseAsset`/`quoteAsset`); o símbolo Binance é derivado (`BTC`+`USDT`) |
| `UserPreference` | Último ativo/intervalo e "Análise no gráfico" | Chave = id **anônimo** gerado no navegador (`localStorage`), não é conta de usuário |

**Não** se persistem cotações, candles ou ticks (ADR-007). Não há `User` nem login (ADR-012).

## Versões validadas (15/10/2026)

`prisma` 7.10.0 · `@prisma/client` 7.10.0 · `@prisma/adapter-pg` 7.10.0 · `pg` 8.23.0 · Node 24.11.1. A tag `latest` do CLI apontava para 8.0.0-rc; foi fixada a 7.10.0 estável. Prisma 7: gerador `prisma-client` (saída em `services/api/src/generated/prisma`, fora do Git), URL em `services/api/prisma.config.ts`, conexão por driver adapter.

## Onde fica

- Dono único das migrações: `services/api` (`prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`).
- O frontend não conhece o Prisma: fala só com a API (`/api/v1/watchlist`, `/api/v1/preferences/:clientId`).

## Banco do projeto: Neon (PostgreSQL gerenciado)

O `DATABASE_URL` do `.env` (não versionado) aponta para um banco Neon (`sslmode=require`). Aplicado em 15/10/2026: `prisma migrate deploy` (migração `20261015021142_init`) e `prisma db seed` (watchlist `default` com BTC/ETH/SOL — sem cotações). A API reporta o banco em `/ready → checks.database`.

```bash
npm run db:migrate   # prisma migrate deploy (não destrutivo; aplica migrações pendentes)
npm run db:seed      # cria a watchlist default se estiver vazia
npm run db:generate  # regenera o Prisma Client (também roda no postinstall da API)
```

Nunca rode `prisma migrate reset` / `migrate dev` contra o Neon: são comandos de desenvolvimento que podem apagar dados.

## Banco local para testes (ADR-014)

Os testes de persistência (`npm run test:db`) **nunca** usam o `DATABASE_URL`. Eles usam um cluster PostgreSQL local e isolado (`npm run db:local:start` → `127.0.0.1:5544`, dados em `.data/`, credenciais de desenvolvimento), criam a cada execução um banco **novo e vazio** com nome único, aplicam as migrações com `migrate deploy` (prova de reprodutibilidade em banco vazio), executam os testes e removem apenas esse banco descartável. O teste recusa qualquer host que não seja local.

## Falhas

Sem `DATABASE_URL` ou com o banco inacessível, a API continua servindo mercado/análise; rotas de persistência respondem `503 DB_UNAVAILABLE` e a interface desativa a estrela/watchlist com aviso. Nada é inventado.

## Backup e rollback (plano)

- **Backup:** o Neon mantém histórico (point-in-time restore) conforme o plano contratado; antes de cada migração em produção, criar um *branch* Neon do banco atual (cópia instantânea) e aplicar a migração primeiro nele.
- **Rollback:** migrações Prisma são só "para frente". Para desfazer, escrever uma nova migração que reverta a anterior (ou restaurar o branch/backup do Neon). O schema atual é aditivo (3 tabelas novas), então reverter = `DROP TABLE` das três, sem efeito em outras tabelas.
- **Credenciais:** apenas em `.env`/variáveis do host. `.env` está no `.gitignore`; `.env.example` não contém segredos.
