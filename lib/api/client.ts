import { z } from "@claritas/contracts";
import {
  AnalysisSchema,
  ApiErrorSchema,
  CandleSchema,
  MarketAssetSchema,
  PreferenceSchema,
  QuoteSchema,
  WatchlistSchema,
  ReportSchema,
  ScannerResultSchema,
  SessionSchema,
  StreamTicketSchema,
  marketEnvelope,
  type Analysis,
  type Candle,
  type ErrorCode,
  type Interval,
  type MarketAsset,
  type MarketEnvelope,
  type Preference,
  type PreferenceUpdate,
  type Quote,
  type Watchlist,
  type Report,
  type ScannerResult,
  type LoginRequest,
  type RegisterRequest,
  type Session,
  type StreamTicket,
} from "@claritas/contracts";
import { API_URL } from "./config";

/** Erro da API Claritas (ou de rede) já tipado para a interface decidir a mensagem. */
export class ApiClientError extends Error {
  constructor(
    readonly code: ErrorCode | "NETWORK",
    message: string,
    readonly status?: number,
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

let onUnauthenticated: (() => void) | null = null;
/** Quem decide o que fazer quando a sessão acaba no meio do uso (o portão de auth redireciona para /entrar). */
export function setUnauthenticatedHandler(fn: (() => void) | null) {
  onUnauthenticated = fn;
}

function failure(res: Response, body: unknown): ApiClientError {
  const parsed = ApiErrorSchema.safeParse(body);
  if (!parsed.success) return new ApiClientError("INTERNAL", `API respondeu ${res.status}`, res.status);
  if (parsed.data.error.code === "UNAUTHENTICATED") onUnauthenticated?.();
  return new ApiClientError(parsed.data.error.code, parsed.data.error.message, res.status, parsed.data.error.retryAfterSec);
}

/** POST/PUT/DELETE tipado com o mesmo tratamento de erro do GET. */
export async function apiSend<T extends z.ZodType>(method: "POST" | "PUT" | "DELETE", path: string, schema: T, body?: unknown): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers: body === undefined ? { accept: "application/json" } : { accept: "application/json", "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiClientError("NETWORK", "API Claritas inacessível");
  }
  const json: unknown = await res.json().catch(() => undefined);
  if (!res.ok) throw failure(res, json);
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiClientError("PROVIDER_BAD_RESPONSE", "Resposta da API fora do contrato", res.status);
  return parsed.data;
}

/** GET tipado: valida a resposta com Zod — dado fora do contrato nunca chega à interface. */
export async function apiGet<T extends z.ZodType>(path: string, schema: T, init?: { signal?: AbortSignal }): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { signal: init?.signal, headers: { accept: "application/json" }, cache: "no-store" });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiClientError("NETWORK", "API Claritas inacessível");
  }
  const body: unknown = await res.json().catch(() => undefined);
  if (!res.ok) throw failure(res, body);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiClientError("PROVIDER_BAD_RESPONSE", "Resposta da API fora do contrato", res.status);
  return parsed.data;
}

const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();

export const marketApi = {
  candles: (symbol: string, interval: Interval, limit = 500, signal?: AbortSignal): Promise<MarketEnvelope<Candle[]>> =>
    apiGet(`/api/v1/market/candles?${qs({ symbol, interval, limit })}`, marketEnvelope(z.array(CandleSchema)), { signal }),
  quote: (symbol: string, signal?: AbortSignal): Promise<MarketEnvelope<Quote>> =>
    apiGet(`/api/v1/market/quote?${qs({ symbol })}`, marketEnvelope(QuoteSchema), { signal }),
  quotes: (symbols: string[], signal?: AbortSignal): Promise<MarketEnvelope<Quote[]>> =>
    apiGet(`/api/v1/market/quotes?${qs({ symbols: symbols.join(",") })}`, marketEnvelope(z.array(QuoteSchema)), { signal }),
  assets: (search?: string, signal?: AbortSignal): Promise<MarketEnvelope<MarketAsset[]>> =>
    apiGet(`/api/v1/market/assets?${qs({ search, limit: 30 })}`, marketEnvelope(z.array(MarketAssetSchema)), { signal }),
  asset: (symbol: string, signal?: AbortSignal): Promise<MarketEnvelope<MarketAsset>> =>
    apiGet(`/api/v1/market/assets/${encodeURIComponent(symbol)}`, marketEnvelope(MarketAssetSchema), { signal }),
};

