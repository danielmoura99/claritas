---
version: alpha
name: Claritas
description: >-
  Plataforma de análise gráfica do mercado financeiro (B3). Minimalista, monocromática, viva:
  preto, grafite, cinza e branco-osso, com uma única cor de marca — Sand — reservada à voz da análise.
  Este arquivo é o contrato visual e a fonte da verdade dos tokens; a implementação vive em design-system/tokens.
colors:
  # Ink — interface. Neutros verdadeiros com um fio quente para casar com a areia.
  ink-0: "#FFFFFF"
  ink-50: "#F7F6F3"
  ink-100: "#EDECE9"
  ink-200: "#D0CEC9"
  ink-300: "#ADABA6"
  ink-400: "#86847F"
  ink-500: "#5C5B58"
  ink-600: "#3A3A38"
  ink-700: "#2B2B2A"
  ink-750: "#222221"
  ink-800: "#1B1B1B"
  ink-850: "#151515"
  ink-900: "#101010"
  ink-950: "#0A0A0A"
  # Sand — a voz da análise Claritas (accent da marca).
  sand-100: "#F3EDE2"
  sand-200: "#E8DDCB"
  sand-300: "#D9C9AE"
  sand-400: "#C8B28E"
  sand-500: "#AE9570"
  sand-600: "#8C7655"
  sand-700: "#5E4F39"
  sand-900: "#1E1A13"
  # Market — alta em osso, baixa em argila. Sem verde/vermelho saturados.
  up-300: "#F7F4EE"
  up-400: "#ECE7DE"
  up-500: "#DED8CC"
  up-600: "#B8B2A6"
  up-900: "#1D1C19"
  down-300: "#E6B3A4"
  down-400: "#D4917E"
  down-500: "#C47A66"
  down-600: "#93594A"
  down-900: "#261613"
  # Suporte (raro) — aço para notícias, ocre para leilão/atenção.
  info-300: "#C3CBD3"
  info-400: "#9BA7B4"
  info-500: "#7A8794"
  info-900: "#15181B"
  warn-400: "#E0B08A"
  warn-500: "#CF9466"
  warn-900: "#24180F"
  # Semânticos — tema escuro (canônico).
  background: "{colors.ink-950}"
  surface-inset: "#070707"
  surface-panel: "#0F0F0F"
  surface-raised: "{colors.ink-850}"
  surface-hover: "{colors.ink-800}"
  surface-active: "{colors.ink-750}"
  border-subtle: "rgba(255,255,255,.055)"
  border-default: "rgba(255,255,255,.09)"
  border-strong: "rgba(255,255,255,.16)"
  text-primary: "{colors.ink-100}"
  text-secondary: "{colors.ink-300}"
  text-tertiary: "{colors.ink-400}"
  text-disabled: "{colors.ink-500}"
  text-on-accent: "#14110C"
  primary: "{colors.sand-400}"
  primary-hover: "{colors.sand-300}"
  primary-pressed: "{colors.sand-500}"
  accent-tint: "rgba(200,178,142,.10)"
  accent-line: "rgba(200,178,142,.42)"
  market-up: "{colors.up-500}"
  market-up-text: "{colors.up-400}"
  market-down: "{colors.down-500}"
  market-down-text: "{colors.down-400}"
  market-flat: "{colors.ink-400}"
  candle-up: "{colors.up-500}"
  candle-down: "{colors.ink-500}"
  status-info: "{colors.info-400}"
  status-warn: "{colors.warn-500}"
typography:
  display-xl:
    fontFamily: Instrument Serif
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.02em
  display-l:
    fontFamily: Instrument Serif
    fontSize: 44px
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: -0.015em
  display-m:
    fontFamily: Instrument Serif
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.01em
  display-s:
    fontFamily: Instrument Serif
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.005em
  heading-l:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  heading-m:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-s:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
  micro:
    fontFamily: Geist Mono
    fontSize: 10px
    fontWeight: 500
    letterSpacing: 0.1em
  num-xl:
    fontFamily: Geist Mono
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.03em
    fontFeature: '"tnum", "zero"'
  num-l:
    fontFamily: Geist Mono
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.02em
    fontFeature: '"tnum", "zero"'
  num-m:
    fontFamily: Geist Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.01em
    fontFeature: '"tnum", "zero"'
  num-s:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    fontFeature: '"tnum", "zero"'
  num-xs:
    fontFamily: Geist Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    fontFeature: '"tnum", "zero"'
rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 10px
  xl: 14px
  pill: 999px
spacing:
  "0": 0px
  "1": 2px
  "2": 4px
  "3": 6px
  "4": 8px
  "5": 12px
  "6": 16px
  "7": 20px
  "8": 24px
  "9": 32px
  "10": 40px
  "11": 56px
  "12": 72px
  control-sm: 28px
  control-md: 34px
  control-lg: 42px
  row: 40px
  row-dense: 32px
  panel-pad: 16px
  panel-gap: 8px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-on-accent}"
    typography: "{typography.body-s}"
    rounded: "{rounded.md}"
    height: 34px
    padding: 0 14px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: 34px
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
  button-buy:
    backgroundColor: "{colors.up-500}"
    textColor: "#03140D"
    rounded: "{rounded.md}"
  button-sell:
    backgroundColor: "{colors.down-500}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: 34px
    padding: 0 10px
  badge:
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    height: 22px
    padding: 0 8px
  panel:
    backgroundColor: "{colors.surface-panel}"
    rounded: "{rounded.xl}"
    padding: 16px
  dialog:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.xl}"
    width: 440px
  tooltip:
    backgroundColor: "{colors.ink-700}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
  signal-card:
    backgroundColor: "{colors.surface-panel}"
    rounded: "{rounded.lg}"
    padding: 16px
---

## Overview

**Claritas** (latim: *clareza*) é uma plataforma de análise gráfica do mercado financeiro. Recebe o fluxo do pregão (B3) em tempo real, desenha o gráfico e **analisa enquanto o mercado anda** — níveis, padrões, cruzamentos, fluxo — exibindo as conclusões na mesma tela, ao vivo, com animação. A ideia central: *o pregão rolando e a plataforma lendo junto*.

Conceito visual: **minimalista, monocromático, vivo.** A tela é quieta; o que se move são os dados. Superfície única por enquanto: **Claritas Terminal** (desktop, escuro, ≥1280px). Densidade de mesa de operação, não de landing page.

Não existe logo. A marca é escrita em tipo (Instrument Serif) pelo componente `Wordmark`. Nunca desenhe símbolo. Todo o sistema foi criado do zero no Claude Design — é uma proposta de direção, não a recriação de um produto existente.

## Colors

**Três vozes de cor — regra inviolável:**

- **Ink** (`ink-*`) = interface. Neutros verdadeiros com um fio quente.
- **Market** = direção de preço, sem verde/vermelho saturados: alta em **osso** (`up-*`, velas `candle-up`), baixa em **grafite** (`candle-down`); valores negativos, stop e venda em **argila** (`down-*`, terracota apagado). Direção também é sempre dita por ▲▼ e sinal + / −, nunca só pela cor.
- **Sand** (`sand-*`, accent `#C8B28E`) = análise Claritas: níveis, zonas, médias móveis, campo de probabilidade, feixe de varredura, última vela e etiqueta do último preço, gauges, tabs ativas, CTA primário, foco. **Se a Claritas não gerou, não é areia.**
- Suporte (raro): `info-*` aço (notícias), `warn-*` ocre (leilão, atenção).

Superfícies em camadas por luminância: `background` → `surface-inset` (gráficos, campos) → `surface-panel` (módulos) → `surface-raised` (cards, diálogos). Hover sobe um degrau (`surface-hover`); press escurece um degrau (`surface-active` / `sand-600`). Bordas de 1px em alfa branco (subtle .055 / default .09 / strong .16).

**Temas.** O tema escuro é o canônico (valores do front matter). Existe um tema claro **derivado e provisório** (`design-system/tokens/theme-light.css`) que só remapeia os tokens semânticos na mesma paleta: superfícies em `ink-0/50/100`, texto em `ink-950/600/500`, accent em `sand-600` (contraste em papel), alta em grafite (`ink-800`, osso some no claro) e baixa em `down-600`. Ative com `data-theme="light"` no `<html>` ou em qualquer contêiner.

## Typography

- **Geist** — UI (títulos de interface, corpo, botões).
- **Geist Mono** — **todo número** (tabular, slashed zero: colunas não tremem quando o preço muda), rótulos e eixos. Rótulo padrão: mono 11px CAIXA ALTA +0.08em.
- **Instrument Serif** — a voz narrativa da Claritas: títulos de sinais, manchetes de relatório, wordmark, veredito do sentimento (itálico).

