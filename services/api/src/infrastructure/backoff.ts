import { randomInt } from "node:crypto";

const cryptoRandom = () => randomInt(0, 1_000_000) / 1_000_000;

/** Backoff exponencial com jitter total ("full jitter"): espera aleatória em [0, min(cap, base·2^tentativa)]. */
export function backoffDelay(attempt: number, { baseMs = 500, capMs = 30_000, random = cryptoRandom } = {}): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(random() * ceiling);
}

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(signal.reason);
      },
      { once: true },
    );
  });
