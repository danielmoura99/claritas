# CLARITAS TERMINAL — Plano mestre de implementação e continuidade

> **Documento operacional para humanos e agentes de IA.** Deve ser suficiente para retomar o projeto em outra conversa, outro agente ou após perda integral do contexto.
>
> **Versão do plano:** 1.0  
> **Data de referência:** 14/10/2026  
> **Status de implementação:** **NÃO INICIADA por este plano** — as etapas abaixo são tarefas, não entregas concluídas.  
> **Ponto de partida informado pelo responsável:** Next.js já instalado **na pasta raiz**; design system do Claritas já organizado **na pasta raiz**. A estrutura real desses arquivos ainda precisa ser auditada no repositório local.  
> **Arquivo que deve permanecer na raiz:** `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md`.

---

## 0. LEIA PRIMEIRO — instruções inegociáveis ao agente executor

1. **ANTES DE INSTALAR, MOVER, APAGAR OU REESCREVER QUALQUER ARQUIVO:** inspecione a pasta raiz, a configuração Next existente e **todo o design system já fornecido**. Identifique tokens, fontes, componentes, arquivos de exemplo, páginas existentes e recursos visuais. Faça um inventário documentado; mostre o plano de reaproveitamento. **Não monte uma interface alternativa.**
2. **Não rode `create-next-app` novamente** e não sobrescreva `app/`, `src/`, `public/`, estilos globais, configurações ou componentes existentes. O Next.js já está instalado na raiz. Se algo divergir deste documento, prevalecem **os arquivos reais do repositório** para detalhes de implementação, enquanto as decisões de arquitetura deste plano continuam válidas até serem formalmente alteradas.
3. O protótipo HTML fornecido anteriormente serve como **referência visual e inventário auxiliar**, **não como fonte automaticamente idêntica ao repositório local**. Não assuma que os caminhos do HTML compilado correspondam aos caminhos que existem na raiz.
4. **Não criar simulador, feed falso ou `Math.random()` na aplicação.** O desenvolvimento deve começar com **dados reais públicos da Binance Spot**. Falsificações de API/fixtures são permitidas **apenas em testes automatizados**, claramente identificadas.
5. **Backend Node.js independente**, em TypeScript, com **Fastify**, além do **frontend Next.js existente**. Não construir o backend principal dentro de Route Handlers do Next. O frontend deve falar com a API Claritas, não com a Binance diretamente.
6. Implementar primeiro **um fluxo vertical real e verificável**: `BTCUSDT` → Binance REST histórico → backend normalizador → Claritas API → gráfico preservando design system → Binance WebSocket → candles atualizados em tempo real.
7. Não apresentar como cálculo real qualquer item do protótipo que ainda seja puramente demonstrativo: **viés de mercado, confiança, sinais, leitura por IA, previsão, probabilidade, fluxo institucional, scanner e relatório**. Substituir por lógica documentada derivada de dados reais ou marcar indisponível/"em construção" até implementar.
8. Preservar as **três telas do produto**: **Pregão ao Vivo**, **Scanner** e **Relatório de Fechamento**. Não ampliar escopo com execução de ordens, carteira, corretora ou autenticação obrigatória na primeira entrega.
9. Ao terminar cada etapa, executar testes, registrar o que mudou e atualizar as seções **14 (Estado da execução)** e **15 (Handoff para a próxima LLM)**. **Nunca declarar concluído sem evidência.**
10. **Não antecipar reestruturações.** Projeto pequeno, inicialmente sem microsserviços, Redis, filas, Kubernetes, IA externa ou Three.js obrigatório. Acrescentar bibliotecas apenas para necessidades reais.

### Critério geral de sucesso

O usuário abre o Claritas com o **visual original reconhecível**, seleciona `BTCUSDT`, visualiza candles históricos reais da Binance e vê a última barra atualizar por WebSocket; mudanças de ativo/timeframe funcionam; não há números inventados apresentados como cotações ou análises reais. A arquitetura permite substituir a Binance por outro provedor sem alterar componentes visuais.

---

## 1. Contexto do produto e decisões já tomadas

### 1.1 Objetivo

**Claritas Terminal** é uma plataforma web de análise gráfica de mercados financeiros, moderna, minimalista e premium. No longo prazo receberá dados de múltiplos provedores, realizará análises e exibirá interpretações diretamente no ambiente do gráfico. A primeira integração será a **Binance Spot pública**, com foco em validação técnica da aquisição e visualização de dados **reais**, começando por criptoativos.

A plataforma deve preservar o design proprietário apresentado no protótipo `Claritas Terminal.html`, **não** retornar às primeiras versões genéricas e saturadas de verde, roxo, vermelho e neon. A experiência desejada é um **terminal analítico minimalista** com animações discretas e funcionais.

### 1.2 Decisões fechadas

| Tema | Decisão | Observação |
|---|---|---|
| Frontend | **Next.js + TypeScript** na raiz existente | Preservar App Router/configuração presente; não reinstalar Next |
| Backend | **Node.js + TypeScript + Fastify** | Processo independente em `services/api/` |
| Banco | **PostgreSQL + Prisma ORM** | Introduzir quando houver persistência concreta; não bloquear primeira cotação real |
| Gráfico principal | **TradingView Lightweight Charts** | Integrar ao contêiner/tema do componente Claritas existente; não confundir com widget hospedado TradingView |
| Estilo | **Design system Claritas existente** + integração com Tailwind se já presente | Tokens originais são a fonte de verdade |
| Componentes | Reutilizar componentes Claritas | shadcn/ui e Radix apenas pontualmente, sem substituição visual |
| Animação | Motion, CSS e recursos já existentes | Efeitos discretos e ligados a eventos de dados |
| Estado cliente | Zustand **se necessário** | Evitar estado global para tudo |
| Validação | Zod | API externa, rotas e configuração |
| Testes | Vitest + Playwright | Unidade, integração, visual e fluxos ponta a ponta |
| Primeiro provedor | **Binance Spot Market Data** | REST + WebSocket públicos, sem API key para dados públicos |
| Primeiro ativo | `BTCUSDT` | Depois `ETHUSDT` e `SOLUSDT` |
| Primeiro timeframe | `1m` ou `5m` após verificação do protótipo | Em seguida `15m`, `1h`, `4h`, `1d` |
| Produto inicial | **Somente dados e análise visual** | Sem envio de ordens reais |
| Deploy | Frontend e API em serviços distintos | API precisa suportar processo WebSocket persistente |

**Pendente de inspeção local:** versão instalada do Next/React/Node, package manager, layout dos arquivos, implementação efetiva do design system, dependências já presentes, banco disponível e ambientes de deploy. Não "corrigir" essas lacunas adivinhando.

---

## 2. Design system original — contrato visual e auditoria obrigatória

### 2.1 O que foi verificado no HTML de referência

