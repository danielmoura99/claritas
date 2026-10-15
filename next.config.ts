import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Contratos compartilhados com a API são publicados como TypeScript fonte (workspace).
  transpilePackages: ["@claritas/contracts"],
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
