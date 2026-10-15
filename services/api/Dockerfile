# API Claritas (Fastify + WebSocket persistente). Build a partir da RAIZ do repositório:
#   docker build -f services/api/Dockerfile -t claritas-api .
# Não validado nesta máquina (sem Docker) — ver docs/DEPLOY.md.
FROM node:24.11.1-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Manifestos primeiro (cache de dependências). Só os workspaces que a API usa.
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY services/api/package.json services/api/
RUN npm ci --omit=dev --ignore-scripts -w @claritas/api -w @claritas/contracts

COPY packages/contracts packages/contracts
COPY services/api services/api
# Prisma Client gerado no build (o diretório generated/ não é versionado).
RUN npm run db:generate

USER node
ENV API_HOST=0.0.0.0 API_PORT=4000
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start:api"]
