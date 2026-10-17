"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginRequestSchema, PASSWORD_MIN, RegisterRequestSchema } from "@claritas/contracts";
import Link from "next/link";
import { Button, Checkbox, Icon, Input, PasswordInput, TextLink, Wordmark } from "@/design-system";
import { ApiClientError, describeError } from "@/lib/api/client";
import { safeNext, signIn, signUp, useSession } from "@/lib/auth/use-session";
import { LoginMarketShowcase } from "./LoginMarketShowcase";

// Tela de entrada fiel ao kit do Claude Design (ui_kits/login): coluna do formulário à esquerda, painel de
// mercado ILUSTRATIVO à direita (≥ 980 px = 61,25 rem; ver LoginMarketShowcase). "Manter conectado" é real.
// "Esqueci a senha", "SSO corporativo", "Privacidade" e "Suporte" aparecem como no kit, mas ainda não têm
// backend: ao clicar, a tela diz isso (nada é simulado). "Criar conta" (cadastro aberto, ADR-018) é um passo.

type Step = "entrar" | "criar";
type Field = "name" | "email" | "password" | "acceptTerms";
type FieldErrors = Partial<Record<Field, string>>;
type Notice = { tone: "error" | "info"; text: string };

const COPY: Record<Step, { eyebrow: string; title: string; body: string; submit: string }> = {
  entrar: { eyebrow: "Acesso", title: "Entre no seu terminal.", body: "O pregão já está sendo lido. Sua mesa abre exatamente onde você parou.", submit: "Entrar" },
  criar: { eyebrow: "Nova conta", title: "Crie seu acesso.", body: "Use o terminal completo por 7 dias, sem cobrança e sem cartão. Watchlist e preferências ficam salvas na sua conta.", submit: "Criar conta e entrar" },
};

/** Recursos do kit ainda sem backend: a tela informa em vez de simular. */
const NOT_YET = {
  forgot: "Recuperação de senha ainda não está disponível nesta versão (exige envio de e-mail).",
  sso: "SSO corporativo ainda não está disponível nesta versão.",
};

function StepHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="cl-label">{eyebrow}</span>
      <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-m-size)/var(--display-m-lh) var(--font-serif)", letterSpacing: "var(--display-m-track)", textWrap: "balance" }}>{title}</h1>
      <p className="m-0 text-fg-secondary" style={{ font: "var(--text-body)", textWrap: "pretty" }}>{body}</p>
    </div>
  );
}

