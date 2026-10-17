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
  /** Requisições REST por IP por minuto (WebSocket tem limites próprios). */
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(10).max(100_000).default(600),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  MARKET_DATA_PROVIDER: z.literal("binance_spot").default("binance_spot"),
  BINANCE_SPOT_REST_URL: z.url().default("https://data-api.binance.vision"),
  BINANCE_SPOT_WS_URL: z.string().regex(/^wss?:\/\//).default("wss://data-stream.binance.vision:443"),
  BINANCE_HTTP_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(4_000),
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
  /** Duração da sessão de login (absoluta, sem renovação automática). */
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  /** Cookie de sessão só em HTTPS. Padrão: ligado em produção. */
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  /** Requisições por IP por minuto nas rotas que recebem senha (entrar/criar conta). */
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).max(1_000).default(20),
  /** Requisições por IP por minuto em cada rota administrativa (Plano 02 §4.6.8). */
  ADMIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(5).max(10_000).default(120),
  /** Intervalo do job que normaliza assinaturas vencidas (0 = desligado; o acesso é negado pelo relógio de qualquer jeito). */
  SUBSCRIPTION_EXPIRY_JOB_MINUTES: z.coerce.number().int().min(0).max(1_440).default(60),
  /** Degustação automática no cadastro (decisão do responsável, 17/10/2026): dias de teste (0 = desligada). */
  SIGNUP_TRIAL_DAYS: z.coerce.number().int().min(0).max(90).default(7),
  /** Código do plano PUBLICADO usado no teste do cadastro (a versão publicada mais recente). */
  SIGNUP_TRIAL_PLAN_CODE: z.string().regex(/^[a-z][a-z0-9-]{1,30}$/).default("pro-mensal"),
  /**
   * Proxies confiáveis à frente da API (repasse do frontend + balanceador do host), para o IP do cliente
   * vir de X-Forwarded-For: "false" (padrão), "true" ou o número de saltos. Ver docs/DEPLOY.md.
   */
  TRUST_PROXY: z
    .string()
    .regex(/^(true|false|\d{1,2})$/, "use true, false ou o número de saltos")
    .transform((v) => (v === "true" ? true : v === "false" ? false : Number(v)))
    .default(false),
});
export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Hosts como Render/Heroku injetam a porta em `PORT`; `API_PORT` explícito tem prioridade.
  const input = source.API_PORT === undefined && source.PORT !== undefined ? { ...source, API_PORT: source.PORT } : source;
  const result = EnvSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuração inválida: ${issues}`);
  }
  return result.data;
}