Uma inspeção do **arquivo HTML exportado** identificou uma biblioteca Claritas com tokens e componentes próprios. Esta é uma **referência corroborada pelo HTML**, mas a LLM executora **deve conferir o design system do repositório raiz** e documentar quaisquer divergências.

**Vocabulário visual encontrado:**

- Interface em preto/carvão/cinzas quentes; aparência calma, densa na medida de um terminal e sem grandes gradientes decorativos.
- A cor **sand/dourado-bege** identifica o **resultado da análise Claritas** e estados de ênfase, **não é a cor universal de alta do mercado**.
- **Alta:** branco-osso/tons neutros. **Baixa:** cinza/granito nos candles e terracota discreta para indicadores negativos. **Evitar substituir por verde/vermelho saturados.**
- Tipografia: **Geist** (interface), **Geist Mono** (números/labels) e **Instrument Serif** (linguagem editorial/insights).
- Linhas, bordas finas e realce superior discreto; glow reservado para **eventos vivos** (novo sinal, beam analítico, preço atualizado).
- Layout visual baseado em barra superior, faixa de cotações, trilho lateral, área gráfica, inspetor de análise e módulos inferiores.

**Tokens exemplificativos observados no HTML:**

| Semântica | Token / valor observado | Uso |
|---|---|---|
| Background principal | `--ink-950: #0A0A0A` | Base da plataforma |
| Superfície do painel | `--surface-panel: #0F0F0F` | Contêiner principal |
| Superfície elevada | `--ink-850: #151515` | Painéis/hover |
| Branco de texto | `--ink-100: #EDECE9` | Texto principal |
| Texto secundário | `--ink-300: #ADABA6` | Subtítulos |
| Texto terciário | `--ink-400: #86847F` | Metadados |
| Acento Claritas | `--sand-400: #C8B28E` | Análise, CTA, destaque contextual |
| Próximo tom de acento | `--sand-300: #D9C9AE` | Hover/realce |
| Movimento de alta | `--up-500: #DED8CC` | Mercado (bone) |
| Movimento de baixa | `--down-500: #C47A66` | Informação negativa (clay) |
| Grade de gráfico | `--chart-grid: rgba(255,255,255,.04)` | Fundo técnico sutil |
| Média rápida | `--chart-ma-fast: var(--sand-400)` | Linha indicadora |
| Média lenta | `--chart-ma-slow: var(--ink-400)` | Linha secundária |
| Borda padrão | `--border-default: rgba(255,255,255,.09)` | Separação |
| Espaçamento | `--space-1` até `--space-12` | Escala original: 2–72px |
| Raios | `--radius-xs` a `--radius-xl` | Escala original: 2–14px |
| Barra superior | `--topbar-h: 52px` | Referência de layout |
| Trilho lateral | `--rail-w: 56px` | Referência de layout |
| Painel inspetor | `--inspector-w: 360px` | Referência de layout |

**Observação:** esses valores são extraídos da referência HTML recebida, não uma ordem para sobrescrever os valores de arquivos da raiz. **Verificar e adotar os tokens da raiz como canônicos.**

**Componentes localizados no manifesto do HTML exportado** (verificar caminhos reais da raiz):

- `components/core/`: `Panel`, `Button`, `Badge`, `Icon`, `IconButton`, `Tooltip`, `Wordmark`.
- `components/navigation/`: `Tabs`, `SegmentedControl`.
- `components/forms/`: `Input`, `Select`, `Checkbox`, `Switch`.
- `components/feedback/`: `Dialog`, `Toast`, `LiveIndicator`.
- `components/market/`: `Delta`, `PriceTicker`, `TickerTape`, `WatchRow`.
- `components/charts/`: `CandleChart`, `Sparkline`, `FlowArea`, `ProbabilityField`, `DistributionCurve`.
- `components/analysis/`: `ConfidenceMeter`, `SentimentGauge`, `MetricRow`, `SignalCard`.
- Páginas/exemplos do kit exportado: `ui_kits/terminal/` contendo referências a `App`, `Chrome`, `Desk`, `Scanner`, `Report`, `Watchlist` e `data.js`.

Os nomes acima vieram do **manifesto do export HTML**; não afirmam que esses arquivos estão efetivamente disponíveis nesses mesmos caminhos no projeto local.

### 2.2 ETAPA ZERO — inventário na raiz ANTES de codificar

**Checklist (bloqueante):**

- [ ] Confirmar diretório atual e branch Git; executar `git status` sem alterar arquivos.
- [ ] Listar árvore do projeto excluindo `node_modules`, `.next`, `dist`, cache e builds. Localizar `package.json`, lockfile, `app/` ou `src/app/`, `public/`, estilos e componentes do design system.
- [ ] Ler `package.json`, `tsconfig.json`, `next.config.*`, `postcss.config.*`, `tailwind.config.*` (se existir), `app/globals.css` (ou equivalente), layouts e páginas.
- [ ] Ler documentação e exemplos do design system, inclusive tokens, fontes, estados, variantes e responsividade; identificar se há componentes `.jsx`, `.tsx`, CSS Modules ou CSS puro.
- [ ] Registrar componentes reaproveitáveis e quais usam APIs incompatíveis com SSR, manipulação de DOM, SVG, Canvas ou bibliotecas externas.
- [ ] Confirmar disponibilidade e licenças das fontes já presentes no projeto; **não buscar novas fontes para trocar a identidade visual**.
- [ ] Executar o Next do estado original e capturar screenshots da interface atual em `1440x900`, `1366x768` e `390x844` (quando aplicável). Se não funcionar, registrar erro antes de corrigir.
- [ ] Mapear a origem de cada `Math.random()`, mock, intervalo artificial, dados estáticos e valor demonstrativo. **Não remover cegamente**: identificar quais componentes precisam de dados reais e quais são só demonstrações.
- [ ] Criar `docs/DESIGN_SYSTEM_AUDIT.md` com **caminhos reais**, inventário, tokens, screenshots, riscos, proposta de migração e lista de reutilização.
- [ ] Implementar uma tela/rota temporária de catálogo de componentes, **se ajudar na verificação**, mas sem deixar exemplos confusos em produção.
- [ ] Mostrar um resumo do inventário e uma proposta mínima de integração antes de mexer na estrutura.

**Critério de aceite da etapa zero:** há documento auditável, screenshots de referência e uma tabela explícita de **componente original → uso futuro → alteração necessária**, sem nenhuma modificação destrutiva no design system.

### 2.3 Regras de preservação durante a implementação

