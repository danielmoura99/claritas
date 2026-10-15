const SETUPS = [
  { k: 'Rompimento', tone: 'up' }, { k: 'Pullback na MM21', tone: 'up' }, { k: 'Divergência IFR', tone: 'sand' },
  { k: 'Perda da VWAP', tone: 'down' }, { k: 'Bandeira', tone: 'sand' }, { k: 'Topo duplo', tone: 'down' },
];

function ScannerScreen({ quotes, onOpen }) {
  const { Panel, Checkbox, Select, SegmentedControl, Button, Badge, Sparkline, Delta, PriceTicker, ConfidenceMeter, LiveIndicator } = window.ClaritasDesignSystem_c8f168;
  const [found, setFound] = React.useState([]);
  const [scanned, setScanned] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  const total = 84;
  React.useEffect(() => {
    if (!running) return;
    setFound([]); setScanned(0);
    let n = 0;
    const id = setInterval(() => {
      n += 3; setScanned(Math.min(total, n));
      if (n % 9 === 0 && n / 9 <= quotes.length) {
        const q = quotes[(n / 9 - 1) % quotes.length]; const s = SETUPS[(n / 9) % SETUPS.length];
        setFound(f => [{ ...q, setup: s, conf: 48 + ((q.seed * 7) % 44), at: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/Sao_Paulo' }) }, ...f]);
      }
      if (n >= total) { setRunning(false); clearInterval(id); }
    }, 140);
    return () => clearInterval(id);
  }, [running]);
  const pct = (scanned / total) * 100;
  const col = 'minmax(0,1.3fr) 110px 90px 80px minmax(0,1.2fr) 150px 80px';
  return (
    <div style={{ display: 'flex', gap: 'var(--panel-gap)', flex: 1, minHeight: 0 }}>
      <Panel eyebrow="Critérios" title="Scanner" style={{ width: 260, flexShrink: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        footer={<Button variant="primary" icon="radar" fullWidth loading={running} onClick={() => setRunning(true)}>{running ? 'Varrendo…' : 'Varrer novamente'}</Button>}>
        <Select label="Universo" options={['Ibovespa (84)', 'IBrX-100', 'Small caps', 'Minha carteira']} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ font: 'var(--text-label)', letterSpacing: 'var(--label-track)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Tempo gráfico</span>
          <SegmentedControl size="sm" fullWidth options={['5m', '15m', '1h', 'D']} defaultValue="15m" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ font: 'var(--text-label)', letterSpacing: 'var(--label-track)', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Setups</span>
          <Checkbox defaultChecked label="Rompimentos" description="Fechamento acima de resistência" />
          <Checkbox defaultChecked label="Pullbacks em médias" />
          <Checkbox defaultChecked label="Divergências de IFR" />
          <Checkbox label="Padrões gráficos" />
          <Checkbox defaultChecked label="Perda de VWAP" />
        </div>
        <Checkbox label="Só volume acima da média" />
      </Panel>
      <Panel padding={false} style={{ flex: 1, minWidth: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ position: 'relative', padding: '18px 20px 16px', borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          {running && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '22%', background: 'var(--scan-beam)', borderRight: '1px solid rgba(243,237,226,.8)', animation: 'cl-scan 1.6s linear infinite', pointerEvents: 'none' }} />}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <LiveIndicator status={running ? 'analyzing' : 'live'} label={running ? 'Varrendo o Ibovespa' : 'Varredura concluída'} detail={`${scanned}/${total} ativos`} />
              <span style={{ font: '400 30px/1.1 var(--font-serif)', color: 'var(--text-primary)' }}>{found.length} {found.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas'}</span>
            </div>
            <span style={{ font: '500 26px/1 var(--font-mono)', color: 'var(--accent)', letterSpacing: '-0.02em' }}>{Math.round(pct)}%</span>
          </div>
          <div style={{ position: 'relative', height: 2, marginTop: 14, background: 'var(--ink-700)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: pct + '%', background: 'var(--accent)', borderRadius: 2, boxShadow: '0 0 10px var(--accent)', transition: 'width 140ms linear' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: col, gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['Ativo', 'Intraday', 'Último', 'Var.', 'Setup', 'Confiança', 'Hora'].map(h => <span key={h} style={{ font: 'var(--text-label)', letterSpacing: 'var(--label-track)', textTransform: 'uppercase', color: 'var(--text-tertiary)', textAlign: ['Último', 'Var.', 'Hora'].includes(h) ? 'right' : 'left' }}>{h}</span>)}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {found.map(r => (
            <div key={r.symbol} onClick={() => onOpen(r.symbol)} style={{ display: 'grid', gridTemplateColumns: col, gap: 16, alignItems: 'center', height: 52, padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', animation: 'cl-rise var(--dur-slow) var(--ease-out)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ font: '600 12.5px/1 var(--font-mono)', color: 'var(--text-primary)' }}>{r.symbol}</span>
                <span style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              </span>
              <Sparkline data={r.series} width={110} height={26} />
              <span style={{ textAlign: 'right' }}><PriceTicker value={r.price} size="sm" /></span>
              <span style={{ textAlign: 'right' }}><Delta value={r.change} size="xs" /></span>
              <span><Badge tone={r.setup.tone} variant="outline">{r.setup.k}</Badge></span>
              <ConfidenceMeter value={r.conf} label={null} showValue={false} size="sm" segments={14} />
              <span style={{ textAlign: 'right', font: '400 11px/1 var(--font-mono)', color: 'var(--text-tertiary)' }}>{r.at}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
window.ScannerScreen = ScannerScreen;