export const analysisApi = {
  get: (symbol: string, interval: Interval, signal?: AbortSignal): Promise<MarketEnvelope<Analysis>> =>
    apiGet(`/api/v1/analysis?${qs({ symbol, interval })}`, marketEnvelope(AnalysisSchema), { signal }),
};

export const scannerApi = {
  scan: (size: number, timeframe: Interval, signal?: AbortSignal): Promise<MarketEnvelope<ScannerResult>> =>
    apiGet(`/api/v1/scanner?${qs({ quote: "USDT", size, timeframe })}`, marketEnvelope(ScannerResultSchema), { signal }),
};

export const reportApi = {
  get: (p: { symbol: string; window: "rolling_24h" | "day"; date?: string; tz: "America/Sao_Paulo" | "UTC" }, signal?: AbortSignal): Promise<MarketEnvelope<Report>> =>
    apiGet(`/api/v1/report?${qs(p)}`, marketEnvelope(ReportSchema), { signal }),
};

const dataOf = <T extends z.ZodType>(t: T) => z.object({ data: t });

export const persistenceApi = {
  watchlist: (signal?: AbortSignal): Promise<Watchlist> => apiGet("/api/v1/watchlist", dataOf(WatchlistSchema), { signal }).then((r) => r.data),
  add: (symbol: string): Promise<Watchlist> => apiSend("PUT", `/api/v1/watchlist/items/${encodeURIComponent(symbol)}`, dataOf(WatchlistSchema)).then((r) => r.data),
  remove: (symbol: string): Promise<Watchlist> => apiSend("DELETE", `/api/v1/watchlist/items/${encodeURIComponent(symbol)}`, dataOf(WatchlistSchema)).then((r) => r.data),
  getPreferences: (signal?: AbortSignal): Promise<Preference | null> => apiGet("/api/v1/preferences", dataOf(PreferenceSchema.nullable()), { signal }).then((r) => r.data),
  putPreferences: (patch: PreferenceUpdate): Promise<Preference> => apiSend("PUT", "/api/v1/preferences", dataOf(PreferenceSchema), patch).then((r) => r.data),
};

export const authApi = {
  session: (signal?: AbortSignal): Promise<Session> => apiGet("/api/v1/auth/session", dataOf(SessionSchema), { signal }).then((r) => r.data),
  login: (input: LoginRequest): Promise<Session> => apiSend("POST", "/api/v1/auth/login", dataOf(SessionSchema), input).then((r) => r.data),
  register: (input: RegisterRequest): Promise<Session> => apiSend("POST", "/api/v1/auth/register", dataOf(SessionSchema), input).then((r) => r.data),
  logout: (): Promise<null> => apiSend("POST", "/api/v1/auth/logout", dataOf(z.null())).then((r) => r.data),
  streamTicket: (): Promise<StreamTicket> => apiSend("POST", "/api/v1/auth/stream-ticket", dataOf(StreamTicketSchema)).then((r) => r.data),
};

/** Mensagem curta, no tom Claritas, para cada erro. */
export function describeError(err: unknown): string {
  if (err instanceof ApiClientError) {
    switch (err.code) {
      case "NETWORK":
        return "API Claritas inacessível — verifique se o serviço está em execução.";
      case "SYMBOL_NOT_FOUND":
        return err.message;
      case "UNAUTHENTICATED":
        return "Sessão encerrada — entre novamente.";
      case "DB_UNAVAILABLE":
        return "Contas indisponíveis no momento — o banco de dados não respondeu.";
      case "PROVIDER_RATE_LIMITED":
        return `Limite de requisições da Binance — nova tentativa em ${err.retryAfterSec ?? 60}s.`;
      case "PROVIDER_TIMEOUT":
      case "PROVIDER_UNAVAILABLE":
        return "Binance indisponível no momento — sem dados para exibir.";
      default:
        return err.message;
    }
  }
  return "Falha inesperada ao carregar dados.";
}