1. **Não substituir o tema original pelo tema padrão do shadcn/UI.** Se shadcn for necessário, adaptar seus tokens ao Claritas e preferir componentes existentes.
2. Não renomear/remover tokens sem plano de compatibilidade. Usar variáveis CSS originais, inclusive no Lightweight Charts.
3. Não converter a cor do candle de alta para verde por hábito. Respeitar a gramática Claritas: **bone (alta), graphite (baixa), clay (negativo), sand (insight)**; confirmar nomenclatura e uso real no código.
4. `CandleChart` existente é uma **referência de componente e estilo**. Poderá virar um **wrapper/contêiner com Lightweight Charts** caso o gráfico atual seja ilustrativo, mas **preservar cabeçalho, controles, grid, margens e recursos visuais identificáveis**.
5. A animação não pode atrapalhar leitura de preços. Usar `prefers-reduced-motion`, pausar efeitos quando aba estiver oculta e não executar WebGL pesado sem justificativa.
6. Não alterar toda a estrutura de navegação para atender à primeira integração. O frontend deve manter a identidade das telas originais.
7. Tratar responsividade explicitamente: desktop é prioridade; em viewport pequena, barras laterais devem poder recolher ou se reorganizar **sem cortar informações críticas**.
8. Fazer comparação visual antes/depois e documentar cada diferença relevante.

---

## 3. Arquitetura-alvo (preservando Next instalado na raiz)

```text
claritas/                              # RAIZ EXISTENTE — Next.js JÁ INSTALADO
├── app/                               # ou src/app/; MANTER a convenção atual
│   ├── layout.tsx
│   ├── page.tsx                       # Pregão ao Vivo, se rota raiz já for essa
│   ├── scanner/ ...                   # adaptar sem quebrar rotas existentes
│   └── relatorio/ ...
├── components/                        # design system e componentes já existentes
├── styles/                            # tokens já existentes, se houver
├── public/                            # ativos locais já existentes
├── lib/
│   ├── api/                           # cliente tipado Claritas API
│   └── market/                        # adaptadores de dados para gráficos
├── services/
│   └── api/                           # NOVO pacote Node.js + Fastify
│       ├── src/
│       │   ├── app.ts                 # construção do servidor
│       │   ├── server.ts              # bootstrap / lifecycle
│       │   ├── config/
│       │   ├── providers/
│       │   │   ├── market-data-provider.ts
│       │   │   └── binance/
│       │   ├── modules/
│       │   │   ├── market/            # REST quotes/candles/assets
│       │   │   ├── streaming/         # WebSocket/SSE para frontend
│       │   │   └── analysis/          # indicadores reais (fase posterior)
│       │   ├── infrastructure/        # reconexão, cache, logs, DB
│       │   └── tests/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── contracts/                     # tipos e schemas Zod compartilhados
│       ├── src/
│       └── package.json
├── prisma/                             # só quando persistência for implementada;
│                                       # preferir propriedade única pela API
├── docs/
│   ├── DESIGN_SYSTEM_AUDIT.md         # produz na etapa 0
│   ├── API_CONTRACT.md
│   ├── DATA_PROVIDER_BINANCE.md
│   ├── DECISIONS.md
│   └── screenshots/
├── .env.example
├── package.json                       # EXISTENTE; configurar workspaces com cautela
├── [lockfile existente]
└── PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md
```

**Importante:** a árvore é uma proposta. **Não mover o Next.js para `apps/web` neste momento.** Se a raiz já usar `src/`, seguir `src/`. Colocar Prisma em `services/api/prisma` em vez da raiz também é válido, desde que apenas a API seja dona das migrações. **Registrar a localização decidida.**

### 3.1 Fluxos principais

```text
HISTÓRICO
Binance REST /api/v3/klines
       ↓
BinanceProvider → Zod/normalização UTC → MarketDataService
       ↓
Claritas API GET /api/market/candles
       ↓
Cliente Next → wrapper do gráfico Claritas → Lightweight Charts

TEMPO REAL
Binance WSS <symbol>@kline_<interval>
       ↓
BinanceStreamManager (1 conexão upstream compartilhada quando possível)
       ↓
upsert candle + controle de x=fechado + estado de conexão
       ↓
Claritas WS (ou SSE, se apropriado)
       ↓
Cliente Next → atualização incremental do último candle
```

- **API Node controla acesso, normalização, cache, reconexão e rate limits.**
- Frontend usa **somente contratos Claritas**, mesmo que o backend passe a utilizar outro fornecedor.
- Não abrir uma conexão Binance por usuário se a API puder compartilhar subscriptions upstream.
- Histórico inicia a série; streaming altera a barra corrente e abre uma nova barra quando o horário avança.
- Na reconexão, buscar candles recentes via REST para evitar buracos antes de retomar streaming.
- Contabilizar origem, disponibilidade, última atualização e eventuais atrasos.

---

## 4. Contratos de domínio e de API

### 4.1 Modelos canônicos (ponto de partida)

```ts
export type Interval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type MarketStatus = 'connecting' | 'live' | 'stale' | 'reconnecting' | 'offline';

export interface MarketAsset {
  id: string;                 // exemplo: 'BINANCE_SPOT:BTCUSDT'
  provider: 'binance_spot';
  symbol: string;             // 'BTCUSDT'
  baseAsset: string;          // 'BTC'
  quoteAsset: string;         // 'USDT'
  displayName: string;
  tickSize?: string;         // string decimal para preservar precisão
  status: 'TRADING' | 'HALTED' | 'UNKNOWN';
}

export interface Candle {
  symbol: string;
  interval: Interval;
  openTimeMs: number;         // UTC Unix epoch ms; chave de candle
  closeTimeMs: number;        // UTC Unix epoch ms
  open: string;               // DECIMAL, sem perda no contrato
  high: string;
  low: string;
  close: string;
  volumeBase: string;        // volume em BTC, ETH etc.
  volumeQuote?: string;      // volume em USDT etc.
  isClosed: boolean;
  provider: 'binance_spot';
}

export interface MarketEnvelope<T> {
  data: T;
  source: 'binance_spot';
  receivedAt: string;        // ISO8601
  asOf: string;              // tempo do evento, ISO8601
  status: MarketStatus;
}
```

**Regras obrigatórias:**

- **Separar identidade interna de símbolo externo**: `BINANCE_SPOT:BTCUSDT` não deve ser confundido com `BTCUSDT` de futuros ou qualquer B3.
- Internamente, manter preços e quantidades em string decimal ou biblioteca decimal onde precisão importar; converter para `number` **somente na borda da visualização** (Lightweight Charts), com validação. Não usar `toFixed()` para alterar dados-fonte.
- Ordenar candles por `openTimeMs`, sem duplicidade; unicidade lógica `(provider, symbol, interval, openTimeMs)`.
- UTC internamente; exibir fuso definido pela interface (ex.: `America/Sao_Paulo`) sem deslocar timestamps dos dados.
- Diferenciar candle aberto (`isClosed=false`) de candle fechado (`isClosed=true`). A leitura de indicadores deve indicar se inclui candle em formação.
- Não calcular retorno percentual sem explicitar a janela (ex.: variação 24h vs variação da sessão/timeframe).
- O contrato acima é **proposto**, deve ser efetivamente implementado e versionado em `packages/contracts`, com Zod e testes.

### 4.2 Endpoints mínimos sugeridos

