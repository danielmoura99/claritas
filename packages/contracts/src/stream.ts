import { z } from "zod";
import { CandleSchema, FeedStatusSchema, IntervalSchema, ProviderSchema, QuoteSchema, SymbolSchema } from "./market";

/** Protocolo do WebSocket Claritas (`/api/v1/market/stream`). Documentado em docs/API_CONTRACT.md. */

export const CandleChannelSchema = z.object({ channel: z.literal("candles"), symbol: SymbolSchema, interval: IntervalSchema });
export const QuoteChannelSchema = z.object({ channel: z.literal("quote"), symbol: SymbolSchema });
export const ChannelSchema = z.discriminatedUnion("channel", [CandleChannelSchema, QuoteChannelSchema]);
export type Channel = z.infer<typeof ChannelSchema>;

export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("subscribe"), ...CandleChannelSchema.shape }),
  z.object({ type: z.literal("subscribe_quote"), ...QuoteChannelSchema.shape }),
  z.object({ type: z.literal("unsubscribe"), ...CandleChannelSchema.shape }),
  z.object({ type: z.literal("unsubscribe_quote"), ...QuoteChannelSchema.shape }),
  z.object({ type: z.literal("ping"), id: z.string().max(36).optional() }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

const meta = { source: ProviderSchema, receivedAt: z.string(), eventTimeMs: z.number().int() };

export const ServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), serverTime: z.string(), protocol: z.literal(1) }),
  z.object({ type: z.literal("candle.upsert"), data: CandleSchema, ...meta }),
  z.object({ type: z.literal("quote.update"), data: QuoteSchema, ...meta }),
  z.object({ type: z.literal("status"), data: FeedStatusSchema }),
  z.object({ type: z.literal("subscribed"), channel: z.enum(["candles", "quote"]), symbol: z.string(), interval: IntervalSchema.optional() }),
  z.object({ type: z.literal("unsubscribed"), channel: z.enum(["candles", "quote"]), symbol: z.string(), interval: IntervalSchema.optional() }),
  z.object({ type: z.literal("error"), code: z.string(), message: z.string() }),
  z.object({ type: z.literal("pong"), id: z.string().optional(), serverTime: z.string() }),
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
export type CandleUpsertMessage = Extract<ServerMessage, { type: "candle.upsert" }>;
export type QuoteUpdateMessage = Extract<ServerMessage, { type: "quote.update" }>;
export type StatusMessage = Extract<ServerMessage, { type: "status" }>;

export const candleKey = (symbol: string, interval: string) => `${symbol}:${interval}`;
