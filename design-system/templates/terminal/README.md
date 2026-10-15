# Claritas Terminal — template

Desktop trading-analysis terminal (dark, ≥1280px). Three click-through screens, all composed from the design-system components. Rendered at `/design-system/terminal`.

| Screen | File | What it shows |
|---|---|---|
| Pregão ao vivo | `Desk.tsx` (+ `Watchlist.tsx` = seletor de ativo, `Chrome.tsx`) | Gráfico ao vivo com auto-análise e campo de probabilidade, leitura Claritas (viés, métricas, estratégia, sinais), faixa de 4 widgets vivos: Sentimento, Fluxo líquido, Distribuição de fechamento, Sinais-chave |
| Scanner | `Scanner.tsx` | Criteria sidebar + progressive scan of 84 assets; results rise in as found |
| Relatório de fechamento | `Report.tsx` | Editorial session summary: serif headline, KPIs, day chart with signal markers, movers, signals recap |

`TerminalApp.tsx` is the root (screen state, live simulation, toasts, "Criar alerta" dialog).

**Interactions:** rail switches screens (persisted in localStorage) · symbol picker (popover) / tape item / signal / toast to open that asset · timeframe control re-seeds the chart · Auto-análise switch (chart footer) pauses the beam, levels and new signals · bell opens "Criar alerta" dialog → toast.

`data.ts` holds mock B3 tickers and the signal templates. Prices are fictitious.

Built-from-scratch: no prior product existed, so this kit *defines* the product rather than recreating it. The original JSX version is kept as a visual reference in `design-system/reference/terminal/`.
