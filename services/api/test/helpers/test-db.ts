import { execSync } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";

// PostgreSQL REAL e LOCAL (`npm run db:local:start`). NUNCA usa DATABASE_URL (pode ser o Neon).
// Cada suíte cria um banco NOVO e vazio, aplica as migrações (migrate deploy) e o remove no fim.
const ADMIN_URL = process.env.DATABASE_URL_TEST_ADMIN ?? "postgresql://claritas:claritas_dev@127.0.0.1:5544/postgres";
const API_DIR = resolve(__dirname, "../..");

async function adminQuery(sql: string) {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    await admin.query(sql);
  } finally {
    await admin.end();
  }
}

export async function createTestDatabase(prefix: string) {
  const name = `${prefix}_${Date.now()}_${Math.floor(performance.now())}`;
  const u = new URL(ADMIN_URL);
  if (!["127.0.0.1", "localhost"].includes(u.hostname)) throw new Error("Testes de banco só rodam contra PostgreSQL local");
  u.pathname = `/${name}`;
  await adminQuery(`CREATE DATABASE "${name}"`);
  execSync("npx prisma migrate deploy", { cwd: API_DIR, env: { ...process.env, DATABASE_URL: u.toString(), PRISMA_HIDE_UPDATE_MESSAGE: "1" }, stdio: "pipe" });
  return {
    url: u.toString(),
    drop: () => adminQuery(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`),
  };
}
