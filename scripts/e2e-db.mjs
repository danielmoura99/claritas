#!/usr/bin/env node
// Banco LOCAL dos testes E2E e da verificação manual de login (nunca o DATABASE_URL do .env, que é o Neon).
// Cria `claritas_e2e` no cluster isolado (npm run db:local:start) se não existir, aplica as migrações
// (migrate deploy, não destrutivo) e o seed da watchlist modelo. Idempotente.
//
//   node scripts/e2e-db.mjs            # prepara e imprime a URL
//   node scripts/e2e-db.mjs --api      # prepara e sobe a API (npm run dev:api) apontando para ele
import { execSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import pg from "pg";

const ROOT = resolve(import.meta.dirname, "..");
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://claritas:claritas_dev@127.0.0.1:5544/claritas_e2e";

const url = new URL(E2E_DATABASE_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
  console.error("E2E_DATABASE_URL precisa apontar para um PostgreSQL local (recusado: %s)", url.hostname);
  process.exit(1);
}
const dbName = url.pathname.slice(1);
const admin = new URL(E2E_DATABASE_URL);
admin.pathname = "/postgres";

const client = new pg.Client({ connectionString: admin.toString() });
try {
  await client.connect();
} catch (err) {
  console.error("PostgreSQL local inacessível em %s — rode `npm run db:local:start`. (%s)", admin.host, err.message);
  process.exit(1);
}
const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
await client.end();

const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL, PRISMA_HIDE_UPDATE_MESSAGE: "1" };
execSync("npm run db:migrate", { cwd: ROOT, env, stdio: "pipe" });
execSync("npm run db:seed", { cwd: ROOT, env, stdio: "pipe" });
console.log(`banco E2E pronto: ${url.host}/${dbName}`);

if (process.argv.includes("--api")) {
  const child = spawn("npm", ["run", "dev:api"], { cwd: ROOT, env, stdio: "inherit", shell: true });
  const stop = () => child.kill();
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}
