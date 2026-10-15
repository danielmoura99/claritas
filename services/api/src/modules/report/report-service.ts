import { INTERVAL_MS, toChartNumber, type Candle, type Report, type ReportQuery } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { TtlCache } from "../../infrastructure/cache";
import type { MarketService } from "../market/market-service";
import { EXCLUDED_BASES } from "../scanner/scanner-service";
import { computeAnalysis } from "../analysis/analysis-service";
import { toDecimalString } from "../analysis/indicators";

const BAR = "15m" as const;
const LOOKBACK_BARS = 40; // para EMA/SMA já estarem estabilizadas no início da janela

/** Offset (ms) do fuso em relação a UTC num instante — via Intl, sem tabela fixa de horário de verão. */
export function tzOffsetMs(timeZone: string, atMs: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(atMs))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return asUtc - Math.floor(atMs / 1000) * 1000;
}

/** Início/fim (UTC ms) do dia de calendário `date` no fuso `timeZone`. */
export function dayBounds(date: string, timeZone: string): { startMs: number; endMs: number } {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const naiveStart = Date.UTC(y, m - 1, d);
  const startMs = naiveStart - tzOffsetMs(timeZone, naiveStart);
  const naiveEnd = Date.UTC(y, m - 1, d + 1);
  const endMs = naiveEnd - tzOffsetMs(timeZone, naiveEnd);
  return { startMs, endMs };
}

/** Maior queda pico→vale e maior alta vale→pico (em %), na ordem temporal. */
export function drawdownRunup(closes: number[]): { drawdownPct: number; runupPct: number } {
  let peak = closes[0] ?? 0, trough = closes[0] ?? 0, dd = 0, ru = 0;
  for (const c of closes) {
    peak = Math.max(peak, c);
    trough = Math.min(trough, c);
    if (peak > 0) dd = Math.max(dd, ((peak - c) / peak) * 100);
    if (trough > 0) ru = Math.max(ru, ((c - trough) / trough) * 100);
  }
  return { drawdownPct: dd, runupPct: ru };
}

export class ReportService {
  private readonly cache = new TtlCache<Report>(100);

  constructor(private readonly market: MarketService, private readonly now: () => number = Date.now) {}

  async build(q: ReportQuery): Promise<Report> {
    const asset = await this.market.resolveAsset(q.symbol);
    const now = this.now();
    let startMs: number, endMs: number, label: string;
    const tzLabel = q.tz === "UTC" ? "UTC" : "Brasília";
    if (q.window === "day") {
      ({ startMs, endMs } = dayBounds(q.date!, q.tz));
      if (startMs > now) throw new AppError("INVALID_REQUEST", "Data no futuro");
      label = `Dia ${q.date!.split("-").reverse().join("/")} (${tzLabel})`;
    } else {
      endMs = now;
      startMs = now - 86_400_000;
      label = `24h móveis até agora`;
    }
    const partial = q.window === "rolling_24h" || endMs > now;
    const effectiveEnd = Math.min(endMs, now);
    const key = `${q.symbol}:${q.window}:${q.date ?? ""}:${q.tz}:${partial || q.window === "rolling_24h" ? Math.floor(now / 60_000) : "final"}`;
    return this.cache.getOrLoad(key, partial || q.window === "rolling_24h" ? 60_000 : 6 * 3_600_000, async () => {
      const all = await this.market.getCandlesRange(q.symbol, BAR, startMs - LOOKBACK_BARS * INTERVAL_MS[BAR], effectiveEnd, 400);
      // Barras cuja abertura cai dentro da janela [start, end).
      const inWindow = all.filter((c) => c.openTimeMs >= startMs && c.openTimeMs < endMs);
      if (inWindow.length < 2) throw new AppError("INSUFFICIENT_DATA", "Sem candles suficientes na janela pedida");
      return this.compose(q, asset.pricePrecision ?? 2, all, inWindow, { startMs, endMs, label, partial });
    });
  }

