const fmtBR = (v, d = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const LBL = { font: 'var(--text-label)', letterSpacing: 'var(--label-track)', textTransform: 'uppercase', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' };

function Thinking({ thoughts }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => { const id = setInterval(() => setI(x => (x + 1) % thoughts.length), 2200); return () => clearInterval(id); }, []);
  return (
    <span key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, font: '400 12px/1 var(--font-mono)', backgroundImage: 'linear-gradient(90deg,var(--ink-500) 0%,var(--sand-200) 50%,var(--ink-500) 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', animation: 'cl-shimmer 2.2s linear infinite, cl-fade 300ms var(--ease-out)' }}>
      {thoughts[i]}…
    </span>
  );
}

function Stat({ k, v }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
      <span style={{ ...LBL, fontSize: 10 }}>{k}</span>
      <span style={{ font: '500 12px/1 var(--font-mono)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </span>
  );
}

function ChartStage({ asset, quotes, signals, onSelect, live, onTick, auto, setAuto, thoughts, onAlert }) {
  const { Panel, PriceTicker, Delta, SegmentedControl, IconButton, Switch, CandleChart, Icon, Button } = window.ClaritasDesignSystem_c8f168;
  const [tf, setTf] = React.useState('5m');
  const s = live.series || [];
  const vwap = s.length ? s.reduce((a, c) => a + ((c.h + c.l + c.c) / 3) * c.v, 0) / s.reduce((a, c) => a + c.v, 0) : 0;
  const hi = s.length ? Math.max(...s.map(c => c.h)) : 0, lo = s.length ? Math.min(...s.map(c => c.l)) : 0;
  const price = live.price || asset.price; const chg = live.change ?? asset.change;
  const abs = price - price / (1 + chg / 100);
  return (
    <Panel padding={false} style={{ minWidth: 0, minHeight: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '18px 16px 10px 22px' }}>
        <SymbolPicker asset={asset} quotes={quotes} onSelect={onSelect} signals={signals} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PriceTicker value={price} size="lg" weight={400} />
          <span style={{ display: 'flex', gap: 10 }}><Delta value={abs} kind="abs" size="sm" arrow={false} /><Delta value={chg} size="sm" arrow={false} /></span>
        </div>
        <div style={{ flex: 1 }} />
        <SegmentedControl size="sm" options={['1m', '5m', '15m', '1h', 'D']} value={tf} onChange={setTf} />
        <div style={{ display: 'flex', gap: 2 }}>
          <IconButton icon="star" label="Favoritar" size="sm" />
          <IconButton icon="layers" label="Indicadores" size="sm" />
          <IconButton icon="maximize-2" label="Tela cheia" size="sm" />
        </div>
        <Button variant="outline" size="sm" icon="bell" onClick={onAlert}>Alerta</Button>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 6px 0 10px' }}>
        <CandleChart key={asset.symbol + tf} seed={asset.seed + tf.length} start={asset.price * (1 - asset.change / 100)} live tickMs={tf === '1m' ? 420 : 650}
          ticksPerCandle={tf === '1m' ? 5 : 9} autoAnalyze={auto} scanning={auto} field={auto} height="100%" window={78} onTick={onTick} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 40, padding: '0 18px 0 16px', borderTop: '1px solid var(--border-subtle)' }}>
        <Switch size="sm" checked={auto} onChange={setAuto} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: auto ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          <Icon name="sparkles" size={13} />
          <span style={{ font: '500 10.5px/1 var(--font-mono)', letterSpacing: 'var(--label-track)', textTransform: 'uppercase' }}>Claritas</span>
        </span>
        {auto ? <Thinking thoughts={thoughts} /> : <span style={{ font: '400 12px/1 var(--font-mono)', color: 'var(--text-tertiary)' }}>análise automática pausada</span>}
        <div style={{ flex: 1, minWidth: 8 }} />
        <Stat k="VWAP" v={fmtBR(vwap)} /><Stat k="Máx" v={fmtBR(hi)} /><Stat k="Mín" v={fmtBR(lo)} />
      </div>
    </Panel>
  );
}

