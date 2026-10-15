import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { Candle, ServerMessage } from "@claritas/contracts";
import { StreamHub, type HubOptions, type StreamClient } from "../../src/modules/streaming/hub";
import { FakeStreamSource } from "../helpers/fake-stream";
import { FIVE_MIN, T0 } from "../fixtures/binance";

// Candles de teste (fictícios) — só exercitam a lógica do hub.
const candle = (i: number, close: string, isClosed: boolean): Candle => ({
  symbol: "TESTUSDT",
  interval: "5m",
  openTimeMs: T0 + i * FIVE_MIN,
  closeTimeMs: T0 + (i + 1) * FIVE_MIN - 1,
  open: "100",
  high: "120",
  low: "90",
  close,
  volumeBase: "1",
  isClosed,
  provider: "binance_spot",
});

class Recorder implements StreamClient {
  readonly msgs: ServerMessage[] = [];
  constructor(readonly id: string) {}
  send(m: ServerMessage) {
    this.msgs.push(m);
  }
  upserts() {
    return this.msgs.filter((m) => m.type === "candle.upsert").map((m) => (m as Extract<ServerMessage, { type: "candle.upsert" }>).data);
  }
  statuses() {
    return this.msgs.filter((m) => m.type === "status").map((m) => (m as Extract<ServerMessage, { type: "status" }>).data.status);
  }
}

let now = T0;
let source: FakeStreamSource;
let fetchRecent: Mock<HubOptions["fetchRecentCandles"]>;
let hub: StreamHub;

const emit = (c: Candle, eventOffset = 1000) => source.handlers.onCandle({ candle: c, eventTimeMs: c.openTimeMs + eventOffset, receivedAtMs: now });

beforeEach(() => {
  vi.useFakeTimers();
  now = T0;
  source = new FakeStreamSource();
  fetchRecent = vi.fn<HubOptions["fetchRecentCandles"]>(async () => []);
  hub = new StreamHub({ source, provider: "binance_spot", staleAfterMs: 15_000, lingerMs: 30_000, fetchRecentCandles: fetchRecent, now: () => now });
  hub.start();
  source.connect();
});

describe("StreamHub", () => {
  it("vários clientes no mesmo par compartilham UMA assinatura upstream", () => {
    const a = new Recorder("a"), b = new Recorder("b");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    hub.subscribe(b, "candles", "TESTUSDT", "5m");
    expect([...source.subscribed]).toEqual(["testusdt@kline_5m"]);
    expect(source.log).toEqual(["+testusdt@kline_5m"]);
    emit(candle(0, "101", false));
    expect(a.upserts()).toHaveLength(1);
    expect(b.upserts()).toHaveLength(1);
  });

  it("isClosed=false atualiza a barra corrente; nova barra não sobrescreve a anterior; não retrocede", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    emit(candle(0, "101", false));
    emit(candle(0, "102", false));
    emit(candle(0, "103", true)); // fechou
    emit(candle(0, "999", false)); // evento atrasado de barra já fechada → ignorado
    emit(candle(1, "104", false)); // nova barra
    emit(candle(0, "100", true)); // barra anterior repetida depois da nova → ignorada (não retrocede)
    const ups = a.upserts();
    expect(ups.map((c) => [c.openTimeMs - T0, c.close, c.isClosed])).toEqual([
      [0, "101", false],
      [0, "102", false],
      [0, "103", true],
      [FIVE_MIN, "104", false],
    ]);
  });

  it("status vai de connecting a live só com evento real", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    expect(a.statuses()).toEqual(["connecting"]);
    emit(candle(0, "101", false));
    expect(a.statuses()).toEqual(["connecting", "live"]);
  });

  it("feed parado vira stale (nunca continua 'live')", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    emit(candle(0, "101", false));
    now += 16_000;
    hub.checkHealth();
    expect(a.statuses().at(-1)).toBe("stale");
    emit(candle(0, "102", false));
    expect(a.statuses().at(-1)).toBe("live");
  });

  it("queda do upstream → reconnecting → offline após 60s", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    emit(candle(0, "101", false));
    source.drop();
    expect(a.statuses().at(-1)).toBe("reconnecting");
    now += 61_000;
    hub.checkHealth();
    expect(a.statuses().at(-1)).toBe("offline");
  });

  it("reconexão: backfill REST recupera barras perdidas e só volta a live com evento novo", async () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    emit(candle(0, "101", false));
    source.drop();
    now += 3 * FIVE_MIN;
    fetchRecent.mockResolvedValueOnce([candle(0, "105", true), candle(1, "106", true), candle(2, "107", true), candle(3, "108", false)]);
    source.connect(true);
    await vi.waitFor(() => expect(fetchRecent).toHaveBeenCalledWith("TESTUSDT", "5m", T0));
    await vi.waitFor(() => expect(a.upserts()).toHaveLength(5));
    expect(a.upserts().slice(1).map((c) => c.close)).toEqual(["105", "106", "107", "108"]);
    expect(a.statuses().at(-1)).toBe("reconnecting");
    emit(candle(3, "109", false));
    expect(a.statuses().at(-1)).toBe("live");
  });

  it("sem consumidores, libera o upstream só após o período de retenção; reassinar cancela a liberação", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    hub.removeClient(a);
    expect(source.subscribed.size).toBe(1);
    vi.advanceTimersByTime(10_000);
    const b = new Recorder("b");
    hub.subscribe(b, "candles", "TESTUSDT", "5m");
    vi.advanceTimersByTime(60_000);
    expect(source.subscribed.size).toBe(1);
    hub.unsubscribe(b, "candles", "TESTUSDT", "5m");
    vi.advanceTimersByTime(30_001);
    expect(source.subscribed.size).toBe(0);
    expect(hub.stats().channels).toBe(0);
  });

  it("cliente novo recebe snapshot do último candle conhecido", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "candles", "TESTUSDT", "5m");
    emit(candle(0, "101", false));
    const b = new Recorder("b");
    hub.subscribe(b, "candles", "TESTUSDT", "5m");
    expect(b.upserts().map((c) => c.close)).toEqual(["101"]);
    expect(b.statuses()).toEqual(["live"]);
  });

  it("quote.update descarta eventos fora de ordem", () => {
    const a = new Recorder("a");
    hub.subscribe(a, "quote", "TESTUSDT");
    const q = (price: string) => ({ symbol: "TESTUSDT", lastPrice: price, openPrice: "1", highPrice: "9", lowPrice: "1", priceChange: "0", priceChangePercent: "0", volumeBase: "1", volumeQuote: "1", window: "rolling_24h" as const, openTimeMs: 0, closeTimeMs: 1, provider: "binance_spot" as const });
    source.handlers.onQuote({ quote: q("2"), eventTimeMs: 2_000, receivedAtMs: now });
    source.handlers.onQuote({ quote: q("1"), eventTimeMs: 1_000, receivedAtMs: now });
    expect(a.msgs.filter((m) => m.type === "quote.update")).toHaveLength(1);
  });
});
