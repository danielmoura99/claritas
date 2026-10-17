# PasswordInput

Password field — login and account creation. An `Input` with a lock icon, a reveal toggle (eye / eye-off, `aria-pressed` while revealed) and a "Caps Lock ativado" hint while Caps Lock is on.

```jsx
<PasswordInput label="Senha" autoComplete="current-password" />
<PasswordInput label="Nova senha" autoComplete="new-password" hint="Mínimo de 8 caracteres" />
<PasswordInput label="Senha" error="E-mail ou senha incorretos" />
```

- Always pass `autoComplete` (`current-password` to sign in, `new-password` to create) so password managers work.
- `error` replaces the hint and turns the border clay, like `Input`.
- Accepts every `Input` prop except `type`, `icon`, `mono`, `prefix`, `suffix`, `kbd` and `end` (owned by the component).