function AnalysisRail({ asset, price, feed, bias, freshId, onPick }) {
  const { Panel, Tabs, SignalCard, LiveIndicator, MetricRow, Icon, ConfidenceMeter } = window.ClaritasDesignSystem_c8f168;
  const [tab, setTab] = React.useState('sum');
  const glowing = freshId && Date.now() - freshId < 2500;
  const word = bias >= 60 ? 'Viés comprador' : bias <= 40 ? 'Viés vendedor' : 'Viés neutro';
  const conf = bias >= 72 || bias <= 30 ? 'Confiança alta' : 'Confiança média';
  const sup = price * 0.986, tgt = price * 1.021;
  const body = bias >= 60
    ? `${asset.symbol} sustenta força relativa acima do Ibovespa, com compradores defendendo cada recuo. O preço segue acima da VWAP e do suporte em ${fmtBR(sup)}, com volume saudável — cenário de continuidade.`
    : `${asset.symbol} perdeu ritmo desde o meio do pregão. Volume em queda e preço oscilando em torno da VWAP: sem vantagem clara até sair da faixa.`;
  return (
    <Panel padding={false} glow={glowing ? 'sand' : false} style={{ minWidth: 0, minHeight: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 0' }}>
        <span style={LBL}>Leitura Claritas</span>
        <LiveIndicator status="analyzing" size="sm" label="Ao vivo" />
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '18px 18px 0' }}>
        <span style={{ position: 'relative', width: 14, height: 14, flexShrink: 0, color: 'var(--accent)' }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'var(--accent)', boxShadow: '0 0 16px rgba(200,178,142,.7)', animation: 'cl-pulse 2s var(--ease-out) infinite' }} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span key={word} style={{ font: '400 28px/1 var(--font-serif)', color: 'var(--text-primary)', animation: 'cl-fade 500ms var(--ease-out)' }}>{word}</span>
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>{conf} · {Math.round(bias)}%</span>
        </div>
      </div>
      <p key={word} style={{ margin: 0, padding: '14px 18px 4px', font: '400 13.5px/1.6 var(--font-sans)', color: 'var(--text-secondary)', textWrap: 'pretty', animation: 'cl-fade 500ms var(--ease-out)' }}>{body}</p>
      <div style={{ padding: '0 18px' }}>
        <Tabs size="sm" value={tab} onChange={setTab} items={[{ value: 'sum', label: 'Resumo' }, { value: 'sig', label: 'Sinais', count: feed.length }, { value: 'tech', label: 'Técnico' }]} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '6px 18px 14px' }}>
        {tab === 'sum' && (<>
          <MetricRow icon="trending-up" label="Regime atual" value={bias >= 55 ? 'Tendência de alta' : 'Lateral'} />
          <MetricRow icon="scale" label="Risco / retorno" value={`${fmtBR(1.8 + bias / 100, 1)} : 1`} />
          <MetricRow icon="crosshair" label="Nível-chave" value={fmtBR(sup)} sub="suporte" />
          <MetricRow icon="target" label="Próximo alvo" value={fmtBR(tgt)} sub={`+${fmtBR((tgt / price - 1) * 100, 1)}%`} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 14, padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-panel)', cursor: 'pointer' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'var(--accent-tint)', color: 'var(--accent)' }}><Icon name="move-up-right" size={16} /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
              <span style={{ ...LBL, fontSize: 10 }}>Estratégia</span>
              <span style={{ font: '500 14px/1.3 var(--font-sans)', color: 'var(--text-primary)' }}>{bias >= 60 ? 'Comprar nos recuos' : 'Aguardar rompimento'}</span>
              <span style={{ font: '400 12px/1.5 var(--font-sans)', color: 'var(--text-tertiary)' }}>Entradas perto de {fmtBR(sup)}, alvo em {fmtBR(tgt)}. Invalida abaixo de {fmtBR(sup * 0.994)}.</span>
            </div>
            <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
          </div>
        </>)}
        {tab === 'sig' && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>{feed.map((f, i) => (
          <SignalCard key={f.id} fresh={f.id === freshId} compact={i > 0} kind={f.kind} symbol={f.symbol} timeframe={f.tf} time={f.time} title={f.title} body={f.body} levels={i === 0 ? f.levels : undefined} confidence={i === 0 ? f.conf : undefined} onClick={() => onPick(f.symbol)} />
        ))}</div>}
        {tab === 'tech' && (<div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          {[['Tendência (MM9 × MM21)', bias + 6], ['Força relativa vs. IBOV', bias - 4], ['Fluxo de agressão', bias + 2], ['Volatilidade', 46]].map(([l, v]) => <ConfidenceMeter key={l} label={l} value={Math.max(5, Math.min(98, v))} segments={18} />)}
        </div>)}
      </div>
    </Panel>
  );
}

