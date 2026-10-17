# TextLink

Inline text action in sand caption type — secondary actions next to a form ("Criar conta", "← Voltar"). From the Claritas login UI kit.

```jsx
<TextLink onClick={() => setStep("criar")}>Criar conta</TextLink>
<TextLink href="/entrar">← Voltar para entrar</TextLink>
<TextLink disabled>Indisponível</TextLink>
```

- With `href` it renders an `<a>`; with `onClick` it renders a `<button>` (keyboard and screen readers treat it as an action).
- Hover moves to `--accent-hover`; focus uses the global `:focus-visible` ring.
- Use for secondary actions only — the primary action of a view is a `Button variant="primary"`.