| Método | Caminho | Objetivo |
|---|---|---|
| `GET` | `/health` | Liveness da API |
| `GET` | `/ready` | Readiness / conectividade interna, sem depender de mercado perfeito |
| `GET` | `/api/v1/market/assets?search=BTC` | Busca e metadados de símbolos suportados |
| `GET` | `/api/v1/market/quote?symbol=BTCUSDT` | Última cotação pública / snapshot |
| `GET` | `/api/v1/market/candles?symbol=BTCUSDT&interval=5m&limit=500` | Histórico real OHLCV |
| `GET` | `/api/v1/market/status?symbol=BTCUSDT` | Saúde do feed, última atualização e fonte |
| `WS` | `/api/v1/market/stream` | Canal de atualização de candle/quote/status |

**Versionar desde o início (`/api/v1`).** Escolher definitivamente esquema das mensagens WS antes de integrar o gráfico e registrar em `docs/API_CONTRACT.md`. Exemplo **ilustrativo do contrato interno** (não é payload Binance):

```json
{
  "type": "candle.upsert",
  "data": {
    "symbol": "BTCUSDT",
    "interval": "5m",
    "openTimeMs": 1760486400000,
    "closeTimeMs": 1760486699999,
    "open": "67000.00",
    "high": "67050.00",
    "low": "66980.00",
    "close": "67020.00",
    "volumeBase": "15.124",
    "isClosed": false,
    "provider": "binance_spot"
  },
  "source": "binance_spot",
  "receivedAt": "2025-10-14T00:00:00.000Z"
}
```

> **ATENÇÃO:** valores e datas do JSON acima são **somente exemplo de formato**. Não usar como dados de interface ou testes de integração live; fixtures de teste devem morar exclusivamente em diretórios de testes.

O frontend nunca deve precisar interpretar `k.t`, `k.o`, `k.c` ou outros campos específicos da Binance.

---

## 5. Primeira fonte real: Binance Spot

### 5.1 Endpoints oficiais escolhidos

**Market data público sem autenticação:**

```text
REST base:  https://data-api.binance.vision
WSS base:   wss://data-stream.binance.vision:443

GET /api/v3/ping
GET /api/v3/time
GET /api/v3/exchangeInfo?symbol=BTCUSDT
GET /api/v3/klines?symbol=BTCUSDT&interval=5m&limit=500
GET /api/v3/ticker/24hr?symbol=BTCUSDT

WSS stream: /ws/btcusdt@kline_5m
```

O endpoint de `klines` Spot permite até **1.000 candles por chamada** na documentação consultada, com parâmetros `startTime`/`endTime` para paginação, conforme necessidades reais. O feed WS kline contém `k.t` (abertura), `k.T` (fechamento), `k.o/h/l/c/v/q` e `k.x` (**barra fechada?**). O backend deve tratar `x=false` como atualização da barra corrente e `x=true` como fechamento. Ver documentação oficial antes de codificar.

**Fonte oficial:**
- https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md
- https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md
- https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md

### 5.2 Política de integração, robustez e limites

- [ ] Verificar no ambiente de desenvolvimento se os domínios acima respondem (geobloqueio, rede corporativa e políticas do provedor podem impedir acesso). **Se bloqueados, reportar e propor alternativa; jamais substituir silenciosamente por dados fictícios.**
- [ ] Testar `exchangeInfo`: só permitir símbolos válidos Spot com status apropriado.
- [ ] Normalizar o padrão de símbolos (`BTCUSDT`), pares e limites de precisão; descartar entradas inválidas.
- [ ] Tratar erros 4xx, 429, 418, 5xx, timeouts e headers relevantes de rate limit. Respeitar `Retry-After` se fornecido; aplicar backoff exponencial com jitter.
- [ ] Tratar reconexões WS, ping/pong, fechamento normal, perda de rede e encerramento periódico da conexão. A documentação Binance prevê limite de duração da conexão e restrições de mensagens; atualizar números antes de implementar.
- [ ] Limitar e deduplicar subscriptions por ativo/intervalo; remover assinatura upstream quando não houver consumidores, respeitando período de retenção para evitar churn.
- [ ] Não criar novo socket upstream por cliente do frontend.
- [ ] Controlar **staleness**: feed sem eventos além do limite configurável muda o status para `stale`/`reconnecting` e atualiza a interface.
- [ ] A reconexão deve chamar REST para confirmar as últimas barras, deduplicar por `openTimeMs` e só depois voltar para `live`.
- [ ] Registrar `eventTime`, `receivedAt` e latência observada; não prometer latência de milissegundos sem medição.
- [ ] Não interpretar candles/ticker como evidência de **fluxo institucional, sentimento, order flow completo, liquidez profunda ou probabilidades de IA**. Essas métricas exigem dados/métodos adicionais, que ficam fora do primeiro incremento.
- [ ] Documentar disponibilidade, custos, limites, termos de uso e eventuais restrições de redistribuição antes de lançamento público/comercial.

### 5.3 Estratégia de carregamento inicial e tempo real

1. Usuário entra no Pregão ao Vivo com `BTCUSDT/5m`.
2. Frontend chama `/api/v1/market/candles` e recebe OHLCV históricos reais em ordem crescente.
3. Adaptador do chart converte decimal para número apenas para renderização e `openTimeMs` para timestamp no formato esperado pela biblioteca.
4. Frontend abre/assina o canal Claritas para `BTCUSDT/5m` e recebe o último snapshot/upsert.
5. Para cada kline recebida do fornecedor, atualizar o candle corrente pela sua chave temporal; não fazer `setData()` integral a cada tick.
6. Ao mudar ativo/timeframe, cancelar assinatura anterior, limpar estado de ativos incompatíveis, buscar histórico novo e assinar o novo canal.
7. Se houver gap temporal ou reconexão, disparar backfill paginado e reconciliar.
8. Mostrar **origem dos dados**, **status do feed** e **horário da última atualização**.

---

## 6. Instalação e estruturação — passos executáveis

> Os comandos abaixo são **pontos de partida**, não devem ser executados às cegas. Descobrir o gerenciador de pacotes existente e suas versões no **passo 0**. Exemplos usam npm; preservar lockfile/gerenciador do projeto se for pnpm ou yarn.

### 6.1 Preparação (após a auditoria)

```bash
# Na raiz do repositório local:
node --version
npm --version
npm pkg get scripts dependencies devDependencies
npm run dev
```

- [ ] Confirmar que o Next atual funciona, documentar comandos reais e resultado do baseline.
- [ ] Preferir Node.js **LTS suportado por todas as dependências efetivamente escolhidas** (por exemplo, Node 24 caso haja compatibilidade). Registrar `engines` em `package.json` e `.nvmrc` ou equivalente.
- [ ] Criar commit de checkpoint: `chore: baseline claritas design system` (somente quando o repositório estiver limpo e revisado).
- [ ] Criar `services/api` e `packages/contracts` sem mover Next.
- [ ] Adicionar npm workspaces na raiz **sem perder scripts/dependências existentes**: `services/*` e `packages/*`. Verificar links/resolução de imports e lockfile.
- [ ] Estabelecer scripts na raiz, mantendo os originais: `dev:web`, `dev:api`, `dev` conjunto, `build`, `typecheck`, `lint`, `test` e `test:e2e`. Só inserir implementações testadas.

