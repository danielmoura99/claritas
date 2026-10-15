# ProbabilityField

Animated dot-mesh "probability landscape" — use behind a chart or in a hero widget to show where Claritas thinks price is heading.

```jsx
<ProbabilityField peak={0.6} spread={0.2} style={{ height: 220 }} />
<CandleChart live field />  {/* built-in overlay */}
```

- Always sand, always behind data, never more than one per view. Honors reduced-motion (renders one still frame).
