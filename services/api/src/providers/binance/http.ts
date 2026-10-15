import type { FastifyBaseLogger } from "fastify";
import { AppError } from "../../infrastructure/errors";
import { backoffDelay, sleep } from "../../infrastructure/backoff";
import { BinanceErrorSchema } from "./schemas";

export interface BinanceHttpOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Tentativas extras para falhas transitórias (rede/5xx). 4xx nunca é repetido. */
  retries?: number;
  log?: Pick<FastifyBaseLogger, "warn" | "debug">;
  fetchImpl?: typeof fetch;
  /** Limite de REQUEST_WEIGHT/min da Binance (6000 na doc consultada); acima de 90% a API pausa até o minuto virar. */
  weightLimitPerMinute?: number;
}

/**
 * Cliente HTTP da Binance: timeout, backoff com jitter para falhas transitórias, respeito a 429/418 + Retry-After
 * (bloqueia novas chamadas até o prazo) e acompanhamento do header X-MBX-USED-WEIGHT-1M.
 */
export class BinanceHttp {
  private blockedUntilMs = 0;
  private usedWeight1m = 0;
  private weightMinute = 0;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: BinanceHttpOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  get usedWeight() {
    return this.usedWeight1m;
  }

  async get<T = unknown>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const now = Date.now();
    if (now < this.blockedUntilMs) {
      throw new AppError("PROVIDER_RATE_LIMITED", "Binance em limite de requisições — aguardando liberação", {
        retryAfterSec: Math.ceil((this.blockedUntilMs - now) / 1000),
      });
    }
    const limit = this.opts.weightLimitPerMinute ?? 6000;
    const minute = Math.floor(now / 60_000);
    if (minute === this.weightMinute && this.usedWeight1m > limit * 0.9) {
      throw new AppError("PROVIDER_RATE_LIMITED", "Orçamento de peso da Binance quase esgotado neste minuto", {
        retryAfterSec: Math.ceil(((minute + 1) * 60_000 - now) / 1000),
      });
    }

    const url = new URL(path, this.opts.baseUrl);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v));

    const retries = this.opts.retries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(backoffDelay(attempt - 1, { baseMs: 300, capMs: 3_000 }));
      let res: Response;
      try {
        res = await this.fetchImpl(url, { signal: AbortSignal.timeout(this.opts.timeoutMs), headers: { accept: "application/json" } });
      } catch (err) {
        const timeout = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
        lastError = new AppError(timeout ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE", timeout ? "Tempo esgotado ao consultar a Binance" : "Binance inacessível", { cause: err });
        this.opts.log?.warn({ path: url.pathname, attempt, err: String(err) }, "binance request failed");
        continue;
      }

      const used = res.headers.get("x-mbx-used-weight-1m");
      if (used) {
        this.usedWeight1m = Number(used) || 0;
        this.weightMinute = Math.floor(Date.now() / 60_000);
      }

      if (res.status === 429 || res.status === 418) {
        const retryAfter = Number(res.headers.get("retry-after")) || 60;
        this.blockedUntilMs = Date.now() + retryAfter * 1000;
        this.opts.log?.warn({ status: res.status, retryAfter }, "binance rate limit");
        throw new AppError("PROVIDER_RATE_LIMITED", res.status === 418 ? "IP temporariamente banido pela Binance" : "Limite de requisições da Binance atingido", { retryAfterSec: retryAfter });
      }
      if (res.status >= 500) {
        lastError = new AppError("PROVIDER_UNAVAILABLE", `Binance respondeu ${res.status}`);
        continue;
      }
      const body: unknown = await res.json().catch(() => undefined);
      if (res.status >= 400) {
        const parsed = BinanceErrorSchema.safeParse(body);
        const code = parsed.success ? parsed.data.code : undefined;
        if (code === -1121) throw new AppError("SYMBOL_NOT_FOUND", "Símbolo inexistente na Binance Spot", { details: { providerCode: code } });
        throw new AppError("INVALID_REQUEST", parsed.success ? `Binance: ${parsed.data.msg}` : `Binance respondeu ${res.status}`, { details: { providerCode: code } });
      }
      if (body === undefined) throw new AppError("PROVIDER_BAD_RESPONSE", "Resposta da Binance não é JSON");
      return body as T;
    }
    throw lastError instanceof AppError ? lastError : new AppError("PROVIDER_UNAVAILABLE", "Binance inacessível", { cause: lastError });
  }
}