### 6.2 Dependências — instalar quando a etapa exigir

**Backend:** `fastify`, `@fastify/cors`, `@fastify/websocket` (se escolher WS Claritas), `zod`, `ws` ou equivalente compatível para **cliente** WSS da Binance, `dotenv`/`env-safe` conforme necessidade, logger Pino integrado ao Fastify, `tsx` para execução de dev, TypeScript e Vitest.

**Frontend:** `lightweight-charts`, `motion` (se não houver solução existente), `zustand` (se estado compartilhado for necessário); priorizar o design system e dependências já presentes. **Não instalar Recharts, Three.js, shadcn/UI ou dezenas de bibliotecas sem necessidade concreta.**

**Persistência posterior:** `prisma`, `@prisma/client`, PostgreSQL driver/adapter **compatível com a versão escolhida**, e configuração de migrations. As APIs de Prisma podem variar entre majors; seguir documentação vigente e **registrar as versões reais**.

**Testes:** `vitest`, `@playwright/test`, utilitários de integração HTTP/WS e testes com clock/fixtures determinísticas.

### 6.3 Configuração de ambiente

Criar `.env.example`, sem segredos. Variáveis sugeridas:

```dotenv
# Frontend Next.js — somente a URL de API acessível ao navegador.
NEXT_PUBLIC_CLARITAS_API_URL=http://localhost:4000
NEXT_PUBLIC_CLARITAS_WS_URL=ws://localhost:4000/api/v1/market/stream

# Backend Node/Fastify
API_HOST=127.0.0.1
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
MARKET_DATA_PROVIDER=binance_spot
BINANCE_SPOT_REST_URL=https://data-api.binance.vision
BINANCE_SPOT_WS_URL=wss://data-stream.binance.vision:443
MARKET_DEFAULT_SYMBOL=BTCUSDT
MARKET_DEFAULT_INTERVAL=5m

# Persistência — opcional até etapa do banco
DATABASE_URL=postgresql://claritas:change_me@localhost:5432/claritas
```

- [ ] `.env`, `.env.local`, tokens, chaves e senhas fora de Git; versionar apenas `.env.example`.
- [ ] **Sem necessidade de chave Binance** para os endpoints de mercado Spot públicos previstos no MVP.
- [ ] Apenas variáveis `NEXT_PUBLIC_` podem ir ao navegador; nunca expor segredos no cliente.
- [ ] URLs e regras CORS variam por ambiente; evitar `*` em produção.

---

## 7. Cronograma de execução por etapas e critérios de aceite

**Regra:** avançar para a próxima etapa somente após os critérios da etapa atual passarem. Em cada etapa, atualizar a tabela de progresso da seção 14.

### ETAPA 0 — Auditoria do design system e baseline (BLOQUEANTE)

**Atividades:** executar integralmente seção 2.2; mapear estilos e componentes reais, testar a versão visual original, validar fontes, identificar mocks e registrar diferenças. Não implementar nova interface antes de concluir.

**Entregáveis:** `docs/DESIGN_SYSTEM_AUDIT.md`, screenshots originais, inventário de componentes, mapa do gráfico antigo → wrapper de gráfico real.

**Aceite:** outro desenvolvedor consegue dizer quais arquivos são canônicos e como evitar regressões visuais. **Sem mudanças visuais não solicitadas.**

### ETAPA 1 — Organização técnica sem quebrar Next

**Atividades:** configurar workspaces (se adequado), `services/api`, `packages/contracts`, TypeScript, lint e scripts; deixar `/health` operacional; manter Next na raiz e telas visuais existentes.

**Entregáveis:** `services/api` inicial, contratos compartilháveis, `GET /health`, scripts `dev:web`/`dev:api`, `.env.example`.

**Aceite:** frontend original continua abrindo; `GET http://localhost:4000/health` responde; build/typecheck passa em ambos; screenshots do design preservados.

### ETAPA 2 — Binance REST histórico com dados REAIS

**Atividades:** implementar `BinanceSpotProvider`, `getAssets`, `getQuote`, `getCandles`; normalizar timestamps/decimais/símbolos; Zod e errors; implementar rotas `/api/v1/market/*` e cache curto de histórico quando apropriado.

**Entregáveis:** APIs reais e testes de normalização com fixtures separadas do produto.

**Aceite mínimo:**

- `BTCUSDT/5m` responde candles reais do endpoint Spot público (ou um erro explícito de indisponibilidade sem dados falsos).
- Campos `O/H/L/C/V` consistentes e ordenados por data, com `low <= min(open,close) <= max(open,close) <= high`.
- Limites, símbolo inválido, fornecedor indisponível e timeout retornam erros padronizados.
- Testes garantem formato, UTC, deduplicação, precisão decimal e ausência de mock no runtime de produção.

### ETAPA 3 — Streaming real, robusto e compartilhado

**Atividades:** conectar backend à Binance WSS `btcusdt@kline_5m`, implementar subscriptions e broadcasts Claritas, reconexão/backfill, status `live/stale/offline`.

**Entregáveis:** WS Claritas, protocolo de mensagens documentado, status observável, testes de reconexão.

**Aceite mínimo:**

- Frontend de teste recebe `candle.upsert` com dados efetivamente recebidos do WSS.
- `isClosed=false` atualiza barra corrente; `isClosed=true` fecha a barra.
- Múltiplos clientes no mesmo ativo/timeframe compartilham upstream.
- Ao derrubar/religar a conexão, app se recupera e reconcilia candles com REST.
- Nunca exibir "Ao vivo" quando feed estiver stale/offline.

### ETAPA 4 — Integração visual sem redesign

**Atividades:** integrar o gráfico real ao container de chart existente; preservar tokens, ícones, layout, controles e tipografia. Implementar adaptador Lightweight Charts, candle + volume, crosshair, resize responsivo, timeframes e seletor de ativo. Usar `setData()` no carregamento e `update()` nos eventos incrementais.

**Entregáveis:** tela **Pregão ao Vivo** conectada à Claritas API, com BTCUSDT real.

**Aceite mínimo:**

- A comparação antes/depois mantém identidade original (cores, fontes, spacing, rail, análise, módulos e grid).
- Candles/volume/escala são legíveis; não existe plot decorativo sobrepondo preço de forma ilegível.
- Layout funciona em desktop `1440x900` e `1366x768`; mobile não corta informação crítica (pode simplificar/recolher painéis).
- O usuário alterna timeframe e ativo suportado sem misturar séries.
- Valores de preço e variação são reais e exibem unidade/moeda correta (`BTCUSDT` cotado em USDT, não em BRL).
- Painel de análise fictício antigo é **explicitamente desativado/sinalizado** até que regras reais existam.

