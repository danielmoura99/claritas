import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Contratos compartilhados com a API são publicados como TypeScript fonte (workspace).
  transpilePackages: ["@claritas/contracts"],
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
