import { INTERVAL_MS, toChartNumber, type Candle, type Interval, type ScannerResult, type ScannerRow } from "@claritas/contracts";
import { TtlCache } from "../../infrastructure/cache";
import { mapLimit } from "../../infrastructure/concurrency";
import type { MarketService } from "../market/market-service";
import { computeAnalysis } from "../analysis/analysis-service";
import { toDecimalString } from "../analysis/indicators";

/** Bases lastreadas (stablecoins, moedas fiduciárias, ouro tokenizado): pares delas com USDT não descrevem "mercado" e poluem o ranking. */
export const EXCLUDED_BASES = ["USDC", "FDUSD", "TUSD", "USDP", "DAI", "BUSD", "USD1", "EUR", "EURI", "AEUR", "XUSD", "USDE", "PAXG", "XAUT", "BFUSD", "RLUSD"];
const BARS = 120;
const CHANGE_N = 20;
const RECENT_BARS = 5;

/**
 * Scanner sobre dados reais: universo = top N pares da moeda de cotação por volume 24h (1 chamada de ticker para todos,
 * cache 60s); métricas por ativo a partir de klines reais com concorrência limitada e cache por (símbolo, timeframe, barra).
 */
export class ScannerService {
  private readonly klineCache = new TtlCache<Candle[]>(400);
  private readonly resultCache = new TtlCache<ScannerResult>(20);

  constructor(private readonly market: MarketService, private readonly concurrency: number, private readonly now: () => number = Date.now) {}

  async scan(quote: string, size: number, timeframe: Interval): Promise<ScannerResult> {
    return this.resultCache.getOrLoad(`${quote}:${size}:${timeframe}`, 30_000, () => this.run(quote, size, timeframe));
  }

  private async run(quote: string, size: number, timeframe: Interval): Promise<ScannerResult> {
    const [assets, quotes] = await Promise.all([this.market.provider.listAssets(), this.market.provider.getAllQuotes()]);
    const tradable = new Map(assets.filter((a) => a.status === "TRADING" && a.quoteAsset === quote && !EXCLUDED_BASES.includes(a.baseAsset)).map((a) => [a.symbol, a]));
    const universe = quotes
      .filter((q) => tradable.has(q.symbol) && Number(q.lastPrice) > 0)
      .sort((a, b) => Number(b.volumeQuote) - Number(a.volumeQuote))
      .slice(0, size);

    // Mesma janela de tempo para o cache: muda quando fecha uma barra do timeframe.
    const bucket = Math.floor(this.now() / INTERVAL_MS[timeframe]);
    const settled = await mapLimit(universe, this.concurrency, async (q) => {
      const candles = await this.klineCache.getOrLoad(`${q.symbol}:${timeframe}:${bucket}`, INTERVAL_MS[timeframe], () =>
        this.market.provider.getCandles({ symbol: q.symbol, interval: timeframe, limit: BARS }),
      );
      return { q, candles: candles.filter((c) => c.isClosed) };
    });

    const results: ScannerRow[] = [];
    const skipped: { symbol: string; reason: string }[] = [];
    settled.forEach((s, i) => {
      const q = universe[i]!;
      if (s.status === "rejected") return skipped.push({ symbol: q.symbol, reason: (s.reason as Error)?.message ?? "falha ao obter candles" });
      const { candles } = s.value;
      if (candles.length < 30) return skipped.push({ symbol: q.symbol, reason: `apenas ${candles.length} barras fechadas` });
      const asset = tradable.get(q.symbol)!;
      const digits = (asset.pricePrecision ?? 4) + 2;
      const a = computeAnalysis(q.symbol, timeframe, candles, false, digits, this.now());
      const lastIdx = candles.length - 1;
      const ev = a.events[0];
      const evIdx = ev ? candles.findIndex((c) => c.openTimeMs === ev.openTimeMs) : -1;
      const ind = (id: string) => a.indicators.find((x) => x.id === id)?.value ?? null;
      results.push({
        symbol: q.symbol,
        displayName: asset.displayName,
        pricePrecision: asset.pricePrecision,
        rank: i + 1,
        lastPrice: q.lastPrice,
        change24hPct: q.priceChangePercent,
        quoteVolume24h: q.volumeQuote,
        high24h: q.highPrice,
        low24h: q.lowPrice,
        regime: a.regime.state,
        lastEvent: ev && evIdx >= 0 ? { type: ev.type, openTimeMs: ev.openTimeMs, barsAgo: lastIdx - evIdx } : null,
        relVolume: ind("rel_volume"),
        volatilityPct: ind("vol20"),
        changeNPct: ind("change20"),
        closes: candles.slice(-30).map((c) => toDecimalString(toChartNumber(c.close), digits)),
        lastClosedOpenTimeMs: candles[lastIdx]!.openTimeMs,
      });
    });

    return {
      provider: "binance_spot",
      scannedAt: new Date(this.now()).toISOString(),
      timeframe,
      universe: { quote, size: universe.length, rankedBy: "quoteVolume24h", excludedBases: EXCLUDED_BASES },
      params: { barsAnalyzed: BARS, changeN: CHANGE_N, recentBars: RECENT_BARS },
      results,
      skipped,
    };
  }
}