### ETAPA 5 — Primeiro motor analítico real e explicável (sem IA obrigatória)

**Atividades:** implementar análises determinísticas sobre candles reais, começando por **SMA/EMA**, variação, volatilidade simples e níveis **claramente definidos**. Usar candles fechados para análise padrão; documentar fórmulas, quantidade mínima de barras e janela.

**Entregáveis:** `services/api/src/modules/analysis`, contrato `GET /api/v1/analysis?symbol=BTCUSDT&interval=5m`, painel Claritas que explica os valores reais.

**Aceite mínimo:**

- Cada resultado tem **nome do algoritmo, fórmula/parâmetros, timeframe, timestamp, inputs necessários e evidência exibível**.
- Sem probabilidades como "73% de acerto" sem método calibrado e validado.
- "Viés comprador/vendedor" só aparece quando regra estiver implementada; caso contrário, `indisponível`.
- Mudança de timeframe atualiza análise e elimina estado obsoleto.
- Efeitos visuais sobrepõem o gráfico apenas quando o evento/regra que os gerou existir.

### ETAPA 6 — Scanner com dados reais

**Atividades:** aproveitar a tela Scanner original; listar ativos Binance válidos, filtrar por métricas simples verificáveis (variação 24h, volume, volatilidade, EMA etc.) dentro dos limites do provedor; aplicar cache e controle de concorrência.

**Aceite:** resultados refletem símbolos e dados Binance reais; filtros funcionam; não há padrões fictícios apresentados como detectados; scanner não satura a API externa; user consegue abrir o ativo encontrado no gráfico.

### ETAPA 7 — Relatório de Fechamento / resumo da sessão

**Atividades:** decidir semântica para mercado cripto 24/7. **Não chamar de "fechamento de pregão B3" enquanto só houver Binance Spot.** Usar recorte configurável de 24h, UTC ou fuso desejado, e nome adequado (ex.: "Resumo do período"). Reaproveitar a interface visual de Relatório de Fechamento, adaptando textos onde necessário.

**Aceite:** OHLCV, variação e indicadores do relatório são calculados de dados históricos reais com janela explícita; nenhuma estatística sem origem/método; relatório acompanha seleção de símbolo e data.

### ETAPA 8 — Persistência com PostgreSQL/Prisma

**Atividades:** introduzir banco apenas para recursos que necessitem persistência (ex.: watchlist personalizada, preferência de timeframe/layout, configurações, anotações ou relatórios salvos). Escolher a versão estável do Prisma compatível com a versão Node; migrar schema, montar seed mínimo **não relacionado a cotações falsas**, criar repositórios na API.

**Sugestão de primeiras entidades:** `UserPreference` (se houver identificação de usuário), `Watchlist`, `WatchlistItem`, `SavedAnalysis`, `SavedLayout`; IDs de ativo independentes de fornecedor. **Não criar `User`/autenticação se ainda não houver caso de uso.**

**Aceite:** migrações reproduzíveis em banco vazio, backups/rollback planejados, testes de persistência, nenhuma credencial exposta, frontend continua desacoplado do Prisma.

### ETAPA 9 — Qualidade, deploy e observabilidade

**Atividades:** revisar segurança/CORS, testes, performance, acessibilidade, reconexão, rate limits, logs, status da API, screenshots e termos de utilização dos dados. Frontend pode usar Vercel; API persistente em VPS/Render/Fly.io ou equivalente com suporte a WSS/WS de longa duração; banco gerenciado à parte, se necessário.

**Aceite:** deploy não depende de processo servidor rodando no notebook; WSS/REST funcionam do navegador público; política de staleness visível; domínio/CORS/TLS corretos; não existe feed inventado se upstream falhar.

---

## 8. Testes obrigatórios e proteções contra regressão

### 8.1 Testes de dados

- [ ] `BTCUSDT` válido retorna metadados Spot; símbolos inválidos falham com erro controlado.
- [ ] Parser da Binance respeita UTC, intervalos case-sensitive (`1m` diferente de `1M`), volume base/quote, strings decimais e flag `x`.
- [ ] Histórico sem duplicidade e ordenado; paginação REST correta; `openTimeMs` como chave.
- [ ] WS upsert não duplica barra; abertura de nova barra não sobrescreve barra anterior.
- [ ] Reconexão backfill recupera barras perdidas e não retrocede candles já fechados.
- [ ] API externa inacessível => estado de erro/stale, **sem números aleatórios de fallback**.
- [ ] Troca rápida de ativo/timeframe ignora respostas tardias da seleção anterior (race condition).
- [ ] Uso de fuso horário coerente entre API, gráfico e relatório.
- [ ] Feed exibe `source` e horário de último evento.

### 8.2 Testes visuais e de interface

- [ ] Capturas de referência da etapa zero versionadas ou disponíveis no projeto.
- [ ] Comparações Playwright com tolerância sensata para charts dinâmicos (congelar dados **somente nos testes**).
- [ ] Desktop `1440x900`, `1366x768`, viewport mobile `390x844` e teste de zoom de navegador.
- [ ] Geist, Geist Mono e Instrument Serif carregando como no design system real.
- [ ] Paleta original preservada: sand para análise; bone/graphite/clay para mercado.
- [ ] Redução de movimento respeitada; transições sem deslocamento excessivo de layout.
- [ ] Navegação por teclado e foco visível em controles.
- [ ] Estados de loading, erro, vazio e offline são consistentes com o Claritas.

### 8.3 Testes de API e infraestrutura

- [ ] `GET /health` e `/ready` independentes, adequados a liveness/readiness.
- [ ] CORS somente origens autorizadas; validação Zod de params/query.
- [ ] Testes de limites de subscrição e rate limit; nenhum leak de conexão após navegação.
- [ ] Log estruturado com correlação de requisição; omitir segredos e payloads desnecessários.
- [ ] Teste de queda total da Binance e recuperação.
- [ ] `npm run build`, `typecheck`, `lint`, `test` e `test:e2e` (ou scripts equivalentes reais) passam.

---

## 9. Riscos e decisões que NÃO devem ser mascarados