Escala: display (serif) 64 / 44 / 30 / 22 · heading 18 / 15 · body 14 / 13 · caption 12 · label 11 · micro 10 · numerais 40 / 26 / 15 / 13 / 11. Utilitários prontos: `.cl-num`, `.cl-label`, `.cl-serif`.

**Conteúdo e voz** (aplica-se a todo texto de interface):

- **Analista sênior, não vendedor.** Diz o que viu, com que evidência, quão seguro está e o que invalidaria a leitura. Nunca promete retorno.
- **Idioma:** português do Brasil. Jargão de mesa é bem-vindo (rompimento, pullback, VWAP, stop, alvo, fluxo de agressão, leilão, pregão).
- **Pessoa:** impessoal ("Rompimento confirmado…", "Invalida se…"). "Você" só em configurações e onboarding. Nunca "nós achamos".
- **Casing:** sentence case em títulos e botões ("Criar alerta"). CAIXA ALTA só nos rótulos mono (`CONFIANÇA`, `ENTRADA`, `AO VIVO`).
- **Números:** pt-BR sempre — vírgula decimal, ponto de milhar (`131.420`, `R$ 38,42`, `+1,21%`). Sinal de menos verdadeiro (−). Preço com 2 casas, câmbio 4, índice 0. Hora 24h, fuso de Brasília (`14:32`).
- **Estrutura de um sinal:** fato (título serif) → evidência (corpo) → níveis (entrada/alvo/stop) → confiança %.
- **Estado da máquina** em minúsculas mono, como log: "lendo fluxo de agressão…".
- **Relatórios** podem ser editoriais, com frase de efeito em itálico serif.
- **Proibido:** emoji, exclamação, urgência ("imperdível"), foguetes, promessas, "garantido". Erros dizem o que aconteceu e o que fazer: "Conexão com a B3 instável — dados com atraso de 15 min."

## Layout

- **Escala de espaço** 2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 (`--space-1` … `--space-12`). No Tailwind, a escala padrão de 4px cobre todos os passos (`p-0.5` = 2px … `p-18` = 72px).
- **Controles** 28 / 34 / 42px. Linhas de 40–48px (densa 32). Gap entre painéis 8px, padding de painel 16px.
- **Terminal:** topbar 60 (marca · busca · 3 cotações macro com sparkline viva · relógio) · rail 56 · grade principal: gráfico fluido + leitura Claritas 380 · faixa de 4 widgets 260 (Sentimento, Fluxo líquido, Distribuição, Sinais-chave) · fita de cotações 30 no rodapé. Watchlist vive num popover no seletor de ativo.
- **Fundos** chapados. Sem imagens, sem gradientes decorativos. Motivos permitidos: campo de probabilidade (malha de pontos animada em areia atrás do gráfico — procedural), feixe de varredura (só durante a análise) e dot grid tênue (estados vazios).

## Elevation & Depth

Profundidade vem de borda + highlight interno de 1px no topo, não de sombra. Painéis não têm drop-shadow (`--shadow-panel` = highlight + anel de 1px). Sombras longas e escuras só para o que flutua: popover (`--shadow-pop`), toast, diálogo (`--shadow-dialog`). **Glow** é reservado ao que está vivo: sinal novo (`--glow-sand`), alvo/stop atingido (`--glow-up` / `--glow-down`). Transparência e blur só em overlays (backdrop do diálogo `blur(10px)`) e toasts (vidro `blur(16px)`), nunca em painéis fixos. Foco = anel sand de 2px com offset (`--focus-ring`).

## Shapes

Raios: 2 (chips no gráfico) · 4 (badges, inputs pequenos) · 6 (botões, inputs) · 10 (cards de sinal, toasts) · 14 (painéis, diálogos) · pill só em switch e dots. Traço de ícone 1.75 (1.5 a partir de 20px). Níveis Claritas no gráfico tracejados 5·4.

## Components

A biblioteca completa — 32 componentes em 7 grupos — vive em `design-system/components` e é importada de `@/design-system`. Cada componente tem um `.md` de uso ao lado do `.tsx`; todos os estados estão na rota `/design-system`.

