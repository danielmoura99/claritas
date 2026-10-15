import { z } from "zod";
import { DecimalStringSchema, IntervalSchema, ProviderSchema, SymbolSchema } from "./market";

/**
 * Análise determinística sobre candles reais. Regras explícitas, sem probabilidades, sem "IA".
 * Toda saída carrega algoritmo, fórmula, parâmetros, janela, base de dados e timestamp.
 */

export const AnalysisQuerySchema = z.object({
  symbol: SymbolSchema,
  interval: IntervalSchema,
  /** Inclui a barra em formação no cálculo (padrão: não — análise sobre barras fechadas). */
  includeOpen: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const AnalysisBasisSchema = z.object({
  provider: ProviderSchema,
  candles: z.number().int(),
  includesOpenCandle: z.boolean(),
  firstOpenTimeMs: z.number().int(),
  /** Abertura da última barra usada no cálculo. */
  lastOpenTimeMs: z.number().int(),
  lastCloseTimeMs: z.number().int(),
});

export const IndicatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  algorithm: z.string(),
  formula: z.string(),
  params: z.record(z.string(), z.number()),
  minBars: z.number().int(),
  /** null quando não há barras suficientes. */
  value: DecimalStringSchema.nullable(),
  unit: z.enum(["price", "percent", "ratio", "volume"]),
  /** Barra (abertura) a que o valor se refere. */
  asOfOpenTimeMs: z.number().int().nullable(),
  description: z.string(),
});
export type Indicator = z.infer<typeof IndicatorSchema>;

export const SeriesPointSchema = z.object({ t: z.number().int(), v: DecimalStringSchema });

export const LevelSchema = z.object({
  id: z.string(),
  label: z.string(),
  price: DecimalStringSchema,
  rule: z.string(),
});

export const REGIME_STATES = ["alta", "baixa", "indefinido", "indisponivel"] as const;
export const RegimeSchema = z.object({
  id: z.literal("ma_regime"),
  name: z.string(),
  state: z.enum(REGIME_STATES),
  rule: z.string(),
  evidence: z.record(z.string(), DecimalStringSchema.nullable()),
});
export type Regime = z.infer<typeof RegimeSchema>;

export const EVENT_TYPES = ["ema_cross_up", "ema_cross_down", "breakout_high", "breakout_low"] as const;
export const AnalysisEventSchema = z.object({
  id: z.string(),
  type: z.enum(EVENT_TYPES),
  /** Abertura da barra FECHADA em que a regra disparou. */
  openTimeMs: z.number().int(),
  price: DecimalStringSchema,
  title: z.string(),
  rule: z.string(),
});
export type AnalysisEvent = z.infer<typeof AnalysisEventSchema>;

export const AnalysisSchema = z.object({
  symbol: z.string(),
  interval: IntervalSchema,
  computedAt: z.string(),
  basis: AnalysisBasisSchema,
  indicators: z.array(IndicatorSchema),
  series: z.record(z.string(), z.array(SeriesPointSchema)),
  levels: z.array(LevelSchema),
  regime: RegimeSchema,
  events: z.array(AnalysisEventSchema),
  /** Avisos de método (ex.: poucas barras), exibidos junto aos resultados. */
  notes: z.array(z.string()),
});
export type Analysis = z.infer<typeof AnalysisSchema>;
