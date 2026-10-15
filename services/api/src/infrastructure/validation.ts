import type { z } from "zod";
import { AppError } from "./errors";

/** Valida query/params com Zod e lança `INVALID_REQUEST` com os problemas encontrados. */
export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw new AppError("INVALID_REQUEST", "Parâmetros inválidos", {
      details: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  return r.data;
}
