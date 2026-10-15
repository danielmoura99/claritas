import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AssetsQuerySchema, CandlesQuerySchema, SymbolQuerySchema, SymbolSchema } from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { MarketService } from "./market-service";

const QuotesQuerySchema = z.object({
  symbols: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(SymbolSchema).min(1).max(40)),
});

export async function marketRoutes(app: FastifyInstance, { market }: { market: MarketService }) {
  app.get("/assets", async (req) => {
    const q = parseOrThrow(AssetsQuerySchema, req.query);
    return market.envelope(await market.searchAssets(q));
  });

  app.get("/assets/:symbol", async (req) => {
    const { symbol } = parseOrThrow(SymbolQuerySchema, req.params);
    return market.envelope(await market.resolveAsset(symbol));
  });

  app.get("/quote", async (req) => {
    const { symbol } = parseOrThrow(SymbolQuerySchema, req.query);
    const quote = await market.getQuote(symbol);
    return market.envelope(quote, { asOfMs: quote.closeTimeMs });
  });

  app.get("/quotes", async (req) => {
    const { symbols } = parseOrThrow(QuotesQuerySchema, req.query);
    const quotes = await market.getQuotes(symbols);
    return market.envelope(quotes, { asOfMs: Math.max(0, ...quotes.map((q) => q.closeTimeMs)) || undefined });
  });

  app.get("/candles", async (req) => {
    const q = parseOrThrow(CandlesQuerySchema, req.query);
    const candles = await market.getCandles(q.symbol, q.interval, q.limit, q.endTimeMs);
    const last = candles[candles.length - 1];
    return market.envelope(candles, { asOfMs: last ? Math.min(last.closeTimeMs, Date.now()) : undefined });
  });
}
