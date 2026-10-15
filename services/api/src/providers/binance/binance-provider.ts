import type { FastifyBaseLogger } from "fastify";
import { z } from "zod";
import type { Candle, MarketAsset, Quote } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { TtlCache } from "../../infrastructure/cache";
import type { CandleRequest, MarketDataProvider } from "../market-data-provider";
import { BinanceHttp } from "./http";
import { ExchangeInfoSchema, RestKlineSchema, Ticker24hSchema } from "./schemas";
import { exchangeSymbolToAsset, isConsistentOhlc, restKlineToCandle, sortDedupeCandles, tickerToQuote } from "./normalize";

export interface BinanceProviderOptions {
  restUrl: string;
  timeoutMs: number;
  log?: Pick<FastifyBaseLogger, "warn" | "debug" | "info">;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const EXCHANGE_INFO_TTL_MS = 60 * 60_000;
const ALL_TICKERS_TTL_MS = 60_000;

/** Binance Spot — dados públicos (sem API key) via data-api.binance.vision. */
export class BinanceSpotProvider implements MarketDataProvider {
  readonly id = "binance_spot" as const;
  readonly http: BinanceHttp;
  private readonly cache = new TtlCache<unknown>();
  private readonly now: () => number;

  constructor(private readonly opts: BinanceProviderOptions) {
    this.http = new BinanceHttp({ baseUrl: opts.restUrl, timeoutMs: opts.timeoutMs, log: opts.log, fetchImpl: opts.fetchImpl });
    this.now = opts.now ?? Date.now;
  }

  async listAssets(): Promise<MarketAsset[]> {
    return this.cache.getOrLoad("exchangeInfo", EXCHANGE_INFO_TTL_MS, async () => {
      const raw = await this.http.get("/api/v3/exchangeInfo", { permissions: "SPOT", showPermissionSets: "false" });
      const parsed = ExchangeInfoSchema.safeParse(raw);
      if (!parsed.success) throw new AppError("PROVIDER_BAD_RESPONSE", "exchangeInfo em formato inesperado");
      return parsed.data.symbols.map(exchangeSymbolToAsset);
    }) as Promise<MarketAsset[]>;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const raw = await this.http.get("/api/v3/ticker/24hr", { symbol });
    const parsed = Ticker24hSchema.safeParse(raw);
    if (!parsed.success) throw new AppError("PROVIDER_BAD_RESPONSE", "ticker/24hr em formato inesperado");
    return tickerToQuote(parsed.data);
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) return [];
    // Peso Binance: 2 para até 20 símbolos; acima disso, lotes de 20.
    const batches: string[][] = [];
    for (let i = 0; i < symbols.length; i += 20) batches.push(symbols.slice(i, i + 20));
    const results = await Promise.all(
      batches.map(async (batch) => {
        const raw = await this.http.get("/api/v3/ticker/24hr", { symbols: JSON.stringify(batch) });
        const parsed = z.array(Ticker24hSchema).safeParse(raw);
        if (!parsed.success) throw new AppError("PROVIDER_BAD_RESPONSE", "ticker/24hr em formato inesperado");
        return parsed.data.map(tickerToQuote);
      }),
    );
    return results.flat();
  }

  async getAllQuotes(): Promise<Quote[]> {
    return this.cache.getOrLoad("allTickers", ALL_TICKERS_TTL_MS, async () => {
      const raw = await this.http.get("/api/v3/ticker/24hr", {});
      const parsed = z.array(Ticker24hSchema).safeParse(raw);
      if (!parsed.success) throw new AppError("PROVIDER_BAD_RESPONSE", "ticker/24hr em formato inesperado");
      return parsed.data.map(tickerToQuote);
    }) as Promise<Quote[]>;
  }

  async getCandles({ symbol, interval, limit, startTimeMs, endTimeMs }: CandleRequest): Promise<Candle[]> {
    if (limit < 1 || limit > 1000) throw new AppError("INVALID_REQUEST", "limit deve estar entre 1 e 1000");
    const raw = await this.http.get("/api/v3/klines", { symbol, interval, limit, startTime: startTimeMs, endTime: endTimeMs });
    const rows = z.array(z.unknown()).safeParse(raw);
    if (!rows.success) throw new AppError("PROVIDER_BAD_RESPONSE", "klines em formato inesperado");
    const now = this.now();
    const candles: Candle[] = [];
    let dropped = 0;
    for (const row of rows.data) {
      const k = RestKlineSchema.safeParse(row);
      if (!k.success) {
        dropped++;
        continue;
      }
      const candle = restKlineToCandle(k.data, symbol, interval, now);
      if (!isConsistentOhlc(candle)) {
        dropped++;
        continue;
      }
      candles.push(candle);
    }
    if (dropped) this.opts.log?.warn({ symbol, interval, dropped }, "klines inválidas descartadas");
    return sortDedupeCandles(candles);
  }

  /** Amostra GET /api/v3/time 3×; usa a amostra de menor RTT (método de Cristian). */
  async estimateClockOffsetMs(): Promise<number> {
    let best: { rtt: number; offset: number } | null = null;
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now();
      const body = z.object({ serverTime: z.number() }).parse(await this.http.get("/api/v3/time"));
      const t1 = Date.now();
      const sample = { rtt: t1 - t0, offset: body.serverTime - (t0 + t1) / 2 };
      if (!best || sample.rtt < best.rtt) best = sample;
    }
    return Math.round(best!.offset);
  }

  async ping(): Promise<boolean> {
    try {
      await this.http.get("/api/v3/ping");
      return true;
    } catch {
      return false;
    }
  }
}
