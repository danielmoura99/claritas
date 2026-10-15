import { z } from "zod";
import { CandleSchema, DecimalStringSchema, IntervalSchema, ProviderSchema, SymbolSchema } from "./market";
import { AnalysisEventSchema, REGIME_STATES } from "./analysis";

/**
 * Resumo de um período sobre candles reais. Mercado cripto é 24/7: não existe "fechamento de pregão";
 * a janela é sempre explícita (24h móveis ou dia de calendário num fuso declarado).
 */
export const REPORT_TIMEZONES = ["America/Sao_Paulo", "UTC"] as const;

export const ReportQuerySchema = z
  .object({
    symbol: SymbolSchema,
    window: z.enum(["rolling_24h", "day"]).default("rolling_24h"),
    /** Dia de calendário (YYYY-MM-DD) no fuso `tz`; obrigatório quando window=day. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tz: z.enum(REPORT_TIMEZONES).default("America/Sao_Paulo"),
  })
  .refine((q) => q.window !== "day" || q.date, { message: "date é obrigatório para window=day", path: ["date"] });
export type ReportQuery = z.infer<typeof ReportQuerySchema>;

export const ReportSchema = z.object({
  symbol: z.string(),
  provider: ProviderSchema,
  generatedAt: z.string(),
  window: z.object({
    kind: z.enum(["rolling_24h", "day"]),
    label: z.string(),
    startMs: z.number().int(),
    endMs: z.number().int(),
    timeZone: z.enum(REPORT_TIMEZONES),
    /** true quando a janela ainda não terminou (dia corrente) ou termina "agora" (24h móveis). */
    partial: z.boolean(),
  }),
  barInterval: IntervalSchema,
  bars: z.number().int(),
  ohlcv: z.object({
    open: DecimalStringSchema,
    high: DecimalStringSchema,
    low: DecimalStringSchema,
    close: DecimalStringSchema,
    volumeBase: DecimalStringSchema,
    volumeQuote: DecimalStringSchema,
    trades: z.number().int(),
  }),
  highTimeMs: z.number().int(),
  lowTimeMs: z.number().int(),
  change: z.object({ abs: DecimalStringSchema, pct: DecimalStringSchema }),
  /** (máx − mín) / abertura · 100 */
  rangePct: DecimalStringSchema,
  /** Desvio-padrão dos retornos log das barras × √n, em % (volatilidade realizada no período, não anualizada). */
  realizedVolPct: DecimalStringSchema.nullable(),
  /** Maior queda de um pico até um vale posterior dentro da janela (fechamentos), em %. */
  maxDrawdownPct: DecimalStringSchema,
  /** Maior alta de um vale até um pico posterior dentro da janela (fechamentos), em %. */
  maxRunupPct: DecimalStringSchema,
  regimeAtEnd: z.enum(REGIME_STATES),
  events: z.array(AnalysisEventSchema),
  candles: z.array(CandleSchema),
  /** Maiores altas/baixas de 24h (só faz sentido para a janela de 24h móveis). */
  movers: z
    .object({
      universe: z.string(),
      gainers: z.array(z.object({ symbol: z.string(), changePct: DecimalStringSchema, lastPrice: DecimalStringSchema })),
      losers: z.array(z.object({ symbol: z.string(), changePct: DecimalStringSchema, lastPrice: DecimalStringSchema })),
    })
    .nullable(),
  method: z.array(z.string()),
});
export type Report = z.infer<typeof ReportSchema>;
