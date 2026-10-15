# Auditoria do design system Claritas — Etapa 0

> Data: 14/10/2026 (America/Sao_Paulo). Estado auditado: branch `master`, commit `7f0ba75` + árvore de trabalho com o design system já incorporado (não commitado). Nenhum arquivo do design system foi alterado durante esta auditoria.

## 1. Ambiente verificado

| Item | Valor real |
|---|---|
| Node.js / npm | v24.11.1 / 11.6.2 (lockfile: `package-lock.json` → npm) |
| Next.js / React | 16.4.1 (App Router, Turbopack, `cacheComponents`, `partialPrefetching`) / 19.3.0 |
| TypeScript | 5.9.3 (`strict`, alias `@/*` → raiz) |
| Estilo | Tailwind CSS 4.3.3 via loader `@tailwindcss/turbopack` (sem `postcss.config`, sem `tailwind.config`) + CSS custom properties do design system |
| shadcn/ui, Radix, Motion, Zustand | **ausentes** |
| Lint | ESLint 9 (`eslint-config-next` 16.4.1) + regras de aderência do design system (`design-system/lint/`) |
| Fontes | `next/font/google` em `app/layout.tsx`: Geist, Geist Mono, Instrument Serif (OFL). Cópias `.woff2` locais em `design-system/assets/fonts` (usadas só pelos HTMLs de referência) |
| Tema | `data-theme="dark"` (canônico) no `<html>`; `data-theme="light"` derivado em `design-system/tokens/theme-light.css` |
| Binance Spot público | `https://data-api.binance.vision` (ping/time/klines → 200) e `wss://data-stream.binance.vision:443` (kline recebidos) **acessíveis desta máquina** em 14/10/2026 |
| PostgreSQL | Serviço `postgresql-x64-17` do sistema na porta 5433 (credenciais não disponíveis ao agente — não será usado). Binários PG 17 disponíveis em `C:\Program Files\PostgreSQL\17\bin` |

## 2. Onde está cada coisa (caminhos reais)

O plano supunha `components/` e `styles/` na raiz — **não existem**. O design system canônico vive em `design-system/`:

| Caminho | Conteúdo | Canônico? |
|---|---|---|
| `DESIGN.md` | Contrato visual, tokens (formato Google Stitch) | **Sim — fonte da verdade dos tokens** |
| `design-system/tokens/*.css` | `colors`, `typography`, `spacing`, `effects`, `motion`, `base`, `theme-light`, `fonts`, `index` (entrada do app) | **Sim** |
| `design-system/components/{core,forms,navigation,feedback,market,charts,analysis}/` | 29 componentes React TSX + `.md` de uso | **Sim** |
| `design-system/templates/terminal/` | Template de composição do Terminal (TopBar, Rail, Desk, Scanner, Report, TerminalApp, `data.ts`) | Referência de layout — **contém dados fictícios** |
| `design-system/lib/` | `format.ts` (pt-BR), `random.ts` (LCG determinístico), `useTween.ts` | Sim |
| `design-system/assets/{fonts,icons}` | 8 woff2, 77 SVG Lucide | Sim |
| `design-system/lint/` | Regras de aderência (oxlint JSON → ESLint) | Sim |
| `design-system/reference/` | HTMLs standalone do export original (guidelines, cards, terminal JSX) | Referência visual, fora do app |
| `app/globals.css` | Importa tokens; mapeia utilitários Tailwind → tokens; paleta Tailwind padrão desligada | Sim |
| `app/layout.tsx` | Fontes + `data-theme` | Sim |
| `app/page.tsx` | Página padrão do `create-next-app` (tokenizada) — **não é tela do produto** | Substituível |
| `app/design-system/` | Showcase `/design-system` e `/design-system/terminal` | Ferramenta interna de verificação |

## 3. Tokens (valores reais da raiz)

Conferem com os valores observados no HTML do plano, com **uma divergência**: `--topbar-h` é **52px** no token, mas o template do terminal usa **60px** fixos (o readme original também cita topbar 60). Mantido como está; o layout novo seguirá o template (60) por fidelidade visual e a divergência fica registrada.

