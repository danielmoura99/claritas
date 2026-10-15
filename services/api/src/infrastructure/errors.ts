import type { ErrorCode } from "@claritas/contracts";

const STATUS: Record<ErrorCode, number> = {
  INVALID_REQUEST: 400,
  SYMBOL_NOT_FOUND: 404,
  NOT_FOUND: 404,
  PROVIDER_UNAVAILABLE: 503,
  PROVIDER_TIMEOUT: 504,
  PROVIDER_RATE_LIMITED: 503,
  PROVIDER_BAD_RESPONSE: 502,
  INSUFFICIENT_DATA: 422,
  DB_UNAVAILABLE: 503,
  INTERNAL: 500,
};

/** Erro de domínio da API, convertido no formato padronizado `ApiError` pelo error handler. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly retryAfterSec?: number;

  constructor(code: ErrorCode, message: string, opts: { details?: unknown; retryAfterSec?: number; cause?: unknown } = {}) {
    super(message, { cause: opts.cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS[code];
    this.details = opts.details;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
