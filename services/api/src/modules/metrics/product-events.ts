import type { FastifyBaseLogger } from "fastify";
import type { Prisma } from "../../generated/prisma/client";
import type { Database } from "../../infrastructure/db";

/** Eventos de produto (Plano 02 Etapa 9). Nomes estáveis; nenhum dado pessoal além do id interno. */
export type ProductEventName =
  | "signup_completed"
  | "first_chart_viewed"
  | "scanner_used"
  | "trial_started"
  | "subscription_activated"
  | "subscription_canceled"
  | "upgrade_clicked";

/** Eventos que só podem ocorrer uma vez por usuário. */
const ONCE: ReadonlySet<ProductEventName> = new Set(["signup_completed", "first_chart_viewed"]);

export class ProductEvents {
  constructor(
    private readonly db: Database,
    private readonly log?: FastifyBaseLogger,
  ) {}

  /** Grava sem bloquear o fluxo principal: métrica nunca derruba operação de negócio. */
  record(name: ProductEventName, userId: string | null, props?: Record<string, string | number | boolean>) {
    if (!this.db.configured) return;
    void (async () => {
      if (userId && ONCE.has(name)) {
        const seen = await this.db.run((p) => p.productEvent.findFirst({ where: { name, userId }, select: { id: true } }));
        if (seen) return;
      }
      await this.db.run((p) => p.productEvent.create({ data: { name, userId, props: (props ?? undefined) as Prisma.InputJsonValue | undefined } }));
    })().catch((err) => this.log?.warn({ err: String(err), name }, "evento de produto não gravado"));
  }
}