| Risco | Mitigação |
|---|---|
| HTML demo usa preços fictícios de B3 enquanto Binance fornece Spot de cripto | Trocar a fonte de dados e identificar ativos de forma explícita; preservar o design, **não os números fictícios** |
| Kit original pode ser JSX/CSS puro e Next usar TSX/App Router | Migrar incrementalmente com wrappers tipados; nunca refazer todos os componentes de uma vez |
| Lightweight Charts não oferece todos os efeitos decorativos originais | Preservar **camada de apresentação** Claritas; custom overlay independente quando necessário; priorizar legibilidade |
| Provider Binance Spot não fornece todos os indicadores sugeridos visualmente | Desativar/ocultar funções sem fonte real ou implementar método transparente; não inferir microestrutura institucional por OHLCV |
| WSS e API podem ficar indisponíveis | Reconectar com backoff, REST backfill, exibir stale/offline e motivo |
| Vercel serverless não é servidor de WebSocket persistente | API Fastify em host que suporte processo contínuo; frontend Next pode ficar na Vercel |
| Prisma/Next mudam com atualizações | Fixar versões via lockfile e registrar versões validadas, sem copiar exemplos de major antiga |
| Dados de mercado têm condições de redistribuição | Revisar termos oficiais, política comercial e obrigações antes de publicar para terceiros |
| Design bonito pode esconder informações falsas | Proibir valores aleatórios de produção; cada número deve ter origem, timestamp e método |
| Performance com streaming e efeitos visuais | Throttle de renderização (não de processamento), subscriptions compartilhadas, uso de `update()` incremental e perf budget |

---

## 10. Convenções de desenvolvimento e decisões arquiteturais (ADR inicial)

| ID | Decisão | Justificativa | Status |
|---|---|---|---|
| ADR-001 | Next.js continua na raiz | Já instalado, evita migração desnecessária | **Aceita** |
| ADR-002 | Backend próprio Fastify em `services/api` | Independência do provedor, WS persistente, evolução posterior | **Aceita** |
| ADR-003 | Design system original é referência obrigatória | Identidade única do Claritas, evita retorno a template genérico | **Aceita** |
| ADR-004 | Binance **Spot** é primeiro provedor | Dados públicos REST/WS para integrar candles reais | **Aceita** |
| ADR-005 | Contratos canônicos com tipos/Zod separados do provedor | Troca de fornecedor sem alterações visuais | **Aceita** |
| ADR-006 | Sem simulador na aplicação | Escopo explicitamente alterado pelo responsável | **Aceita** |
| ADR-007 | PostgreSQL/Prisma para dados de produto, não feed tick-by-tick no MVP | Simplificar sem sacrificar arquitetura futura | **Aceita** |
| ADR-008 | Gráfico real via Lightweight Charts dentro do visual Claritas | Atualização incremental e bom desempenho | **Aceita; validar viabilidade visual na etapa zero** |
| ADR-009 | Seleção do deploy da API | Depende de custos, região e WS persistente | **Pendente** |
| ADR-010 | Regra exata dos indicadores e dos sinais | Não há estratégia quantitativa definida | **Pendente; não inventar** |
| ADR-011 | Estrutura física do design system no repositório | Não foi inspecionada na raiz real | **Pendente; obrigatória na etapa zero** |
| ADR-012 | Autenticação e persistência de preferências | Nenhuma obrigação inicial definida | **Adiada** |

Para mudar uma decisão aceita: abrir registro em `docs/DECISIONS.md` contendo **situação, opções, trade-off, decisão, data, arquivos afetados e estratégia de migração**. Não alterar silenciosamente.

---

## 11. Primeiro incremento (vertical slice) — ordem exata

Quando o agente receber autorização de execução, **começar pelo primeiro item não concluído**, sem pular etapas:

1. [ ] **Inspecionar a raiz e auditar design system (etapa zero).** Entregar inventário e screenshots.
2. [ ] Garantir o Next existente rodando sem regressão visual; salvar baseline.
3. [ ] Criar Fastify independente em `services/api/`; manter Next na raiz.
4. [ ] Criar `packages/contracts` e tipos básicos `Candle`, `MarketAsset`, `MarketStatus`.
5. [ ] Consumir `GET /api/v3/klines?symbol=BTCUSDT&interval=5m&limit=500` pela API Node, normalizar e expor em `/api/v1/market/candles`.
6. [ ] Mostrar no frontend um `BTCUSDT/5m` **real** dentro do contêiner de gráfico Claritas, respeitando tokens e responsividade.
7. [ ] Adicionar WSS Binance → API Claritas → `series.update()` no gráfico.
8. [ ] Testar desconexão/reconexão, troca `BTCUSDT` ↔ `ETHUSDT`, troca `5m` ↔ `15m`.
9. [ ] Desativar/sinalizar qualquer informação demonstrativa remanescente na versão integrada.
10. [ ] Registrar screenshots de comparação, testes, decisões, limitações e estado final.

**Entrega de MVP técnico somente ao concluir 1–10.** Não iniciar scanner avançado, probabilidades de IA ou persistência antes de validar o fluxo de dados real.

---

## 12. Referências técnicas oficiais (verificar atualizações)

### Binance Spot

- Public market data, hosts e autenticação: https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md
- REST Spot e `GET /api/v3/klines`: https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md
- Kline WS, flag `x`, reconexões e limites: https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
- Repositório oficial: https://github.com/binance/binance-spot-api-docs

### Frontend/backend

- Next.js App Router: https://nextjs.org/docs/app
- Next.js e `'use client'`: https://nextjs.org/docs/app/api-reference/directives/use-client
- Lazy loading de gráficos: https://nextjs.org/docs/app/guides/lazy-loading
- Fastify TypeScript: https://fastify.dev/docs/latest/Reference/TypeScript/
- Lightweight Charts — séries: https://tradingview.github.io/lightweight-charts/docs/series-types
- Lightweight Charts — atualizações: https://tradingview.github.io/lightweight-charts/docs/5.0
- Prisma + PostgreSQL: https://www.prisma.io/docs/ (confirmar major estável e compatibilidade no dia da instalação)

**As APIs, políticas e versões das dependências podem mudar.** Conferir o material oficial antes de implementar; registrar escolhas verificadas em `docs/DECISIONS.md` e no lockfile.

---

## 13. Regras para uso por LLM e critérios de resposta

O agente executor deve trabalhar **incrementalmente e com evidências**:

- A primeira ação em uma nova sessão é ler **este documento integralmente**, o inventário do design system, `docs/DECISIONS.md`, `package.json`, `git status`, e a seção **14**.
- Se algum documento citado ainda não existir, registrar como pendência; não inventar seu conteúdo.
- Relacionar cada alteração a uma etapa e a um critério de aceite.
- Informar o que foi **verificado** versus o que é **proposta**.
- Preservar dados e arquivos já existentes. Não executar comandos destrutivos, upgrades indiscriminados, formatar repositório inteiro, trocar fontes/cores por preferência estética ou sobrescrever arquivos de origem sem revisar diffs.
- Não converter `mock` em "IA", nem número calculado de janela fixa em "previsão probabilística" sem metodologia validada.
- Ao concluir tarefas, registrar comandos, resultados dos testes, screenshots, rotas funcionando, erros e pontos bloqueados.
- Sempre indicar **o próximo passo único recomendado**, com seus pré-requisitos.

### Exemplos de pedidos que devem ser recusados internamente por falta de base