function Widget({ title, children, action }) {
  const { Panel, IconButton } = window.ClaritasDesignSystem_c8f168;
  return (
    <Panel eyebrow={title} actions={action || <IconButton icon="maximize-2" label="Expandir" size="sm" />} padding="4px 18px 16px" style={{ minWidth: 0, minHeight: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column' }}>
      {children}
    </Panel>
  );
}

function Widgets({ price, bias }) {
  const { SentimentGauge, FlowArea, DistributionCurve, MetricRow } = window.ClaritasDesignSystem_c8f168;
  const [net, setNet] = React.useState(1.24);
  const [inst, setInst] = React.useState(68);
  const [sig, setSig] = React.useState({ vol: 1.8, align: 3, foreign: 312 });
  const base = React.useRef(price);
  React.useEffect(() => {
    const id = setInterval(() => {
      setInst(v => Math.max(55, Math.min(78, v + (Math.random() - 0.5) * 2)));
      setSig(s => ({ vol: Math.max(0.8, s.vol + (Math.random() - 0.48) * 0.12), align: Math.random() < 0.15 ? (s.align === 3 ? 4 : 3) : s.align, foreign: s.foreign + Math.round((Math.random() - 0.4) * 14) }));
    }, 1500);
    return () => clearInterval(id);
  }, []);
  const p = price || base.current || 38;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 'var(--panel-gap)', minHeight: 0 }}>
      <Widget title="Sentimento">
        <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}><SentimentGauge value={bias} size={190} /></div>
      </Widget>
      <Widget title="Fluxo líquido">
        <span style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--text-tertiary)' }}>Hoje, todos os participantes</span>
        <span style={{ font: '400 26px/1 var(--font-mono)', letterSpacing: '-0.03em', color: 'var(--accent)', margin: '10px 0 6px' }}>+R$ {fmtBR(net, 2)} bi</span>
        <FlowArea live height={74} tickMs={900} onTick={d => setNet(Math.max(0.2, 0.6 + d[d.length - 1] / 18))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
          {[['Institucional', inst], ['Varejo', 100 - inst]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--radius-md)', background: 'var(--surface-raised)', font: '400 11.5px/1 var(--font-sans)', color: 'var(--text-tertiary)' }}>
              {k}<span style={{ font: '500 11.5px/1 var(--font-mono)', color: 'var(--text-primary)' }}>{Math.round(v)}%</span>
            </div>
          ))}
        </div>
      </Widget>
      <Widget title="Distribuição de fechamento">
        <DistributionCurve mean={p * (1 + (bias - 50) / 2500)} sd={p * 0.0085} target={p * 1.01} min={p * 0.97} max={p * 1.03} decimals={2} ticks={4} height={170} caption={`chance de fechar ≥ ${fmtBR(p * 1.01)}`} />
      </Widget>
      <Widget title="Sinais-chave" action={<a href="#" onClick={e => e.preventDefault()} style={{ font: '400 11.5px/1 var(--font-sans)', color: 'var(--text-tertiary)' }}>Ver todos →</a>}>
        <MetricRow dense icon="activity" label="Momentum" value={bias >= 55 ? 'Comprador' : 'Neutro'} />
        <MetricRow dense icon="chart-column" label="Volume" value={`${fmtBR(sig.vol, 1)}× média`} />
        <MetricRow dense icon="layers" label="Alinhamento de tempos" value={`${sig.align} de 4`} />
        <MetricRow dense icon="globe" label="Fluxo estrangeiro" value={`${sig.foreign >= 0 ? '+' : '−'}R$ ${Math.abs(sig.foreign)} mi`} tone={sig.foreign >= 0 ? 'sand' : 'down'} style={{ borderBottom: 0 }} />
      </Widget>
    </div>
  );
}

Object.assign(window, { ChartStage, AnalysisRail, Widgets, fmtBR });
