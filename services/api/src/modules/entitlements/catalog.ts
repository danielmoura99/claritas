import type { FeatureKey } from "@claritas/contracts";

export interface CatalogFeature {
  key: FeatureKey;
  name: string;
  description: string;
  kind: "BOOLEAN" | "QUOTA" | "LIMIT";
  window: "DAY_UTC" | "MONTH_UTC" | null;
  /** Só `true` quando a capacidade existe e funciona no produto (docs/SAAS_AUDIT.md §5). Nunca vender o que não existe. */
  implemented: boolean;
}

/** Catálogo inicial (Plano 02 §5.1), conferido contra o código real em 17/10/2026. O seed o grava de forma idempotente. */
export const FEATURE_CATALOG: readonly CatalogFeature[] = [
  { key: "terminal.access", name: "Pregão ao vivo", description: "Abrir o terminal: candles, cotações, leitura determinística e atualização ao vivo.", kind: "BOOLEAN", window: null, implemented: true },
  { key: "terminal.timeframe.advanced", name: "Períodos avançados", description: "Períodos de gráfico reservados a planos superiores (quais são: decisão comercial pendente).", kind: "BOOLEAN", window: null, implemented: false },
  { key: "terminal.indicators.advanced", name: "Indicadores avançados", description: "Indicadores além do motor determinístico atual (ainda não existem).", kind: "BOOLEAN", window: null, implemented: false },
  { key: "scanner.access", name: "Scanner", description: "Abrir o Scanner de pares USDT por volume.", kind: "BOOLEAN", window: null, implemented: true },
  { key: "scanner.scan", name: "Varreduras do Scanner", description: "Varreduras executadas por dia (janela UTC).", kind: "QUOTA", window: "DAY_UTC", implemented: true },
  { key: "reports.access", name: "Resumo do período", description: "Abrir o Resumo do período com janela explícita.", kind: "BOOLEAN", window: null, implemented: true },
  { key: "reports.export", name: "Exportar relatórios", description: "Exportação de relatórios (ainda não existe).", kind: "QUOTA", window: "MONTH_UTC", implemented: false },
  { key: "watchlist.max_assets", name: "Ativos na watchlist", description: "Quantidade máxima de ativos acompanhados.", kind: "LIMIT", window: null, implemented: true },
  { key: "alerts.max_active", name: "Alertas ativos", description: "Alertas configurados (ainda não existem).", kind: "LIMIT", window: null, implemented: false },
  { key: "history.max_days", name: "Histórico acessível", description: "Dias de histórico por usuário (ainda não há limite por conta).", kind: "LIMIT", window: null, implemented: false },
];

export const CATALOG_BY_KEY = new Map(FEATURE_CATALOG.map((f) => [f.key, f]));

/**
 * Planos iniciais em RASCUNHO (Plano 02 §5.2). Sem preço, sem publicação e sem "Premium" (evitar plano de
 * fachada): só capacidades implementadas. Nomes e limites são proposta a validar comercialmente (D-02).
 */
export const DRAFT_PLANS: readonly { code: string; name: string; description: string; features: { key: FeatureKey; limit: number | null }[] }[] = [
  {
    code: "essencial",
    name: "Essencial",
    description: "Pregão ao vivo com gráfico, leitura determinística e watchlist.",
    features: [
      { key: "terminal.access", limit: null },
      { key: "watchlist.max_assets", limit: 10 },
    ],
  },
  {
    code: "pro",
    name: "Pro",
    description: "Essencial + Scanner e Resumo do período, com limites maiores.",
    features: [
      { key: "terminal.access", limit: null },
      { key: "scanner.access", limit: null },
      { key: "scanner.scan", limit: 50 },
      { key: "reports.access", limit: null },
      { key: "watchlist.max_assets", limit: 50 },
    ],
  },
];
