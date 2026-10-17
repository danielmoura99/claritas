"use client";

import * as React from "react";
import type { AccessDecision, FeatureKey, MeAccess } from "@claritas/contracts";
import { ApiClientError, describeError, setAccessDeniedHandler } from "../api/client";
import { meApi } from "../api/commercial";

export type AccessStore =
  | { status: "loading" }
  | { status: "ready"; access: MeAccess }
  | { status: "error"; message: string };

const LOADING: AccessStore = { status: "loading" };
/** Janela máxima entre uma mudança feita pelo admin e a interface refletir (o servidor já nega na hora). */
const REFRESH_MS = 60_000;

let state: AccessStore = LOADING;
let inflight: Promise<void> | null = null;
let lastFetch = 0;
const listeners = new Set<() => void>();

function set(next: AccessStore) {
  state = next;
  listeners.forEach((l) => l());
}

/** Recalcula o retrato de acesso (uma requisição por vez). Nunca é cache autorizador: só apresentação. */
export function refreshAccess(): Promise<void> {
  inflight ??= meApi
    .access()
    .then((access) => set({ status: "ready", access }))
    .catch((err) => {
      // 401 é tratado pelo portão de sessão; aqui só registramos indisponibilidade.
      if (!(err instanceof ApiClientError && err.code === "UNAUTHENTICATED")) set({ status: "error", message: describeError(err) });
    })
    .finally(() => {
      lastFetch = Date.now();
      inflight = null;
    });
  return inflight;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/**
 * Permissões efetivas para a INTERFACE (Plano 02 §8.3). Carregando ≠ autorizado: as telas protegidas não
 * aparecem até a resposta. Atualiza ao voltar à aba, a cada minuto e quando a API nega algo por acesso.
 */
export function useAccess(): AccessStore {
  const s = React.useSyncExternalStore(subscribe, () => state, () => LOADING);
  React.useEffect(() => {
    if (state.status === "loading" || Date.now() - lastFetch > REFRESH_MS) void refreshAccess();
    startWatching();
  }, []);
  return s;
}

let watching = false;
/** Um único relógio/ouvinte por aba, por mais componentes que usem o acesso. */
function startWatching() {
  if (watching) return;
  watching = true;
  setAccessDeniedHandler(() => void refreshAccess());
  window.addEventListener("focus", () => Date.now() - lastFetch > 5_000 && void refreshAccess());
  setInterval(() => void refreshAccess(), REFRESH_MS);
}

/** Decisão de uma feature (null enquanto carrega). */
export function useFeature(key: FeatureKey): AccessDecision | null {
  const s = useAccess();
  return s.status === "ready" ? s.access.features[key] : null;
}
