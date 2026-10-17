import type { AccessDecision, AccessReason, AccessState, FeatureKey, SubscriptionSource, SubscriptionStatus } from "@claritas/contracts";

/** Canal de suporte publicado (D-S17). Sem a variável, a interface diz que ainda não há canal — nada é inventado. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_CLARITAS_SUPPORT_EMAIL ?? null;

export const FEATURE_LABEL: Record<FeatureKey, string> = {
  "terminal.access": "Pregão ao vivo",
  "terminal.timeframe.advanced": "Períodos avançados",
  "terminal.indicators.advanced": "Indicadores avançados",
  "scanner.access": "Scanner",
  "scanner.scan": "Varreduras do Scanner",
  "reports.access": "Resumo do período",
  "reports.export": "Exportar relatórios",
  "watchlist.max_assets": "Ativos na watchlist",
  "alerts.max_active": "Alertas ativos",
  "history.max_days": "Histórico acessível",
};

/** Estados do FeatureGate (Plano 02 §8.3). */
export type GateState = "UPGRADE_REQUIRED" | "TRIAL_EXPIRED" | "ACCESS_EXPIRED" | "NO_ACCESS_YET" | "ACCOUNT_SUSPENDED" | "QUOTA_REACHED" | "FEATURE_UNAVAILABLE";

export function gateStateOf(decision: AccessDecision, state: AccessState): GateState {
  const r: AccessReason = decision.reason;
  if (r === "ACCOUNT_BLOCKED") return "ACCOUNT_SUSPENDED";
  if (r === "QUOTA_EXCEEDED") return "QUOTA_REACHED";
  if (r === "FEATURE_UNAVAILABLE") return "FEATURE_UNAVAILABLE";
  if (r === "SUBSCRIPTION_INACTIVE") return state === "TRIAL_EXPIRED" ? "TRIAL_EXPIRED" : state === "EXPIRED" ? "ACCESS_EXPIRED" : "NO_ACCESS_YET";
  return "UPGRADE_REQUIRED"; // FEATURE_NOT_INCLUDED ou negação explícita
}

/** Texto do bloqueio, no tom Claritas — sem preço, sem checkout (Etapa 7 adiada). */
export function gateCopy(gate: GateState, feature: string): { eyebrow: string; title: string; body: string } {
  switch (gate) {
    case "NO_ACCESS_YET":
      return { eyebrow: "Conta criada", title: "Sua conta está pronta; o acesso ainda não foi liberado.", body: "Nesta fase o Claritas libera o terminal manualmente — por período de teste ou plano combinado com a equipe. Fale com o suporte para ativar." };
    case "TRIAL_EXPIRED":
      return { eyebrow: "Teste encerrado", title: "Seu período de teste terminou.", body: "Nada foi cobrado. Para continuar usando o terminal, fale com o suporte e combine um plano." };
    case "ACCESS_EXPIRED":
      return { eyebrow: "Acesso encerrado", title: "O prazo do seu acesso terminou.", body: "Fale com o suporte para renovar. Sua watchlist e preferências continuam salvas." };
    case "ACCOUNT_SUSPENDED":
      return { eyebrow: "Conta", title: "Sua conta está sem acesso no momento.", body: "Fale com o suporte para entender o motivo e reativar." };
    case "QUOTA_REACHED":
      return { eyebrow: feature, title: "Você atingiu o limite do seu plano.", body: "O limite volta no início da próxima janela. Para ampliar, fale com o suporte." };
    case "FEATURE_UNAVAILABLE":
      return { eyebrow: feature, title: "Este recurso ainda não está disponível.", body: "Ele está no roteiro, mas ainda não existe no produto." };
    case "UPGRADE_REQUIRED":
      return { eyebrow: feature, title: `${feature} não está incluído no seu acesso atual.`, body: "Veja o que cada plano inclui ou fale com o suporte para ampliar o seu." };
  }
}

/** Por que está liberado ou negado (Plano 02 §7.3 — quadro "Funcionalidades liberadas"). */
export const REASON_LABEL: Record<AccessReason, string> = {
  ALLOWED_BY_PLAN: "Liberado pelo plano",
  ALLOWED_BY_GRANT: "Liberado por concessão individual",
  ADMIN_PERMISSION: "Permissão de administração",
  UNAUTHENTICATED: "Sem sessão",
  ACCOUNT_BLOCKED: "Conta bloqueada",
  SUBSCRIPTION_INACTIVE: "Sem assinatura ou concessão válida",
  FEATURE_NOT_INCLUDED: "Não incluído no plano",
  FEATURE_EXPLICITLY_DENIED: "Negado por concessão individual",
  FEATURE_UNAVAILABLE: "Ainda não existe no produto",
  QUOTA_EXCEEDED: "Limite atingido",
};

export const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING: "Pendente",
  TRIALING: "Em teste",
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  CANCELED: "Encerrada",
  EXPIRED: "Expirada",
  SUSPENDED: "Suspensa",
};

/** Origem sempre explícita: cortesia e acesso manual NÃO são pagamento (Plano 02 §8.1). */
export const SUB_SOURCE_LABEL: Record<SubscriptionSource, string> = {
  OWN_GATEWAY: "Pagamento (gateway)",
  MANUAL: "Acesso manual, sem cobrança",
  COMPLIMENTARY: "Cortesia",
};

export const STATE_LABEL: Record<AccessState, string> = {
  ACTIVE: "Acesso ativo",
  TRIALING: "Em período de teste",
  TRIAL_EXPIRED: "Teste encerrado",
  EXPIRED: "Acesso encerrado",
  NONE: "Aguardando liberação",
  BLOCKED: "Conta sem acesso",
};

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const DAY_FMT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
/** Data/hora de Brasília para exibição (o dado continua em UTC). */
export const fmtDateTime = (iso: string | null | undefined) => (iso ? DATE_FMT.format(new Date(iso)) : "—");
export const fmtDate = (iso: string | null | undefined) => (iso ? DAY_FMT.format(new Date(iso)) : "—");
export const fmtInt = (n: number) => n.toLocaleString("pt-BR");

/** Dias inteiros restantes até um instante (arredonda para cima; 0 se já passou). */
export const daysUntil = (iso: string, now = Date.now()) => Math.max(0, Math.ceil((Date.parse(iso) - now) / 86_400_000));
