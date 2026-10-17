# DataTable

Dense data table in the terminal grammar — admin lists (users, subscriptions, audit). Label header, hairline rows, hover on actionable rows, `Enter`/`Space` to open a row.

```jsx
<DataTable
  caption="Usuários"
  rows={users}
  rowKey={(u) => u.id}
  onRowClick={(u) => router.push(`/admin/usuarios/${u.id}`)}
  rowLabel={(u) => `Abrir ${u.email}`}
  columns={[
    { key: "email", header: "E-mail", render: (u) => u.email, width: "34%" },
    { key: "created", header: "Cadastro", render: (u) => formatDate(u.createdAt), mono: true, align: "right", hideBelow: 720 },
  ]}
  empty="Nenhum usuário encontrado com estes filtros."
/>
```

- `mono` for any number or date; `hideBelow` drops secondary columns on narrow screens; `wrap` lets long text (reasons) wrap instead of truncating.
- `loading` with no rows shows a status line; with rows it keeps them (no layout jump).
- Pagination is server-side and lives outside the table.
