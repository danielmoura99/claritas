import { Panel } from "@/design-system";
import { SUPPORT_EMAIL } from "@/lib/auth/access-copy";

const FAQ: { q: string; a: string }[] = [
  { q: "Como consigo acesso ao terminal?", a: "Crie sua conta em Entrar: toda conta nova ganha 7 dias de teste do plano Pro (Pregão ao vivo, Scanner e Resumo do período), sem cobrança e sem cartão. Depois disso, fale com a equipe para continuar." },
  { q: "O teste vira cobrança no fim?", a: "Não. O Claritas ainda não processa pagamentos: o teste termina sozinho no 7º dia, sem renovação nem cobrança automática. Sua watchlist e preferências continuam salvas." },
  { q: "Como cancelo ou mudo de plano?", a: "Fale com o suporte. O acesso pode ser encerrado antes do prazo ou trocado por outro plano; sua watchlist e preferências ficam salvas." },
  { q: "O que é uma cortesia?", a: "Um acesso gratuito concedido pela equipe, com prazo definido. Ele aparece como cortesia em Minha conta — não é pagamento." },
  { q: "Atingi o limite de varreduras do Scanner. E agora?", a: "Os limites do Scanner são diários e voltam à meia-noite UTC (21h em Brasília). Para ampliar, fale com o suporte." },
  { q: "Os sinais são recomendação de investimento?", a: "Não. O Claritas é uma ferramenta de análise gráfica com regras descritivas e fórmulas exibidas na tela. Não executa ordens nem promete resultados." },
  { q: "De onde vêm os dados?", a: "Da Binance Spot pública (REST e WebSocket), repassados pela API Claritas. Se o feed parar, a tela mostra o estado real — nunca dados inventados." },
];

/** Ajuda e suporte (Plano 02 Etapa 8): respostas que correspondem ao funcionamento real nesta fase. */
export function HelpScreen() {
  return (
    <>
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="cl-label">Ajuda</span>
        <h1 className="m-0 text-fg" style={{ font: "var(--weight-regular) var(--display-l-size)/var(--display-l-lh) var(--font-serif)", letterSpacing: "var(--display-l-track)" }}>Perguntas frequentes.</h1>
      </header>
      <section aria-label="Perguntas frequentes" className="grid gap-2 md:grid-cols-2">
        {FAQ.map((f) => (
          <Panel key={f.q} title={f.q}>
            <p className="m-0 text-sm text-fg-secondary">{f.a}</p>
          </Panel>
        ))}
      </section>
      <section id="suporte" aria-label="Suporte" className="grid gap-2 md:grid-cols-2">
        <Panel eyebrow="Suporte" title="Fale com a equipe">
          {SUPPORT_EMAIL ? (
            <p className="m-0 text-sm text-fg-secondary">
              Escreva para <a className="text-accent" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Informe o e-mail da sua conta — nunca envie sua senha.
            </p>
          ) : (
            <p className="m-0 text-sm text-fg-secondary">O canal oficial de suporte ainda está sendo publicado. Enquanto isso, use o contato pelo qual você recebeu o convite.</p>
          )}
        </Panel>
        <Panel eyebrow="Privacidade" title="O que guardamos">
          <p className="m-0 text-sm text-fg-secondary">
            Nome, e-mail, senha protegida por hash (nunca a senha em si), sessões, watchlist, preferências e eventos de uso sem dados pessoais. Nenhum dado de cartão passa pelo Claritas. A política de privacidade completa está em elaboração.
          </p>
        </Panel>
      </section>
    </>
  );
}
