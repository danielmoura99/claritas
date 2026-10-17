// Seed mínimo: cria a watchlist modelo (sem dono) que contas novas copiam. NENHUMA cotação ou dado de mercado
// é gravado, e nenhuma conta de usuário é criada.
import { Database } from "../src/infrastructure/db";
import { ensureTemplateWatchlist } from "../src/modules/watchlist/repositories";
import { loadEnvFiles } from "../src/config/env";

loadEnvFiles();
const db = new Database(process.env.DATABASE_URL);
const symbols = await ensureTemplateWatchlist(db, [["BTC", "USDT"], ["ETH", "USDT"], ["SOL", "USDT"]]);
console.log("watchlist modelo:", symbols.join(", "));
await db.close();
