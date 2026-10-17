import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MarketStreamClient } from "./stream-client";

/** Socket mínimo controlado pelo teste (o cliente só usa estes membros). */
class FakeSocket {
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly url: string) {}
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

/** Esvazia a fila de microtarefas (funciona com relógio falso). */
const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe("MarketStreamClient com ticket", () => {
  // O cliente só conecta no navegador; aqui basta existir `window`.
  beforeAll(() => vi.stubGlobal("window", {}));
  afterAll(() => vi.unstubAllGlobals());
  afterEach(() => vi.useRealTimers());

  it("pede um ticket novo a cada conexão e reassina após reconectar", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let n = 0;
    const sockets: FakeSocket[] = [];
    const client = new MarketStreamClient(
      async () => `ws://api.test/stream?ticket=t${++n}`,
      (u) => {
        const s = new FakeSocket(u);
        sockets.push(s);
        return s as unknown as WebSocket;
      },
    );
    client.subscribeQuote("BTCUSDT", {});
    await vi.waitFor(() => expect(sockets).toHaveLength(1));
    expect(sockets[0]!.url).toBe("ws://api.test/stream?ticket=t1");
    sockets[0]!.open();
    expect(sockets[0]!.sent.map((m) => JSON.parse(m).type)).toContain("subscribe_quote");

    sockets[0]!.close(); // queda
    await vi.advanceTimersByTimeAsync(20_000);
    await vi.waitFor(() => expect(sockets).toHaveLength(2));
    expect(sockets[1]!.url).toBe("ws://api.test/stream?ticket=t2");
    sockets[1]!.open();
    expect(sockets[1]!.sent.map((m) => JSON.parse(m).type)).toContain("subscribe_quote");
    client.close();
  });

  it("sem ticket (API fora) não abre socket e tenta de novo depois", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let calls = 0;
    const created: string[] = [];
    const client = new MarketStreamClient(
      async () => {
        calls++;
        if (calls === 1) throw new Error("fora");
        return "ws://api.test/stream?ticket=ok";
      },
      (u) => {
        created.push(u);
        return new FakeSocket(u) as unknown as WebSocket;
      },
    );
    const states: string[] = [];
    client.onConnectionState((s) => states.push(s));
    client.subscribeCandles("BTCUSDT", "5m", {});
    await flush();
    expect(created).toEqual([]);
    expect(states).toEqual(["connecting", "closed"]);
    await vi.advanceTimersByTimeAsync(20_000);
    await vi.waitFor(() => expect(created).toEqual(["ws://api.test/stream?ticket=ok"]));
    client.close();
  });

  it("fechar durante a resolução do ticket não deixa socket órfão", async () => {
    let release!: (u: string) => void;
    const created: string[] = [];
    const client = new MarketStreamClient(
      () => new Promise<string>((r) => (release = r)),
      (u) => {
        created.push(u);
        return new FakeSocket(u) as unknown as WebSocket;
      },
    );
    client.subscribeQuote("ETHUSDT", {});
    client.close();
    release("ws://api.test/stream?ticket=tarde");
    await flush();
    expect(created).toEqual([]);
  });
});
