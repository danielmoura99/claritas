import type { Preference, PreferenceUpdate, Watchlist } from "@claritas/contracts";
import type { Database } from "../../infrastructure/db";

/** Nome da lista sem dono que serve de modelo para contas novas (criada pelo seed). */
export const TEMPLATE_WATCHLIST = "default";

/** Mapeamento instrumento → símbolo do provedor atual (Binance Spot concatena base e cotação). */
export const providerSymbol = (base: string, quote: string) => `${base}${quote}`;

export class WatchlistRepository {
  constructor(private readonly db: Database) {}

  /** Lista do usuário; na primeira vez nasce como cópia do modelo (se houver). */
  private async ensure(userId: string) {
    const existing = await this.db.run((p) => p.watchlist.findUnique({ where: { userId } }));
    if (existing) return existing;
    try {
      return await this.db.run((p) =>
        p.$transaction(async (tx) => {
          const template = await tx.watchlist.findFirst({ where: { userId: null, name: TEMPLATE_WATCHLIST }, include: { items: { orderBy: { position: "asc" } } } });
          return tx.watchlist.create({
            data: {
              userId,
              name: TEMPLATE_WATCHLIST,
              items: { create: (template?.items ?? []).map((i, position) => ({ baseAsset: i.baseAsset, quoteAsset: i.quoteAsset, position })) },
            },
          });
        }),
      );
    } catch (err) {
      // Duas requisições simultâneas na primeira visita: a outra criou primeiro.
      if ((err as { code?: string }).code === "P2002") return this.db.run((p) => p.watchlist.findUniqueOrThrow({ where: { userId } }));
      throw err;
    }
  }

  async get(userId: string): Promise<Watchlist> {
    const wl = await this.ensure(userId);
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
  async add(userId: string, baseAsset: string, quoteAsset: string): Promise<Watchlist> {
    const wl = await this.ensure(userId);
    await this.db.run((p) =>
      p.$transaction(async (tx) => {
        const exists = await tx.watchlistItem.findUnique({ where: { watchlistId_baseAsset_quoteAsset: { watchlistId: wl.id, baseAsset, quoteAsset } } });
        if (exists) return;
        const last = await tx.watchlistItem.aggregate({ where: { watchlistId: wl.id }, _max: { position: true } });
        await tx.watchlistItem.create({ data: { watchlistId: wl.id, baseAsset, quoteAsset, position: (last._max.position ?? -1) + 1 } });
        await tx.watchlist.update({ where: { id: wl.id }, data: { updatedAt: new Date() } });
      }),
    );
    return this.get(userId);
  }

  async remove(userId: string, baseAsset: string, quoteAsset: string): Promise<Watchlist> {
    const wl = await this.ensure(userId);
    await this.db.run((p) => p.watchlistItem.deleteMany({ where: { watchlistId: wl.id, baseAsset, quoteAsset } }));
    return this.get(userId);
  }
}

/** Lista modelo das contas novas (seed). Idempotente; não toca listas de usuários. */
export async function ensureTemplateWatchlist(db: Database, instruments: readonly (readonly [string, string])[]) {
  return db.run(async (p) => {
    const found = await p.watchlist.findFirst({ where: { userId: null, name: TEMPLATE_WATCHLIST }, include: { items: true } });
    const wl = found ?? (await p.watchlist.create({ data: { name: TEMPLATE_WATCHLIST }, include: { items: true } }));
    if (wl.items.length === 0) {
      await p.watchlistItem.createMany({ data: instruments.map(([baseAsset, quoteAsset], position) => ({ watchlistId: wl.id, baseAsset, quoteAsset, position })) });
    }
    const items = await p.watchlistItem.findMany({ where: { watchlistId: wl.id }, orderBy: { position: "asc" } });
    return items.map((i) => providerSymbol(i.baseAsset, i.quoteAsset));
  });
}

export class PreferenceRepository {
  constructor(private readonly db: Database) {}

  private static toDto(r: { symbol: string | null; interval: string | null; showAnalysis: boolean; updatedAt: Date }): Preference {
    return { symbol: r.symbol, interval: r.interval as Preference["interval"], showAnalysis: r.showAnalysis, updatedAt: r.updatedAt.toISOString() };
  }

  async get(userId: string): Promise<Preference | null> {
    const r = await this.db.run((p) => p.userSettings.findUnique({ where: { userId } }));
    return r ? PreferenceRepository.toDto(r) : null;
  }

  async upsert(userId: string, patch: PreferenceUpdate): Promise<Preference> {
    const r = await this.db.run((p) => p.userSettings.upsert({ where: { userId }, update: patch, create: { userId, ...patch } }));
    return PreferenceRepository.toDto(r);
  }
}
