import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AddressInfo } from "node:net";
import WebSocket from "ws";
import type { ServerMessage } from "@claritas/contracts";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { BinanceStreamSource } from "../../src/providers/binance/stream-source";
import { streamTicket, testSessions, allowAllAccess } from "../helpers/auth";

// Integração REAL: Binance WSS → hub → WebSocket Claritas. Rede necessária.
let app: FastifyInstance;
let source: BinanceStreamSource;
let wsUrl: string;

beforeAll(async () => {
  const env = parseEnv({ LOG_LEVEL: "silent", CORS_ORIGIN: "http://localhost:3000", STREAM_UPSTREAM_LINGER_MS: "0" });
  source = new BinanceStreamSource({ wsUrl: env.BINANCE_SPOT_WS_URL });
  app = await buildApp({ env, logger: false, streamSource: source, sessions: testSessions, access: allowAllAccess });
  await app.listen({ host: "127.0.0.1", port: 0 });
  wsUrl = `ws://127.0.0.1:${(app.server.address() as AddressInfo).port}/api/v1/market/stream`;
});
afterAll(() => app.close());

async function client(origin = "http://localhost:3000") {
  // Cada conexão consome um ticket de uso único (a sessão é a de teste).
  const ws = new WebSocket(`${wsUrl}?ticket=${await streamTicket(app)}`, { headers: { origin } });
  const msgs: ServerMessage[] = [];
  ws.on("message", (d) => msgs.push(JSON.parse(d.toString())));
  const opened = new Promise<void>((res, rej) => {
    ws.once("open", () => res());
    ws.once("error", rej);
  });
  return { ws, msgs, opened, send: (m: object) => ws.send(JSON.stringify(m)) };
}

const until = async (cond: () => boolean, ms: number) => {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error("timeout aguardando condição");
    await new Promise((r) => setTimeout(r, 50));
  }
};

const upserts = (msgs: ServerMessage[]) => msgs.filter((m): m is Extract<ServerMessage, { type: "candle.upsert" }> => m.type === "candle.upsert");
const statuses = (msgs: ServerMessage[]) => msgs.filter((m): m is Extract<ServerMessage, { type: "status" }> => m.type === "status").map((m) => m.data.status);

describe("WebSocket Claritas com Binance real", () => {
  it("recebe candle.upsert com dados do WSS e dois clientes compartilham o upstream", async () => {
    const [a, b] = await Promise.all([client(), client()]);
    await Promise.all([a.opened, b.opened]);
    a.send({ type: "subscribe", channel: "candles", symbol: "BTCUSDT", interval: "1m" });
    b.send({ type: "subscribe", channel: "candles", symbol: "BTCUSDT", interval: "1m" });
    await until(() => upserts(a.msgs).length >= 2 && upserts(b.msgs).length >= 2, 20_000);
    const u = upserts(a.msgs).at(-1)!;
    expect(u.data).toMatchObject({ symbol: "BTCUSDT", interval: "1m", provider: "binance_spot" });
    expect(Number(u.data.close)).toBeGreaterThan(0);
    expect(Math.abs(Date.now() - u.eventTimeMs)).toBeLessThan(30_000); // evento recente, não histórico
    expect(statuses(a.msgs)).toContain("live");
    const stats = app.hub.stats();
    expect(stats.byChannel.find((c) => c.key === "BTCUSDT:1m")?.consumers).toBe(2);
    expect(stats.channels).toBe(1);
    a.ws.close();
    b.ws.close();
    await until(() => app.hub.stats().channels === 0, 5_000); // nenhum vazamento após fechar
  });

  it("recusa origem não autorizada e símbolo inexistente", async () => {
    const evil = await client("https://evil.example");
    const closed = await new Promise<number>((res) => evil.ws.once("close", (code) => res(code)));
    expect(closed).toBe(1008);

    const c = await client();
    await c.opened;
    c.send({ type: "subscribe", channel: "candles", symbol: "ZZZZNOTREALUSDT", interval: "5m" });
    await until(() => c.msgs.some((m) => m.type === "error"), 10_000);
    expect(c.msgs.find((m) => m.type === "error")).toMatchObject({ code: "SYMBOL_NOT_FOUND" });
    c.ws.close();
  });

  it("queda da conexão Binance: reconnecting → reconciliação REST → live de novo", async () => {
    const c = await client();
    await c.opened;
    c.send({ type: "subscribe", channel: "candles", symbol: "ETHUSDT", interval: "1m" });
    await until(() => statuses(c.msgs).includes("live"), 20_000);
    // Derruba a conexão upstream real (equivale a uma queda de rede).
    (source as unknown as { ws: WebSocket }).ws.terminate();
    await until(() => statuses(c.msgs).includes("reconnecting"), 5_000);
    const before = c.msgs.length;
    await until(() => statuses(c.msgs.slice(before)).includes("live"), 30_000);
    const after = upserts(c.msgs.slice(before));
    expect(after.length).toBeGreaterThan(0);
    // Ordem temporal nunca retrocede.
    const times = upserts(c.msgs).map((m) => m.data.openTimeMs);
    for (let i = 1; i < times.length; i++) expect(times[i]!).toBeGreaterThanOrEqual(times[i - 1]!);
    c.ws.close();
  });
});
