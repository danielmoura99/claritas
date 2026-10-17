import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// scrypt (node:crypto, sem dependência nativa). N=2^15, r=8, p=1 ≈ 32 MiB e algumas dezenas de ms por hash:
// caro para força bruta offline, viável no plano free do Render. Parâmetros vão no próprio hash, então
// podem subir no futuro sem invalidar contas existentes.
const PARAMS = { N: 2 ** 15, r: 8, p: 1 } as const;
const KEY_LEN = 64;
const SALT_LEN = 16;
const MAX_MEM = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, keyLen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, keyLen, { ...opts, maxmem: MAX_MEM }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

/** Formato: `scrypt$N$r$p$<sal base64url>$<chave base64url>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await derive(password, salt, KEY_LEN, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64url");
  const opts = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(opts.N) || !Number.isInteger(opts.r) || !Number.isInteger(opts.p) || expected.length === 0) return false;
  const actual = await derive(password, Buffer.from(saltB64, "base64url"), expected.length, opts);
  return timingSafeEqual(actual, expected);
}

let dummy: Promise<string> | null = null;
/**
 * Hash descartável para comparar quando o e-mail não existe: o login leva o mesmo tempo com ou sem conta,
 * e o tempo de resposta não revela quais e-mails estão cadastrados.
 */
export function dummyHash(): Promise<string> {
  dummy ??= hashPassword(randomBytes(16).toString("hex"));
  return dummy;
}