  private async compose(q: ReportQuery, precision: number, all: Candle[], win: Candle[], w: { startMs: number; endMs: number; label: string; partial: boolean }): Promise<Report> {
    const digits = precision + 2;
    const px = (v: number) => toDecimalString(v, digits);
    const n = (s: string) => toChartNumber(s);
    const first = win[0]!, last = win[win.length - 1]!;
    let hi = -Infinity, lo = Infinity, hiT = 0, loT = 0, vb = 0, vq = 0, trades = 0;
    for (const c of win) {
      if (n(c.high) > hi) { hi = n(c.high); hiT = c.openTimeMs; }
      if (n(c.low) < lo) { lo = n(c.low); loT = c.openTimeMs; }
      vb += n(c.volumeBase);
      vq += n(c.volumeQuote ?? "0");
      trades += c.trades ?? 0;
    }
    const open = n(first.open), close = n(last.close);
    const closes = win.map((c) => n(c.close));
    const logR = closes.slice(1).map((c, i) => Math.log(c / closes[i]!));
    const mean = logR.reduce((a, b) => a + b, 0) / (logR.length || 1);
    const sd = logR.length > 1 ? Math.sqrt(logR.reduce((a, b) => a + (b - mean) ** 2, 0) / (logR.length - 1)) : null;
    const { drawdownPct, runupPct } = drawdownRunup(closes);

    const closedAll = all.filter((c) => c.isClosed);
    const analysis = closedAll.length >= 30 ? computeAnalysis(q.symbol, BAR, closedAll, false, digits, this.now()) : null;
    const events = analysis ? analysis.events.filter((e) => e.openTimeMs >= w.startMs && e.openTimeMs < w.endMs) : [];

    let movers: Report["movers"] = null;
    if (q.window === "rolling_24h") {
      const [assets, quotes] = await Promise.all([this.market.provider.listAssets(), this.market.provider.getAllQuotes()]);
      const ok = new Set(assets.filter((a) => a.status === "TRADING" && a.quoteAsset === "USDT" && !EXCLUDED_BASES.includes(a.baseAsset)).map((a) => a.symbol));
      const universe = quotes.filter((x) => ok.has(x.symbol)).sort((a, b) => Number(b.volumeQuote) - Number(a.volumeQuote)).slice(0, 30);
      const byChange = [...universe].sort((a, b) => Number(b.priceChangePercent) - Number(a.priceChangePercent));
      const pick = (x: (typeof universe)[number]) => ({ symbol: x.symbol, changePct: x.priceChangePercent, lastPrice: x.lastPrice });
      movers = { universe: "Top 30 USDT por volume 24h", gainers: byChange.slice(0, 3).map(pick), losers: byChange.slice(-3).reverse().map(pick) };
    }

    return {
      symbol: q.symbol,
      provider: "binance_spot",
      generatedAt: new Date(this.now()).toISOString(),
      window: { kind: q.window, label: w.label, startMs: w.startMs, endMs: w.endMs, timeZone: q.tz, partial: w.partial },
      barInterval: BAR,
      bars: win.length,
      ohlcv: { open: first.open, high: px(hi), low: px(lo), close: last.close, volumeBase: toDecimalString(vb, 8), volumeQuote: toDecimalString(vq, 2), trades },
      highTimeMs: hiT,
      lowTimeMs: loT,
      change: { abs: px(close - open), pct: toDecimalString(((close - open) / open) * 100, 4) },
      rangePct: toDecimalString(((hi - lo) / open) * 100, 4),
      realizedVolPct: sd === null ? null : toDecimalString(sd * Math.sqrt(logR.length) * 100, 4),
      maxDrawdownPct: toDecimalString(drawdownPct, 4),
      maxRunupPct: toDecimalString(runupPct, 4),
      regimeAtEnd: analysis?.regime.state ?? "indisponivel",
      events: events.slice(0, 12),
      candles: win,
      movers,
      method: [
        `Barras de ${BAR} com abertura dentro da janela [início, fim); ${win.length} barras.`,
        "Abertura = abertura da 1ª barra; fechamento = fechamento da última; máx./mín. = extremos das barras; volume = soma.",
        "Amplitude = (máx − mín) / abertura · 100.",
        "Volatilidade realizada = desvio-padrão amostral dos retornos log entre fechamentos × √(nº de retornos), em %; não anualizada.",
        "Maior queda/alta = maior movimento pico→vale / vale→pico entre fechamentos, na ordem temporal.",
        `Regime e eventos: mesmas regras da análise (EMA9×EMA21, SMA20, Donchian 20) sobre barras fechadas de ${BAR}, com ${LOOKBACK_BARS} barras de aquecimento antes da janela.`,
        ...(q.window === "rolling_24h" ? ["Maiores altas/baixas: variação 24h móvel (ticker Binance) entre os 30 pares USDT de maior volume."] : []),
      ],
    };
  }
}
