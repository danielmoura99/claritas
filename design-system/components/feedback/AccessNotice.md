# AccessNotice

Access state panel — a locked feature (paywall), an expired trial, a suspended account, an admin-only area. Quiet: dotted ground, dashed hairline, serif title and explicit text (never color alone). Never shows a fake price or a fake checkout.

```jsx
<AccessNotice fill eyebrow="Scanner" title="O Scanner não está incluído no seu acesso atual."
  actions={<><Button variant="primary" onClick={…}>Ver planos</Button><Button variant="ghost">Minha conta</Button></>}>
  Seu acesso inclui o Pregão ao vivo. Para varrer o mercado, fale com o suporte para ampliar o plano.
</AccessNotice>

<AccessNotice tone="warn" eyebrow="Teste" title="Seu teste termina em 2 dias." />
<AccessNotice tone="info" eyebrow="Pagamentos" title="Integração adiada." />
```

- `tone`: `lock` (sand lock — not included / locked), `info` (neutral state), `warn` (needs attention — `role="alert"`).
- `fill` centers it in the available area (screen-level lock inside the terminal shell).
