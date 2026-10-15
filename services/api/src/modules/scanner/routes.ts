import type { FastifyInstance } from "fastify";
import { ScannerQuerySchema } from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { ScannerService } from "./scanner-service";

export async function scannerRoutes(app: FastifyInstance, { scanner }: { scanner: ScannerService }) {
  app.get("/", async (req) => {
    const q = parseOrThrow(ScannerQuerySchema, req.query);
    const data = await scanner.scan(q.quote, q.size, q.timeframe);
    return { data, source: data.provider, receivedAt: new Date().toISOString(), asOf: data.scannedAt, status: "live" };
  });
}
