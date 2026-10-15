import { buildApp } from "./app";
import { loadEnvFiles, parseEnv } from "./config/env";

loadEnvFiles();
const env = parseEnv();
const app = await buildApp({ env });

let closing = false;
async function shutdown(signal: string) {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, "encerrando API");
  const timer = setTimeout(() => process.exit(1), 10_000);
  timer.unref();
  await app.close();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (err) {
  app.log.fatal({ err }, "falha ao iniciar a API");
  process.exit(1);
}
