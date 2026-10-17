# StatTile

One verifiable number with its label — admin overview, account limits. Value in Geist Mono tabular numbers.

```jsx
<StatTile label="Com acesso ao terminal" value={formatInt(12)} hint="assinatura válida ou concessão" />
<StatTile label="Receita recorrente" value={null} hint="Pendente — depende do gateway" />
```

- `value={null}` renders "—" in the disabled tone: use it for numbers that do not exist yet (never invent).
- `tone="sand"` only for the one number Claritas wants to highlight in a view.
- `kind="text"` for a short label instead of a number (plan name, origin) — UI face, not mono.
