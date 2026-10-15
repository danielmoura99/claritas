# SignalCard

One Claritas read — kind badge, serif headline, typed explanation, levels grid and confidence.

```jsx
<SignalCard fresh kind="buy" symbol="VALE3" timeframe="15m" time="14:32"
  title="Rompimento confirmado acima de R$ 61,20"
  body="Fechamento acima da resistência com volume 2,1× a média de 20 períodos."
  levels={[{label:'Entrada',value:'61,25'},{label:'Alvo',value:'62,40',tone:'up'},{label:'Stop',value:'60,70',tone:'down'}]}
  confidence={78} tags={['Rompimento','Volume']} />
```

- `fresh` only for the newest card in a feed. `compact` hides body/levels for lists.
