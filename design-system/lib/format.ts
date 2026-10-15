// pt-BR number/time formatting shared by components and templates (DESIGN.md → Content: numbers).
export const BRT = "America/Sao_Paulo";

/** 1.234,56 — fixed decimals, pt-BR separators. */
export const fmtBR = (v: number, d = 2) =>
  Number(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** 14:32 in Brasília time. */
export const fmtTimeBR = (t: number | Date) =>
  new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: BRT });
