import type { FastifyInstance } from "fastify";
import { ReportQuerySchema } from "@claritas/contracts";
import { parseOrThrow } from "../../infrastructure/validation";
import type { ReportService } from "./report-service";

export async function reportRoutes(app: FastifyInstance, { report }: { report: ReportService }) {
  app.get("/", async (req) => {
    const q = parseOrThrow(ReportQuerySchema, req.query);
    const data = await report.build(q);
    return { data, source: data.provider, receivedAt: new Date().toISOString(), asOf: new Date(Math.min(data.window.endMs, Date.now())).toISOString(), status: "live" };
  });
}
