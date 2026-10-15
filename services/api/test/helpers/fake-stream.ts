// DUBLÊ DE TESTE — substitui a conexão upstream nos testes unitários. Nunca usado em src/.
import type { MarketStreamSource, UpstreamHandlers, UpstreamStream } from "../../src/providers/market-data-provider";
import { streamName } from "../../src/providers/binance/stream-source";

export class FakeStreamSource implements MarketStreamSource {
  handlers!: UpstreamHandlers;
  open = false;
  readonly subscribed = new Set<string>();
  readonly log: string[] = [];

  start(h: UpstreamHandlers) {
    this.handlers = h;
  }
  connect(reconnected = false) {
    this.open = true;
    this.handlers.onOpen({ reconnected });
  }
  drop(reason = "1006") {
    this.open = false;
    this.handlers.onClose({ reason, willReconnect: true });
  }
  subscribe(streams: UpstreamStream[]) {
    for (const s of streams) {
      this.subscribed.add(streamName(s));
      this.log.push(`+${streamName(s)}`);
    }
  }
  unsubscribe(streams: UpstreamStream[]) {
    for (const s of streams) {
      this.subscribed.delete(streamName(s));
      this.log.push(`-${streamName(s)}`);
    }
  }
  isOpen() {
    return this.open;
  }
  async stop() {
    this.open = false;
  }
}
