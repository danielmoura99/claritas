/* Precompiled from the .jsx files in this folder (same order index.html used to load them with Babel in the browser).
   Classic script so the page opens straight from file:// without a dev server. Regenerate if you edit the .jsx. */

/* ---- Chrome.jsx ---- */
function useClock() {
  const [t, setT] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
}
function MacroQuote({
  q
}) {
  const {
    Delta,
    Sparkline,
    PriceTicker
  } = window.ClaritasDesignSystem_c8f168;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)',
      letterSpacing: '0.02em'
    }
  }, q.symbol), /*#__PURE__*/React.createElement(PriceTicker, {
    value: q.price,
    decimals: q.decimals ?? 2,
    size: "xs",
    color: "var(--text-secondary)"
  })), /*#__PURE__*/React.createElement(Delta, {
    value: q.change,
    size: "xs",
    arrow: false
  })), /*#__PURE__*/React.createElement(Sparkline, {
    data: q.series,
    width: 64,
    height: 24,
    color: q.change >= 0 ? 'var(--accent)' : 'var(--market-down-text)',
    baseline: false,
    animate: false,
    area: false,
    strokeWidth: 1.25
  }));
}
function TopBar({
  macro,
  onAlert
}) {
  const {
    Wordmark,
    Input,
    LiveIndicator,
    IconButton,
    Tooltip
  } = window.ClaritasDesignSystem_c8f168;
  const clock = useClock();
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      height: 60,
      padding: '0 16px 0 20px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 22,
    product: "Terminal"
  }), /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Buscar ativo ou perguntar \xE0 Claritas\u2026",
    kbd: "/",
    size: "sm",
    style: {
      width: 380
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28
    }
  }, macro.slice(0, 3).map(q => /*#__PURE__*/React.createElement(MacroQuote, {
    key: q.symbol,
    q: q
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 26,
      background: 'var(--border-default)'
    }
  }), /*#__PURE__*/React.createElement(LiveIndicator, {
    status: "live",
    detail: clock
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Alertas",
    badge: true,
    onClick: onAlert
  })), /*#__PURE__*/React.createElement(Tooltip, {
    content: "Marina Duarte \xB7 Plano Pro",
    placement: "bottom"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 30,
      height: 30,
      borderRadius: 30,
      border: '1px solid var(--border-strong)',
      color: 'var(--text-secondary)',
      font: '500 11px/1 var(--font-mono)'
    }
  }, "MD")));
}
function Rail({
  screen,
  onScreen
}) {
  const {
    IconButton
  } = window.ClaritasDesignSystem_c8f168;
  const items = [{
    id: 'desk',
    icon: 'chart-candlestick',
    label: 'Pregão ao vivo'
  }, {
    id: 'scanner',
    icon: 'radar',
    label: 'Scanner'
  }, {
    id: 'report',
    icon: 'file-text',
    label: 'Relatório de fechamento'
  }];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      width: 'var(--rail-w)',
      padding: '12px 0',
      borderRight: '1px solid var(--border-subtle)'
    }
  }, items.map(i => /*#__PURE__*/React.createElement(IconButton, {
    key: i.id,
    icon: i.icon,
    label: i.label,
    active: screen === i.id,
    onClick: () => onScreen(i.id)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "history",
    label: "Replay de preg\xF5es"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "settings",
    label: "Ajustes"
  }));
}
Object.assign(window, {
  TopBar,
  Rail
});

/* ---- Watchlist.jsx ---- */
// Symbol picker: the watchlist lives in a popover so the desk stays quiet.
function SymbolPicker({
  asset,
  quotes,
  onSelect,
  signals
}) {
  const {
    WatchRow,
    Icon,
    Input
  } = window.ClaritasDesignSystem_c8f168;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const list = quotes.filter(x => !q || (x.symbol + x.name).toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setOpen(o => !o),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 10px 6px 6px',
      margin: '-6px 0 -6px -6px',
      border: 0,
      borderRadius: 'var(--radius-md)',
      background: open ? 'var(--surface-hover)' : 'transparent',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 17px/1 var(--font-mono)',
      color: 'var(--text-primary)',
      letterSpacing: '0.01em'
    }
  }, asset.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap'
    }
  }, asset.name)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--text-tertiary)"
  })), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 10px)',
      left: -6,
      zIndex: 'var(--z-dropdown)',
      width: 340,
      padding: 6,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-pop)',
      animation: 'cl-pop var(--dur-fast) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Filtrar",
    size: "sm",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      margin: '2px 2px 6px'
    },
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 380,
      overflowY: 'auto'
    }
  }, list.map(x => /*#__PURE__*/React.createElement(WatchRow, {
    key: x.symbol,
    symbol: x.symbol,
    name: x.name,
    price: x.price,
    change: x.change,
    series: x.series,
    selected: x.symbol === asset.symbol,
    signal: signals[x.symbol],
    onClick: () => {
      onSelect(x.symbol);
      setOpen(false);
    }
  })))));
}
window.SymbolPicker = SymbolPicker;

