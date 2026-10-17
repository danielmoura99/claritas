"use client";

import * as React from "react";
import { Button, Icon, IconButton, type IconName } from "@/design-system";
import { meApi } from "@/lib/api/commercial";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "search", title: "Escolha o ativo", body: "Busque no topo (ex.: ETH) ou abra o seletor ao lado do nome do par." },
  { icon: "clock", title: "Ajuste o período", body: "1m a 1d no canto do gráfico. Os candles são reais e se atualizam ao vivo." },
  { icon: "book-open", title: "Leia o método", body: "A leitura ao lado mostra médias, níveis e eventos — com fórmula, sem previsão." },
];

/**
 * Onboarding curto e opcional (Plano 02 §8.4 / Etapa 8): 3 passos, pular a qualquer momento, não volta depois de
 * concluído ou dispensado (gravado na conta). Fica no canto: não cobre o gráfico nem muda o layout do Pregão.
 */
export function Onboarding() {
  const [show, setShow] = React.useState(false);
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const abort = new AbortController();
    meApi
      .onboarding(abort.signal)
      .then((o) => !abort.signal.aborted && setShow(!o.done))
      .catch(() => {});
    return () => abort.abort();
  }, []);
  if (!show) return null;
  const finish = () => {
    setShow(false);
    void meApi.completeOnboarding().catch(() => {});
  };
  const s = STEPS[step]!;
  const last = step === STEPS.length - 1;
  return (
    <aside aria-label="Primeiros passos" className="fixed bottom-14 right-4 z-40 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-lg border border-line bg-raised p-4 shadow-pop md:bottom-12"
      style={{ animation: "cl-pop var(--dur-base) var(--ease-out)" }}>
      <div className="flex items-center justify-between">
        <span className="cl-label">Primeiros passos · {step + 1}/{STEPS.length}</span>
        <IconButton icon="x" label="Pular" size="sm" onClick={finish} />
      </div>
      <div className="flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-panel text-accent"><Icon name={s.icon} size={15} /></span>
        <span className="flex flex-col gap-1">
          <span className="text-sm text-fg">{s.title}</span>
          <span className="text-xs leading-relaxed text-fg-tertiary">{s.body}</span>
        </span>
      </div>
      <div className="flex justify-end gap-2">
        {step > 0 && <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Button>}
        <Button size="sm" variant={last ? "primary" : "secondary"} onClick={() => (last ? finish() : setStep(step + 1))}>{last ? "Entendi" : "Próximo"}</Button>
      </div>
    </aside>
  );
}

/** Sinal de ativação: o primeiro gráfico com candles reais (o servidor registra uma vez por conta). */
export function useFirstChartSignal(hasCandles: boolean) {
  const sent = React.useRef(false);
  React.useEffect(() => {
    if (!hasCandles || sent.current) return;
    sent.current = true;
    void meApi.event({ name: "first_chart_viewed" });
  }, [hasCandles]);
}
