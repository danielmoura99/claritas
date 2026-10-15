/** Cache TTL em memória com deduplicação de requisições em voo (várias chamadas simultâneas → 1 upstream). */
export class TtlCache<V> {
  private readonly values = new Map<string, { value: V; expiresAt: number }>();
  private readonly inflight = new Map<string, Promise<V>>();

  constructor(private readonly maxEntries = 500, private readonly now: () => number = Date.now) {}

  get(key: string): V | undefined {
    const hit = this.values.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= this.now()) {
      this.values.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: V, ttlMs: number) {
    if (this.values.size >= this.maxEntries) {
      const oldest = this.values.keys().next().value;
      if (oldest !== undefined) this.values.delete(oldest);
    }
    this.values.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<V>): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const p = load()
      .then((v) => {
        this.set(key, v, ttlMs);
        return v;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  delete(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}