/* ---- Desk.jsx ---- */
const fmtBR = (v, d = 2) => Number(v).toLocaleString('pt-BR', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});
const LBL = {
  font: 'var(--text-label)',
  letterSpacing: 'var(--label-track)',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  whiteSpace: 'nowrap'
};
function Thinking({
  thoughts
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI(x => (x + 1) % thoughts.length), 2200);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 0,
      font: '400 12px/1 var(--font-mono)',
      backgroundImage: 'linear-gradient(90deg,var(--ink-500) 0%,var(--sand-200) 50%,var(--ink-500) 100%)',
      backgroundSize: '200% 100%',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      animation: 'cl-shimmer 2.2s linear infinite, cl-fade 300ms var(--ease-out)'
    }
  }, thoughts[i], "\u2026");
}
function Stat({
  k,
  v
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'baseline',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...LBL,
      fontSize: 10
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1 var(--font-mono)',
      color: 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, v));
}
function ChartStage({
  asset,
  quotes,
  signals,
  onSelect,
  live,
  onTick,
  auto,
  setAuto,
  thoughts,
  onAlert
}) {
  const {
    Panel,
    PriceTicker,
    Delta,
    SegmentedControl,
    IconButton,
    Switch,
    CandleChart,
    Icon,
    Button
  } = window.ClaritasDesignSystem_c8f168;
  const [tf, setTf] = React.useState('5m');
  const s = live.series || [];
  const vwap = s.length ? s.reduce((a, c) => a + (c.h + c.l + c.c) / 3 * c.v, 0) / s.reduce((a, c) => a + c.v, 0) : 0;
  const hi = s.length ? Math.max(...s.map(c => c.h)) : 0,
    lo = s.length ? Math.min(...s.map(c => c.l)) : 0;
  const price = live.price || asset.price;
  const chg = live.change ?? asset.change;
  const abs = price - price / (1 + chg / 100);
  return /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 28,
      padding: '18px 16px 10px 22px'
    }
  }, /*#__PURE__*/React.createElement(SymbolPicker, {
    asset: asset,
    quotes: quotes,
    onSelect: onSelect,
    signals: signals
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(PriceTicker, {
    value: price,
    size: "lg",
    weight: 400
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: abs,
    kind: "abs",
    size: "sm",
    arrow: false
  }), /*#__PURE__*/React.createElement(Delta, {
    value: chg,
    size: "sm",
    arrow: false
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    options: ['1m', '5m', '15m', '1h', 'D'],
    value: tf,
    onChange: setTf
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "star",
    label: "Favoritar",
    size: "sm"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "layers",
    label: "Indicadores",
    size: "sm"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "maximize-2",
    label: "Tela cheia",
    size: "sm"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm",
    icon: "bell",
    onClick: onAlert
  }, "Alerta")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: '0 6px 0 10px'
    }
  }, /*#__PURE__*/React.createElement(CandleChart, {
    key: asset.symbol + tf,
    seed: asset.seed + tf.length,
    start: asset.price * (1 - asset.change / 100),
    live: true,
    tickMs: tf === '1m' ? 420 : 650,
    ticksPerCandle: tf === '1m' ? 5 : 9,
    autoAnalyze: auto,
    scanning: auto,
    field: auto,
    height: "100%",
    window: 78,
    onTick: onTick
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      height: 40,
      padding: '0 18px 0 16px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    size: "sm",
    checked: auto,
    onChange: setAuto
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      color: auto ? 'var(--accent)' : 'var(--text-tertiary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 13
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 10.5px/1 var(--font-mono)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase'
    }
  }, "Claritas")), auto ? /*#__PURE__*/React.createElement(Thinking, {
    thoughts: thoughts
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, "an\xE1lise autom\xE1tica pausada"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 8
    }
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "VWAP",
    v: fmtBR(vwap)
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "M\xE1x",
    v: fmtBR(hi)
  }), /*#__PURE__*/React.createElement(Stat, {
    k: "M\xEDn",
    v: fmtBR(lo)
  })));
}
function AnalysisRail({
  asset,
  price,
  feed,
  bias,
  freshId,
  onPick
}) {
  const {
    Panel,
    Tabs,
    SignalCard,
    LiveIndicator,
    MetricRow,
    Icon,
    ConfidenceMeter
  } = window.ClaritasDesignSystem_c8f168;
  const [tab, setTab] = React.useState('sum');
  const glowing = freshId && Date.now() - freshId < 2500;
  const word = bias >= 60 ? 'Viés comprador' : bias <= 40 ? 'Viés vendedor' : 'Viés neutro';
  const conf = bias >= 72 || bias <= 30 ? 'Confiança alta' : 'Confiança média';
  const sup = price * 0.986,
    tgt = price * 1.021;
  const body = bias >= 60 ? `${asset.symbol} sustenta força relativa acima do Ibovespa, com compradores defendendo cada recuo. O preço segue acima da VWAP e do suporte em ${fmtBR(sup)}, com volume saudável — cenário de continuidade.` : `${asset.symbol} perdeu ritmo desde o meio do pregão. Volume em queda e preço oscilando em torno da VWAP: sem vantagem clara até sair da faixa.`;
  return /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    glow: glowing ? 'sand' : false,
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 18px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: LBL
  }, "Leitura Claritas"), /*#__PURE__*/React.createElement(LiveIndicator, {
    status: "analyzing",
    size: "sm",
    label: "Ao vivo"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      padding: '18px 18px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 14,
      height: 14,
      flexShrink: 0,
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 14,
      background: 'var(--accent)',
      boxShadow: '0 0 16px rgba(200,178,142,.7)',
      animation: 'cl-pulse 2s var(--ease-out) infinite'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    key: word,
    style: {
      font: '400 28px/1 var(--font-serif)',
      color: 'var(--text-primary)',
      animation: 'cl-fade 500ms var(--ease-out)'
    }
  }, word), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, conf, " \xB7 ", Math.round(bias), "%"))), /*#__PURE__*/React.createElement("p", {
    key: word,
    style: {
      margin: 0,
      padding: '14px 18px 4px',
      font: '400 13.5px/1.6 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty',
      animation: 'cl-fade 500ms var(--ease-out)'
    }
  }, body), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px'
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    size: "sm",
    value: tab,
    onChange: setTab,
    items: [{
      value: 'sum',
      label: 'Resumo'
    }, {
      value: 'sig',
      label: 'Sinais',
      count: feed.length
    }, {
      value: 'tech',
      label: 'Técnico'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '6px 18px 14px'
    }
  }, tab === 'sum' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MetricRow, {
    icon: "trending-up",
    label: "Regime atual",
    value: bias >= 55 ? 'Tendência de alta' : 'Lateral'
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "scale",
    label: "Risco / retorno",
    value: `${fmtBR(1.8 + bias / 100, 1)} : 1`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "crosshair",
    label: "N\xEDvel-chave",
    value: fmtBR(sup),
    sub: "suporte"
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "target",
    label: "Pr\xF3ximo alvo",
    value: fmtBR(tgt),
    sub: `+${fmtBR((tgt / price - 1) * 100, 1)}%`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      marginTop: 14,
      padding: 14,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-raised)',
      boxShadow: 'var(--shadow-panel)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 30,
      height: 30,
      flexShrink: 0,
      borderRadius: 'var(--radius-md)',
      background: 'var(--accent-tint)',
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "move-up-right",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...LBL,
      fontSize: 10
    }
  }, "Estrat\xE9gia"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px/1.3 var(--font-sans)',
      color: 'var(--text-primary)'
    }
  }, bias >= 60 ? 'Comprar nos recuos' : 'Aguardar rompimento'), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1.5 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, "Entradas perto de ", fmtBR(sup), ", alvo em ", fmtBR(tgt), ". Invalida abaixo de ", fmtBR(sup * 0.994), ".")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  }))), tab === 'sig' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      paddingTop: 6
    }
  }, feed.map((f, i) => /*#__PURE__*/React.createElement(SignalCard, {
    key: f.id,
    fresh: f.id === freshId,
    compact: i > 0,
    kind: f.kind,
    symbol: f.symbol,
    timeframe: f.tf,
    time: f.time,
    title: f.title,
    body: f.body,
    levels: i === 0 ? f.levels : undefined,
    confidence: i === 0 ? f.conf : undefined,
    onClick: () => onPick(f.symbol)
  }))), tab === 'tech' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      paddingTop: 10
    }
  }, [['Tendência (MM9 × MM21)', bias + 6], ['Força relativa vs. IBOV', bias - 4], ['Fluxo de agressão', bias + 2], ['Volatilidade', 46]].map(([l, v]) => /*#__PURE__*/React.createElement(ConfidenceMeter, {
    key: l,
    label: l,
    value: Math.max(5, Math.min(98, v)),
    segments: 18
  })))));
}
function Widget({
  title,
  children,
  action
}) {
  const {
    Panel,
    IconButton
  } = window.ClaritasDesignSystem_c8f168;
  return /*#__PURE__*/React.createElement(Panel, {
    eyebrow: title,
    actions: action || /*#__PURE__*/React.createElement(IconButton, {
      icon: "maximize-2",
      label: "Expandir",
      size: "sm"
    }),
    padding: "4px 18px 16px",
    style: {
      minWidth: 0,
      minHeight: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, children);
}
function Widgets({
  price,
  bias
}) {
  const {
    SentimentGauge,
    FlowArea,
    DistributionCurve,
    MetricRow
  } = window.ClaritasDesignSystem_c8f168;
  const [net, setNet] = React.useState(1.24);
  const [inst, setInst] = React.useState(68);
  const [sig, setSig] = React.useState({
    vol: 1.8,
    align: 3,
    foreign: 312
  });
  const base = React.useRef(price);
  React.useEffect(() => {
    const id = setInterval(() => {
      setInst(v => Math.max(55, Math.min(78, v + (Math.random() - 0.5) * 2)));
      setSig(s => ({
        vol: Math.max(0.8, s.vol + (Math.random() - 0.48) * 0.12),
        align: Math.random() < 0.15 ? s.align === 3 ? 4 : 3 : s.align,
        foreign: s.foreign + Math.round((Math.random() - 0.4) * 14)
      }));
    }, 1500);
    return () => clearInterval(id);
  }, []);
  const p = price || base.current || 38;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 'var(--panel-gap)',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Widget, {
    title: "Sentimento"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(SentimentGauge, {
    value: bias,
    size: 190
  }))), /*#__PURE__*/React.createElement(Widget, {
    title: "Fluxo l\xEDquido"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, "Hoje, todos os participantes"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 26px/1 var(--font-mono)',
      letterSpacing: '-0.03em',
      color: 'var(--accent)',
      margin: '10px 0 6px'
    }
  }, "+R$ ", fmtBR(net, 2), " bi"), /*#__PURE__*/React.createElement(FlowArea, {
    live: true,
    height: 74,
    tickMs: 900,
    onTick: d => setNet(Math.max(0.2, 0.6 + d[d.length - 1] / 18))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginTop: 10
    }
  }, [['Institucional', inst], ['Varejo', 100 - inst]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 10px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--surface-raised)',
      font: '400 11.5px/1 var(--font-sans)',
      color: 'var(--text-tertiary)'
    }
  }, k, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11.5px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, Math.round(v), "%"))))), /*#__PURE__*/React.createElement(Widget, {
    title: "Distribui\xE7\xE3o de fechamento"
  }, /*#__PURE__*/React.createElement(DistributionCurve, {
    mean: p * (1 + (bias - 50) / 2500),
    sd: p * 0.0085,
    target: p * 1.01,
    min: p * 0.97,
    max: p * 1.03,
    decimals: 2,
    ticks: 4,
    height: 170,
    caption: `chance de fechar ≥ ${fmtBR(p * 1.01)}`
  })), /*#__PURE__*/React.createElement(Widget, {
    title: "Sinais-chave",
    action: /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => e.preventDefault(),
      style: {
        font: '400 11.5px/1 var(--font-sans)',
        color: 'var(--text-tertiary)'
      }
    }, "Ver todos \u2192")
  }, /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "activity",
    label: "Momentum",
    value: bias >= 55 ? 'Comprador' : 'Neutro'
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "chart-column",
    label: "Volume",
    value: `${fmtBR(sig.vol, 1)}× média`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "layers",
    label: "Alinhamento de tempos",
    value: `${sig.align} de 4`
  }), /*#__PURE__*/React.createElement(MetricRow, {
    dense: true,
    icon: "globe",
    label: "Fluxo estrangeiro",
    value: `${sig.foreign >= 0 ? '+' : '−'}R$ ${Math.abs(sig.foreign)} mi`,
    tone: sig.foreign >= 0 ? 'sand' : 'down',
    style: {
      borderBottom: 0
    }
  })));
}
Object.assign(window, {
  ChartStage,
  AnalysisRail,
  Widgets,
  fmtBR
});

