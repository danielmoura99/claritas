// Seed mínimo e idempotente. NENHUMA cotação, conta de usuário, assinatura, admin, preço ou publicação é criada:
//  - watchlist modelo (sem dono) copiada para contas novas;
//  - catálogo de features (Plano 02) e planos iniciais em RASCUNHO.
import { Database } from "../src/infrastructure/db";
import { ensureTemplateWatchlist } from "../src/modules/watchlist/repositories";
import { seedCatalog } from "../src/modules/plans/seed-catalog";
import { loadEnvFiles } from "../src/config/env";

loadEnvFiles();
const db = new Database(process.env.DATABASE_URL);
const symbols = await ensureTemplateWatchlist(db, [["BTC", "USDT"], ["ETH", "USDT"], ["SOL", "USDT"]]);
console.log("watchlist modelo:", symbols.join(", "));
const catalog = await seedCatalog(db);
console.log(`catálogo: ${catalog.features} features; planos-rascunho criados: ${catalog.draftPlansCreated.join(", ") || "nenhum (já existiam)"}`);
await db.close();
