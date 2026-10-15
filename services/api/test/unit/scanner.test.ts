import { describe, expect, it } from "vitest";
import type { Candle, MarketAsset, Quote } from "@claritas/contracts";
import { mapLimit } from "../../src/infrastructure/concurrency";
import { MarketService } from "../../src/modules/market/market-service";
import { ScannerService } from "../../src/modules/scanner/scanner-service";
import type { CandleRequest, MarketDataProvider } from "../../src/providers/market-data-provider";

// Provedor FALSO de teste: ativos e cotações fictícios para exercitar ranking, filtros e concorrência.
const T0 = Date.UTC(2023, 0, 2);
const asset = (base: string, quote = "USDT", status: MarketAsset["status"] = "TRADING"): MarketAsset => ({ id: `X:${base}${quote}`, provider: "binance_spot", symbol: `${base}${quote}`, baseAsset: base, quoteAsset: quote, displayName: `${base}/${quote}`, pricePrecision: 2, status });
const quote = (symbol: string, vol: number): Quote => ({ symbol, lastPrice: "10.00", openPrice: "9.00", highPrice: "11.00", lowPrice: "8.00", priceChange: "1.00", priceChangePercent: "11.111", volumeBase: "1", volumeQuote: String(vol), window: "rolling_24h", openTimeMs: T0, closeTimeMs: T0 + 1, provider: "binance_spot" });

class FakeProvider implements MarketDataProvider {
  readonly id = "binance_spot" as const;
  inFlight = 0;
  maxInFlight = 0;
  calls = 0;
  assets = [asset("AAA"), asset("BBB"), asset("CCC"), asset("USDC"), asset("DDD", "BTC"), asset("EEE", "USDT", "HALTED"), asset("FFF")];
  quotes = [quote("AAAUSDT", 500), quote("BBBUSDT", 900), quote("CCCUSDT", 100), quote("USDCUSDT", 99_999), quote("DDDBTC", 5_000), quote("EEEUSDT", 7_000), quote("FFFUSDT", 300)];
  async listAssets() { return this.assets; }
  async getQuote(): Promise<Quote> { throw new Error("n/a"); }
  async getQuotes(): Promise<Quote[]> { return []; }
  async getAllQuotes() { return this.quotes; }
  async ping() { return true; }
  async getCandles({ symbol, interval, limit }: CandleRequest): Promise<Candle[]> {
    this.calls++;
    this.inFlight++;
    this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
    await new Promise((r) => setTimeout(r, 5));
    this.inFlight--;
    if (symbol === "FFFUSDT") throw new Error("upstream falhou");
    return Array.from({ length: limit }, (_, i) => {
      const c = 100 + i;
      return { symbol, interval, openTimeMs: T0 + i * 900_000, closeTimeMs: T0 + (i + 1) * 900_000 - 1, open: String(c - 0.5), high: String(c + 1), low: String(c - 1), close: String(c), volumeBase: "1", volumeQuote: "100", isClosed: true, provider: "binance_spot" };
    });
  }
}

describe("ScannerService", () => {
  it("universo = top N por volume 24h, só TRADING da moeda de cotação, sem stablecoins", async () => {
    const p = new FakeProvider();
    const s = new ScannerService(new MarketService(p, []), 2, () => T0 + 500 * 900_000);
    const r = await s.scan("USDT", 3, "15m");
    expect(r.results.map((x) => [x.rank, x.symbol])).toEqual([[1, "BBBUSDT"], [2, "AAAUSDT"]]);
    expect(r.skipped).toEqual([{ symbol: "FFFUSDT", reason: "upstream falhou" }]);
    expect(r.results[0]).toMatchObject({ regime: "alta", change24hPct: "11.111", quoteVolume24h: "900" });
    expect(r.results[0]!.closes).toHaveLength(30);
    expect(r.universe.rankedBy).toBe("quoteVolume24h");
  });

  it("respeita o limite de concorrência e reutiliza cache (não satura a Binance)", async () => {
    const p = new FakeProvider();
    const s = new ScannerService(new MarketService(p, []), 2, () => T0 + 500 * 900_000);
    await s.scan("USDT", 10, "15m");
    expect(p.maxInFlight).toBeLessThanOrEqual(2);
    const calls = p.calls;
    await s.scan("USDT", 10, "15m");
    expect(p.calls).toBe(calls);
  });
});

describe("mapLimit", () => {
  it("preserva ordem e isola falhas", async () => {
    const r = await mapLimit([1, 2, 3], 2, async (x) => {
      if (x === 2) throw new Error("x");
      return x * 10;
    });
    expect(r.map((x) => x.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    expect((r[2] as PromiseFulfilledResult<number>).value).toBe(30);
  });
});
