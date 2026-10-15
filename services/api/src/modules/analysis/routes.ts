import type { FastifyInstance } from "fastify";
import { AnalysisQuerySchema } from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { AnalysisService } from "./analysis-service";

export async function analysisRoutes(app: FastifyInstance, { analysis }: { analysis: AnalysisService }) {
  app.get("/", async (req) => {
    const q = parseOrThrow(AnalysisQuerySchema, req.query);
    const data = await analysis.analyze(q.symbol, q.interval, q.includeOpen);
    return { data, source: "binance_spot", receivedAt: new Date().toISOString(), asOf: new Date(Math.min(data.basis.lastCloseTimeMs, Date.now())).toISOString(), status: "live" };
  });
}