| Semântica | Token | Valor |
|---|---|---|
| Fundo | `--bg-app` → `--ink-950` | `#0A0A0A` |
| Painel | `--surface-panel` | `#0F0F0F` |
| Elevado | `--surface-raised` → `--ink-850` | `#151515` |
| Texto 1/2/3 | `--text-primary/secondary/tertiary` | `#EDECE9` / `#ADABA6` / `#86847F` |
| Acento (análise) | `--accent` → `--sand-400` (hover `--sand-300`) | `#C8B28E` |
| Alta (mercado) | `--market-up` → `--up-500`; texto `--up-400` | `#DED8CC` |
| Baixa | `--market-down` → `--down-500`; vela `--candle-down` → `--ink-500` | `#C47A66` / `#5C5B58` |
| Grade | `--chart-grid` | `rgba(255,255,255,.04)` |
| MM rápida / lenta | `--chart-ma-fast` / `--chart-ma-slow` | sand-400 / ink-400 |
| Borda | `--border-subtle/default/strong` | `.055` / `.09` / `.16` alfa branco |
| Espaço | `--space-1..12` | 2 4 6 8 12 16 20 24 32 40 56 72 px |
| Raios | `--radius-xs..xl`, `--radius-pill` | 2 4 6 10 14, 999 px |
| Layout | `--topbar-h` 52 · `--tape-h` 32 · `--rail-w` 56 · `--inspector-w` 360 · `--panel-gap` 8 · `--panel-pad` 16 | |
| Movimento | `--ease-out cubic-bezier(.2,.8,.2,1)`, `--dur-tick 140` … `--dur-scan 2600`; `prefers-reduced-motion` zera draw/scan/slow | |

Gramática de cor confirmada no código: **bone (alta) · graphite (vela de baixa) · clay (negativo/stop) · sand (insight Claritas)**. Nenhum verde/vermelho saturado.

## 4. Componentes — origem → uso futuro → alteração necessária

Legenda SSR: ✅ seguro em SSR · 🟡 cliente (hooks/handlers) · 🔵 mede DOM (ResizeObserver/offsets) · 🟣 canvas/rAF

| Componente | SSR | Uso no produto | Alteração necessária |
|---|---|---|---|
| `core/Panel` | ✅ | Todos os módulos | Nenhuma |
| `core/Button` | 🟡 | Ações (alerta, varrer, exportar) | Nenhuma |
| `core/IconButton` | 🟡 | Rail, cabeçalho do gráfico, favoritar | Nenhuma |
| `core/Badge` | ✅ | Status, tipo de sinal, fonte dos dados | Nenhuma |
| `core/Icon` | ✅ | Ícones Lucide | Nenhuma |
| `core/Tooltip` | 🟡 | Rail/ações | Nenhuma |
| `core/Wordmark` | ✅ | Topbar | Nenhuma |
| `forms/Input` | 🟡 | Busca de ativo, filtros do scanner | Nenhuma |
| `forms/Select` | 🟡 | Filtros scanner/relatório | Nenhuma |
| `forms/Checkbox` | 🟡 | Critérios do scanner | Nenhuma |
| `forms/Switch` | 🟡 | Exibir indicadores/análise no gráfico | Nenhuma |
| `navigation/SegmentedControl` | 🔵 | Timeframes (`1m 5m 15m 1h 4h 1d`) | Nenhuma |
| `navigation/Tabs` | 🔵 | Abas da leitura Claritas | Nenhuma |
| `feedback/LiveIndicator` | ✅ | **Status real do feed** (`live/analyzing/delayed/closed`) | Mapear `MarketStatus` → status visual; nunca "Ao vivo" se stale/offline |
| `feedback/Toast` | ✅ | Erros de conexão/feed | Nenhuma |
| `feedback/Dialog` | 🟡 | (futuro) | Nenhuma |
| `market/Delta` | ✅ | Variações reais (24h / período explícito) | Nenhuma |
| `market/PriceTicker` | 🟡 | Último preço real (flash por dígito) | Nenhuma |
| `market/TickerTape` | 🟡 | Fita com miniTicker real | Nenhuma |
| `market/WatchRow` | 🟡 | Seletor de ativo / watchlist | Nenhuma |
| `charts/CandleChart` | 🔵 | **Ilustrativo** (SVG próprio, série gerada por LCG, live simulado) | **Não usado com dados reais.** Novo wrapper `charts/MarketChart` com Lightweight Charts preserva legenda OHLC, cores, grid, eixo mono à direita, etiqueta sand do último preço e níveis tracejados 5·4 |
| `charts/Sparkline` | ✅ | Sparklines de cotações reais | Nenhuma |
| `charts/FlowArea` | 🔵 | Série real (volume por candle) via prop `data` | Usar só modo controlado (`data`), nunca `live` simulado |
| `charts/ProbabilityField` | 🟣 | **Decorativo/probabilístico sem fonte** | Fora das telas do produto (permanece no showcase) |
| `charts/DistributionCurve` | 🔵 | Curva normal com P(≥alvo) — **modelo sem calibração** | Não usar com rótulo de probabilidade; painel marcado indisponível |
| `analysis/SignalCard` | 🟡 | Eventos determinísticos reais (cruzamentos de médias) | Não preencher `confidence` sem método |
| `analysis/ConfidenceMeter` | ✅ | — | Não usar (não há confiança calibrada) |
| `analysis/SentimentGauge` | 🟡 | Posição do preço no range 24h (0 = mínima, 100 = máxima), com rótulos explícitos | Passar `label/minLabel/maxLabel` honestos; não usar "Comprador/Vendedor" |
| `analysis/MetricRow` | 🟡 | Indicadores reais (EMA, SMA, ATR, volume relativo) | Nenhuma |