/** Aviso do formulário: erro (servidor/rede) ou informação (recurso ainda indisponível). Composição com tokens. */
function FormNotice({ notice }: { notice: Notice }) {
  const error = notice.tone === "error";
  return (
    <div role={error ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-md border border-line px-3 py-2.5 text-xs leading-relaxed ${error ? "bg-down-tint text-down-text" : "bg-info-tint text-fg-secondary"}`}>
      <Icon name={error ? "circle-alert" : "info"} size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{notice.text}</span>
    </div>
  );
}

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {};
  for (const i of issues) {
    const k = i.path[0];
    if ((k === "name" || k === "email" || k === "password" || k === "acceptTerms") && !out[k]) out[k] = i.message;
  }
  return out;
}

export function LoginScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const next = safeNext(search.get("next"));
  const session = useSession();
  const [step, setStep] = React.useState<Step>(search.get("modo") === "criar" ? "criar" : "entrar");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [pending, setPending] = React.useState(false);
  const info = (text: string) => setNotice({ tone: "info", text });

  // Quem já tem sessão válida não precisa desta tela.
  React.useEffect(() => {
    if (session.status === "authenticated") router.replace(next);
  }, [session.status, next, router]);

  const goTo = (s: Step) => {
    setStep(s);
    setErrors({});
    setNotice(null);
    setPassword("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    // Mesmos contratos Zod da API: o erro aparece no campo antes de qualquer requisição.
    const parsed = step === "criar" ? RegisterRequestSchema.safeParse({ name, email, password, acceptTerms }) : LoginRequestSchema.safeParse({ email, password, remember });
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error.issues));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      if (step === "criar") await signUp(RegisterRequestSchema.parse({ name, email, password, acceptTerms }));
      else await signIn(LoginRequestSchema.parse({ email, password, remember }));
      router.replace(next);
    } catch (err) {
      setPending(false);
      if (err instanceof ApiClientError) {
        if (err.code === "INVALID_CREDENTIALS") return setErrors({ password: err.message });
        if (err.code === "EMAIL_TAKEN") return setErrors({ email: err.message });
        if (err.code === "RATE_LIMITED") return setNotice({ tone: "error", text: `${err.message}${err.retryAfterSec ? ` Nova tentativa em ${Math.ceil(err.retryAfterSec / 60)} min.` : ""}` });
      }
      setNotice({ tone: "error", text: describeError(err) });
    }
  };

  const copy = COPY[step];
  return (
    <div className="grid h-dvh grid-cols-1 bg-app text-fg min-[61.25rem]:grid-cols-[minmax(27.5rem,35rem)_minmax(0,1fr)]">
      <main className="flex min-w-0 flex-col overflow-y-auto px-4 py-8 sm:px-14">
        <Wordmark size={24} product="Terminal" />
        <div className="flex flex-1 items-center py-10">
          <div key={step} className="w-full max-w-95" style={{ animation: "cl-rise var(--dur-base) var(--ease-out)" }}>
            <form noValidate onSubmit={onSubmit} aria-label={copy.title} className="flex flex-col gap-8">
              <StepHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
              <div className="flex flex-col gap-4.5">
                {step === "criar" && (
                  <Input label="Nome" name="name" size="lg" autoComplete="name" placeholder="Como devemos chamar você" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} disabled={pending} />
                )}
                <Input label="E-mail" name="email" type="email" size="lg" icon="user" inputMode="email" autoComplete={step === "criar" ? "email" : "username"} placeholder="voce@exemplo.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={pending} />
                <PasswordInput label="Senha" name="password" size="lg" autoComplete={step === "criar" ? "new-password" : "current-password"} placeholder="••••••••"
                  hint={step === "criar" ? `Mínimo de ${PASSWORD_MIN} caracteres. Uma frase longa vale mais que símbolos.` : undefined}
                  value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={pending} />
                {step === "entrar" && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Checkbox checked={remember} onChange={setRemember} label="Manter conectado neste dispositivo" disabled={pending} />
                    <TextLink onClick={() => info(NOT_YET.forgot)}>Esqueci a senha</TextLink>
                  </div>
                )}
                {step === "criar" && (
                  <div className="flex flex-col gap-1.5">
                    <Checkbox checked={acceptTerms} onChange={setAcceptTerms} disabled={pending}
                      label={<span>Li e aceito os <Link href="/termos" target="_blank" className="text-accent">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="text-accent">Política de Privacidade</Link></span>} />
                    {errors.acceptTerms && <span role="alert" className="text-xs text-down-text">{errors.acceptTerms}</span>}
                  </div>
                )}
                {notice && <FormNotice notice={notice} />}
              </div>
              <div className="flex flex-col gap-2.5">
                <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} iconRight={pending ? undefined : "chevron-right"}>{copy.submit}</Button>
                {step === "entrar" ? (
                  <>
                    <div className="my-1.5 flex items-center gap-3" aria-hidden>
                      <span className="h-px flex-1 bg-line-subtle" />
                      <span className="cl-label text-fg-disabled" style={{ fontSize: "var(--micro-size)" }}>ou</span>
                      <span className="h-px flex-1 bg-line-subtle" />
                    </div>
                    <Button type="button" variant="outline" size="lg" fullWidth icon="shield-check" onClick={() => info(NOT_YET.sso)}>SSO corporativo</Button>
                    <p className="m-0 mt-2 text-xs text-fg-tertiary">
                      Ainda não tem conta? <TextLink onClick={() => goTo("criar")} disabled={pending}>Criar conta</TextLink>
                    </p>
                  </>
                ) : (
                  <TextLink onClick={() => goTo("entrar")} disabled={pending} style={{ alignSelf: "flex-start" }}>← Já tenho conta</TextLink>
                )}
              </div>
            </form>
          </div>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-fg-tertiary">
          <span>Conexão criptografada · Binance Spot em tempo real</span>
          <span className="flex gap-4">
            <TextLink href="/planos">Planos</TextLink>
            <TextLink href="/termos">Termos</TextLink>
            <TextLink href="/privacidade">Privacidade</TextLink>
            <TextLink href="/ajuda#suporte">Ajuda</TextLink>
          </span>
        </footer>
      </main>
      <div className="hidden min-w-0 min-[61.25rem]:flex">
        <LoginMarketShowcase />
      </div>
    </div>
  );
}
