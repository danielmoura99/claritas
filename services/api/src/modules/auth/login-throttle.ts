const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;

/**
 * Tentativas de login erradas por e-mail (além do limite por IP da rota): segura força bruta
 * distribuída contra uma conta. Em memória, como os tickets do WS.
 */
export class LoginThrottle {
  private readonly failures = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Segundos até liberar, ou 0 se o e-mail pode tentar. */
  retryAfterSec(email: string): number {
    const recent = this.recent(email);
    if (recent.length < MAX_FAILURES) return 0;
    return Math.max(1, Math.ceil((recent[0]! + WINDOW_MS - this.now()) / 1000));
  }

  fail(email: string) {
    const recent = this.recent(email);
    recent.push(this.now());
    this.failures.set(email, recent);
    if (this.failures.size > 50_000) this.failures.delete(this.failures.keys().next().value!);
  }

  succeed(email: string) {
    this.failures.delete(email);
  }

  private recent(email: string) {
    const cutoff = this.now() - WINDOW_MS;
    return (this.failures.get(email) ?? []).filter((t) => t > cutoff);
  }
}
