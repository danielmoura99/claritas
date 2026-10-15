# CandleChart

The centerpiece: a live candlestick chart where Claritas draws its reading in sand (levels, zones, trends, markers) while a scan beam sweeps the session.

```jsx
<CandleChart live autoAnalyze scanning field height={420} watermark="PETR4 · 5m" />
<CandleChart data={candles} annotations={[{ id:'r1', type:'level', price:38.9, label:'Resistência' }]} />
```

- Without `data` it simulates a B3 session (seeded); `live` ticks every `tickMs`.
- `onTick(series)` lets the page sync prices/feeds to the same stream.
- Candles bone (alta) / graphite (baixa) · last candle + price tag in sand · MAs sand/gray · **anything Claritas concluded is sand**.
- `field` adds the animated ProbabilityField behind the right half of the plot.
- `CandleChart.generateSeries({seed,start})` for static mock data.
