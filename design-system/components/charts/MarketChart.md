# MarketChart

Gráfico de mercado **real** (TradingView Lightweight Charts 5, Apache-2.0) vestido com a gramática Claritas. Use para dados vindos da API; o `CandleChart` original continua sendo a referência ilustrativa (série gerada) do showcase.

```tsx
<MarketChart seriesKey="BTCUSDT:5m" bars={bars} decimals={2} unit="USDT"
  lines={[{ id: "ema9", label: "EMA9", tone: "sand", points }]}
  levels={[{ id: "hi", price: 81900, label: "Máx 20", tone: "sand" }]}
  markers={[{ id: "x1", time, side: "buy", label: "EMA9×21" }]} />
```

- `bars`: números já convertidos na borda (`toChartNumber`), `time` em epoch ms UTC. A última vela é pintada em areia.
- `seriesKey`: troque ao mudar ativo/intervalo — recarrega e reenquadra, sem misturar séries.
- Carga, troca de série e abertura de barra → `setData`; ticks da barra corrente → `update()` incremental.
- `timeZone` só afeta a exibição (padrão `America/Sao_Paulo`); os dados continuam UTC.
- Cores lidas dos tokens (`--candle-up`, `--candle-down`, `--chart-grid`, `--accent`…) e reaplicadas ao trocar `data-theme`.
- `overlay`: conteúdo central para carregando / erro / vazio.
- Mantém o logo de atribuição do TradingView exigido pela licença da biblioteca.
