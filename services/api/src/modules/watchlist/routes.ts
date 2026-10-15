import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ClientIdSchema, PreferenceUpdateSchema, SymbolSchema } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { parseOrThrow } from "../../infrastructure/validation";
import type { MarketService } from "../market/market-service";
import type { PreferenceRepository, WatchlistRepository } from "./repositories";

export async function persistenceRoutes(
  app: FastifyInstance,
  { watchlist, preferences, market }: { watchlist: WatchlistRepository; preferences: PreferenceRepository; market: MarketService },
) {
  const SymbolParams = z.object({ symbol: SymbolSchema });

  /** Resolve o símbolo para a identidade independente do provedor (base/cotação). */
  async function instrumentOf(symbol: string, requireTrading: boolean) {
    if (requireTrading) {
      const a = await market.resolveAsset(symbol);
      return { baseAsset: a.baseAsset, quoteAsset: a.quoteAsset };
    }
    const a = (await market.provider.listAssets()).find((x) => x.symbol === symbol);
    if (!a) throw new AppError("SYMBOL_NOT_FOUND", `Símbolo ${symbol} não existe na Binance Spot`);
    return { baseAsset: a.baseAsset, quoteAsset: a.quoteAsset };
  }

  app.get("/watchlist", async () => ({ data: await watchlist.get() }));

  app.put("/watchlist/items/:symbol", async (req) => {
    const { symbol } = parseOrThrow(SymbolParams, req.params);
    const i = await instrumentOf(symbol, true); // só ativos negociando entram
    return { data: await watchlist.add(i.baseAsset, i.quoteAsset) };
  });

  app.delete("/watchlist/items/:symbol", async (req) => {
    const { symbol } = parseOrThrow(SymbolParams, req.params);
    const i = await instrumentOf(symbol, false); // remover funciona mesmo se o ativo deixou de negociar
    return { data: await watchlist.remove(i.baseAsset, i.quoteAsset) };
  });

  app.get("/preferences/:clientId", async (req) => {
    const { clientId } = parseOrThrow(z.object({ clientId: ClientIdSchema }), req.params);
    // Cliente sem preferências ainda é um estado normal (data: null), não um erro.
    return { data: await preferences.get(clientId) };
  });

  app.put("/preferences/:clientId", async (req) => {
    const { clientId } = parseOrThrow(z.object({ clientId: ClientIdSchema }), req.params);
    const patch = parseOrThrow(PreferenceUpdateSchema, req.body ?? {});
    if (patch.symbol) await market.resolveAsset(patch.symbol);
    return { data: await preferences.upsert(clientId, patch) };
  });
}
