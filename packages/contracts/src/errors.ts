import { z } from "zod";

export const ERROR_CODES = [
  "INVALID_REQUEST",
  "SYMBOL_NOT_FOUND",
  "NOT_FOUND",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_TIMEOUT",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_BAD_RESPONSE",
  "INSUFFICIENT_DATA",
  "DB_UNAVAILABLE",
  "INTERNAL",
] as const;
export const ErrorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

/** Formato padronizado de erro da API Claritas. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
    retryAfterSec: z.number().optional(),
  }),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
