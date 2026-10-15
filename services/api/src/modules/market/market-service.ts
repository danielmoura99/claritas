import { INTERVAL_MS, type Candle, type Interval, type MarketAsset, type MarketEnvelope, type MarketStatus, type Quote } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { TtlCache } from "../../infrastructure/cache";
import type { MarketDataProvider } from "../../providers/market-data-provider";
import { sortDedupeCandles } from "../../providers/binance/normalize";

const LATEST_CANDLES_TTL_MS = 2_000;
const HISTORICAL_CANDLES_TTL_MS = 5 * 60_000;
const QUOTE_TTL_MS = 2_000;

export class MarketService {
  private readonly candleCache = new TtlCache<Candle[]>(300);
  private readonly quoteCache = new TtlCache<Quote>(300);

  constructor(
    readonly provider: MarketDataProvider,
    private readonly featured: string[],
    private readonly now: () => number = Date.now,
  ) {}

  envelope<T>(data: T, opts: { asOfMs?: number; status?: MarketStatus } = {}): MarketEnvelope<T> {
    const receivedAt = new Date(this.now()).toISOString();
    return {
      data,
      source: this.provider.id,
      receivedAt,
      asOf: opts.asOfMs ? new Date(opts.asOfMs).toISOString() : receivedAt,
      status: opts.status ?? "live",
    };
  }

  private async assetMap(): Promise<Map<string, MarketAsset>> {
    const assets = await this.provider.listAssets();
    return new Map(assets.map((a) => [a.symbol, a]));
  }

  /** Garante que o símbolo existe na Binance Spot e está negociando. */
  async resolveAsset(symbol: string): Promise<MarketAsset> {
    const asset = (await this.assetMap()).get(symbol);
    if (!asset) throw new AppError("SYMBOL_NOT_FOUND", `Símbolo ${symbol} não existe na Binance Spot`);
    if (asset.status !== "TRADING") {
      throw new AppError("SYMBOL_NOT_FOUND", `Símbolo ${symbol} não está em negociação (status ${asset.status})`, { details: { status: asset.status } });
    }
    return asset;
  }

  async searchAssets({ search, quote, limit }: { search?: string; quote?: string; limit: number }): Promise<MarketAsset[]> {
    const assets = (await this.provider.listAssets()).filter((a) => a.status === "TRADING" && (!quote || a.quoteAsset === quote));
    const q = search?.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const featuredRank = (s: string) => {
      const i = this.featured.indexOf(s);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    const matches = q
      ? assets.filter((a) => a.symbol.includes(q) || a.baseAsset.startsWith(q))
      : assets.filter((a) => this.featured.includes(a.symbol));
    return matches
      .sort((a, b) => {
        if (q) {
          const exact = Number(b.baseAsset === q) - Number(a.baseAsset === q);
          if (exact) return exact;
          const starts = Number(b.symbol.startsWith(q)) - Number(a.symbol.startsWith(q));
          if (starts) return starts;
        }
        return featuredRank(a.symbol) - featuredRank(b.symbol) || a.symbol.localeCompare(b.symbol);
      })
      .slice(0, limit);
  }

  featuredSymbols() {
    return this.featured;
  }

  async getQuote(symbol: string): Promise<Quote> {
    await this.resolveAsset(symbol);
    return this.quoteCache.getOrLoad(symbol, QUOTE_TTL_MS, () => this.provider.getQuote(symbol));
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const map = await this.assetMap();
    const valid = symbols.filter((s) => map.get(s)?.status === "TRADING");
    return this.provider.getQuotes(valid);
  }

  /** Últimos `limit` candles (ou até `endTimeMs`), crescentes. Cache curto para o "agora", longo para histórico fechado. */
  async getCandles(symbol: string, interval: Interval, limit: number, endTimeMs?: number): Promise<Candle[]> {
    await this.resolveAsset(symbol);
    const key = `${symbol}:${interval}:${limit}:${endTimeMs ?? "now"}`;
    const historical = endTimeMs !== undefined && endTimeMs < this.now() - INTERVAL_MS[interval];
    return this.candleCache.getOrLoad(key, historical ? HISTORICAL_CANDLES_TTL_MS : LATEST_CANDLES_TTL_MS, () =>
      this.provider.getCandles({ symbol, interval, limit, endTimeMs }),
    );
  }

  /** Busca paginada [startMs, endMs] (lotes de 1000), para backfill e relatórios. Sem cache. */
  async getCandlesRange(symbol: string, interval: Interval, startMs: number, endMs: number, maxCandles = 5000): Promise<Candle[]> {
    const out: Candle[] = [];
    let cursor = startMs;
    while (cursor <= endMs && out.length < maxCandles) {
      const page = await this.provider.getCandles({ symbol, interval, limit: 1000, startTimeMs: cursor, endTimeMs: endMs });
      if (page.length === 0) break;
      out.push(...page);
      const last = page[page.length - 1]!;
      if (page.length < 1000) break;
      cursor = last.openTimeMs + INTERVAL_MS[interval];
    }
    return sortDedupeCandles(out).slice(0, maxCandles);
  }
}
