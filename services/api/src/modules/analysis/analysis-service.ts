import { INTERVAL_MS, toChartNumber, type Analysis, type AnalysisEvent, type Candle, type Indicator, type Interval, type Regime } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { TtlCache } from "../../infrastructure/cache";
import type { MarketService } from "../market/market-service";
import { atr, crossovers, donchian, donchianBreakouts, ema, logReturnStdevPct, sma, toDecimalString } from "./indicators";

export const ANALYSIS_PARAMS = { emaFast: 9, emaSlow: 21, sma: 20, atr: 14, vol: 20, donchian: 20, change: 20, volumeAvg: 20 } as const;
/** Mínimo para a regra de regime (EMA21 precisa de 21 barras; usamos folga para a semente estabilizar). */
const MIN_BARS = 30;
const WINDOW = 500;

/**
 * Motor analítico determinístico sobre candles reais.
 * Padrão: SOMENTE barras fechadas (a barra em formação muda a cada tick e distorceria regras de fechamento).
 */
export class AnalysisService {
  private readonly cache = new TtlCache<Analysis>(200);

  constructor(private readonly market: MarketService, private readonly now: () => number = Date.now) {}

  async analyze(symbol: string, interval: Interval, includeOpen = false): Promise<Analysis> {
    const asset = await this.market.resolveAsset(symbol);
    const raw = await this.market.getCandles(symbol, interval, WINDOW);
    const candles = includeOpen ? raw : raw.filter((c) => c.isClosed);
    if (candles.length < MIN_BARS) {
      throw new AppError("INSUFFICIENT_DATA", `São necessárias ao menos ${MIN_BARS} barras fechadas; disponíveis: ${candles.length}`);
    }
    const last = candles[candles.length - 1]!;
    // Recalcula só quando muda a última barra considerada (e, com includeOpen, a cada nova consulta curta).
    const key = `${symbol}:${interval}:${includeOpen}:${last.openTimeMs}:${includeOpen ? last.close : ""}`;
    const ttl = includeOpen ? 2_000 : INTERVAL_MS[interval];
    return this.cache.getOrLoad(key, ttl, async () => computeAnalysis(symbol, interval, candles, includeOpen, (asset.pricePrecision ?? 2) + 2, this.now()));
  }
}

