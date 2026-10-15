# Métodos analíticos — Claritas (Etapa 5)

Implementação: `services/api/src/modules/analysis/` (`indicators.ts` funções puras; `analysis-service.ts` montagem). Endpoint: `GET /api/v1/analysis?symbol=BTCUSDT&interval=5m[&includeOpen=true]` → `Analysis` (contrato em `packages/contracts/src/analysis.ts`).

## Princípios

1. **Determinístico e explicável:** cada saída traz algoritmo, fórmula, parâmetros, barras mínimas, unidade, barra de referência (`asOfOpenTimeMs`) e descrição.
2. **Barras fechadas por padrão.** A barra em formação muda a cada tick; regras de fechamento sobre ela piscariam. `includeOpen=true` existe, e o resultado declara `basis.includesOpenCandle`.
3. **Sem probabilidade, confiança ou previsão.** O regime descreve a configuração atual das médias; não estima chance de alta/baixa. Não há "% de acerto".
4. **Janela explícita:** últimas 500 barras do intervalo pedido (`basis.candles`, `firstOpenTimeMs`, `lastOpenTimeMs`). Mínimo de 30 barras fechadas; abaixo disso → `422 INSUFFICIENT_DATA`.
5. **Recalcula ao fechar barra:** cache por (símbolo, intervalo, última barra fechada); o frontend só pede nova análise quando muda a última barra fechada. Troca de timeframe descarta o resultado anterior.

## Indicadores

| id | Nome | Fórmula | Parâmetros | Mín. barras |
|---|---|---|---|---|
| `close` | Último fechamento | `C_t` | — | 1 |
| `ema9`, `ema21` | EMA | `EMA_t = α·C_t + (1−α)·EMA_{t−1}`, `α = 2/(n+1)`, semente `EMA_{n−1} = SMA(n)` | n = 9, 21 | n |
| `sma20` | SMA | `(1/n)·Σ C_{t−n+1..t}` | n = 20 | 20 |
| `dist_sma20` | Distância à SMA | `(C_t − SMA_t)/SMA_t · 100` (%) | n = 20 | 20 |
| `change20` | Variação 20 barras | `(C_t − C_{t−n})/C_{t−n} · 100` (%) | n = 20 | 21 |
| `change_window` | Variação da janela | `(C_t − C_0)/C_0 · 100` (%) | janela | 2 |
| `atr14` | ATR (Wilder) | `TR = max(H−L, |H−C_{t−1}|, |L−C_{t−1}|)`; semente = média dos n primeiros TR; `ATR_t = (ATR_{t−1}·(n−1) + TR_t)/n` | n = 14 | 15 |
| `vol20` | Volatilidade | desvio-padrão amostral de `ln(C_t/C_{t−1})` nas últimas n barras, ×100 (% por barra, **não anualizada**) | n = 20 | 21 |
| `rel_volume` | Volume relativo | `V_t / SMA(V, n)`, V = volume em moeda de cotação | n = 20 | 20 |

## Níveis

Canal de Donchian de 20 barras: `Máx 20` = maior máxima e `Mín 20` = menor mínima das 20 últimas barras consideradas. Desenhados tracejados em areia no gráfico (gramática Claritas: areia = conclusão da análise).

## Regime de médias (`ma_regime`)

- `alta`: `EMA9 > EMA21` **e** `C_t > SMA20`
- `baixa`: `EMA9 < EMA21` **e** `C_t < SMA20`
- `indefinido`: qualquer outra combinação
- `indisponivel`: falta barras para EMA21/SMA20

A evidência (`close`, `ema9`, `ema21`, `sma20`) acompanha o resultado e é exibida na leitura.

## Eventos

| tipo | Regra (avaliada no fechamento de cada barra da janela) |
|---|---|
| `ema_cross_up` / `ema_cross_down` | `EMA9_{t−1} ≤ EMA21_{t−1}` e `EMA9_t > EMA21_t` (ou o inverso) |
| `breakout_high` / `breakout_low` | `C_t >` maior máxima (ou `<` menor mínima) das 20 barras **anteriores**; só a primeira barra de uma sequência conta |

Até 30 eventos, mais recentes primeiro. No gráfico aparecem só os 6 mais recentes (legibilidade).

## O que fica de fora (e por quê)

| Painel do protótipo | Situação | Motivo |
|---|---|---|
| Sentimento (Comprador/Vendedor) | Substituído por **Range 24h** (posição do preço entre mínima e máxima da janela móvel de 24h) | Sentimento não é derivável de candles |
| Fluxo líquido institucional/varejo | Substituído por **Volume por barra** (volume real em moeda de cotação) | Binance Spot pública não identifica participantes |
| Distribuição de fechamento (P ≥ alvo) | **Indisponível** | Exige modelo calibrado e validado |
| Confiança % dos sinais | **Não exibida** | Não há método calibrado |
| Feixe de varredura / campo de probabilidade | Não usado nas telas reais | Decorativo; o plano permite efeitos só ligados a eventos reais (o glow do painel acende quando surge um evento novo) |
