"use client";

import { LiveDesk } from "./LiveDesk";
import { UnavailablePanel } from "./Unavailable";

/** Pregão ao Vivo. Painéis sem metodologia real ficam explicitamente indisponíveis. */
export function LiveDeskScreen() {
  return (
    <LiveDesk
      rail={<UnavailablePanel eyebrow="Leitura Claritas" title="Em construção" reason="A leitura do protótipo (viés, confiança, sinais) era demonstrativa. Ela volta quando houver regras determinísticas documentadas sobre os candles reais." />}
      widgets={
        <>
          <UnavailablePanel eyebrow="Sentimento" reason="Sem fonte de sentimento de mercado — não é derivável de candles." />
          <UnavailablePanel eyebrow="Fluxo líquido" reason="Fluxo institucional/varejo exige dados que a Binance Spot pública não fornece." />
          <UnavailablePanel eyebrow="Distribuição de fechamento" reason="Probabilidade de fechamento exige modelo calibrado e validado." />
          <UnavailablePanel eyebrow="Sinais-chave" reason="Aguardando o motor analítico determinístico." />
        </>
      }
    />
  );
}
