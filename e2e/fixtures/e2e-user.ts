// Conta do E2E REAL. Vive só no banco LOCAL de E2E (scripts/e2e-db.mjs), nunca no Neon.
export const AUTH_FILE = "e2e/.auth/user.json";
export const E2E_USER = { name: "Analista E2E", email: "e2e@claritas.test", password: "senha-do-e2e-claritas" };
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgresql://claritas:claritas_dev@127.0.0.1:5544/claritas_e2e";
