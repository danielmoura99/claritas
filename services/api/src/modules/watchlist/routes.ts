import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { PreferenceUpdateSchema, SymbolSchema } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { parseOrThrow } from "../../infrastructure/validation";
import { authOf } from "../auth/routes";
import type { AccessPolicy } from "../entitlements/entitlements-service";
import type { MarketService } from "../market/market-service";
import type { PreferenceRepository, WatchlistRepository } from "./repositories";

/** Watchlist e preferências do usuário da sessão (o guarda de auth já validou a sessão). */
export async function persistenceRoutes(
  app: FastifyInstance,
  { watchlist, preferences, market, access }: { watchlist: WatchlistRepository; preferences: PreferenceRepository; market: MarketService; access: AccessPolicy },
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

  app.get("/watchlist", async (req) => ({ data: await watchlist.get(authOf(req).user.id) }));

  app.put("/watchlist/items/:symbol", async (req) => {
    const userId = authOf(req).user.id;
    const { symbol } = parseOrThrow(SymbolParams, req.params);
    const i = await instrumentOf(symbol, true); // só ativos negociando entram
    // Limite do plano/concessão (LIMIT). Sem decisão favorável, nada entra (deny-by-default).
    const d = await access.check(userId, "watchlist.max_assets");
    if (!d.allowed || d.limit === undefined) throw new AppError("ENTITLEMENT_REQUIRED", "Watchlist não incluída no seu acesso atual", { details: { feature: "watchlist.max_assets", reason: d.reason } });
    return { data: await watchlist.add(userId, i.baseAsset, i.quoteAsset, d.limit) };
  });

  app.delete("/watchlist/items/:symbol", async (req) => {
    const userId = authOf(req).user.id;
    const { symbol } = parseOrThrow(SymbolParams, req.params);
    const i = await instrumentOf(symbol, false); // remover funciona mesmo se o ativo deixou de negociar
    return { data: await watchlist.remove(userId, i.baseAsset, i.quoteAsset) };
  });

  // Usuário sem preferências ainda é um estado normal (data: null), não um erro.
  app.get("/preferences", async (req) => ({ data: await preferences.get(authOf(req).user.id) }));

  app.put("/preferences", async (req) => {
    const userId = authOf(req).user.id;
    const patch = parseOrThrow(PreferenceUpdateSchema, req.body ?? {});
    if (patch.symbol) await market.resolveAsset(patch.symbol);
    return { data: await preferences.upsert(userId, patch) };
  });
}
