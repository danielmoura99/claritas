import type { NextConfig } from "next";

// Destino do repasse /api/v1 (lado servidor; nunca vai ao navegador). Aceita a variável antiga
// NEXT_PUBLIC_CLARITAS_API_URL para não quebrar deploys existentes.
const CLARITAS_API_URL = (process.env.CLARITAS_API_URL ?? process.env.NEXT_PUBLIC_CLARITAS_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Contratos compartilhados com a API são publicados como TypeScript fonte (workspace).
  transpilePackages: ["@claritas/contracts"],
  // O navegador chama /api/v1 no próprio domínio e o Next repassa à API Claritas: o cookie de sessão
  // fica first-party (web e API em domínios diferentes). O WebSocket vai direto à API, com ticket.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${CLARITAS_API_URL}/api/v1/:path*` }];
  },
  // Cabeçalhos defensivos básicos. CSP com nonce fica pendente (ver docs/DEPLOY.md).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // o showcase embute /design-system/terminal
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
