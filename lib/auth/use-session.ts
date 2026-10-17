"use client";

import * as React from "react";
import type { LoginRequest, RegisterRequest, Session } from "@claritas/contracts";
import { ApiClientError, authApi, describeError } from "../api/client";

export type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; session: Session }
  | { status: "anonymous" }
  /** API ou banco fora: não dá para afirmar nem negar a sessão — a interface diz isso, sem redirecionar. */
  | { status: "unavailable"; message: string };

const LOADING: SessionState = { status: "loading" };
let state: SessionState = LOADING;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Confere a sessão na API (uma requisição por vez, compartilhada entre os componentes da aba). */
export function refreshSession(): Promise<void> {
  inflight ??= authApi
    .session()
    .then((session) => set({ status: "authenticated", session }))
    .catch((err) => {
      if (err instanceof ApiClientError && err.code === "UNAUTHENTICATED") set({ status: "anonymous" });
      else set({ status: "unavailable", message: describeError(err) });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** A sessão acabou no meio do uso (alguma chamada respondeu 401). */
export function markSignedOut() {
  if (state.status !== "anonymous") set({ status: "anonymous" });
}

/** Estado da sessão compartilhado na aba; a primeira leitura dispara a conferência na API. */
export function useSession(): SessionState {
  const s = React.useSyncExternalStore(subscribe, () => state, () => LOADING);
  React.useEffect(() => {
    if (state.status === "loading") void refreshSession();
  }, []);
  return s;
}

/** Usuário da sessão atual (null enquanto não autenticado). */
export function useCurrentUser() {
  const s = useSession();
  return s.status === "authenticated" ? s.session.user : null;
}

export async function signIn(input: LoginRequest): Promise<Session> {
  const session = await authApi.login(input);
  set({ status: "authenticated", session });
  return session;
}

export async function signUp(input: RegisterRequest): Promise<Session> {
  const session = await authApi.register(input);
  set({ status: "authenticated", session });
  return session;
}

/**
 * Encerra a sessão no servidor e recarrega em /entrar: a navegação completa descarta watchlist,
 * preferências e o WebSocket da conta anterior que estão em memória.
 */
export async function signOut(): Promise<void> {
  await authApi.logout().catch(() => {});
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa intencional (ver acima)
  window.location.assign("/entrar");
}

/** Destino seguro depois de entrar: só caminhos internos (evita redirecionamento aberto). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.startsWith("/entrar")) return "/";
  return next;
}
