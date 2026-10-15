function nowHM() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); }

function makeSignal(tpl, symbol, price, id) {
  const up = tpl.kind === 'buy' || tpl.kind === 'pattern';
  const f = v => fmtBR(v);
  return {
    ...tpl, id, symbol, time: nowHM(),
    levels: tpl.kind === 'watch' || tpl.kind === 'alert' ? [{ label: 'Faixa', value: `${f(price * 0.997)}–${f(price * 1.003)}` }, { label: 'Último', value: f(price) }]
      : [{ label: 'Entrada', value: f(price) }, { label: 'Alvo', value: f(price * (up ? 1.016 : 0.984)), tone: up ? 'up' : 'down' }, { label: 'Stop', value: f(price * (up ? 0.992 : 1.008)), tone: up ? 'down' : 'up' }],
  };
}

function App() {
  const { TickerTape, Toast, Dialog, Button, Input, Select, Checkbox, Switch, CandleChart } = window.ClaritasDesignSystem_c8f168;
  const D = window.CL_DATA;
  const [screen, setScreenRaw] = React.useState(() => localStorage.getItem('cl-kit-screen') || 'desk');
  const setScreen = s => { setScreenRaw(s); localStorage.setItem('cl-kit-screen', s); };
  const [sel, setSel] = React.useState('PETR4');
  const [auto, setAuto] = React.useState(true);
  const [quotes, setQuotes] = React.useState(() => D.assets.map(a => ({ ...a, series: CandleChart.generateSeries({ seed: a.seed, start: a.price * (1 - a.change / 100), count: 48 }).map(c => c.c) })));
  const [macro, setMacro] = React.useState(() => D.macro.map((m, i) => ({ ...m, series: CandleChart.generateSeries({ seed: 90 + i, start: m.price * (1 - m.change / 100), count: 40, vol: 0.0012 }).map(c => c.c) })));
  const [live, setLive] = React.useState({});
  const [feed, setFeed] = React.useState(() => [
    makeSignal(D.signals[3], 'WEGE3', 52.9, 'seed-1'),
    { ...makeSignal(D.signals[2], 'BBAS3', 27.61, 'seed-2'), time: '13:48' },
    { ...makeSignal(D.signals[1], 'ITUB4', 34.18, 'seed-3'), time: '12:20' },
  ]);
  const [freshId, setFreshId] = React.useState(null);
  const [marks, setMarks] = React.useState({ WEGE3: 'sand' });
  const [toasts, setToasts] = React.useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [bias, setBias] = React.useState(64);
  const liveRef = React.useRef(live); liveRef.current = live;
  const selRef = React.useRef(sel); selRef.current = sel;

  const pushToast = t => { const id = Date.now() + Math.random(); setToasts(ts => [{ ...t, id }, ...ts].slice(0, 3)); setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5200); };

  React.useEffect(() => {
    const id = setInterval(() => {
      setQuotes(qs => qs.map(q => {
        if (Math.random() < 0.45) return q;
        const p = q.price * (1 + (Math.random() - 0.5) * 0.0024);
        return { ...q, price: p, change: q.change + ((p - q.price) / q.price) * 100, series: [...q.series.slice(1), p] };
      }));
      setMacro(ms => ms.map(m => { if (Math.random() < 0.4) return m; const p = m.price * (1 + (Math.random() - 0.5) * 0.0008); return { ...m, price: p, change: m.change + ((p - m.price) / m.price) * 100, series: [...m.series.slice(1), p] }; }));
      setBias(b => Math.max(28, Math.min(86, b + (Math.random() - 0.48) * 2.4)));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!auto) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      const tpl = D.signals[(n + 1) % D.signals.length];
      const other = n % 3 === 0;
      const symbol = other ? D.assets[(n * 5) % D.assets.length].symbol : selRef.current;
      const price = other ? D.assets.find(a => a.symbol === symbol).price : liveRef.current.price || 38;
      const sig = makeSignal(tpl, symbol, price, 'sig-' + Date.now());
      setFeed(f => [sig, ...f].slice(0, 14));
      setFreshId(sig.id);
      setMarks(m => ({ ...m, [symbol]: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand' }));
      setBias(b => Math.max(30, Math.min(84, b + (sig.kind === 'buy' ? 4 : sig.kind === 'sell' ? -5 : 1))));
      if (other || screen !== 'desk') pushToast({ tone: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand', title: `Novo sinal em ${symbol}`, message: sig.title, meta: sig.time, action: 'Ver no gráfico', symbol });
    }, 9000);
    return () => clearInterval(id);
  }, [auto, screen]);

  const onTick = React.useCallback(s => {
    const last = s[s.length - 1]; const first = s[0];
    setLive({ price: last.c, change: ((last.c - first.o) / first.o) * 100, series: s });
  }, []);

  const open = sym => { setSel(sym); setScreen('desk'); setMarks(m => ({ ...m, [sym]: undefined })); };
  const asset = D.assets.find(a => a.symbol === sel);
  const shown = quotes.map(q => (q.symbol === sel && live.price ? { ...q, price: live.price, change: live.change } : q));
  const tape = [...macro, ...shown.map(q => ({ symbol: q.symbol, price: q.price, change: q.change, signal: !!marks[q.symbol] }))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 1280, overflow: 'hidden', background: 'var(--bg-app)' }}>
      <TopBar macro={macro} onAlert={() => setAlertOpen(true)} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Rail screen={screen} onScreen={setScreen} />
        <main style={{ flex: 1, display: 'flex', gap: 'var(--panel-gap)', padding: 10, minWidth: 0, minHeight: 0 }}>
          {screen === 'desk' && (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gridTemplateRows: 'minmax(0,1fr) 260px', gap: 'var(--panel-gap)', minWidth: 0, minHeight: 0 }}>
              <ChartStage asset={asset} quotes={shown} signals={marks} onSelect={open} live={live} onTick={onTick} auto={auto} setAuto={setAuto} thoughts={D.thoughts} onAlert={() => setAlertOpen(true)} />
              <AnalysisRail asset={asset} price={live.price || asset.price} feed={feed} bias={bias} freshId={freshId} onPick={open} />
              <div style={{ gridColumn: '1 / -1', display: 'grid', minHeight: 0 }}><Widgets price={live.price} bias={bias} /></div>
            </div>
          )}
          {screen === 'scanner' && <ScannerScreen quotes={quotes} onOpen={open} />}
          {screen === 'report' && <ReportScreen quotes={quotes} onOpen={open} />}
        </main>
      </div>
      <TickerTape items={tape} speed={80} height={30} onSelect={s => D.assets.some(a => a.symbol === s) && open(s)} style={{ borderBottom: 0, borderTop: '1px solid var(--border-subtle)', background: 'transparent' }} />
      <div style={{ position: 'fixed', top: 72, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 'var(--z-toast)' }}>
        {toasts.map(t => <Toast key={t.id} {...t} onAction={() => open(t.symbol)} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />)}
      </div>
      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} eyebrow={`${asset.symbol} · ${asset.name}`} title="Criar alerta" width={420}
        footer={<><Button variant="ghost" onClick={() => setAlertOpen(false)}>Cancelar</Button><Button variant="primary" icon="bell" onClick={() => { setAlertOpen(false); pushToast({ tone: 'info', title: 'Alerta criado', message: `${asset.symbol} cruzando R$ ${fmtBR((live.price || asset.price) * 1.01)}`, meta: nowHM() }); }}>Criar alerta</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Condição" options={['Preço cruzar para cima', 'Preço cruzar para baixo', 'Novo sinal Claritas', 'Volume atípico']} />
            <Input label="Preço" prefix="R$" mono defaultValue={fmtBR((live.price || asset.price) * 1.01)} hint={`Último: ${fmtBR(live.price || asset.price)}`} />
          </div>
          <Checkbox defaultChecked label="Anexar leitura Claritas" description="O alerta chega com a análise do gráfico no momento do disparo." />
          <Switch defaultChecked size="sm" label="Som de alerta" />
        </div>
      </Dialog>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
