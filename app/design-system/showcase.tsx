"use client";

import * as React from "react";
import Link from "next/link";
import {
  Badge, Button, DataTable, Icon, ICON_NAMES, IconButton, Panel, StatTile, Tooltip, Wordmark,
  Checkbox, Input, PasswordInput, Select, Switch,
  SegmentedControl, Tabs, TextLink,
  AccessNotice, Dialog, LiveIndicator, Toast,
  Delta, PriceTicker, TickerTape, WatchRow,
  CandleChart, DistributionCurve, FlowArea, ProbabilityField, Sparkline,
  ConfidenceMeter, MetricRow, SentimentGauge, SignalCard,
  type Annotation, type BadgeTone, type ButtonVariant, type LiveStatus, type ToastTone,
} from "@/design-system";

type Theme = "dark" | "light";
const THEME_KEY = "cl-theme";

const SECTIONS = [
  ["fundacoes", "Fundações"], ["core", "Core"], ["forms", "Forms"], ["navigation", "Navigation"], ["feedback", "Feedback"],
  ["market", "Market"], ["charts", "Charts"], ["analysis", "Analysis"], ["temas", "Temas lado a lado"], ["templates", "Templates"],
] as const;

const series = (seed: number, n = 32, start = 38) => CandleChart.generateSeries({ seed, start, count: n }).map(c => c.c);

/* ---------- layout helpers (tokens only) ---------- */

function Section({ id, title, count, children }: { id: string; title: string; count?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 flex flex-col gap-4">
      <header className="flex items-baseline gap-3 border-b border-line-subtle pb-2">
        <h2 className="font-serif text-3xl text-fg">{title}</h2>
        {count && <span className="cl-label">{count}</span>}
      </header>
      {children}
    </section>
  );
}

function Spec({ name, file, children }: { name: string; file: string; children: React.ReactNode }) {
  return (
    <Panel eyebrow={name} title={<span className="font-mono text-xs text-fg-tertiary">{file}</span>}>
      <div className="flex flex-col gap-4">{children}</div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="cl-label w-28 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-12 w-full rounded-md shadow-panel" style={{ background: `var(${token})` }} />
      <span className="font-mono text-xs text-fg-secondary">{label ?? token}</span>
    </div>
  );
}

function SwatchGroup({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="cl-label">{title}</span>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {tokens.map(t => <Swatch key={t} token={t} />)}
      </div>
    </div>
  );
}

/* ---------- sections ---------- */