Template `templates/terminal/*` → base de **layout** das três telas (TopBar 60 · Rail 56 · gráfico + leitura 380 · faixa de 4 widgets 260 · fita 30). Não será importado pelas telas reais porque acopla dados fictícios; as telas do produto recompõem os mesmos componentes com dados da API.

## 5. Mocks e valores demonstrativos mapeados

| Origem | O que é | Destino |
|---|---|---|
| `templates/terminal/data.ts` | Ativos B3 fictícios (PETR4…), sinais e "pensamentos" | Fica só no template/showcase |
| `templates/terminal/TerminalApp.tsx` (`Math.random`, `setInterval`) | Cotações, viés e sinais simulados | Idem |
| `templates/terminal/Desk.tsx` | Fluxo institucional/varejo, volume, fluxo estrangeiro aleatórios | Idem |
| `templates/terminal/Scanner.tsx` | Varredura fictícia de 84 ativos | Idem |
| `templates/terminal/Report.tsx` | KPIs e manchete fixos ("131.420", "68% acerto") | Idem |
| `charts/CandleChart` (`generateSeries`, `live`) | Série e tick simulados (LCG) | Showcase apenas |
| `charts/FlowArea` (`live` sem `data`) | Passeio aleatório determinístico | Showcase apenas |
| `charts/ProbabilityField` | `Math.random` só na fase da animação | Showcase apenas |
| `app/design-system/showcase.tsx` (`useTicking`) | Preço oscilando para demonstrar flash | Showcase apenas |

Regra para as telas novas (`/`, `/scanner`, `/relatorio`): **nenhum** desses módulos pode ser importado; um teste automatizado verificará a ausência de `Math.random`/`generateSeries`/`CL_DATA` no código das telas e da API.

## 6. Screenshots de referência

`docs/screenshots/baseline/` — capturados do build de produção antes de qualquer alteração (Chrome headless):

- `home-{1440x900,1366x768,390x844}.png` — página padrão do Next.
- `design-system-{…}.png` — showcase.
- `terminal-template-{…}.png` — template do terminal (referência visual principal das telas do produto).

Observação: em `390x844` o template corta horizontalmente (container com `min-width: 1280px`). As telas reais precisarão de um layout empilhado em mobile.

## 7. Riscos

1. **Lightweight Charts não renderiza CSS vars** — cores precisam ser resolvidas via `getComputedStyle` e reaplicadas ao trocar tema.
2. **Fontes do `next/font`** têm nomes gerados; o gráfico deve ler `--font-mono` computado.
3. **Template com `min-width: 1280`** — layout real precisa de breakpoint.
4. **`cacheComponents`** do Next 16: telas devem ser client-side para dados live (sem `Date`/`Math.random` no prerender).
5. Divergência `--topbar-h` (52) × template (60) — registrada, sem mudança de token.
6. Componentes analíticos com aparência de "IA" (SignalCard com confiança, SentimentGauge, DistributionCurve) induzem leitura de probabilidade — uso restrito conforme tabela §4.

## 8. Proposta mínima de integração (seguida nas etapas 1–4)

1. Next continua na raiz; npm workspaces `services/*` e `packages/*`.
2. `packages/contracts` (Zod + tipos canônicos) consumido pela API e pelo front.
3. `services/api` Fastify independente (porta 4000) é a única ponte com a Binance.
4. Novo componente `design-system/components/charts/MarketChart.tsx` (Lightweight Charts) com tokens Claritas; `CandleChart` original intocado.
5. Telas do produto em `app/(terminal)/` reutilizando componentes do design system; shell visual (topbar, rail, fita) fiel ao template.
6. Valores sem metodologia ficam **indisponíveis** com explicação, nunca simulados.
