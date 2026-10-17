import { randomUUID } from "node:crypto";
import type { EventEmitter } from "node:events";
import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";
import { z } from "zod";
import { ClientMessageSchema, IntervalSchema, SymbolSchema, type ServerMessage } from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { MarketService } from "../market/market-service";
import type { StreamClient, StreamHub } from "./hub";

const MAX_INBOUND_PER_SEC = 20;
const HEARTBEAT_MS = 30_000;
const MAX_MESSAGE_BYTES = 4_096;
/** Janela máxima entre a perda de acesso e o fechamento do stream sem aviso do admin (D-S09). */
export const ACCESS_RECHECK_MS = 60_000;
/** Close code próprio: acesso comercial revogado (o cliente não deve insistir sem nova autorização). */
export const WS_CLOSE_ACCESS_REVOKED = 4403;

const StatusQuerySchema = z.object({ symbol: SymbolSchema, interval: IntervalSchema.optional() });

export async function streamingRoutes(
  app: FastifyInstance,
  {
    hub,
    market,
    maxSubscriptionsPerClient,
    allowedOrigins,
    stillAllowed,
    accessEvents,
  }: {
    hub: StreamHub;
    market: MarketService;
    maxSubscriptionsPerClient: number;
    allowedOrigins: string[];
    /** Reavalia `terminal.access` do dono do stream (conta ativa + entitlement). */
    stillAllowed: (userId: string) => Promise<boolean>;
    /** Avisos de mudança de acesso feitos pela administração. */
    accessEvents: EventEmitter;
  },
) {
  app.get("/status", async (req) => {
    const { symbol, interval } = parseOrThrow(StatusQuerySchema, req.query);
    return { data: hub.getStatus(symbol, interval), upstream: hub.stats().upstreamOpen ? "open" : "closed" };
  });

  app.get("/stream", { websocket: true }, (socket: WebSocket, req) => {
    // Navegadores sempre mandam Origin no handshake WS; recusamos origens não autorizadas.
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      socket.close(1008, "origin not allowed");
      return;
    }

    const log = req.log.child({ ws: true });
    const client: StreamClient = {
      id: randomUUID(),
      send: (msg: ServerMessage) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(msg));
      },
    };
    let alive = true;
    let windowStart = Date.now();
    let inWindow = 0;

    const heartbeat = setInterval(() => {
      if (!alive) {
        log.info({ client: client.id }, "cliente ws sem pong — encerrando");
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, HEARTBEAT_MS);
    heartbeat.unref();
    socket.on("pong", () => (alive = true));

    // Revalidação contínua (Plano 02 §4.6.5): não confiar só na abertura. Periódica + imediata em ação do admin.
    const userId = req.streamUserId;
    let closing = false;
    const recheck = async () => {
      if (closing || !userId) return;
      let ok = false;
      try {
        ok = await stillAllowed(userId);
      } catch (err) {
        // Banco fora: mantém o acesso já validado (o terminal não cai por instabilidade), tenta de novo depois.
        log.warn({ err: String(err) }, "revalidação do stream indisponível");
        return;
      }
      if (ok || closing) return;
      closing = true;
      client.send({ type: "error", code: "ENTITLEMENT_REQUIRED", message: "acesso ao terminal encerrado" });
      socket.close(WS_CLOSE_ACCESS_REVOKED, "access revoked");
    };
    const recheckTimer = setInterval(() => void recheck(), ACCESS_RECHECK_MS);
    recheckTimer.unref();
    const onAccessChanged = (changed: string) => {
      if (changed === userId) void recheck();
    };
    accessEvents.on("changed", onAccessChanged);

    client.send({ type: "hello", serverTime: new Date().toISOString(), protocol: 1 });

    socket.on("message", async (raw) => {
      const now = Date.now();
      if (now - windowStart >= 1000) {
        windowStart = now;
        inWindow = 0;
      }
      if (++inWindow > MAX_INBOUND_PER_SEC) {
        client.send({ type: "error", code: "RATE_LIMITED", message: "mensagens demais por segundo" });
        socket.close(1008, "rate limited");
        return;
      }
      const text = raw.toString();
      if (text.length > MAX_MESSAGE_BYTES) return client.send({ type: "error", code: "INVALID_REQUEST", message: "mensagem grande demais" });
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        return client.send({ type: "error", code: "INVALID_REQUEST", message: "JSON inválido" });
      }
      const parsed = ClientMessageSchema.safeParse(json);
      if (!parsed.success) return client.send({ type: "error", code: "INVALID_REQUEST", message: parsed.error.issues[0]?.message ?? "mensagem inválida" });
      const msg = parsed.data;
      try {
        switch (msg.type) {
          case "ping":
            return client.send({ type: "pong", id: msg.id, serverTime: new Date().toISOString() });
          case "subscribe":
          case "subscribe_quote": {
            if (hub.subscriptionCount(client) >= maxSubscriptionsPerClient) {
              return client.send({ type: "error", code: "SUBSCRIPTION_LIMIT", message: `máximo de ${maxSubscriptionsPerClient} assinaturas por conexão` });
            }
            await market.resolveAsset(msg.symbol); // só ativos Spot válidos e negociando
            if (socket.readyState !== socket.OPEN) return;
            if (msg.type === "subscribe") hub.subscribe(client, "candles", msg.symbol, msg.interval);
            else hub.subscribe(client, "quote", msg.symbol);
            return;
          }
          case "unsubscribe":
            return hub.unsubscribe(client, "candles", msg.symbol, msg.interval);
          case "unsubscribe_quote":
            return hub.unsubscribe(client, "quote", msg.symbol);
        }
      } catch (err) {
        const code = (err as { code?: string }).code ?? "INTERNAL";
        client.send({ type: "error", code, message: (err as Error).message });
      }
    });

    socket.on("close", () => {
      clearInterval(heartbeat);
      clearInterval(recheckTimer);
      accessEvents.off("changed", onAccessChanged);
      hub.removeClient(client);
    });
    socket.on("error", (err) => log.warn({ err: err.message }, "erro no ws do cliente"));
  });
}
