# FlowArea

Streaming sand area chart for flows (fluxo líquido, volume acumulado) — glides left each tick.

```jsx
<FlowArea live height={90} onTick={d => setNet(d[d.length - 1])} />
```
