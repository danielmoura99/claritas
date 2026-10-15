import type { MarketStatus } from "@claritas/contracts";
import type { LiveStatus } from "@/design-system";

/**
 * Status do feed → LiveIndicator. Regra inviolável: "Ao vivo" SOMENTE com status `live`.
 */
export function feedIndicator(status: MarketStatus): { status: LiveStatus; label: string } {
  switch (status) {
    case "live":
      return { status: "live", label: "Ao vivo" };
    case "connecting":
      return { status: "pre", label: "Conectando" };
    case "stale":
      return { status: "delayed", label: "Sem atualização" };
    case "reconnecting":
      return { status: "auction", label: "Reconectando" };
    case "offline":
      return { status: "closed", label: "Offline" };
  }
}

/** Formata decimal string (ou number) em pt-BR com casas fixas — só para exibição. */
export function formatPrice(value: string | number | undefined, decimals: number): string {
  if (value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Casas decimais de exibição: do tickSize do ativo quando disponível; senão, heurística pela magnitude. */
export function displayDecimals(price: number | undefined, pricePrecision?: number): number {
  if (pricePrecision !== undefined) return Math.min(pricePrecision, 8);
  if (!price) return 2;
  if (price >= 1000) return 2;
  if (price >= 1) return 4;
  return 6;
}

export const TIME_ZONE = "America/Sao_Paulo";

export function formatTime(ms: number | null | undefined, withSeconds = true): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", ...(withSeconds ? { second: "2-digit" } : {}), hourCycle: "h23" });
}

export function formatCompact(value: number, decimals = 1): string {
  return value.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: decimals });
}