export function computeAnalysis(symbol: string, interval: Interval, candles: Candle[], includeOpen: boolean, priceDigits: number, nowMs: number): Analysis {
  const P = ANALYSIS_PARAMS;
  const close = candles.map((c) => toChartNumber(c.close));
  const high = candles.map((c) => toChartNumber(c.high));
  const low = candles.map((c) => toChartNumber(c.low));
  const vol = candles.map((c) => toChartNumber(c.volumeQuote ?? c.volumeBase));
  const times = candles.map((c) => c.openTimeMs);
  const lastIdx = candles.length - 1;
  const lastT = times[lastIdx]!;
  const px = (v: number | null | undefined) => (v == null ? null : toDecimalString(v, priceDigits));
  const pct = (v: number | null | undefined) => (v == null ? null : toDecimalString(v, 4));

  const emaF = ema(close, P.emaFast);
  const emaS = ema(close, P.emaSlow);
  const smaV = sma(close, P.sma);
  const atrV = atr(high, low, close, P.atr);
  const volSma = sma(vol, P.volumeAvg);
  const volStdev = logReturnStdevPct(close, P.vol);
  const changeBase = close[lastIdx - P.change];
  const change = changeBase ? ((close[lastIdx]! - changeBase) / changeBase) * 100 : null;
  const windowChange = ((close[lastIdx]! - close[0]!) / close[0]!) * 100;
  const relVolume = volSma[lastIdx] ? vol[lastIdx]! / volSma[lastIdx]! : null;
  const dch = donchian(high, low, P.donchian);
  const distSma = smaV[lastIdx] ? ((close[lastIdx]! - smaV[lastIdx]!) / smaV[lastIdx]!) * 100 : null;
  const unitBar = includeOpen ? "barras (inclui a barra em formação)" : "barras fechadas";

  const ind = (i: Omit<Indicator, "asOfOpenTimeMs"> & { asOfOpenTimeMs?: number | null }): Indicator => ({ asOfOpenTimeMs: i.value === null ? null : lastT, ...i });

  const indicators: Indicator[] = [
    ind({ id: "close", name: "Último fechamento", algorithm: "Preço de fechamento", formula: "C_t", params: {}, minBars: 1, value: px(close[lastIdx]), unit: "price", description: `Fechamento da última das ${unitBar}.` }),
    ind({ id: "ema9", name: `EMA ${P.emaFast}`, algorithm: "Média móvel exponencial", formula: "EMA_t = α·C_t + (1−α)·EMA_{t−1}; α = 2/(n+1); semente = SMA(n)", params: { n: P.emaFast }, minBars: P.emaFast, value: px(emaF[lastIdx]), unit: "price", description: "Média rápida dos fechamentos." }),
    ind({ id: "ema21", name: `EMA ${P.emaSlow}`, algorithm: "Média móvel exponencial", formula: "EMA_t = α·C_t + (1−α)·EMA_{t−1}; α = 2/(n+1); semente = SMA(n)", params: { n: P.emaSlow }, minBars: P.emaSlow, value: px(emaS[lastIdx]), unit: "price", description: "Média lenta dos fechamentos." }),
    ind({ id: "sma20", name: `SMA ${P.sma}`, algorithm: "Média móvel simples", formula: "SMA_t = (1/n)·Σ C_{t−n+1..t}", params: { n: P.sma }, minBars: P.sma, value: px(smaV[lastIdx]), unit: "price", description: "Média aritmética dos últimos n fechamentos." }),
    ind({ id: "dist_sma20", name: `Distância à SMA ${P.sma}`, algorithm: "Diferença percentual", formula: "(C_t − SMA_t) / SMA_t · 100", params: { n: P.sma }, minBars: P.sma, value: pct(distSma), unit: "percent", description: "Quanto o fechamento está acima (+) ou abaixo (−) da SMA." }),
    ind({ id: "change20", name: `Variação ${P.change} barras`, algorithm: "Retorno simples", formula: "(C_t − C_{t−n}) / C_{t−n} · 100", params: { n: P.change }, minBars: P.change + 1, value: pct(change), unit: "percent", description: `Variação nas últimas ${P.change} ${unitBar} de ${interval}.` }),
    ind({ id: "change_window", name: `Variação da janela`, algorithm: "Retorno simples", formula: "(C_t − C_0) / C_0 · 100", params: { n: candles.length }, minBars: 2, value: pct(windowChange), unit: "percent", description: `Do primeiro ao último fechamento das ${candles.length} barras carregadas.` }),
    ind({ id: "atr14", name: `ATR ${P.atr}`, algorithm: "Average True Range (Wilder)", formula: "TR = max(H−L, |H−C_{t−1}|, |L−C_{t−1}|); ATR_t = (ATR_{t−1}·(n−1) + TR_t)/n", params: { n: P.atr }, minBars: P.atr + 1, value: px(atrV[lastIdx]), unit: "price", description: "Amplitude média por barra, em unidades de preço." }),
    ind({ id: "vol20", name: `Volatilidade ${P.vol}`, algorithm: "Desvio-padrão amostral dos retornos log", formula: "σ = stdev(ln(C_t/C_{t−1})) · 100, últimas n barras", params: { n: P.vol }, minBars: P.vol + 1, value: pct(volStdev), unit: "percent", description: `Por barra de ${interval} (não anualizada).` }),
    ind({ id: "rel_volume", name: "Volume relativo", algorithm: "Razão volume / média", formula: "V_t / SMA(V, n)", params: { n: P.volumeAvg }, minBars: P.volumeAvg, value: relVolume == null ? null : toDecimalString(relVolume, 2), unit: "ratio", description: "Volume (em moeda de cotação) da última barra comparado à média de n barras." }),
  ];

  const levels = dch
    ? [
        { id: "donchian_high", label: `Máx ${P.donchian}`, price: px(dch.upper)!, rule: `Maior máxima das últimas ${P.donchian} ${unitBar} (canal de Donchian).` },
        { id: "donchian_low", label: `Mín ${P.donchian}`, price: px(dch.lower)!, rule: `Menor mínima das últimas ${P.donchian} ${unitBar} (canal de Donchian).` },
      ]
    : [];

  const e9 = emaF[lastIdx], e21 = emaS[lastIdx], s20 = smaV[lastIdx], c = close[lastIdx]!;
  let state: Regime["state"] = "indisponivel";
  if (e9 != null && e21 != null && s20 != null) {
    state = e9 > e21 && c > s20 ? "alta" : e9 < e21 && c < s20 ? "baixa" : "indefinido";
  }
  const regime: Regime = {
    id: "ma_regime",
    name: "Regime de médias",
    state,
    rule: `alta: EMA${P.emaFast} > EMA${P.emaSlow} e fechamento > SMA${P.sma}; baixa: EMA${P.emaFast} < EMA${P.emaSlow} e fechamento < SMA${P.sma}; caso contrário, indefinido. Descreve a configuração atual das médias — não é previsão nem probabilidade.`,
    evidence: { close: px(c), ema9: px(e9), ema21: px(e21), sma20: px(s20) },
  };

  const events: AnalysisEvent[] = [];
  for (const x of crossovers(emaF, emaS)) {
    events.push({
      id: `cross:${times[x.index]}`,
      type: x.direction === "up" ? "ema_cross_up" : "ema_cross_down",
      openTimeMs: times[x.index]!,
      price: px(close[x.index])!,
      title: x.direction === "up" ? `EMA${P.emaFast} cruzou acima da EMA${P.emaSlow}` : `EMA${P.emaFast} cruzou abaixo da EMA${P.emaSlow}`,
      rule: `EMA${P.emaFast}_{t−1} ${x.direction === "up" ? "≤" : "≥"} EMA${P.emaSlow}_{t−1} e EMA${P.emaFast}_t ${x.direction === "up" ? ">" : "<"} EMA${P.emaSlow}_t, no fechamento da barra.`,
    });
  }
  for (const b of donchianBreakouts(high, low, close, P.donchian)) {
    events.push({
      id: `breakout:${times[b.index]}`,
      type: b.direction === "up" ? "breakout_high" : "breakout_low",
      openTimeMs: times[b.index]!,
      price: px(close[b.index])!,
      title: b.direction === "up" ? `Fechamento acima da máxima de ${P.donchian} barras (${px(b.level)})` : `Fechamento abaixo da mínima de ${P.donchian} barras (${px(b.level)})`,
      rule: `C_t ${b.direction === "up" ? ">" : "<"} ${b.direction === "up" ? "maior máxima" : "menor mínima"} das ${P.donchian} barras anteriores (primeira barra da sequência).`,
    });
  }
  events.sort((a, b) => b.openTimeMs - a.openTimeMs);

  const toSeries = (arr: (number | null)[]) => arr.flatMap((v, i) => (v == null ? [] : [{ t: times[i]!, v: px(v)! }]));
  const notes: string[] = [];
  if (!includeOpen) notes.push("Calculado apenas com barras fechadas; a barra em formação não entra.");
  if (candles.length < WINDOW / 2) notes.push(`Janela curta: ${candles.length} barras.`);

  return {
    symbol,
    interval,
    computedAt: new Date(nowMs).toISOString(),
    basis: {
      provider: "binance_spot",
      candles: candles.length,
      includesOpenCandle: includeOpen,
      firstOpenTimeMs: times[0]!,
      lastOpenTimeMs: lastT,
      lastCloseTimeMs: candles[lastIdx]!.closeTimeMs,
    },
    indicators,
    series: { ema9: toSeries(emaF), ema21: toSeries(emaS), sma20: toSeries(smaV) },
    levels,
    regime,
    events: events.slice(0, 30),
    notes,
  };
}
