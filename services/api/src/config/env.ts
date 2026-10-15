import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { IntervalSchema, SymbolSchema } from "@claritas/contracts";

/** Carrega `.env` da raiz do repositório e de services/api (se existirem) sem sobrescrever o ambiente real. */
export function loadEnvFiles(cwd = process.cwd()) {
  for (const file of [resolve(cwd, ".env"), resolve(cwd, "../../.env")]) {
    if (existsSync(file)) {
      try {
        process.loadEnvFile(file);
      } catch {
        /* arquivo ilegível: segue com o ambiente atual */
      }
    }
  }
}

const csv = z
  .string()
  .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: csv.default(["http://localhost:3000"]),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MARKET_DATA_PROVIDER: z.literal("binance_spot").default("binance_spot"),
  BINANCE_SPOT_REST_URL: z.url().default("https://data-api.binance.vision"),
  BINANCE_SPOT_WS_URL: z.string().regex(/^wss?:\/\//).default("wss://data-stream.binance.vision:443"),
  BINANCE_HTTP_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(8_000),
  MARKET_DEFAULT_SYMBOL: SymbolSchema.default("BTCUSDT"),
  MARKET_DEFAULT_INTERVAL: IntervalSchema.default("5m"),
  /** Símbolos exibidos na fita/seletor quando não há watchlist persistida. */
  MARKET_FEATURED_SYMBOLS: csv.default(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "LINKUSDT"]),
  /** Sem eventos além deste limite → `stale`. */
  STREAM_STALE_AFTER_MS: z.coerce.number().int().min(2_000).default(15_000),
  /** Tempo de retenção de uma assinatura upstream sem consumidores (evita churn). */
  STREAM_UPSTREAM_LINGER_MS: z.coerce.number().int().min(0).default(30_000),
  STREAM_MAX_SUBSCRIPTIONS_PER_CLIENT: z.coerce.number().int().min(1).max(200).default(40),
  SCANNER_UNIVERSE_SIZE: z.coerce.number().int().min(5).max(100).default(30),
  SCANNER_CONCURRENCY: z.coerce.number().int().min(1).max(8).default(4),
  DATABASE_URL: z.string().optional(),
});
export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuração inválida: ${issues}`);
  }
  return result.data;
}
