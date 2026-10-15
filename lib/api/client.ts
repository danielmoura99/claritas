import { z } from "@claritas/contracts";
import {
  AnalysisSchema,
  ApiErrorSchema,
  CandleSchema,
  MarketAssetSchema,
  QuoteSchema,
  ScannerResultSchema,
  marketEnvelope,
  type Analysis,
  type Candle,
  type ErrorCode,
  type Interval,
  type MarketAsset,
  type MarketEnvelope,
  type Quote,
  type ScannerResult,
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
  if (!res.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    if (parsed.success) throw new ApiClientError(parsed.data.error.code, parsed.data.error.message, res.status, parsed.data.error.retryAfterSec);
    throw new ApiClientError("INTERNAL", `API respondeu ${res.status}`, res.status);
  }
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

/** Mensagem curta, no tom Claritas, para cada erro. */
export function describeError(err: unknown): string {
  if (err instanceof ApiClientError) {
    switch (err.code) {
      case "NETWORK":
        return "API Claritas inacessível — verifique se o serviço está em execução.";
      case "SYMBOL_NOT_FOUND":
        return err.message;
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