function Foundations() {
  const ink = ["950", "900", "850", "800", "750", "700", "600", "500", "400", "300", "200", "100", "50"].map(s => `--ink-${s}`);
  const sand = ["100", "200", "300", "400", "500", "600", "700", "900"].map(s => `--sand-${s}`);
  const market = ["--up-300", "--up-400", "--up-500", "--up-600", "--up-900", "--down-300", "--down-400", "--down-500", "--down-600", "--down-900"];
  const support = ["--info-300", "--info-400", "--info-500", "--info-900", "--warn-400", "--warn-500", "--warn-900"];
  const surfaces = ["--bg-app", "--surface-inset", "--surface-panel", "--surface-raised", "--surface-hover", "--surface-active", "--accent", "--accent-tint", "--market-up", "--market-down", "--status-info", "--status-warn"];
  const spaces = Array.from({ length: 12 }, (_, i) => `--space-${i + 1}`);
  const radii = ["--radius-xs", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-pill"];
  const shadows = ["--shadow-panel", "--shadow-raised", "--shadow-pop", "--shadow-dialog", "--glow-sand", "--glow-up", "--glow-down"];
  return (
    <Section id="fundacoes" title="Fundações" count="tokens · design-system/tokens">
      <Panel eyebrow="Cor" title="Ink = interface · Market = direção · Sand = análise Claritas">
        <div className="flex flex-col gap-5">
          <SwatchGroup title="Ink" tokens={ink} />
          <SwatchGroup title="Sand (voz da análise)" tokens={sand} />
          <SwatchGroup title="Market — alta osso / baixa argila" tokens={market} />
          <SwatchGroup title="Suporte — info aço / warn ocre" tokens={support} />
          <SwatchGroup title="Semânticos (mudam com o tema)" tokens={surfaces} />
        </div>
      </Panel>
      <div className="grid gap-2 lg:grid-cols-2">
        <Panel eyebrow="Tipo" title="Geist · Geist Mono · Instrument Serif">
          <div className="flex flex-col gap-4">
            <span className="font-serif text-fg" style={{ font: "var(--text-display)", letterSpacing: "var(--display-l-track)" }}>Rompimento confirmado</span>
            <span className="text-fg" style={{ font: "var(--text-heading)" }}>Heading L — Geist semibold</span>
            <span className="text-fg-secondary" style={{ font: "var(--text-body)" }}>Body — fechamento acima da resistência de três testes, com volume 2,1× a média.</span>
            <span className="text-fg-tertiary" style={{ font: "var(--text-caption)" }}>Caption — dados com atraso de 15 min.</span>
            <span className="cl-label">Label mono · confiança</span>
            <span className="cl-num text-fg" style={{ fontSize: "var(--num-xl-size)", letterSpacing: "var(--num-xl-track)" }}>131.420,00</span>
          </div>
        </Panel>
        <Panel eyebrow="Espaço · raio · elevação" title="Escala densa de mesa de operação">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              {spaces.map(s => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-24 font-mono text-xs text-fg-tertiary">{s}</span>
                  <span className="h-2 rounded-xs bg-accent" style={{ width: `var(${s})` }} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {radii.map(r => <div key={r} className="flex flex-col items-center gap-1.5"><div className="size-12 border border-line-strong bg-raised" style={{ borderRadius: `var(${r})` }} /><span className="font-mono text-xs text-fg-tertiary">{r.replace("--radius-", "")}</span></div>)}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {shadows.map(s => <div key={s} className="flex flex-col gap-1.5"><div className="h-12 rounded-lg bg-raised" style={{ boxShadow: `var(${s})` }} /><span className="font-mono text-xs text-fg-tertiary">{s.replace("--", "")}</span></div>)}
            </div>
          </div>
        </Panel>
      </div>
      <Panel eyebrow="Movimento" title="Os dados se movem; o chrome não">
        <div className="flex flex-wrap items-center gap-6">
          <LiveIndicator status="live" />
          <span className="cl-dotgrid h-16 w-40 rounded-md border border-line-subtle" />
          <span className="relative h-16 w-64 overflow-hidden rounded-md bg-inset">
            <span className="absolute inset-y-0 w-1/5 border-r" style={{ background: "var(--scan-beam)", borderColor: "var(--scan-edge)", animation: "cl-scan var(--dur-scan) linear infinite" }} />
          </span>
          <span className="font-mono text-xs text-fg-tertiary">ease-out · tick 140 · fast 180 · base 260 · slow 480 · draw 900 · scan 2600</span>
        </div>
      </Panel>
    </Section>
  );
}

function CoreSection() {
  const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "outline", "buy", "sell"];
  const tones: BadgeTone[] = ["neutral", "up", "down", "sand", "info", "warn"];
  const [iconQuery, setIconQuery] = React.useState("");
  const icons = ICON_NAMES.filter(n => n.includes(iconQuery.toLowerCase()));
  return (
    <Section id="core" title="Core" count="9 componentes">
      <Spec name="Button" file="core/Button.tsx">
        {variants.map(v => (
          <Row key={v} label={v}>
            <Button variant={v} icon="sparkles">Default</Button>
            <Button variant={v} forceState="hover">Hover</Button>
            <Button variant={v} forceState="active">Active</Button>
            <Button variant={v} forceState="focus">Focus</Button>
            <Button variant={v} loading>Loading</Button>
            <Button variant={v} disabled>Disabled</Button>
          </Row>
        ))}
        <Row label="Tamanhos">
          <Button size="sm" icon="search" kbd="⌘K">Buscar</Button>
          <Button size="md">Médio</Button>
          <Button size="lg" variant="primary" iconRight="arrow-up-right">Abrir terminal</Button>
          <div className="w-56"><Button fullWidth variant="outline" icon="bell">Largura total</Button></div>
        </Row>
      </Spec>
      <Spec name="IconButton" file="core/IconButton.tsx">
        <Row label="Ghost">
          <IconButton icon="crosshair" label="Default" />
          <IconButton icon="pencil" label="Hover" forceHover />
          <IconButton icon="crosshair" label="Ativo (selecionado)" active />
          <IconButton icon="bell" label="Com badge" badge />
          <IconButton icon="ruler" label="Desabilitado" disabled />
        </Row>
        <Row label="Secondary">
          <IconButton icon="maximize-2" label="Tela cheia" variant="secondary" />
          <IconButton icon="layers" label="Hover" variant="secondary" forceHover />
          <IconButton icon="settings" label="Desabilitado" variant="secondary" disabled />
        </Row>
        <Row label="Tamanhos">
          <IconButton icon="settings" label="sm" size="sm" />
          <IconButton icon="settings" label="md" size="md" />
          <IconButton icon="settings" label="lg" size="lg" />
        </Row>
      </Spec>
      <Spec name="Badge" file="core/Badge.tsx">
        {(["soft", "outline", "solid"] as const).map(v => (
          <Row key={v} label={v}>
            {tones.map(t => <Badge key={t} tone={t} variant={v}>{t}</Badge>)}
          </Row>
        ))}
        <Row label="Extras">
          <Badge tone="sand" dot>Ao vivo</Badge>
          <Badge tone="up" icon="trending-up">Compra</Badge>
          <Badge tone="down" icon="trending-down" size="sm">Venda</Badge>
          <Badge size="sm">sm</Badge>
        </Row>
      </Spec>
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="DataTable" file="core/DataTable.tsx">
          <DataTable caption="Exemplo" rowKey={r => r.id} onRowClick={() => undefined} rowLabel={r => `Abrir ${r.email}`}
            rows={[{ id: "1", email: "ana@exemplo.com", plano: "Pro", criado: "17/10/2026" }, { id: "2", email: "bruno@exemplo.com", plano: "—", criado: "16/10/2026" }]}
            columns={[
              { key: "email", header: "E-mail", render: r => r.email, width: "50%" },
              { key: "plano", header: "Plano", render: r => r.plano },
              { key: "criado", header: "Cadastro", render: r => r.criado, mono: true, align: "right" },
            ]} />
          <DataTable caption="Vazio" rowKey={(r: { id: string }) => r.id} rows={[]} columns={[{ key: "x", header: "Coluna", render: () => null }]} empty="Nenhum registro com estes filtros." />
        </Spec>
        <Spec name="StatTile" file="core/StatTile.tsx">
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Usuários" value="128" hint="total cadastrado" />
            <StatTile label="Com acesso" value="42" tone="sand" />
            <StatTile label="Receita" value={null} hint="pendente" />
          </div>
        </Spec>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="Panel" file="core/Panel.tsx">
          <div className="grid grid-cols-2 gap-2">
            <Panel eyebrow="Default" title="Painel" actions={<IconButton icon="ellipsis" label="Mais" size="sm" />}>Corpo do painel.</Panel>
            <Panel eyebrow="Inset" inset footer={<span className="text-xs text-fg-tertiary">Rodapé</span>}>Superfície de gráfico.</Panel>
            <Panel eyebrow="Glow" title="Sinal novo" glow="sand">Ênfase viva em areia.</Panel>
            <Panel padding={false}><div className="p-4 text-fg-tertiary">Sem padding (vazio)</div></Panel>
          </div>
        </Spec>
        <Spec name="Tooltip · Wordmark" file="core/Tooltip.tsx · core/Wordmark.tsx">
          <Row label="Tooltip">
            <div className="flex h-16 items-end gap-8">
              <Tooltip content="Sempre aberto" defaultOpen><Button size="sm">Topo</Button></Tooltip>
              <Tooltip content="Atalho" kbd="⌘K"><Button size="sm">Passe o mouse</Button></Tooltip>
              <Tooltip content="Abaixo" placement="bottom"><Button size="sm">Bottom</Button></Tooltip>
            </div>
          </Row>
          <Row label="Wordmark">
            <Wordmark size={28} />
            <Wordmark size={22} product="Terminal" />
            <Wordmark size={18} color="var(--accent)" />
          </Row>
        </Spec>
      </div>
      <Spec name="Icon" file={`core/Icon.tsx · ${ICON_NAMES.length} ícones Lucide · assets/icons`}>
        <div className="w-72"><Input icon="search" size="sm" placeholder="Filtrar ícones" value={iconQuery} onChange={e => setIconQuery(e.target.value)} /></div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-12">
          {icons.map(n => (
            <div key={n} className="flex flex-col items-center gap-1.5 rounded-md p-2 text-fg-secondary hover:bg-hover hover:text-fg">
              <Icon name={n} size={18} />
              <span className="w-full truncate text-center font-mono text-xs text-fg-tertiary">{n}</span>
            </div>
          ))}
        </div>
        {icons.length === 0 && <span className="font-mono text-xs text-fg-tertiary">nenhum ícone encontrado (estado vazio)</span>}
      </Spec>
    </Section>
  );
}

function FormsSection() {
  const [checked, setChecked] = React.useState(true);
  return (
    <Section id="forms" title="Forms" count="5 componentes">
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="Input" file="forms/Input.tsx">
          <Input label="Default" placeholder="Buscar ativo" icon="search" kbd="/" />
          <Input label="Focus" placeholder="Foco forçado" forceFocus />
          <Input label="Preço" prefix="R$" suffix="BRL" mono defaultValue="38,42" hint="Último: 38,38" />
          <Input label="Erro" defaultValue="abc" error="Informe um preço válido, ex.: 38,42" />
          <Input label="Desabilitado" placeholder="Indisponível" disabled />
          <div className="flex gap-2"><Input size="sm" placeholder="sm" /><Input size="md" placeholder="md" /><Input size="lg" placeholder="lg" /></div>
        </Spec>
        <Spec name="PasswordInput" file="forms/PasswordInput.tsx">
          <PasswordInput label="Senha" placeholder="Sua senha" autoComplete="off" />
          <PasswordInput label="Revelada" defaultValue="senha-de-exemplo" defaultVisible autoComplete="off" />
          <PasswordInput label="Nova senha" hint="Mínimo de 8 caracteres" autoComplete="off" forceFocus />
          <PasswordInput label="Erro" defaultValue="errada" error="E-mail ou senha incorretos" autoComplete="off" />
          <PasswordInput label="Desabilitada" placeholder="Indisponível" disabled autoComplete="off" />
        </Spec>
        <div className="flex flex-col gap-2">
          <Spec name="Select" file="forms/Select.tsx">
            <Select label="Default" options={["Ibovespa (84)", "IBrX-100", "Small caps"]} />
            <Select label="Com ícone" icon="filter" options={[{ value: "a", label: "Preço cruzar para cima" }, { value: "b", label: "Novo sinal Claritas" }]} />
            <Select label="Desabilitado" options={["Indisponível"]} disabled />
          </Spec>
          <Spec name="Checkbox · Switch" file="forms/Checkbox.tsx · forms/Switch.tsx">
            <Row label="Checkbox">
              <Checkbox label="Desmarcado" />
              <Checkbox checked={checked} onChange={setChecked} label="Marcado (controlado)" />
              <Checkbox indeterminate label="Indeterminado" />
              <Checkbox defaultChecked disabled label="Desabilitado" />
            </Row>
            <Checkbox defaultChecked label="Anexar leitura Claritas" description="O alerta chega com a análise do gráfico no momento do disparo." />
            <Row label="Switch">
              <Switch label="Off" />
              <Switch defaultChecked label="On (sand)" />
              <Switch defaultChecked tone="up" label="On (up)" />
              <Switch defaultChecked size="sm" label="sm" />
              <Switch disabled label="Desabilitado" />
              <Switch defaultChecked disabled label="On desabilitado" />
            </Row>
          </Spec>
        </div>
      </div>
    </Section>
  );
}

function NavigationSection() {
  return (
    <Section id="navigation" title="Navigation" count="3 componentes">
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="SegmentedControl" file="navigation/SegmentedControl.tsx">
          <Row label="md mono"><SegmentedControl options={["1m", "5m", "15m", "1h", "D"]} defaultValue="5m" /></Row>
          <Row label="sm"><SegmentedControl size="sm" options={["Velas", "Linha", "Área"]} mono={false} /></Row>
          <Row label="fullWidth"><div className="w-72"><SegmentedControl fullWidth size="sm" options={["5m", "15m", "1h", "D"]} defaultValue="15m" /></div></Row>
        </Spec>
        <Spec name="Tabs" file="navigation/Tabs.tsx">
          <Tabs items={[{ value: "sum", label: "Resumo", icon: "layout-grid" }, { value: "sig", label: "Sinais", count: 12 }, { value: "tech", label: "Técnico" }]} />
          <Tabs size="sm" items={["Resumo", "Sinais", "Técnico"]} defaultValue="Sinais" />
        </Spec>
        <Spec name="TextLink" file="navigation/TextLink.tsx">
          <Row label="botão"><TextLink onClick={() => undefined}>Criar conta</TextLink></Row>
          <Row label="link"><TextLink href="#navigation">← Voltar para entrar</TextLink></Row>
          <Row label="desabilitado"><TextLink disabled>Indisponível</TextLink></Row>
        </Spec>
      </div>
    </Section>
  );
}

function FeedbackSection() {
  const [open, setOpen] = React.useState(false);
  const statuses: LiveStatus[] = ["live", "analyzing", "pre", "auction", "closed", "delayed"];
  const tones: ToastTone[] = ["sand", "up", "down", "info", "warn"];
  return (
    <Section id="feedback" title="Feedback" count="4 componentes">
      <Spec name="LiveIndicator" file="feedback/LiveIndicator.tsx">
        <Row label="md">{statuses.map(s => <LiveIndicator key={s} status={s} />)}</Row>
        <Row label="sm + detail">{statuses.slice(0, 3).map(s => <LiveIndicator key={s} status={s} size="sm" detail="14:32:07" />)}</Row>
      </Spec>
      <Spec name="AccessNotice" file="feedback/AccessNotice.tsx">
        <div className="grid gap-2 lg:grid-cols-3">
          <AccessNotice eyebrow="Scanner" title="O Scanner não está incluído no seu acesso atual." actions={<><Button variant="primary" size="sm">Ver planos</Button><Button variant="ghost" size="sm">Minha conta</Button></>}>
            Seu acesso inclui o Pregão ao vivo. Fale com o suporte para ampliar.
          </AccessNotice>
          <AccessNotice tone="warn" eyebrow="Teste" title="Seu teste termina em 2 dias." />
          <AccessNotice tone="info" eyebrow="Pagamentos" title="Integração adiada." >Acessos são concedidos manualmente nesta fase.</AccessNotice>
        </div>
      </Spec>
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="Toast" file="feedback/Toast.tsx">
          {tones.map(t => <Toast key={t} tone={t} title={`Tom ${t}`} message="Fechamento acima da resistência com volume 2,1× a média." meta="14:32" action={t === "sand" ? "Ver no gráfico" : undefined} onClose={() => undefined} />)}
          <Toast tone="warn" title="Conexão com a B3 instável" message="Dados com atraso de 15 min." />
        </Spec>
        <Spec name="Dialog" file="feedback/Dialog.tsx">
          <Dialog inline title="Criar alerta" eyebrow="PETR4 · Petrobras PN" onClose={() => undefined}
            footer={<><Button variant="ghost">Cancelar</Button><Button variant="primary" icon="bell">Criar alerta</Button></>}>
            O alerta chega com a leitura Claritas anexada.
          </Dialog>
          <Dialog inline title="Sem rodapé nem fechar">Variação mínima do diálogo.</Dialog>
          <Row label="Modal"><Button variant="outline" icon="maximize-2" onClick={() => setOpen(true)}>Abrir diálogo modal</Button></Row>
          <Dialog open={open} onClose={() => setOpen(false)} title="Diálogo modal" eyebrow="Overlay com blur"
            footer={<Button variant="primary" onClick={() => setOpen(false)}>Entendi</Button>}>
            Esc ou clique fora fecham. Backdrop com blur(10px).
          </Dialog>
        </Spec>
      </div>
    </Section>
  );
}

function useTicking(start: number, ms = 1400) {
  const [v, setV] = React.useState(start);
  React.useEffect(() => { const id = setInterval(() => setV(x => +(x * (1 + (Math.random() - 0.5) * 0.004)).toFixed(2)), ms); return () => clearInterval(id); }, [ms]);
  return v;
}

function MarketSection() {
  const price = useTicking(38.42);
  const [sel, setSel] = React.useState("PETR4");
  const rows = [
    { symbol: "PETR4", name: "Petrobras PN", price: 38.42, change: 1.21, seed: 7 },
    { symbol: "VALE3", name: "Vale ON", price: 61.27, change: -0.64, seed: 11 },
    { symbol: "ITUB4", name: "Itaú Unibanco PN", price: 34.18, change: 0, seed: 19 },
  ];
  return (
    <Section id="market" title="Market" count="4 componentes">
      <div className="grid gap-2 lg:grid-cols-2">
        <Spec name="Delta" file="market/Delta.tsx">
          <Row label="Direção"><Delta value={1.21} /><Delta value={-0.64} /><Delta value={0} /></Row>
          <Row label="Tipos"><Delta value={0.42} kind="abs" /><Delta value={-12} kind="bps" /><Delta value={2.08} arrow={false} /><Delta value={-1.1} sign={false} /></Row>
          <Row label="Pill"><Delta value={1.21} variant="pill" /><Delta value={-2.31} variant="pill" /><Delta value={0} variant="pill" /></Row>
          <Row label="Tamanhos">{(["xs", "sm", "md", "lg", "xl"] as const).map(s => <Delta key={s} value={0.42} size={s} />)}</Row>
        </Spec>
        <Spec name="PriceTicker" file="market/PriceTicker.tsx">
          <Row label="Ao vivo (flash)"><PriceTicker value={price} prefix="R$" size="xl" /></Row>
          <Row label="Tamanhos">{(["xs", "sm", "md", "lg"] as const).map(s => <PriceTicker key={s} value={price} size={s} />)}</Row>
          <Row label="Sem flash"><PriceTicker value={price} flash={false} color="var(--text-secondary)" /><PriceTicker value={131420} decimals={0} prefix="pts" /></Row>
        </Spec>
      </div>
      <Spec name="WatchRow" file="market/WatchRow.tsx">
        <div className="grid gap-2 lg:grid-cols-2">
          <div className="flex flex-col">
            {rows.map(r => <WatchRow key={r.symbol} {...r} series={series(r.seed)} selected={sel === r.symbol} signal={r.symbol === "VALE3" ? "down" : r.symbol === "ITUB4" ? "sand" : undefined} onClick={() => setSel(r.symbol)} />)}
          </div>
          <div className="flex flex-col">
            <WatchRow symbol="WEGE3" name="Hover forçado" price={52.9} change={2.08} series={series(23)} forceHover />
            <WatchRow symbol="BBAS3" name="Sem série" price={27.61} change={-1.12} />
            <WatchRow symbol="ABEV3" price={12.08} change={0.08} series={series(43)} dense />
          </div>
        </div>
      </Spec>
      <Spec name="TickerTape" file="market/TickerTape.tsx">
        <TickerTape items={[
          { symbol: "IBOV", price: 131420, change: 0.42, decimals: 0 }, { symbol: "USDBRL", price: 5.4321, change: -0.21, decimals: 4 },
          ...rows.map(r => ({ symbol: r.symbol, price: r.price, change: r.change, signal: r.symbol === "PETR4" })),
          { symbol: "MGLU3", price: 9.84, change: -2.31 }, { symbol: "WEGE3", price: 52.9, change: 2.08, signal: true },
        ]} speed={40} />
      </Spec>
    </Section>
  );
}

function ChartsSection() {
  const [scan, setScan] = React.useState(true);
  const report = React.useMemo(() => CandleChart.generateSeries({ seed: 3, start: 130870, count: 84, vol: 0.0011 }), []);
  const notes: Annotation[] = [
    { id: "z", type: "zone", from: report[30].l, to: report[30].h * 1.0006, label: "Lateralização" },
    { id: "m1", type: "marker", t: report[14].t, side: "buy", label: "Compra" },
    { id: "m2", type: "marker", t: report[38].t, side: "sell", label: "Venda" },
    { id: "t", type: "trend", t1: report[40].t, p1: report[40].l, t2: report[70].t, p2: report[70].l, label: "Tendência" },
    { id: "l", type: "level", price: report[60].h, label: "Alvo" },
  ];
  const [mean, setMean] = React.useState(100);
  return (
    <Section id="charts" title="Charts" count="5 componentes">
      <Spec name="CandleChart" file="charts/CandleChart.tsx">
        <Row label="Ao vivo"><Switch checked={scan} onChange={setScan} size="sm" label="Auto-análise + feixe + campo" /></Row>
        <CandleChart live autoAnalyze={scan} scanning={scan} field={scan} height={340} watermark="PETR4 · 5m" />
        <Row label="Anotações">
          <span className="text-xs text-fg-tertiary">zona · marcadores compra/venda · tendência · nível — dados controlados, sem volume</span>
        </Row>
        <CandleChart data={report} annotations={notes} height={280} decimals={0} ma={[9]} showVolume={false} />
      </Spec>
      <div className="grid gap-2 lg:grid-cols-3">
        <Spec name="Sparkline" file="charts/Sparkline.tsx">
          <Row label="Alta"><Sparkline data={series(7)} liveDot /></Row>
          <Row label="Baixa"><Sparkline data={series(11).reverse()} /></Row>
          <Row label="Sem área"><Sparkline data={series(19)} area={false} baseline={false} color="var(--accent)" /></Row>
          <Row label="Vazio"><Sparkline data={[]} /></Row>
        </Spec>
        <Spec name="FlowArea" file="charts/FlowArea.tsx">
          <FlowArea live height={96} />
          <FlowArea data={series(5, 40)} height={64} color="var(--market-down)" grid={false} />
        </Spec>
        <Spec name="DistributionCurve" file="charts/DistributionCurve.tsx">
          <DistributionCurve mean={mean} sd={4} target={104} height={150} />
          <SegmentedControl size="sm" options={["96", "100", "104"]} value={String(mean)} onChange={v => setMean(Number(v))} />
          <DistributionCurve mean={100} sd={4} showProbability={false} height={80} />
        </Spec>
      </div>
      <Spec name="ProbabilityField" file="charts/ProbabilityField.tsx">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="h-40 rounded-lg bg-inset"><ProbabilityField /></div>
          <div className="h-40 rounded-lg bg-inset"><ProbabilityField peak={0.25} spread={0.12} wire={false} /></div>
          <div className="h-40 rounded-lg bg-inset"><ProbabilityField colorVar="--info-400" intensity={0.7} speed={2} /></div>
        </div>
      </Spec>
    </Section>
  );
}

function AnalysisSection() {
  const [v, setV] = React.useState(64);
  const [fresh, setFresh] = React.useState(0);
  return (
    <Section id="analysis" title="Analysis" count="4 componentes">
      <div className="grid gap-2 lg:grid-cols-3">
        <Spec name="SentimentGauge" file="analysis/SentimentGauge.tsx">
          <div className="grid place-items-center"><SentimentGauge value={v} /></div>
          <SegmentedControl size="sm" fullWidth options={["12", "35", "50", "64", "90"]} value={String(v)} onChange={x => setV(Number(x))} />
        </Spec>
        <Spec name="ConfidenceMeter" file="analysis/ConfidenceMeter.tsx">
          <ConfidenceMeter value={78} />
          <ConfidenceMeter value={42} tone="down" label="Risco" segments={18} />
          <ConfidenceMeter value={0} label="Vazio" size="sm" />
          <div className="flex items-end gap-6">
            <ConfidenceMeter value={81} variant="arc" />
            <ConfidenceMeter value={58} variant="arc" size="sm" tone="up" />
          </div>
        </Spec>
        <Spec name="MetricRow" file="analysis/MetricRow.tsx">
          <div>
            <MetricRow icon="trending-up" label="Regime atual" value="Tendência de alta" />
            <MetricRow icon="scale" label="Risco / retorno" value="2,4 : 1" tone="neutral" />
            <MetricRow icon="crosshair" label="Nível-chave" value="37,88" sub="suporte" tone="up" />
            <MetricRow icon="globe" label="Fluxo estrangeiro" value="−R$ 312 mi" tone="down" onClick={() => undefined} />
            <MetricRow label="Sem ícone, denso" value="3 de 4" tone="muted" dense />
          </div>
        </Spec>
      </div>
      <Spec name="SignalCard" file="analysis/SignalCard.tsx">
        <Row label="Novo"><Button size="sm" icon="refresh-cw" onClick={() => setFresh(f => f + 1)}>Reenviar sinal</Button></Row>
        <div className="grid gap-2 lg:grid-cols-3">
          <SignalCard key={fresh} fresh kind="buy" symbol="PETR4" timeframe="5m" time="14:32" title="Rompimento confirmado acima de R$ 38,10"
            body="Fechamento acima da resistência de três testes, com volume 2,1× a média de 20 períodos. Invalida se voltar a fechar abaixo de 37,70."
            confidence={78} levels={[{ label: "Entrada", value: "38,12" }, { label: "Alvo", value: "38,73", tone: "up" }, { label: "Stop", value: "37,81", tone: "down" }]} tags={["Rompimento", "Volume"]} />
          <SignalCard selected kind="sell" symbol="MGLU3" timeframe="5m" time="11:42" title="Perda da VWAP com fluxo vendedor" body="Três velas de baixa consecutivas com saldo de agressão negativo." confidence={64} tags={["Fluxo"]} onClick={() => undefined} />
          <div className="flex flex-col gap-2">
            <SignalCard compact kind="watch" symbol="ITUB4" timeframe="15m" time="12:20" title="Testando a VWAP pela terceira vez" />
            <SignalCard compact kind="alert" symbol="VALE3" timeframe="1m" time="13:05" title="Volume atípico nos últimos 3 minutos" />
            <SignalCard compact kind="pattern" symbol="WEGE3" timeframe="1h" time="15:10" title="Bandeira de alta em formação" />
          </div>
        </div>
      </Spec>
    </Section>
  );
}

function Sampler() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" icon="sparkles">Analisar agora</Button>
        <Button>Secundário</Button>
        <Button variant="outline" icon="bell">Alerta</Button>
        <Button variant="buy">Comprar</Button>
        <Button variant="sell">Vender</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="up">Alta</Badge><Badge tone="down">Baixa</Badge><Badge tone="sand" dot>Claritas</Badge><Badge tone="warn" variant="solid">Leilão</Badge>
        <Delta value={1.21} variant="pill" /><Delta value={-0.64} variant="pill" /><LiveIndicator status="analyzing" size="sm" />
      </div>
      <Input label="Preço" prefix="R$" mono defaultValue="38,42" hint="Último: 38,38" />
      <div className="flex gap-6"><Checkbox defaultChecked label="Anexar leitura" /><Switch defaultChecked label="Som" /></div>
      <SignalCard kind="buy" symbol="PETR4" timeframe="5m" time="14:32" title="Rompimento confirmado acima de R$ 38,10" confidence={78} tags={["Volume"]} />
      <CandleChart height={200} autoAnalyze ma={[9, 21]} />
    </div>
  );
}

