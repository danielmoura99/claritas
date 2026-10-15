import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { AppError } from "./errors";

export type Db = PrismaClient;

/**
 * Acesso ao PostgreSQL (Prisma 7 + driver adapter pg). A API funciona sem banco: recursos de mercado
 * não dependem dele; rotas de persistência respondem 503 DB_UNAVAILABLE.
 */
export class Database {
  readonly client: PrismaClient | null;

  constructor(url: string | undefined) {
    this.client = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url, connectionTimeoutMillis: 3_000 }) }) : null;
  }

  get configured() {
    return this.client !== null;
  }

  /** Cliente pronto para uso, ou erro padronizado se não houver banco configurado. */
  require(): PrismaClient {
    if (!this.client) throw new AppError("DB_UNAVAILABLE", "Persistência não configurada (DATABASE_URL ausente)");
    return this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /** Converte falhas de conexão do driver em 503; deixa outros erros seguirem. */
  async run<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T> {
    const db = this.require();
    try {
      return await fn(db);
    } catch (err) {
      if (err instanceof AppError) throw err;
      const msg = String((err as Error)?.message ?? err);
      if (/ECONNREFUSED|ETIMEDOUT|Can't reach database|connect|Connection terminated|timeout/i.test(msg)) {
        throw new AppError("DB_UNAVAILABLE", "Banco de dados indisponível", { cause: err });
      }
      throw err;
    }
  }

  async close() {
    await this.client?.$disconnect();
  }
}
