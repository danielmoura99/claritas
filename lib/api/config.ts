// URLs públicas da API Claritas (só variáveis NEXT_PUBLIC_ chegam ao navegador; nenhum segredo aqui).
export const API_URL = (process.env.NEXT_PUBLIC_CLARITAS_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
export const WS_URL = process.env.NEXT_PUBLIC_CLARITAS_WS_URL ?? `${API_URL.replace(/^http/, "ws")}/api/v1/market/stream`;