function ThemesSection() {
  return (
    <Section id="temas" title="Temas lado a lado" count="dark (canônico) · light (derivado)">
      <div className="grid gap-2 lg:grid-cols-2">
        {(["dark", "light"] as const).map(t => (
          <div key={t} data-theme={t} className="flex flex-col gap-3 rounded-xl bg-app p-4 text-fg shadow-panel">
            <span className="cl-label">{t === "dark" ? "Escuro — canônico" : "Claro — derivado, provisório"}</span>
            <Sampler />
          </div>
        ))}
      </div>
    </Section>
  );
}

function TemplatesSection() {
  return (
    <Section id="templates" title="Templates" count="design-system/templates">
      <Panel eyebrow="Claritas Terminal" title="Pregão ao vivo · Scanner · Relatório de fechamento" actions={<Link href="/design-system/terminal" className="text-sm">Abrir em tela cheia →</Link>}>
        <div className="relative h-96 overflow-hidden rounded-lg bg-inset">
          <iframe title="Claritas Terminal" src="/design-system/terminal" className="absolute left-0 top-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" />
        </div>
      </Panel>
    </Section>
  );
}

/* ---------- page ---------- */

export function Showcase() {
  const [theme, setTheme] = React.useState<Theme>("dark");
  React.useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage blocked */ }
  }, [theme]);

  return (
    <div className="min-h-full bg-app text-fg">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-line-subtle bg-app px-6 py-3">
        <Wordmark size={22} product="Design system" />
        <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-1">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="text-sm text-fg-tertiary hover:text-fg hover:no-underline">{label}</a>)}
        </nav>
        <SegmentedControl size="sm" mono={false} options={[{ value: "dark", label: "Escuro" }, { value: "light", label: "Claro" }]} value={theme} onChange={v => setTheme(v as Theme)} />
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-10">
        <div className="flex flex-col gap-3">
          <span className="cl-label">Fonte da verdade: DESIGN.md · biblioteca: design-system/</span>
          <h1 className="font-serif text-5xl text-fg">A biblioteca inteira, <i className="text-accent">em todos os estados.</i></h1>
          <p className="max-w-3xl text-fg-secondary">35 componentes em 7 grupos, tokens, template do terminal e os dois temas. Areia é a voz da análise: se a Claritas não gerou, não é areia.</p>
        </div>
        <Foundations />
        <CoreSection />
        <FormsSection />
        <NavigationSection />
        <FeedbackSection />
        <MarketSection />
        <ChartsSection />
        <AnalysisSection />
        <ThemesSection />
        <TemplatesSection />
      </main>
    </div>
  );
}