- "Criar 78% de probabilidade de alta com base no visual do protótipo" → não; implementar metodologia ou deixar indisponível.
- "Continuar exibindo PETR4 real com feed Binance" → não; Binance Spot não fornece PETR4.
- "Trocar candle up/down para verde/vermelho padrão" → não; viola o design system Claritas sem decisão explícita.
- "Conectar direto do browser à Binance porque é mais rápido" → não para a arquitetura escolhida; o frontend deve falar com Claritas API.
- "Refazer o dashboard com um template shadcn" → não; o dashboard existente é a base do produto.

---

## 14. Estado da execução — ATUALIZE AO FINAL DE CADA ETAPA

> **Esta seção é a fonte de verdade de progresso.** Inicialmente tudo está **não iniciado** no novo repositório; nada foi executado dentro dele pela elaboração deste documento.

| Etapa | Status | Evidência/commit | Pendências |
|---|---|---|---|
| 0. Auditoria design system | **CONCLUÍDA** (14/10) | `docs/DESIGN_SYSTEM_AUDIT.md`, `docs/screenshots/baseline/*` (9 capturas, 3 rotas × 3 viewports), commit `3363722` | — |
| 1. Estrutura Node/Fastify + contratos | **CONCLUÍDA** (14/10) | npm workspaces `packages/*`,`services/*`; `packages/contracts` (Zod 4); `services/api` Fastify 5 com `/health` (curl 200 + `x-request-id`); `.env.example`; `npm test` 14/14, `typecheck`, `lint`, `next build` OK | — |
| 2. Binance REST | **CONCLUÍDA** (14/10) | `BinanceSpotProvider` + `MarketService`; rotas `/api/v1/market/{assets,assets/:symbol,quote,quotes,candles}` e `/ready`; curl real BTCUSDT/5m OK; erros 400/404/503/504 padronizados; testes: 43 unitários (normalização UTC/decimal/flag x, timeout, 5xx com backoff, 429/418 + Retry-After, -1121, rotas com fixtures isoladas, guarda "sem dados fictícios") + 5 integração real (`npm run test:integration`) | — |
| 3. Binance WebSocket / Claritas stream | **NÃO INICIADA** | — | Subscription, reconexão, backfill |
| 4. Chart live com identidade Claritas | **NÃO INICIADA** | — | Wrapper visual + screenshots |
| 5. Motor analítico real | **NÃO INICIADA** | — | Definir fórmulas e evidências |
| 6. Scanner real | **NÃO INICIADA** | — | Reaproveitar UI e dados Binance |
| 7. Relatório com janela explícita | **NÃO INICIADA** | — | Adaptar semântica a cripto 24/7 |
| 8. PostgreSQL/Prisma | **NÃO INICIADA** | — | Persistência apenas quando necessária |
| 9. Qualidade e deploy | **NÃO INICIADA** | — | Host persistente da API |

**Última atualização do estado:** 14/10/2026 — plano criado, nenhuma implementação neste repositório verificada.

**Bloqueador atual:** inspeção do projeto raiz e do design system real ainda não realizada.

**Próxima ação única:** **ETAPA 0 — AUDITAR O DESIGN SYSTEM EXISTENTE ANTES DE INSTALAR QUALQUER DEPENDÊNCIA OU ALTERAR O NEXT.**

### Registro incremental de trabalho (preencher a cada sessão)

```text
Data / hora / fuso:
Agente ou responsável:
Etapa ativa:
Objetivo desta sessão:
Estado Git antes:
Arquivos lidos:
Arquivos alterados:
Comandos executados:
Resultados e testes (comandos + OK/erro):
Diferenças visuais observadas:
Decisões tomadas (ADR):
Problemas/bloqueios:
Status atualizado da etapa:
Estado Git depois / commit:
Próximo passo único:
```

---

## 15. Handoff — prompt de retomada após perda de contexto

Copiar esta mensagem para a nova LLM e **anexar o repositório ou disponibilizar a pasta raiz**:

> Estamos desenvolvendo o **Claritas Terminal**, uma plataforma web de análise de mercado. O **Next.js + TypeScript já está instalado na raiz** e o **design system original Claritas já foi colocado na raiz**. Leia integralmente `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md`, especialmente seções 0, 2, 10, 11, 14 e 15; depois inspecione os arquivos reais e `git status`.
>
> Não redesenhe a interface: preservar tokens, fontes e componentes originais (Geist, Geist Mono, Instrument Serif; preto/grafite, bone/terracota e sand dourado). Não usar dados simulados em runtime. A arquitetura decidida é **frontend Next na raiz + backend próprio Node.js/TypeScript/Fastify em `services/api` + contratos compartilhados + Binance Spot pública inicialmente, via REST histórico e WSS de candles**. PostgreSQL/Prisma entra quando houver necessidade de persistência. O primeiro MVP técnico é `BTCUSDT/5m` real funcionando no gráfico Claritas, com WebSocket, troca de ativo/timeframe e estados de conexão corretos.
>
 **OBRIGATÓRIO:** antes de qualquer instalação ou código, **audite o design system na raiz**, localize os arquivos e componentes reais, preserve toda a interface existente e crie `docs/DESIGN_SYSTEM_AUDIT.md` com inventário e screenshots. Não execute `create-next-app` de novo. Leia o estado atualizado da seção 14 e prossiga **somente da primeira etapa pendente**, testando e registrando cada avanço. Não invente implementação anterior, arquivos, resultados, números de mercado ou probabilidades.
>
 Entregue primeiro o inventário do design system, riscos de migração e o plano de integração mínimo com os arquivos efetivamente encontrados. Depois execute a etapa autorizada e atualize o Markdown de progresso.

---

## 16. Definição de pronto (DoD) do primeiro MVP

O MVP técnico só está pronto quando **todos** os itens abaixo forem comprovados:

- [ ] Next existente preservado e design system auditado/reutilizado, sem redesign.
- [ ] Fastify separado executando em Node.js, acessível via API Claritas.
- [ ] Binance Spot REST retorna candles históricos reais de `BTCUSDT`.
- [ ] Binance Spot WSS atualiza o candle corrente na interface.
- [ ] UI atualiza incrementalmente sem recarregar o gráfico inteiro.
- [ ] Troca de ativo e timeframe preserva consistência, precision, fuso e subscriptions.
- [ ] Erros, desconexão e stale feed não são escondidos por valores fictícios.
- [ ] Fontes, cores, tipografia, navegação e painéis permanecem reconhecivelmente Claritas.
- [ ] Não há cálculos/"confianças" sem método apresentados como reais.
- [ ] Testes unitários, integração, E2E e screenshots relevantes passaram.
- [ ] `.env.example`, contrato de API, documentação Binance, decisões e seção 14 estão atualizados.
- [ ] Nova LLM consegue retomar lendo apenas o repositório e este plano.

---

### Nota final

**Primeiro preservamos o produto visual; depois conectamos dados reais por uma API própria.** Não é uma tarefa de criar um dashboard novo: é transformar o **Claritas existente** em um terminal com fluxo de mercado legítimo, mantendo a sua identidade visual. A sequência começa **pela inspeção do design system na raiz**, não por instalar bibliotecas.