/* ---- Scanner.jsx ---- */
const SETUPS = [{
  k: 'Rompimento',
  tone: 'up'
}, {
  k: 'Pullback na MM21',
  tone: 'up'
}, {
  k: 'Divergência IFR',
  tone: 'sand'
}, {
  k: 'Perda da VWAP',
  tone: 'down'
}, {
  k: 'Bandeira',
  tone: 'sand'
}, {
  k: 'Topo duplo',
  tone: 'down'
}];
function ScannerScreen({
  quotes,
  onOpen
}) {
  const {
    Panel,
    Checkbox,
    Select,
    SegmentedControl,
    Button,
    Badge,
    Sparkline,
    Delta,
    PriceTicker,
    ConfidenceMeter,
    LiveIndicator
  } = window.ClaritasDesignSystem_c8f168;
  const [found, setFound] = React.useState([]);
  const [scanned, setScanned] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  const total = 84;
  React.useEffect(() => {
    if (!running) return;
    setFound([]);
    setScanned(0);
    let n = 0;
    const id = setInterval(() => {
      n += 3;
      setScanned(Math.min(total, n));
      if (n % 9 === 0 && n / 9 <= quotes.length) {
        const q = quotes[(n / 9 - 1) % quotes.length];
        const s = SETUPS[n / 9 % SETUPS.length];
        setFound(f => [{
          ...q,
          setup: s,
          conf: 48 + q.seed * 7 % 44,
          at: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Sao_Paulo'
          })
        }, ...f]);
      }
      if (n >= total) {
        setRunning(false);
        clearInterval(id);
      }
    }, 140);
    return () => clearInterval(id);
  }, [running]);
  const pct = scanned / total * 100;
  const col = 'minmax(0,1.3fr) 110px 90px 80px minmax(0,1.2fr) 150px 80px';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--panel-gap)',
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "Crit\xE9rios",
    title: "Scanner",
    style: {
      width: 260,
      flexShrink: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    },
    footer: /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: "radar",
      fullWidth: true,
      loading: running,
      onClick: () => setRunning(true)
    }, running ? 'Varrendo…' : 'Varrer novamente')
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Universo",
    options: ['Ibovespa (84)', 'IBrX-100', 'Small caps', 'Minha carteira']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Tempo gr\xE1fico"), /*#__PURE__*/React.createElement(SegmentedControl, {
    size: "sm",
    fullWidth: true,
    options: ['5m', '15m', '1h', 'D'],
    defaultValue: "15m"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, "Setups"), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Rompimentos",
    description: "Fechamento acima de resist\xEAncia"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Pullbacks em m\xE9dias"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Diverg\xEAncias de IFR"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Padr\xF5es gr\xE1ficos"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Perda de VWAP"
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "S\xF3 volume acima da m\xE9dia"
  })), /*#__PURE__*/React.createElement(Panel, {
    padding: false,
    style: {
      flex: 1,
      minWidth: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      padding: '18px 20px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }
  }, running && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '22%',
      background: 'var(--scan-beam)',
      borderRight: '1px solid rgba(243,237,226,.8)',
      animation: 'cl-scan 1.6s linear infinite',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(LiveIndicator, {
    status: running ? 'analyzing' : 'live',
    label: running ? 'Varrendo o Ibovespa' : 'Varredura concluída',
    detail: `${scanned}/${total} ativos`
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 30px/1.1 var(--font-serif)',
      color: 'var(--text-primary)'
    }
  }, found.length, " ", found.length === 1 ? 'oportunidade encontrada' : 'oportunidades encontradas')), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 26px/1 var(--font-mono)',
      color: 'var(--accent)',
      letterSpacing: '-0.02em'
    }
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 2,
      marginTop: 14,
      background: 'var(--ink-700)',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: pct + '%',
      background: 'var(--accent)',
      borderRadius: 2,
      boxShadow: '0 0 10px var(--accent)',
      transition: 'width 140ms linear'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: col,
      gap: 16,
      padding: '10px 20px',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, ['Ativo', 'Intraday', 'Último', 'Var.', 'Setup', 'Confiança', 'Hora'].map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)',
      textAlign: ['Último', 'Var.', 'Hora'].includes(h) ? 'right' : 'left'
    }
  }, h))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, found.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.symbol,
    onClick: () => onOpen(r.symbol),
    style: {
      display: 'grid',
      gridTemplateColumns: col,
      gap: 16,
      alignItems: 'center',
      height: 52,
      padding: '0 20px',
      borderBottom: '1px solid var(--border-subtle)',
      cursor: 'pointer',
      animation: 'cl-rise var(--dur-slow) var(--ease-out)'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--surface-hover)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12.5px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, r.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, r.name)), /*#__PURE__*/React.createElement(Sparkline, {
    data: r.series,
    width: 110,
    height: 26
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(PriceTicker, {
    value: r.price,
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: r.change,
    size: "xs"
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Badge, {
    tone: r.setup.tone,
    variant: "outline"
  }, r.setup.k)), /*#__PURE__*/React.createElement(ConfidenceMeter, {
    value: r.conf,
    label: null,
    showValue: false,
    size: "sm",
    segments: 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right',
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, r.at))))));
}
window.ScannerScreen = ScannerScreen;

