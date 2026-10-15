import type { Preference, PreferenceUpdate, Watchlist } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";

export const DEFAULT_WATCHLIST = "default";

/** Mapeamento instrumento → símbolo do provedor atual (Binance Spot concatena base e cotação). */
export const providerSymbol = (base: string, quote: string) => `${base}${quote}`;

export class WatchlistRepository {
  constructor(private readonly db: Database) {}

  private async ensureDefault() {
    return this.db.run((p) => p.watchlist.upsert({ where: { name: DEFAULT_WATCHLIST }, update: {}, create: { name: DEFAULT_WATCHLIST } }));
  }

  async get(): Promise<Watchlist> {
    const wl = await this.ensureDefault();
    return this.db.run(async (p) => {
      const full = await p.watchlist.findUniqueOrThrow({ where: { id: wl.id }, include: { items: { orderBy: { position: "asc" } } } });
      return {
        id: full.id,
        name: full.name,
        updatedAt: full.updatedAt.toISOString(),
        items: full.items.map((i) => ({ baseAsset: i.baseAsset, quoteAsset: i.quoteAsset, symbol: providerSymbol(i.baseAsset, i.quoteAsset), position: i.position })),
      };
    });
  }

  /** Adiciona ao fim (idempotente). */
  async add(baseAsset: string, quoteAsset: string): Promise<Watchlist> {
    const wl = await this.ensureDefault();
    await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const exists = await tx.watchlistItem.findUnique({ where: { watchlistId_baseAsset_quoteAsset: { watchlistId: wl.id, baseAsset, quoteAsset } } });
        if (exists) return;
        const last = await tx.watchlistItem.aggregate({ where: { watchlistId: wl.id }, _max: { position: true } });
        await tx.watchlistItem.create({ data: { watchlistId: wl.id, baseAsset, quoteAsset, position: (last._max.position ?? -1) + 1 } });
        await tx.watchlist.update({ where: { id: wl.id }, data: { updatedAt: new Date() } });
      }),
    );
    return this.get();
  }

  async remove(baseAsset: string, quoteAsset: string): Promise<Watchlist> {
    const wl = await this.ensureDefault();
    await this.db.run((p) => p.watchlistItem.deleteMany({ where: { watchlistId: wl.id, baseAsset, quoteAsset } }));
    return this.get();
  }
}

export class PreferenceRepository {
  constructor(private readonly db: Database) {}

  private static toDto(r: { clientId: string; symbol: string | null; interval: string | null; showAnalysis: boolean; updatedAt: Date }): Preference {
    return { clientId: r.clientId, symbol: r.symbol, interval: r.interval as Preference["interval"], showAnalysis: r.showAnalysis, updatedAt: r.updatedAt.toISOString() };
  }

  async get(clientId: string): Promise<Preference | null> {
    const r = await this.db.run((p) => p.userPreference.findUnique({ where: { clientId } }));
    return r ? PreferenceRepository.toDto(r) : null;
  }

  async upsert(clientId: string, patch: PreferenceUpdate): Promise<Preference> {
    const r = await this.db.run((p) => p.userPreference.upsert({ where: { clientId }, update: patch, create: { clientId, ...patch } }));
    return PreferenceRepository.toDto(r);
  }
}
