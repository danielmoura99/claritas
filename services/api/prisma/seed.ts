// Seed mínimo: cria a watchlist "default" com três instrumentos. NENHUMA cotação ou dado de mercado é gravado.
import { Database } from "../src/infrastructure/db";
import { WatchlistRepository } from "../src/modules/watchlist/repositories";
import { loadEnvFiles } from "../src/config/env";

loadEnvFiles();
const db = new Database(process.env.DATABASE_URL);
const repo = new WatchlistRepository(db);
const current = await repo.get();
if (current.items.length === 0) {
  for (const [base, quote] of [["BTC", "USDT"], ["ETH", "USDT"], ["SOL", "USDT"]] as const) await repo.add(base, quote);
}
console.log("watchlist default:", (await repo.get()).items.map((i) => i.symbol).join(", "));
await db.close();