/* ---- Report.jsx ---- */
function ReportScreen({
  quotes,
  onOpen
}) {
  const {
    Panel,
    Badge,
    Button,
    Delta,
    CandleChart,
    SignalCard,
    Sparkline
  } = window.ClaritasDesignSystem_c8f168;
  const series = React.useMemo(() => CandleChart.generateSeries({
    seed: 3,
    start: 130870,
    count: 84,
    vol: 0.0011
  }), []);
  const marks = [{
    id: 'm1',
    type: 'marker',
    t: series[14].t,
    side: 'buy',
    label: 'PETR4 ↑'
  }, {
    id: 'm2',
    type: 'marker',
    t: series[38].t,
    side: 'sell',
    label: 'MGLU3 ↓'
  }, {
    id: 'm3',
    type: 'marker',
    t: series[61].t,
    side: 'buy',
    label: 'WEGE3 ↑'
  }, {
    id: 'z1',
    type: 'zone',
    from: series[30].l,
    to: series[30].h * 1.0006,
    label: 'Lateralização 12h–14h'
  }];
  const sorted = [...quotes].sort((a, b) => b.change - a.change);
  const movers = [...sorted.slice(0, 3), ...sorted.slice(-3)];
  const kpis = [['Ibovespa', '131.420', '+0,42%', 'up'], ['Volume financeiro', 'R$ 24,1 bi', '+8% vs. média', null], ['Sinais emitidos', '37', '12 compra · 9 venda', null], ['Taxa de acerto', '68%', '25 de 37 no alvo', 'sand']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 340px',
      gap: 'var(--panel-gap)',
      maxWidth: 1320
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    padding: 28,
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "sand",
    dot: true
  }, "Relat\xF3rio Claritas"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1 var(--font-mono)',
      color: 'var(--text-tertiary)'
    }
  }, "Sexta, 9 de outubro de 2026 \xB7 fechamento 17:00")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      font: '400 var(--display-l-size)/var(--display-l-lh) var(--font-serif)',
      letterSpacing: 'var(--display-l-track)',
      color: 'var(--text-primary)',
      maxWidth: 820,
      textWrap: 'pretty'
    }
  }, "Ibovespa fecha em alta de 0,42%, puxado por petr\xF3leo e ", /*#__PURE__*/React.createElement("i", {
    style: {
      color: 'var(--accent)'
    }
  }, "uma tarde de rompimentos.")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 720,
      font: '400 15px/1.6 var(--font-sans)',
      color: 'var(--text-secondary)',
      textWrap: 'pretty'
    }
  }, "A manh\xE3 foi lateral, entre 130.900 e 131.200 pontos. Depois das 14h o fluxo comprador voltou com PETR4 e PRIO3, e o \xEDndice renovou a m\xE1xima \xE0s 16:20. Varejo seguiu pressionado pelos juros futuros.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "share-2",
    size: "sm"
  }, "Compartilhar"), /*#__PURE__*/React.createElement(Button, {
    icon: "download",
    size: "sm"
  }, "Exportar PDF"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 1,
      marginTop: 24,
      background: 'var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }
  }, kpis.map(([k, v, d, t]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '16px 18px',
      background: 'var(--surface-inset)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-label)',
      letterSpacing: 'var(--label-track)',
      textTransform: 'uppercase',
      color: 'var(--text-tertiary)'
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 26px/1 var(--font-mono)',
      letterSpacing: '-0.02em',
      color: t === 'sand' ? 'var(--accent)' : 'var(--text-primary)'
    }
  }, v), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px/1 var(--font-mono)',
      color: t === 'up' ? 'var(--market-up-text)' : 'var(--text-tertiary)'
    }
  }, d))))), /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "IBOV \xB7 5m",
    title: "O dia em uma tela",
    padding: 8
  }, /*#__PURE__*/React.createElement(CandleChart, {
    data: series,
    annotations: marks,
    height: 360,
    decimals: 0,
    ma: [9],
    crosshair: true,
    watermark: "IBOV"
  })), /*#__PURE__*/React.createElement(Panel, {
    eyebrow: "Destaques",
    title: "Maiores altas e baixas",
    padding: false
  }, movers.map((q, i) => /*#__PURE__*/React.createElement("div", {
    key: q.symbol,
    onClick: () => onOpen(q.symbol),
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 70px 70px',
      alignItems: 'center',
      gap: 10,
      height: 46,
      padding: '0 16px',
      cursor: 'pointer',
      borderTop: i === 3 ? '1px solid var(--border-default)' : i ? '1px solid var(--border-subtle)' : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 12px/1 var(--font-mono)',
      color: 'var(--text-primary)'
    }
  }, q.symbol), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--text-caption)',
      color: 'var(--text-tertiary)'
    }
  }, q.sector)), /*#__PURE__*/React.createElement(Sparkline, {
    data: q.series,
    width: 70,
    height: 22,
    baseline: false,
    animate: false
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Delta, {
    value: q.change,
    size: "sm"
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 'var(--panel-gap)'
    }
  }, /*#__PURE__*/React.createElement(SignalCard, {
    kind: "buy",
    symbol: "PETR4",
    timeframe: "15m",
    time: "14:05",
    title: "Rompimento de R$ 38,10 \u2014 alvo atingido \xE0s 16:20",
    confidence: 81,
    tags: ['Alvo ✓']
  }), /*#__PURE__*/React.createElement(SignalCard, {
    kind: "pattern",
    symbol: "WEGE3",
    timeframe: "1h",
    time: "15:10",
    title: "Bandeira de alta confirmou no fechamento",
    confidence: 66,
    tags: ['Padrão']
  }), /*#__PURE__*/React.createElement(SignalCard, {
    kind: "sell",
    symbol: "MGLU3",
    timeframe: "5m",
    time: "11:42",
    title: "Perda da VWAP \u2014 stop acionado, sinal invalidado",
    confidence: 58,
    tags: ['Stop']
  }))));
}
window.ReportScreen = ReportScreen;

