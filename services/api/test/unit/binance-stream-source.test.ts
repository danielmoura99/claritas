import { afterEach, describe, expect, it } from "vitest";
import { WebSocketServer, type WebSocket } from "ws";
import type { AddressInfo } from "node:net";
import { BinanceStreamSource } from "../../src/providers/binance/stream-source";
import type { CandleEvent } from "../../src/providers/market-data-provider";
import { wsKline } from "../fixtures/binance";

// Servidor WS LOCAL que imita o protocolo da Binance (dublê de teste) — exercita reconexão e controle real do socket.
function fakeBinance() {
  const wss = new WebSocketServer({ port: 0 });
  const received: unknown[] = [];
  const sockets: WebSocket[] = [];
  wss.on("connection", (ws, req) => {
    sockets.push(ws);
    received.push({ connect: req.url });
    ws.on("message", (m) => {
      const msg = JSON.parse(m.toString());
      received.push(msg);
      ws.send(JSON.stringify({ result: null, id: msg.id }));
    });
  });
  const url = () => `ws://127.0.0.1:${(wss.address() as AddressInfo).port}`;
  return { wss, received, sockets, url };
}

let cleanup: (() => Promise<void>) | null = null;
afterEach(async () => {
  await cleanup?.();
  cleanup = null;
});

const waitFor = async (cond: () => boolean, ms = 5000) => {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > ms) throw new Error("timeout");
    await new Promise((r) => setTimeout(r, 20));
  }
};

describe("BinanceStreamSource (contra servidor WS local)", () => {
  it("usa /stream, assina em lote, roteia klines e reconecta reassinando tudo", async () => {
    const fb = fakeBinance();
    const events: CandleEvent[] = [];
    const opens: boolean[] = [];
    const closes: string[] = [];
    const src = new BinanceStreamSource({ wsUrl: fb.url(), controlIntervalMs: 10 });
    cleanup = async () => {
      await src.stop();
      fb.wss.close();
    };
    src.start({ onCandle: (e) => events.push(e), onQuote: () => {}, onOpen: ({ reconnected }) => opens.push(reconnected), onClose: ({ reason }) => closes.push(reason) });
    src.subscribe([{ kind: "candles", symbol: "TESTUSDT", interval: "5m" }, { kind: "quote", symbol: "TESTUSDT" }]);
    await waitFor(() => fb.received.some((m) => (m as { method?: string }).method === "SUBSCRIBE"));
    expect(fb.received[0]).toEqual({ connect: "/stream" });
    const sub = fb.received.find((m) => (m as { method?: string }).method === "SUBSCRIBE") as { params: string[] };
    expect(sub.params.sort()).toEqual(["testusdt@kline_5m", "testusdt@miniTicker"]);

    fb.sockets[0]!.send(JSON.stringify({ stream: "testusdt@kline_5m", data: wsKline(0, false, "101.00000000") }));
    await waitFor(() => events.length === 1);
    expect(events[0]!.candle).toMatchObject({ symbol: "TESTUSDT", close: "101.00000000", isClosed: false });

    // Queda da conexão: deve reconectar e reassinar os mesmos streams.
    fb.sockets[0]!.terminate();
    await waitFor(() => opens.length === 2, 8000);
    expect(opens).toEqual([false, true]);
    expect(closes.length).toBe(1);
    await waitFor(() => fb.received.filter((m) => (m as { method?: string }).method === "SUBSCRIBE").length === 2);
  });

  it("UNSUBSCRIBE quando o stream deixa de ser desejado", async () => {
    const fb = fakeBinance();
    const src = new BinanceStreamSource({ wsUrl: fb.url(), controlIntervalMs: 10 });
    cleanup = async () => {
      await src.stop();
      fb.wss.close();
    };
    src.start({ onCandle: () => {}, onQuote: () => {}, onOpen: () => {}, onClose: () => {} });
    src.subscribe([{ kind: "candles", symbol: "TESTUSDT", interval: "1m" }]);
    await waitFor(() => fb.received.some((m) => (m as { method?: string }).method === "SUBSCRIBE"));
    src.unsubscribe([{ kind: "candles", symbol: "TESTUSDT", interval: "1m" }]);
    await waitFor(() => fb.received.some((m) => (m as { method?: string }).method === "UNSUBSCRIBE"));
    expect((fb.received.find((m) => (m as { method?: string }).method === "UNSUBSCRIBE") as { params: string[] }).params).toEqual(["testusdt@kline_1m"]);
  });

  it("silêncio do upstream recicla a conexão (conexão meia-aberta)", async () => {
    const fb = fakeBinance();
    const opens: boolean[] = [];
    const src = new BinanceStreamSource({ wsUrl: fb.url(), controlIntervalMs: 10, silenceTimeoutMs: 300 });
    cleanup = async () => {
      await src.stop();
      fb.wss.close();
    };
    src.start({ onCandle: () => {}, onQuote: () => {}, onOpen: ({ reconnected }) => opens.push(reconnected), onClose: () => {} });
    src.subscribe([{ kind: "candles", symbol: "TESTUSDT", interval: "1m" }]);
    await waitFor(() => opens.length >= 2, 8000);
    expect(opens.slice(0, 2)).toEqual([false, true]);
  });
});
