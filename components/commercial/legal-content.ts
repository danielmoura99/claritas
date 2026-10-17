import { LEGAL_VERSIONS } from "@claritas/contracts";

// Textos legais — VERSÃO PRELIMINAR redigida a partir do funcionamento real do produto (Plano 02, revisão em
// docs/LEGAL_REVIEW.md). Itens entre [colchetes] dependem de dados da empresa ainda não informados. Precisam de
// validação por advogado antes da cobrança pública. Mudou o texto → nova versão em LEGAL_VERSIONS (re-aceite).

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  slug: "termos" | "privacidade";
  title: string;
  version: string;
  summary: string;
  sections: LegalSection[];
}

const CONTROLLER = "[Razão social], inscrita no CNPJ sob o nº [CNPJ], com sede em [endereço] (\"Claritas\")";
const CONTACT = "[e-mail de contato]";

export const TERMS: LegalDocument = {
  slug: "termos",
  title: "Termos de Uso",
  version: LEGAL_VERSIONS.terms,
  summary: "As regras de uso do Claritas Terminal: o que o serviço é (e o que não é), como funcionam acesso, planos e cancelamento, e as responsabilidades de cada parte.",
  sections: [
    { title: "1. Quem oferece o serviço", paragraphs: [`O Claritas Terminal é oferecido por ${CONTROLLER}. Contato: ${CONTACT}. Ao criar uma conta, você declara ter lido e aceito estes Termos e a Política de Privacidade.`] },
    {
      title: "2. O que é o Claritas Terminal",
      paragraphs: [
        "Ferramenta de análise gráfica de mercados que exibe dados públicos de cotações (atualmente da Binance Spot) e cálculos descritivos (médias, níveis, eventos), sempre com a fórmula visível.",
        "O Claritas NÃO executa ordens, NÃO custodia ativos, NÃO administra carteiras e NÃO oferece recomendação, consultoria ou análise personalizada de investimentos. Nada no serviço é promessa de rentabilidade. Decisões de investimento são exclusivamente suas.",
        "Os dados de mercado vêm de terceiros e podem atrasar, falhar ou conter erros. Quando o fluxo de dados para, a tela mostra o estado real — nunca dados inventados —, mas o Claritas não garante a exatidão ou a continuidade dessas fontes.",
      ],
    },
    {
      title: "3. Conta e segurança",
      paragraphs: [
        "A conta é pessoal e intransferível. Você é responsável por manter a senha em sigilo e por toda atividade realizada com ela. Não compartilhe o acesso.",
        "O serviço é destinado a maiores de 18 anos.",
        "Podemos suspender ou encerrar contas em caso de violação destes Termos, uso fraudulento, compartilhamento de acesso ou risco à segurança, com registro do motivo.",
      ],
    },
    {
      title: "4. Acesso, planos e preços",
      paragraphs: [
        "O acesso às funcionalidades depende do plano ou da concessão vigente na sua conta (por exemplo: período de teste, acesso manual ou cortesia), sempre com data de término informada em Minha conta.",
        "Os preços, a periodicidade e o que cada plano inclui são exibidos na página de Planos antes da contratação. Funcionalidades ainda não existentes não são oferecidas.",
        "Fase atual: o Claritas ainda não processa pagamentos. Não há cobrança nem renovação automáticas; contratações são combinadas diretamente com a equipe. Quando a cobrança online for ativada, estes Termos serão atualizados e você será informado antes de qualquer cobrança.",
      ],
    },
    {
      title: "5. Arrependimento e cancelamento",
      paragraphs: [
        "Em contratações feitas pela internet, você pode desistir em até 7 (sete) dias a contar da contratação, com devolução integral dos valores pagos (art. 49 do Código de Defesa do Consumidor).",
        "Você pode pedir o encerramento do acesso a qualquer momento pelo suporte. Regras de reembolso proporcional para planos semestrais e anuais após o prazo de arrependimento serão informadas na contratação. [Definir política de reembolso.]",
      ],
    },
    {
      title: "6. Uso aceitável",
      paragraphs: [
        "É proibido: burlar limites técnicos ou de plano; automatizar coleta de dados (scraping) ou redistribuir os dados exibidos; tentar acessar contas, áreas ou dados de terceiros; interferir no funcionamento do serviço; usar o Claritas para fins ilícitos.",
      ],
    },
    {
      title: "7. Disponibilidade e alterações do serviço",
      paragraphs: [
        "Trabalhamos para manter o serviço disponível, mas pode haver interrupções para manutenção, falhas de fornecedores ou de fontes de dados. Não há garantia de disponibilidade contínua nesta fase.",
        "Funcionalidades podem ser alteradas. Mudanças que reduzam o que você contratou durante o período vigente não se aplicam sem a sua concordância.",
      ],
    },
    { title: "8. Propriedade intelectual", paragraphs: ["Marca, software, layout e textos do Claritas são protegidos. Você recebe uma licença pessoal, limitada e revogável de uso durante a vigência do acesso. Dados de mercado pertencem às respectivas fontes."] },
    {
      title: "9. Responsabilidade",
      paragraphs: [
        "O Claritas responde nos termos da legislação aplicável, inclusive do Código de Defesa do Consumidor. Não respondemos por decisões de investimento tomadas com base nas informações exibidas, nem por perdas decorrentes de oscilações de mercado ou de falhas de fontes de dados de terceiros.",
      ],
    },
    { title: "10. Alterações destes Termos", paragraphs: ["Ao alterarmos estes Termos, publicaremos uma nova versão com data e pediremos novo aceite quando a mudança for relevante. A versão vigente fica sempre disponível nesta página."] },
    { title: "11. Lei e foro", paragraphs: ["Aplica-se a legislação brasileira. Fica eleito o foro do domicílio do consumidor."] },
  ],
};