/* ---- App.jsx ---- */
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function nowHM() {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}
function makeSignal(tpl, symbol, price, id) {
  const up = tpl.kind === 'buy' || tpl.kind === 'pattern';
  const f = v => fmtBR(v);
  return {
    ...tpl,
    id,
    symbol,
    time: nowHM(),
    levels: tpl.kind === 'watch' || tpl.kind === 'alert' ? [{
      label: 'Faixa',
      value: `${f(price * 0.997)}–${f(price * 1.003)}`
    }, {
      label: 'Último',
      value: f(price)
    }] : [{
      label: 'Entrada',
      value: f(price)
    }, {
      label: 'Alvo',
      value: f(price * (up ? 1.016 : 0.984)),
      tone: up ? 'up' : 'down'
    }, {
      label: 'Stop',
      value: f(price * (up ? 0.992 : 1.008)),
      tone: up ? 'down' : 'up'
    }]
  };
}
function App() {
  const {
    TickerTape,
    Toast,
    Dialog,
    Button,
    Input,
    Select,
    Checkbox,
    Switch,
    CandleChart
  } = window.ClaritasDesignSystem_c8f168;
  const D = window.CL_DATA;
  const [screen, setScreenRaw] = React.useState(() => localStorage.getItem('cl-kit-screen') || 'desk');
  const setScreen = s => {
    setScreenRaw(s);
    localStorage.setItem('cl-kit-screen', s);
  };
  const [sel, setSel] = React.useState('PETR4');
  const [auto, setAuto] = React.useState(true);
  const [quotes, setQuotes] = React.useState(() => D.assets.map(a => ({
    ...a,
    series: CandleChart.generateSeries({
      seed: a.seed,
      start: a.price * (1 - a.change / 100),
      count: 48
    }).map(c => c.c)
  })));
  const [macro, setMacro] = React.useState(() => D.macro.map((m, i) => ({
    ...m,
    series: CandleChart.generateSeries({
      seed: 90 + i,
      start: m.price * (1 - m.change / 100),
      count: 40,
      vol: 0.0012
    }).map(c => c.c)
  })));
  const [live, setLive] = React.useState({});
  const [feed, setFeed] = React.useState(() => [makeSignal(D.signals[3], 'WEGE3', 52.9, 'seed-1'), {
    ...makeSignal(D.signals[2], 'BBAS3', 27.61, 'seed-2'),
    time: '13:48'
  }, {
    ...makeSignal(D.signals[1], 'ITUB4', 34.18, 'seed-3'),
    time: '12:20'
  }]);
  const [freshId, setFreshId] = React.useState(null);
  const [marks, setMarks] = React.useState({
    WEGE3: 'sand'
  });
  const [toasts, setToasts] = React.useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [bias, setBias] = React.useState(64);
  const liveRef = React.useRef(live);
  liveRef.current = live;
  const selRef = React.useRef(sel);
  selRef.current = sel;
  const pushToast = t => {
    const id = Date.now() + Math.random();
    setToasts(ts => [{
      ...t,
      id
    }, ...ts].slice(0, 3));
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 5200);
  };
  React.useEffect(() => {
    const id = setInterval(() => {
      setQuotes(qs => qs.map(q => {
        if (Math.random() < 0.45) return q;
        const p = q.price * (1 + (Math.random() - 0.5) * 0.0024);
        return {
          ...q,
          price: p,
          change: q.change + (p - q.price) / q.price * 100,
          series: [...q.series.slice(1), p]
        };
      }));
      setMacro(ms => ms.map(m => {
        if (Math.random() < 0.4) return m;
        const p = m.price * (1 + (Math.random() - 0.5) * 0.0008);
        return {
          ...m,
          price: p,
          change: m.change + (p - m.price) / m.price * 100,
          series: [...m.series.slice(1), p]
        };
      }));
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
      const symbol = other ? D.assets[n * 5 % D.assets.length].symbol : selRef.current;
      const price = other ? D.assets.find(a => a.symbol === symbol).price : liveRef.current.price || 38;
      const sig = makeSignal(tpl, symbol, price, 'sig-' + Date.now());
      setFeed(f => [sig, ...f].slice(0, 14));
      setFreshId(sig.id);
      setMarks(m => ({
        ...m,
        [symbol]: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand'
      }));
      setBias(b => Math.max(30, Math.min(84, b + (sig.kind === 'buy' ? 4 : sig.kind === 'sell' ? -5 : 1))));
      if (other || screen !== 'desk') pushToast({
        tone: sig.kind === 'buy' ? 'up' : sig.kind === 'sell' ? 'down' : 'sand',
        title: `Novo sinal em ${symbol}`,
        message: sig.title,
        meta: sig.time,
        action: 'Ver no gráfico',
        symbol
      });
    }, 9000);
    return () => clearInterval(id);
  }, [auto, screen]);
  const onTick = React.useCallback(s => {
    const last = s[s.length - 1];
    const first = s[0];
    setLive({
      price: last.c,
      change: (last.c - first.o) / first.o * 100,
      series: s
    });
  }, []);
  const open = sym => {
    setSel(sym);
    setScreen('desk');
    setMarks(m => ({
      ...m,
      [sym]: undefined
    }));
  };
  const asset = D.assets.find(a => a.symbol === sel);
  const shown = quotes.map(q => q.symbol === sel && live.price ? {
    ...q,
    price: live.price,
    change: live.change
  } : q);
  const tape = [...macro, ...shown.map(q => ({
    symbol: q.symbol,
    price: q.price,
    change: q.change,
    signal: !!marks[q.symbol]
  }))];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      minWidth: 1280,
      overflow: 'hidden',
      background: 'var(--bg-app)'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    macro: macro,
    onAlert: () => setAlertOpen(true)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Rail, {
    screen: screen,
    onScreen: setScreen
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 'var(--panel-gap)',
      padding: 10,
      minWidth: 0,
      minHeight: 0
    }
  }, screen === 'desk' && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) 380px',
      gridTemplateRows: 'minmax(0,1fr) 260px',
      gap: 'var(--panel-gap)',
      minWidth: 0,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(ChartStage, {
    asset: asset,
    quotes: shown,
    signals: marks,
    onSelect: open,
    live: live,
    onTick: onTick,
    auto: auto,
    setAuto: setAuto,
    thoughts: D.thoughts,
    onAlert: () => setAlertOpen(true)
  }), /*#__PURE__*/React.createElement(AnalysisRail, {
    asset: asset,
    price: live.price || asset.price,
    feed: feed,
    bias: bias,
    freshId: freshId,
    onPick: open
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1',
      display: 'grid',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Widgets, {
    price: live.price,
    bias: bias
  }))), screen === 'scanner' && /*#__PURE__*/React.createElement(ScannerScreen, {
    quotes: quotes,
    onOpen: open
  }), screen === 'report' && /*#__PURE__*/React.createElement(ReportScreen, {
    quotes: quotes,
    onOpen: open
  }))), /*#__PURE__*/React.createElement(TickerTape, {
    items: tape,
    speed: 80,
    height: 30,
    onSelect: s => D.assets.some(a => a.symbol === s) && open(s),
    style: {
      borderBottom: 0,
      borderTop: '1px solid var(--border-subtle)',
      background: 'transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 72,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 'var(--z-toast)'
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, _extends({
    key: t.id
  }, t, {
    onAction: () => open(t.symbol),
    onClose: () => setToasts(ts => ts.filter(x => x.id !== t.id))
  })))), /*#__PURE__*/React.createElement(Dialog, {
    open: alertOpen,
    onClose: () => setAlertOpen(false),
    eyebrow: `${asset.symbol} · ${asset.name}`,
    title: "Criar alerta",
    width: 420,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setAlertOpen(false)
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      icon: "bell",
      onClick: () => {
        setAlertOpen(false);
        pushToast({
          tone: 'info',
          title: 'Alerta criado',
          message: `${asset.symbol} cruzando R$ ${fmtBR((live.price || asset.price) * 1.01)}`,
          meta: nowHM()
        });
      }
    }, "Criar alerta"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Condi\xE7\xE3o",
    options: ['Preço cruzar para cima', 'Preço cruzar para baixo', 'Novo sinal Claritas', 'Volume atípico']
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Pre\xE7o",
    prefix: "R$",
    mono: true,
    defaultValue: fmtBR((live.price || asset.price) * 1.01),
    hint: `Último: ${fmtBR(live.price || asset.price)}`
  })), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Anexar leitura Claritas",
    description: "O alerta chega com a an\xE1lise do gr\xE1fico no momento do disparo."
  }), /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: true,
    size: "sm",
    label: "Som de alerta"
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
