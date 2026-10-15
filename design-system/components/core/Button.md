# Button

Action button — use for any clickable command; one `primary` (sand) per view, `buy`/`sell` only for order intent.

```jsx
<Button variant="primary" icon="sparkles">Analisar agora</Button>
<Button variant="buy" size="lg">Comprar PETR4</Button>
<Button variant="ghost" icon="download" size="sm">Exportar</Button>
```

- variants: primary · secondary (default) · ghost · outline (sand line) · buy · sell
- sizes: sm 28px · md 34px · lg 42px
- `loading` swaps the icon for a spinner; `kbd` adds a shortcut hint.
