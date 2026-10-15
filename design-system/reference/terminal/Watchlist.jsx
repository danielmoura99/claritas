// Symbol picker: the watchlist lives in a popover so the desk stays quiet.
function SymbolPicker({ asset, quotes, onSelect, signals }) {
  const { WatchRow, Icon, Input } = window.ClaritasDesignSystem_c8f168;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const list = quotes.filter(x => !q || (x.symbol + x.name).toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 6px 6px', margin: '-6px 0 -6px -6px', border: 0, borderRadius: 'var(--radius-md)', background: open ? 'var(--surface-hover)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ font: '600 17px/1 var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>{asset.symbol}</span>
          <span style={{ font: 'var(--text-caption)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{asset.name}</span>
        </span>
        <Icon name="chevron-down" size={14} color="var(--text-tertiary)" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', left: -6, zIndex: 'var(--z-dropdown)', width: 340, padding: 6, borderRadius: 'var(--radius-lg)', background: 'var(--surface-raised)', boxShadow: 'var(--shadow-pop)', animation: 'cl-pop var(--dur-fast) var(--ease-out)' }}>
          <Input icon="search" placeholder="Filtrar" size="sm" value={q} onChange={e => setQ(e.target.value)} style={{ margin: '2px 2px 6px' }} autoFocus />
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {list.map(x => <WatchRow key={x.symbol} symbol={x.symbol} name={x.name} price={x.price} change={x.change} series={x.series} selected={x.symbol === asset.symbol} signal={signals[x.symbol]} onClick={() => { onSelect(x.symbol); setOpen(false); }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
window.SymbolPicker = SymbolPicker;
