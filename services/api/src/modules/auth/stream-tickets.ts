import { randomBytes } from "node:crypto";

const TTL_MS = 60_000;
const MAX_PENDING = 10_000;

/**
 * Tickets do WebSocket de mercado: o navegador abre o WS direto na API (o repasse do frontend não
 * transporta WebSocket), então o cookie de sessão não vai junto. Quem tem sessão pede um ticket
 * (uso único, 60 s) e o envia na URL do handshake.
 * Em memória: a API roda num processo só (o hub de streaming também). Com várias instâncias, mover para o banco.
 */
export class StreamTickets {
  private readonly pending = new Map<string, { userId: string; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  issue(userId: string): { ticket: string; expiresAt: Date } {
    this.prune();
    const ticket = randomBytes(24).toString("base64url");
    const expiresAt = this.now() + TTL_MS;
    this.pending.set(ticket, { userId, expiresAt });
    return { ticket, expiresAt: new Date(expiresAt) };
  }

  /** Devolve o dono e invalida o ticket; expirado ou desconhecido → null. */
  consume(ticket: string | undefined): string | null {
    if (!ticket) return null;
    const entry = this.pending.get(ticket);
    if (!entry) return null;
    this.pending.delete(ticket);
    return entry.expiresAt > this.now() ? entry.userId : null;
  }

  private prune() {
    const now = this.now();
    for (const [t, e] of this.pending) if (e.expiresAt <= now) this.pending.delete(t);
    // Teto contra acúmulo: descarta os mais antigos (Map preserva a ordem de inserção).
    while (this.pending.size >= MAX_PENDING) this.pending.delete(this.pending.keys().next().value!);
  }
}
