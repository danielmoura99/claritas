#!/usr/bin/env node
// Banco PostgreSQL LOCAL e isolado para desenvolvimento/testes (ADR-014).
// Usa os binários do PostgreSQL já instalados (PG_BIN ou PATH) para criar um cluster próprio em .data/postgres,
// na porta 5544, sem tocar em nenhum servidor PostgreSQL existente na máquina.
//
//   node scripts/db-local.mjs start    # cria (se preciso) e inicia o cluster + bancos claritas e claritas_test
//   node scripts/db-local.mjs stop
//   node scripts/db-local.mjs status
//
// Credenciais apenas de desenvolvimento (iguais às do .env.example). Nunca use em produção.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = join(ROOT, ".data", "postgres");
const LOG = join(ROOT, ".data", "postgres.log");
const PORT = process.env.DB_LOCAL_PORT ?? "5544";
const USER = "claritas";
const PASSWORD = "claritas_dev";
const DATABASES = ["claritas", "claritas_test"];

function findBin() {
  const candidates = [process.env.PG_BIN, "C:\\Program Files\\PostgreSQL\\17\\bin", "C:\\Program Files\\PostgreSQL\\16\\bin", "/usr/lib/postgresql/17/bin", "/usr/lib/postgresql/16/bin", "/opt/homebrew/bin", "/usr/local/bin"].filter(Boolean);
  for (const dir of candidates) {
    const exe = join(dir, process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl");
    if (existsSync(exe)) return dir;
  }
  const which = spawnSync(process.platform === "win32" ? "where" : "which", ["pg_ctl"], { encoding: "utf8" });
  if (which.status === 0) return resolve(which.stdout.trim().split(/\r?\n/)[0], "..");
  console.error("PostgreSQL não encontrado. Instale o PostgreSQL (16+) ou defina PG_BIN com a pasta dos binários.");
  process.exit(1);
}

const BIN = findBin();
const bin = (name) => join(BIN, process.platform === "win32" ? `${name}.exe` : name);
const run = (name, args, opts = {}) => spawnSync(bin(name), args, { encoding: "utf8", ...opts });
const env = { ...process.env, PGPASSWORD: PASSWORD };

function isRunning() {
  return run("pg_ctl", ["-D", DATA, "status"]).status === 0;
}

function init() {
  if (existsSync(join(DATA, "PG_VERSION"))) return;
  // No Windows o initdb roda com token restrito e pode não conseguir criar a pasta: criamos antes.
  mkdirSync(DATA, { recursive: true });
  const pwfile = join(ROOT, ".data", "pw.tmp");
  writeFileSync(pwfile, PASSWORD);
  const r = run("initdb", ["-D", DATA, "-U", USER, "--pwfile", pwfile, "--auth=scram-sha-256", "--encoding=UTF8", "--locale=C"], { stdio: "inherit" });
  rmSync(pwfile, { force: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function start() {
  init();
  if (!isRunning()) {
    // Destacado do console de quem chamou: no Windows o postgres morre (0xC0000142) se o console fechar,
    // e herdar stdio faria este comando nunca retornar. A saída vai para .data/postgres.log.
    const child = spawn(bin("pg_ctl"), ["-D", DATA, "-l", LOG, "-o", `-p ${PORT} -c listen_addresses=127.0.0.1`, "start"], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    const deadline = Date.now() + 30_000;
    while (run("pg_isready", ["-h", "127.0.0.1", "-p", PORT]).status !== 0) {
      if (Date.now() > deadline) {
        console.error("PostgreSQL não respondeu em 30 s; veja .data/postgres.log");
        process.exit(1);
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
  for (const db of DATABASES) {
    const exists = run("psql", ["-h", "127.0.0.1", "-p", PORT, "-U", USER, "-d", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname='${db}'`], { env });
    if (exists.stdout.trim() !== "1") {
      const c = run("createdb", ["-h", "127.0.0.1", "-p", PORT, "-U", USER, db], { env, stdio: "inherit" });
      if (c.status !== 0) process.exit(c.status ?? 1);
    }
  }
  console.log(`PostgreSQL local em 127.0.0.1:${PORT} (dados em .data/postgres)`);
  console.log(`DATABASE_URL=postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/claritas`);
}

function stop() {
  if (isRunning()) run("pg_ctl", ["-D", DATA, "-w", "stop"], { stdio: "inherit" });
  console.log("PostgreSQL local parado.");
}

const cmd = process.argv[2] ?? "status";
if (cmd === "start") start();
else if (cmd === "stop") stop();
else console.log(isRunning() ? `rodando em 127.0.0.1:${PORT}` : "parado");
