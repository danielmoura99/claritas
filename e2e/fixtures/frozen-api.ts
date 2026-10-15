// FIXTURES DE TESTE — dados de mercado FICTÍCIOS e determinísticos, usados SOMENTE pela suíte visual.
// A API Claritas real roda em processo com este provedor; nada aqui é importado pelo runtime da aplicação.
import type { Page, WebSocketRoute } from "@playwright/test";
import { INTERVAL_MS, type Candle, type Interval, type MarketAsset, type Quote } from "@claritas/contracts";
import { buildApp } from "../../services/api/src/app";
import { parseEnv } from "../../services/api/src/config/env";
import { Database } from "../../services/api/src/infrastructure/db";
import type { CandleRequest, MarketDataProvider, MarketStreamSource } from "../../services/api/src/providers/market-data-provider";

/** Relógio congelado de todos os testes visuais: 2026-10-09 15:00 (Brasília). */
export const FROZEN_NOW = Date.UTC(2026, 9, 9, 18, 0, 0);

const SYMBOLS: [string, string, number][] = [
  ["BTC", "USDT", 81_000], ["ETH", "USDT", 2_400], ["SOL", "USDT", 104], ["BNB", "USDT", 730], ["XRP", "USDT", 1.33], ["ADA", "USDT", 0.23], ["DOGE", "USDT", 0.081], ["LINK", "USDT", 12.4],
];

const lcg = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

function series(symbol: string, interval: Interval, limit: number, endMs: number): Candle[] {
  const [, , base] = SYMBOLS.find(([b, q]) => b + q === symbol) ?? ["", "", 100];
  const step = INTERVAL_MS[interval];
  const lastOpen = Math.floor(endMs / step) * step;
  const firstOpen = lastOpen - (limit - 1) * step;
  // Passeio determinístico a partir de um ponto fixo no tempo → a mesma barra tem sempre o mesmo valor.
  const anchor = Math.floor(Date.UTC(2026, 8, 1) / step) * step;
  const seed = [...symbol].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rnd = lcg(seed + step);
  let p = base;
  const out: Candle[] = [];
  for (let t = anchor; t <= lastOpen; t += step) {
    const o = p;
    const c = o * (1 + (rnd() - 0.5) * 0.006 + Math.sin(t / (step * 37)) * 0.0008);
    const h = Math.max(o, c) * (1 + rnd() * 0.002);
    const l = Math.min(o, c) * (1 - rnd() * 0.002);
    p = c;
    if (t < firstOpen) continue;
    const d = base >= 1000 ? 2 : base >= 1 ? 4 : 6;
    out.push({ symbol, interval, openTimeMs: t, closeTimeMs: t + step - 1, open: o.toFixed(d), high: h.toFixed(d), low: l.toFixed(d), close: c.toFixed(d), volumeBase: (50 + rnd() * 100).toFixed(4), volumeQuote: ((50 + rnd() * 100) * base).toFixed(2), trades: 100, isClosed: t + step - 1 < endMs, provider: "binance_spot" });
  }
  return out;
}

function quoteOf(symbol: string): Quote {
  const c = series(symbol, "1h", 25, FROZEN_NOW);
  const first = c[0]!, last = c[c.length - 1]!;
  const hi = Math.max(...c.map((x) => Number(x.high))), lo = Math.min(...c.map((x) => Number(x.low)));
  const chg = Number(last.close) - Number(first.open);
  return { symbol, lastPrice: last.close, openPrice: first.open, highPrice: String(hi), lowPrice: String(lo), priceChange: chg.toFixed(4), priceChangePercent: ((chg / Number(first.open)) * 100).toFixed(3), volumeBase: "1000.0", volumeQuote: String(1_000_000_000 / (SYMBOLS.findIndex(([b, q]) => b + q === symbol) + 1)), window: "rolling_24h", openTimeMs: FROZEN_NOW - 86_400_000, closeTimeMs: FROZEN_NOW, provider: "binance_spot" };
}

