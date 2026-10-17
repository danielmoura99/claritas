import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { LoginRequestSchema, RegisterRequestSchema } from "@claritas/contracts";
import { buildApp } from "../../src/app";
import { parseEnv } from "../../src/config/env";
import { hashPassword, verifyPassword } from "../../src/modules/auth/password";
import { LoginThrottle } from "../../src/modules/auth/login-throttle";
import { StreamTickets } from "../../src/modules/auth/stream-tickets";
import { SESSION_COOKIE, clearedSessionCookie, hashSessionToken, readSessionToken, sessionCookie } from "../../src/modules/auth/session-cookie";
import { FakeStreamSource } from "../helpers/fake-stream";
import { SESSION_HEADERS, TEST_USER, streamTicket, testSessions, allowAllAccess } from "../helpers/auth";

describe("senha (scrypt)", () => {
  it("hash com sal aleatório verifica a senha certa e recusa a errada", async () => {
    const a = await hashPassword("senha-forte-123");
    const b = await hashPassword("senha-forte-123");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^scrypt\$32768\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(await verifyPassword("senha-forte-123", a)).toBe(true);
    expect(await verifyPassword("senha-forte-124", a)).toBe(false);
  });

  it("hash malformado nunca autentica", async () => {
    for (const bad of ["", "plain", "bcrypt$x$y", "scrypt$abc$8$1$c2FsdA$a2V5"]) expect(await verifyPassword("x", bad)).toBe(false);
  });
});

