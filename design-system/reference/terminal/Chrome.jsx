function useClock() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return t.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function MacroQuote({ q }) {
  const { Delta, Sparkline, PriceTicker } = window.ClaritasDesignSystem_c8f168;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ font: '500 11px/1 var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.02em' }}>{q.symbol}</span>
          <PriceTicker value={q.price} decimals={q.decimals ?? 2} size="xs" color="var(--text-secondary)" />
        </span>
        <Delta value={q.change} size="xs" arrow={false} />
      </div>
      <Sparkline data={q.series} width={64} height={24} color={q.change >= 0 ? 'var(--accent)' : 'var(--market-down-text)'} baseline={false} animate={false} area={false} strokeWidth={1.25} />
    </div>
  );
}

function TopBar({ macro, onAlert }) {
  const { Wordmark, Input, LiveIndicator, IconButton, Tooltip } = window.ClaritasDesignSystem_c8f168;
  const clock = useClock();
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 28, height: 60, padding: '0 16px 0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
      <Wordmark size={22} product="Terminal" />
      <Input icon="search" placeholder="Buscar ativo ou perguntar à Claritas…" kbd="/" size="sm" style={{ width: 380 }} />
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 28 }}>{macro.slice(0, 3).map(q => <MacroQuote key={q.symbol} q={q} />)}</div>
      <div style={{ width: 1, height: 26, background: 'var(--border-default)' }} />
      <LiveIndicator status="live" detail={clock} />
      <div style={{ display: 'flex', gap: 2 }}>
        <IconButton icon="bell" label="Alertas" badge onClick={onAlert} />
      </div>
      <Tooltip content="Marina Duarte · Plano Pro" placement="bottom">
        <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 30, border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', font: '500 11px/1 var(--font-mono)' }}>MD</span>
      </Tooltip>
    </header>
  );
}

function Rail({ screen, onScreen }) {
  const { IconButton } = window.ClaritasDesignSystem_c8f168;
  const items = [
    { id: 'desk', icon: 'chart-candlestick', label: 'Pregão ao vivo' },
    { id: 'scanner', icon: 'radar', label: 'Scanner' },
    { id: 'report', icon: 'file-text', label: 'Relatório de fechamento' },
  ];
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 'var(--rail-w)', padding: '12px 0', borderRight: '1px solid var(--border-subtle)' }}>
      {items.map(i => <IconButton key={i.id} icon={i.icon} label={i.label} active={screen === i.id} onClick={() => onScreen(i.id)} />)}
      <div style={{ flex: 1 }} />
      <IconButton icon="history" label="Replay de pregões" />
      <IconButton icon="settings" label="Ajustes" />
    </nav>
  );
}

Object.assign(window, { TopBar, Rail });