export class FrozenProvider implements MarketDataProvider {
  readonly id = "binance_spot" as const;
  /** Atraso artificial por símbolo (para testar respostas tardias). */
  delays: Record<string, number> = {};
  failCandles = false;
  async listAssets(): Promise<MarketAsset[]> {
    return SYMBOLS.map(([b, q, p]) => ({ id: `BINANCE_SPOT:${b}${q}`, provider: "binance_spot", symbol: b + q, baseAsset: b, quoteAsset: q, displayName: `${b}/${q}`, pricePrecision: p >= 1000 ? 2 : p >= 1 ? 4 : 6, tickSize: "0.01", status: "TRADING" }));
  }
  async getQuote(symbol: string) { return quoteOf(symbol); }
  async getQuotes(symbols: string[]) { return symbols.map(quoteOf); }
  async getAllQuotes() { return SYMBOLS.map(([b, q]) => quoteOf(b + q)); }
  async ping() { return true; }
  async getCandles({ symbol, interval, limit, startTimeMs, endTimeMs }: CandleRequest) {
    if (this.failCandles) throw Object.assign(new Error("fora"), {});
    const delay = this.delays[symbol];
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const end = Math.min(endTimeMs ?? FROZEN_NOW, FROZEN_NOW);
    const all = series(symbol, interval, startTimeMs ? Math.ceil((end - startTimeMs) / INTERVAL_MS[interval]) + 1 : limit, end);
    return (startTimeMs ? all.filter((c) => c.openTimeMs >= startTimeMs) : all).slice(-limit);
  }
}

class SilentStream implements MarketStreamSource {
  start() {}
  subscribe() {}
  unsubscribe() {}
  isOpen() { return false; }
  async stop() {}
}

/**
 * Liga a página à API Claritas em processo (provedor congelado) e simula o WebSocket.
 * `wsStatus` controla o status enviado ao assinar (ex.: "live", "offline").
 */
export async function useFrozenApi(page: Page, opts: { wsStatus?: "live" | "offline" | "stale"; provider?: FrozenProvider } = {}) {
  const realNow = Date.now;
  Date.now = () => FROZEN_NOW; // relógio do lado da API (só neste processo de teste)
  const provider = opts.provider ?? new FrozenProvider();
  const app = await buildApp({ env: parseEnv({ LOG_LEVEL: "silent" }), logger: false, provider, streamSource: new SilentStream(), database: new Database(undefined) });
  await page.clock.setFixedTime(FROZEN_NOW);
  await page.route("http://localhost:4000/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const res = await app.inject({ method: req.method() as "GET", url: url.pathname + url.search, payload: req.postData() ?? undefined, headers: { "content-type": "application/json" } });
    await route.fulfill({ status: res.statusCode, body: res.body, headers: { "content-type": "application/json", "access-control-allow-origin": "*" } });
  });
  await page.routeWebSocket(/:4000\/api\/v1\/market\/stream/, (ws: WebSocketRoute) => {
    ws.send(JSON.stringify({ type: "hello", serverTime: new Date(FROZEN_NOW).toISOString(), protocol: 1 }));
    ws.onMessage((raw) => {
      const m = JSON.parse(String(raw));
      if (m.type !== "subscribe" && m.type !== "subscribe_quote") return;
      const status = opts.wsStatus ?? "live";
      const at = new Date(FROZEN_NOW - 1000).toISOString();
      ws.send(JSON.stringify({ type: "subscribed", channel: m.channel, symbol: m.symbol, interval: m.interval }));
      ws.send(JSON.stringify({ type: "status", data: { symbol: m.symbol, interval: m.interval, status, source: "binance_spot", lastEventAt: at, lastReceivedAt: at, latencyMs: 120, ...(status === "live" ? {} : { reason: "simulado no teste" }) } }));
    });
  });
  return {
    provider,
    async close() {
      Date.now = realNow;
      await app.close();
    },
  };
}