describe("cookie e token de sessão", () => {
  it("atributos de segurança", () => {
    const c = sessionCookie("tok", { maxAgeSec: 60, secure: true });
    expect(c).toBe(`${SESSION_COOKIE}=tok; Path=/; HttpOnly; SameSite=Lax; Max-Age=60; Secure`);
    expect(sessionCookie("tok", { maxAgeSec: 60, secure: false })).not.toMatch(/Secure/);
    expect(clearedSessionCookie(false)).toMatch(/Max-Age=0/);
    // "Manter conectado" desmarcado: cookie de sessão do navegador (sem Max-Age).
    expect(sessionCookie("tok", { secure: false })).toBe(`${SESSION_COOKIE}=tok; Path=/; HttpOnly; SameSite=Lax`);
  });

  it("lê só o cookie de sessão e ignora valores fora do formato", () => {
    const token = "A".repeat(43);
    expect(readSessionToken(`outro=1; ${SESSION_COOKIE}=${token}; x=2`)).toBe(token);
    expect(readSessionToken(`${SESSION_COOKIE}=curto`)).toBeNull();
    expect(readSessionToken(`${SESSION_COOKIE}=${"A".repeat(30)};drop table`)).toBe("A".repeat(30));
    expect(readSessionToken(undefined)).toBeNull();
  });

  it("o banco guarda SHA-256, não o token", () => {
    expect(hashSessionToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("tickets do WebSocket", () => {
  it("uso único e validade de 60 s", () => {
    let now = 1_000_000;
    const t = new StreamTickets(() => now);
    const a = t.issue("u1");
    expect(t.consume(a.ticket)).toBe("u1");
    expect(t.consume(a.ticket)).toBeNull();
    const b = t.issue("u1");
    now += 60_001;
    expect(t.consume(b.ticket)).toBeNull();
    expect(t.consume(undefined)).toBeNull();
  });
});

describe("tentativas de login por e-mail", () => {
  it("bloqueia após 10 falhas em 15 min, libera com sucesso ou com o tempo", () => {
    let now = 0;
    const th = new LoginThrottle(() => now);
    for (let i = 0; i < 9; i++) th.fail("a@x.test");
    expect(th.retryAfterSec("a@x.test")).toBe(0);
    th.fail("a@x.test");
    expect(th.retryAfterSec("a@x.test")).toBe(900);
    expect(th.retryAfterSec("b@x.test")).toBe(0);
    now += 15 * 60_000 + 1;
    expect(th.retryAfterSec("a@x.test")).toBe(0);
    for (let i = 0; i < 10; i++) th.fail("a@x.test");
    th.succeed("a@x.test");
    expect(th.retryAfterSec("a@x.test")).toBe(0);
  });
});

describe("contratos de auth", () => {
  it("normaliza e-mail e valida senha", () => {
    expect(RegisterRequestSchema.parse({ name: " Ana ", email: " ANA@Claritas.test ", password: "12345678" })).toEqual({ name: "Ana", email: "ana@claritas.test", password: "12345678" });
    expect(RegisterRequestSchema.safeParse({ name: "Ana", email: "ana@claritas.test", password: "1234567" }).success).toBe(false);
    expect(RegisterRequestSchema.safeParse({ name: "", email: "ana@claritas.test", password: "12345678" }).success).toBe(false);
    expect(RegisterRequestSchema.safeParse({ name: "Ana", email: "não-é-email", password: "12345678" }).success).toBe(false);
    expect(RegisterRequestSchema.safeParse({ name: "Ana", email: "a@b.test", password: "12345678", admin: true }).success).toBe(false);
    // Contas antigas com senha curta continuam entrando: a política vale para o cadastro.
    expect(LoginRequestSchema.safeParse({ email: "a@b.test", password: "x" }).success).toBe(true);
  });
});

describe("guarda da API", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp({ env: parseEnv({ CORS_ORIGIN: "http://localhost:3000" }), logger: false, streamSource: new FakeStreamSource(), sessions: testSessions, access: allowAllAccess });
  });
  afterAll(() => app.close());

  it("sem sessão: rotas de mercado, análise e persistência → 401 UNAUTHENTICATED", async () => {
    for (const url of ["/api/v1/market/assets", "/api/v1/analysis?symbol=BTCUSDT&interval=5m", "/api/v1/scanner", "/api/v1/report?symbol=BTCUSDT", "/api/v1/watchlist", "/api/v1/auth/session"]) {
      const res = await app.inject(url);
      expect(res.statusCode, url).toBe(401);
      expect(res.json().error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("cookie inválido também é 401; /health e /ready seguem públicos", async () => {
    expect((await app.inject({ url: "/api/v1/market/assets", headers: { cookie: `${SESSION_COOKIE}=${"B".repeat(43)}` } })).statusCode).toBe(401);
    expect((await app.inject("/health")).statusCode).toBe(200);
    expect((await app.inject("/ready")).statusCode).toBe(200);
  });

  it("com sessão: devolve o usuário sem dados sensíveis e sem cache", async () => {
    const res = await app.inject({ url: "/api/v1/auth/session", headers: SESSION_HEADERS });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user).toEqual(TEST_USER);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("escrita vinda de outra origem → 403 FORBIDDEN, mesmo com sessão", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/v1/preferences", headers: { ...SESSION_HEADERS, origin: "https://evil.example" }, payload: {} });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe("FORBIDDEN");
    const login = await app.inject({ method: "POST", url: "/api/v1/auth/login", headers: { origin: "https://evil.example" }, payload: {} });
    expect(login.statusCode).toBe(403);
  });

  it("WebSocket exige ticket válido e de uso único", async () => {
    expect((await app.inject("/api/v1/market/stream")).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/api/v1/auth/stream-ticket" })).statusCode).toBe(401);
    const ticket = await streamTicket(app);
    expect(ticket).toMatch(/^[\w-]{32}$/);
    // Sem upgrade o inject não abre o socket, mas o guarda já consome o ticket.
    await app.inject(`/api/v1/market/stream?ticket=${ticket}`);
    expect((await app.inject(`/api/v1/market/stream?ticket=${ticket}`)).statusCode).toBe(401);
  });

  it("sair sem sessão é idempotente e limpa o cookie", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/logout" });
    expect(res.statusCode).toBe(200);
    expect(String(res.headers["set-cookie"])).toMatch(/Max-Age=0/);
  });
});

describe("limites das rotas de senha", () => {
  it("AUTH_RATE_LIMIT_PER_MINUTE vale por IP em entrar/criar conta", async () => {
    const app = await buildApp({ env: parseEnv({ AUTH_RATE_LIMIT_PER_MINUTE: "2" }), logger: false, streamSource: new FakeStreamSource(), sessions: testSessions, access: allowAllAccess });
    // Corpo inválido: 400 sem tocar banco, mas conta para o limite.
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await app.inject({ method: "POST", url: "/api/v1/auth/login", payload: {} })).statusCode);
    expect(codes).toEqual([400, 400, 429]);
    await app.close();
  });

  it("sem banco, entrar e criar conta respondem 503 explícito", async () => {
    const app = await buildApp({ env: parseEnv({}), logger: false, streamSource: new FakeStreamSource() });
    const res = await app.inject({ method: "POST", url: "/api/v1/auth/register", payload: { name: "Ana", email: "ana@claritas.test", password: "senha-forte-123" } });
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe("DB_UNAVAILABLE");
    await app.close();
  });
});

describe("config de auth", () => {
  it("TRUST_PROXY, cookie seguro e duração da sessão", () => {
    expect(parseEnv({}).TRUST_PROXY).toBe(false);
    expect(parseEnv({ TRUST_PROXY: "true" }).TRUST_PROXY).toBe(true);
    expect(parseEnv({ TRUST_PROXY: "2" }).TRUST_PROXY).toBe(2);
    expect(() => parseEnv({ TRUST_PROXY: "talvez" })).toThrow(/TRUST_PROXY/);
    expect(parseEnv({ SESSION_COOKIE_SECURE: "true" }).SESSION_COOKIE_SECURE).toBe(true);
    expect(parseEnv({}).SESSION_TTL_DAYS).toBe(30);
  });
});