export const PRIVACY: LegalDocument = {
  slug: "privacidade",
  title: "Política de Privacidade",
  version: LEGAL_VERSIONS.privacy,
  summary: "Quais dados pessoais o Claritas trata, para quê, com que base legal (LGPD), com quem compartilha, por quanto tempo guarda e como você exerce seus direitos.",
  sections: [
    { title: "1. Controlador e encarregado", paragraphs: [`Controlador: ${CONTROLLER}. Encarregado pelo tratamento de dados pessoais (DPO): [nome], ${CONTACT}.`] },
    {
      title: "2. Dados que tratamos",
      paragraphs: [
        "Cadastro: nome, e-mail e senha — a senha é guardada apenas como hash criptográfico, nunca em texto.",
        "Sessão: um cookie essencial (claritas_session) com um identificador aleatório; no servidor guardamos só o hash desse identificador, datas de criação, uso e expiração.",
        "Uso do produto: ativos acompanhados (watchlist), preferências do terminal, contagem de varreduras do Scanner e eventos de uso sem dados pessoais (ex.: \"abriu o primeiro gráfico\").",
        "Acesso comercial: plano, período, origem (teste, acesso manual, cortesia) e histórico de alterações feitas pela equipe.",
        "Aceites: versão dos Termos e desta Política aceitas, com data.",
        "Registros técnicos: endereço IP e dados da requisição em registros de acesso, para segurança e para cumprir o Marco Civil da Internet.",
        "Não tratamos dados de cartão de pagamento nem dados pessoais sensíveis.",
      ],
    },
    {
      title: "3. Finalidades e bases legais (LGPD, art. 7º)",
      paragraphs: [
        "Criar e manter sua conta, autenticar e prestar o serviço contratado — execução de contrato (art. 7º, V).",
        "Segurança, prevenção de fraude e abuso, limites de uso e métricas agregadas de produto — legítimo interesse (art. 7º, IX), sem uso para perfil de marketing.",
        "Guarda de registros de acesso a aplicações por 6 meses (Marco Civil, art. 15) e registros fiscais quando houver cobrança — cumprimento de obrigação legal (art. 7º, II).",
        "Não vendemos dados pessoais e não usamos cookies de publicidade.",
      ],
    },
    {
      title: "4. Com quem compartilhamos",
      paragraphs: [
        "Com operadores que hospedam e executam o serviço, apenas no necessário: banco de dados gerenciado (Neon, na AWS em Ohio, Estados Unidos), servidor da API (Render, em Frankfurt, Alemanha) e hospedagem da interface (Vercel, rede global). Esses provedores processam dados fora do Brasil; a transferência internacional se apoia nas garantias contratuais desses provedores (LGPD, art. 33). [Anexar as cláusulas/DPA de cada provedor.]",
        "Com autoridades, quando houver obrigação legal ou ordem judicial.",
      ],
    },
    {
      title: "5. Por quanto tempo guardamos",
      paragraphs: [
        "Dados da conta: enquanto a conta existir. Após o encerramento, excluímos ou anonimizamos, salvo o que precisa ser mantido por obrigação legal.",
        "Registros de acesso: 6 meses (Marco Civil). Histórico administrativo de acesso: mantido para auditoria e defesa de direitos enquanto necessário. [Definir prazos máximos.]",
      ],
    },
    {
      title: "6. Seus direitos (LGPD, art. 18)",
      paragraphs: [
        "Confirmação e acesso aos dados, correção, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade, informação sobre compartilhamento e revisão de decisões automatizadas.",
        "Acesso e portabilidade: em Minha conta, use \"Baixar meus dados\" (arquivo JSON). Para os demais pedidos, inclusive exclusão da conta, escreva ao encarregado. Responderemos em até 15 dias.",
        "Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
      ],
    },
    { title: "7. Segurança", paragraphs: ["Senhas com hash scrypt, sessões revogáveis, cookies HttpOnly, conexões HTTPS, controle de acesso por papel com registro de auditoria imutável e limites contra força bruta. Nenhum sistema é infalível; em caso de incidente relevante, comunicaremos a ANPD e os titulares afetados (art. 48)."] },
    { title: "8. Cookies", paragraphs: ["Usamos apenas o cookie essencial de sessão (sem ele não é possível entrar). O navegador também guarda localmente preferências de exibição. Não há cookies de publicidade ou de terceiros para rastreamento."] },
    { title: "9. Alterações", paragraphs: ["Mudanças relevantes geram nova versão desta Política, com data, e novo aceite quando necessário."] },
  ],
};
