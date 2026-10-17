// REST: mesma origem do frontend. O Next repassa /api/v1/* para a API Claritas (next.config.ts → rewrites),
// então o cookie de sessão é first-party mesmo com web e API em domínios diferentes.
export const API_URL = "";
// WebSocket: direto na API (o repasse não transporta WebSocket); autenticado por ticket de uso único.
// Só variáveis NEXT_PUBLIC_ chegam ao navegador; nenhum segredo aqui.
export const WS_URL = process.env.NEXT_PUBLIC_CLARITAS_WS_URL ?? "ws://localhost:4000/api/v1/market/stream";