- **core:** Button (primary · secondary · ghost · outline · buy · sell; sm/md/lg; loading, disabled, kbd), IconButton (ghost/secondary, active, badge), Badge (6 tons × soft/outline/solid), Panel, Tooltip, Wordmark, Icon (77 ícones Lucide).
- **forms:** Input (label, hint, erro, prefixo/sufixo, mono, kbd), Select, Checkbox (indeterminado), Switch (sand/up).
- **navigation:** Tabs (indicador sand deslizante, contador), SegmentedControl (timeframes).
- **feedback:** LiveIndicator (ao vivo, analisando, pré, leilão, fechado, atraso), Toast (vidro), Dialog (serif, backdrop blur).
- **market:** Delta, PriceTicker (flash só dos dígitos que mudaram), TickerTape, WatchRow.
- **charts:** CandleChart (auto-análise, anotações, feixe, campo), Sparkline, FlowArea, DistributionCurve, ProbabilityField.
- **analysis:** SignalCard (fresh: sobe + glow + texto digitado), ConfidenceMeter (barra/arco), SentimentGauge, MetricRow.

Gráfico: fundo transparente sobre o painel; velas osso/grafite; última vela e etiqueta do último preço em areia; MM rápida areia, lenta cinza; volume em branco 7–13%; grade 4% alfa; eixo à direita em mono; zonas 7% areia; marcadores com anel pulsante.

## Do's and Don'ts

- **Do** usar só tokens: `var(--…)` em estilos inline ou utilitários Tailwind mapeados (`bg-panel`, `text-fg-secondary`, `border-line`, `text-accent`, `rounded-md`, `shadow-pop`). A paleta padrão do Tailwind está desligada.
- **Do** importar componentes de `@/design-system`, nunca de arquivos internos.
- **Do** escrever todo número em Geist Mono, formato pt-BR.
- **Do** reservar areia ao que a análise Claritas produziu, e um único CTA primário (sand) por tela; buy/sell só para intenção de ordem.
- **Do** respeitar `prefers-reduced-motion` (os tokens de duração zeram sozinhos).
- **Don't** escrever cor (hex/rgb), fonte, espaçamento ou raio hardcoded no código do app — o lint de aderência (`design-system/lint`) acusa.
- **Don't** usar verde/vermelho saturados, emoji, ícone fora do set Lucide, icon font ou PNG.
- **Don't** animar o chrome: sem bounce, spring, scale ou shrink no press. Os dados se movem; o chrome não.
- **Don't** desenhar logo ou símbolo para a marca.

## Motion

Easing decisivo `cubic-bezier(.2,.8,.2,1)` (`--ease-out`). Durações: tick 140 · fast 180 · base 260 · slow 480 · draw 900 · scan 2600 · fita 60s. Assinaturas: **tudo se mexe ao mesmo tempo, devagar** — velas formando, campo de probabilidade ondulando, gauge interpolando, área de fluxo deslizando, curva de distribuição se deformando, valores trocando com fade, fita rolando. Mais: pulso ao vivo, flash de dígito, feixe de varredura, anotação desenhando, sinal entrando, texto "pensando" com shimmer. Keyframes `cl-*` em `design-system/tokens/motion.css`.

## Iconography

[Lucide](https://lucide.dev) outline (ISC), copiado de `lucide-static@0.460.0` para `design-system/assets/icons/*.svg` (77 ícones) e embutido no componente `Icon` (stroke 1.75, `currentColor`, 16px padrão; 14 denso; 20 ênfase). Ícones herdam a cor do texto; `sparkles`, `scan-line` e `radar` aparecem em areia quando representam a análise. Unicode como ícone só ▲ ▼ – dentro de variações (`Delta`) e → ↑ ↓ em rótulos de ação. Ícone fora do set: buscar no Lucide com o mesmo traço, nunca desenhar à mão.

## Implementation

- Tokens CSS: `design-system/tokens/*.css` (entrada do app: `tokens/index.css`, importada por `app/globals.css`). Se um valor mudar aqui, mude lá — e vice-versa.
- Fontes no app: `next/font` em `app/layout.tsx` (Geist, Geist Mono, Instrument Serif) ligadas a `--font-sans` / `--font-mono` / `--font-serif`. Os `.woff2` em `design-system/assets/fonts` servem os HTMLs de referência.
- Mapa da biblioteca e como criar componente novo: `design-system/README.md`.
