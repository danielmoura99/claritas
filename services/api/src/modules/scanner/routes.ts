import type { FastifyInstance } from "fastify";
import { ScannerQuerySchema } from "@claritas/contracts";
import { AppError } from "../../infrastructure/errors";
import { parseOrThrow } from "../../infrastructure/validation";
import { authOf } from "../auth/routes";
import type { AccessPolicy } from "../entitlements/entitlements-service";
import type { ProductEvents } from "../metrics/product-events";
import type { ScannerService } from "./scanner-service";

const IDEMPOTENCY = /^[A-Za-z0-9_-]{8,64}$/;

export async function scannerRoutes(app: FastifyInstance, { scanner, access, events }: { scanner: ScannerService; access: AccessPolicy; events?: ProductEvents }) {
  app.get("/", async (req, reply) => {
    const q = parseOrThrow(ScannerQuerySchema, req.query);
    // `scanner.access` já foi exigida pelo guarda; aqui consome 1 varredura da quota diária (D-S08).
    // Retentativa com o mesmo Idempotency-Key não conta duas vezes.
    const header = req.headers["idempotency-key"];
    const key = typeof header === "string" && IDEMPOTENCY.test(header) ? header : req.id;
    const userId = authOf(req).user.id;
    const d = await access.consume(userId, "scanner.scan", key);
    if (!d.allowed) {
      if (d.reason === "QUOTA_EXCEEDED") throw new AppError("QUOTA_EXCEEDED", "Limite diário de varreduras atingido", { details: { feature: "scanner.scan", limit: d.limit, resetsAt: d.resetsAt } });
      throw new AppError("ENTITLEMENT_REQUIRED", "Varreduras não incluídas no seu acesso atual", { details: { feature: "scanner.scan", reason: d.reason } });
    }
    if (d.limit !== undefined) reply.header("x-quota-limit", String(d.limit)).header("x-quota-remaining", String(d.remaining ?? 0));
    const data = await scanner.scan(q.quote, q.size, q.timeframe);
    events?.record("scanner_used", userId, { timeframe: q.timeframe });
    return { data, source: data.provider, receivedAt: new Date().toISOString(), asOf: data.scannedAt, status: "live" };
  });
}
