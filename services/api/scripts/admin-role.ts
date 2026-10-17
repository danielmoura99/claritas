// Promoção/remoção de ADMIN — único caminho para alterar `role` (Plano 02 §4.2, D-S11).
//
//   npm run admin:role -- promote --email pessoa@exemplo.com --confirm pessoa@exemplo.com --reason "fundador da operação"
//   npm run admin:role -- demote  --email pessoa@exemplo.com --confirm pessoa@exemplo.com --reason "saiu da equipe"
//
// Regras: só conta JÁ EXISTENTE e ATIVA; confirmação digitada do e-mail; motivo obrigatório; registro na
// auditoria (append-only) com o operador do sistema operacional; nunca remove o último admin ativo.
// Roda contra o banco do DATABASE_URL do ambiente — confira qual é antes de executar.
import { userInfo } from "node:os";
import { Database } from "../src/infrastructure/db";
import { loadEnvFiles } from "../src/config/env";
import { audit } from "../src/modules/audit/audit";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const action = process.argv[2];
const email = arg("email")?.trim().toLowerCase();
const confirm = arg("confirm")?.trim().toLowerCase();
const reason = arg("reason")?.trim();

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

if (action !== "promote" && action !== "demote") fail("Uso: admin:role -- <promote|demote> --email <e-mail> --confirm <e-mail> --reason <motivo>");
if (!email) fail("Informe --email");
if (confirm !== email) fail("A confirmação (--confirm) precisa repetir exatamente o e-mail");
if (!reason || reason.length < 5) fail("Informe --reason com pelo menos 5 caracteres");

loadEnvFiles();
const url = process.env.DATABASE_URL;
if (!url) fail("DATABASE_URL não definido");
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return "?";
  }
})();
console.log(`Banco alvo: ${host}`);

const db = new Database(url);
const operator = `cli:${userInfo().username}`;
try {
  await db.run((p) =>
    p.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email }, select: { id: true, role: true, status: true } });
      if (!user) fail("Conta não encontrada — o admin precisa ter se cadastrado antes (nunca criar conta aqui)");
      if (user.status !== "ACTIVE") fail(`Conta não está ativa (${user.status})`);
      const target = action === "promote" ? "ADMIN" : "USER";
      if (user.role === target) fail(`A conta já é ${target}`);
      if (target === "USER") {
        const admins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        if (admins <= 1) fail("Não é possível remover o último admin ativo");
      }
      await tx.user.update({ where: { id: user.id }, data: { role: target } });
      await audit(tx, { id: null, label: operator }, { action: `user.role_${target.toLowerCase()}`, targetType: "User", targetId: user.id, reason, before: { role: user.role }, after: { role: target } });
      console.log(`✔ ${email} agora é ${target} (auditado como ${operator}).`);
    }),
  );
} finally {
  await db.close();
}
