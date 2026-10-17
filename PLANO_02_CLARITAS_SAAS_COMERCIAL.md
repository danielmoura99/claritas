# CLARITAS TERMINAL — PLANO 02: SAAS, ASSINATURAS, AUTORIZAÇÃO E OPERAÇÃO COMERCIAL

> **Documento mestre de implementação, operação e continuidade entre LLMs**  
> **Versão:** 1.1 — integração com gateway próprio existente  
> **Data:** 17/10/2026  
> **Status deste documento:** PLANEJADO; implementação ainda **NÃO VERIFICADA** neste contexto  
> **Referência anterior:** `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md` (Plano 01)  
> **Salvar na raiz do repositório:** `PLANO_02_CLARITAS_SAAS_COMERCIAL.md`
> **Decisão confirmada:** o responsável **já possui um gateway de pagamento próprio, operacional em outros produtos**. O Claritas **não deve criar novo checkout, processador, motor de pagamentos ou cobrança paralela**; deve se integrar à solução existente, sobretudo por **webhooks autenticados, vínculo de cliente/assinatura e conciliação**. As especificações da integração ainda precisam ser auditadas.

---

### Histórico de revisão

- **v1.1 (17/10/2026):** decisão comercial atualizada: gateway **próprio e já existente**. Removidas as tarefas de escolher processador, desenvolver checkout/billing interno e simular um gateway alternativo. Adicionada Etapa 7 de **conexão segura com gateway existente**, auditoria de contrato, webhook validado, conciliação, correlação de usuários/planos, idempotência e testes reais. Os demais requisitos de RBAC, planos, entitlements e admin permanecem.
- **v1.0 (17/10/2026):** plano inicial de SaaS e assinaturas, anterior à confirmação da existência do gateway próprio.

---

## 0. COMO USAR ESTE DOCUMENTO — OBRIGATÓRIO PARA A LLM EXECUTORA

Este documento é autocontido o suficiente para continuar o projeto em outra conversa ou ambiente. **Não pressupõe acesso à conversa que lhe deu origem.** O usuário informou que concluiu a implementação técnica do Plano 01, colocou a aplicação em funcionamento e **já implementou login e senha**. Entretanto, **nenhum código do repositório atualizado foi fornecido nesta elaboração**. Logo, a existência, qualidade e estrutura efetivas de autenticação, banco, APIs, testes, integração Binance e design system **devem ser verificadas no código real**. Nunca confundir relato de conclusão com auditoria técnica concluída.

### Objetivo de negócio

Transformar o Claritas Terminal, atualmente uma aplicação de análise gráfica com dados reais da Binance Spot, em **produto SaaS comercializável**, com:

1. usuários autenticados e distinção segura de `USER` e `ADMIN`;
2. controle de acesso a funcionalidades por **plano**, **estado de assinatura** e **concessões individuais com prazo**;
3. gestão administrativa de clientes, planos, permissões e assinaturas;
4. experiência de autoatendimento do assinante, upgrade e cancelamento;
5. integração do **gateway próprio já existente** (externo ao Claritas), com provisionamento/revogação automática por eventos verificados e conciliação;
6. trilha de auditoria, segurança, conformidade básica e métricas de negócio;
7. **preservação integral da identidade visual Claritas** já construída.

### Ponto de partida confirmado apenas por relato do responsável

- O projeto Next.js/TypeScript está funcionando.
- Há backend Node.js/TypeScript/Fastify, PostgreSQL/Prisma e integração de dados Binance, conforme arquitetura planejada no Plano 01; **auditar a implementação real**.
- Há uma tela de login e senha **já implementada**. Não criar um segundo sistema de autenticação ou duplicar usuários.
- Existem as telas **Pregão ao Vivo**, **Scanner** e **Relatório de Fechamento**.
- O design system e os componentes visuais Claritas estão no repositório.
- **Gateway decidido:** já existe gateway próprio utilizado em outros produtos do responsável. **Ainda não foram fornecidos sua documentação, autenticação, endpoints, payloads de webhook, identificadores, mecanismo de assinatura, capacidade de recorrência e operações de consulta/cancelamento.** Investigar antes de implementar a integração; não assumir contratos não comprovados.
- Ainda não há decisão confirmada sobre planos comerciais finais, preços, regras fiscais ou prazo de teste. **Não inventar esses parâmetros como se estivessem aprovados.**

### Regras de execução

- **ETAPA 0 É BLOQUEANTE:** auditar autenticação, autorização atual, entidades Prisma, rotas Fastify, API consumida pelo frontend e design system **antes de modificar qualquer arquivo**. Gerar relatório da auditoria.
- Preservar o login atual e migrar modelos de dados **sem perda de usuários, senhas, sessões válidas, informações financeiras ou preferências**. Adotar migrações incrementais e reversíveis quando possível; fazer backup antes de mudança destrutiva.
- O **backend** é autoridade para acesso. O frontend apenas apresenta o resultado (exibir, ocultar ou bloquear controles); **não** confundir esconder botão com autorização.
- **Role não é plano**; assinatura não é entitlement; e autorização administrativa não pode ser comprada via checkout.
- Por padrão, acesso deve ser **negado se não existir regra explícita**. Endpoint novo não deve herdar acesso permissivo.
- **Não desenvolver processamento de pagamentos, checkout, cartão, antifraude, split, recorrência ou cobrança no Claritas**: essas funções pertencem ao gateway existente. Integrar somente os recursos que ele realmente expõe (link/checkout externo, consulta, webhook, cancelamento/portal quando disponíveis).
- NÃO ativar cobrança real, converter assinaturas existentes ou disparar e-mails em massa sem configuração explícita e validação apropriada. Utilizar **ambiente de teste do gateway próprio quando existir**, senão homologação com eventos de teste assinados/validados em ambiente isolado; nunca simular pagamento como se fosse confirmado em produção.
- Não reimplementar a UI com outro template nem usar os estilos-padrão do shadcn/ui para substituir os componentes Claritas.
- Criar testes antes de declarar etapas concluídas; não falsificar evidência, pagamentos, assinatura ativa ou webhook recebido.
- Implementar o máximo possível autonomamente; quando houver dependência externa real, documentá-la e continuar as etapas independentes.
- A cada etapa atualizar o **Diário de Execução (§18)** e **Handoff (§19)**; ao final validar o **Definition of Done (§20)**.

---

## 1. VISÃO DE PRODUTO E DECISÕES ARQUITETURAIS

### 1.1 O que estamos vendendo

O objeto comercial é o **acesso ao Claritas Terminal e às suas funcionalidades analíticas**, não a compra/venda de ativos. Não construir módulos de execução de ordens, custódia, gestão de carteira de terceiros ou aconselhamento personalizado regulado como parte deste plano.

A base continua sendo: gráfico com market data real, Scanner, Relatório de Fechamento e leitura analítica. Novos recursos pagos só poderão ser habilitados quando realmente existirem e funcionarem. **A cobrança não pode destravar uma promessa inexistente.**

### 1.2 Separação conceitual obrigatória

| Conceito | Responde à pergunta | Exemplo | Persistência sugerida |
|---|---|---|---|
| Identidade | Quem é a pessoa? | usuário `u_123` | `User` existente |
| Papel (`role`) | Pode administrar a plataforma? | `USER` / `ADMIN` | campo ou relação de autorização |
| Status da conta | A pessoa pode usar a conta? | `ACTIVE` / `SUSPENDED` | `User.status` |
| Plano | Qual oferta contratada? | Inicial / Pro / Premium | `Plan` |
| Assinatura | Qual vínculo comercial e ciclo de cobrança? | `TRIALING`, `ACTIVE`, `PAST_DUE` | `Subscription` |
| Feature | Qual capacidade é vendável? | `scanner.use`, `report.export` | `Feature` |
| Entitlement | Esta conta pode executar uma capacidade agora? | `scanner.use = true` | calculado no servidor |
| Limite (quota) | Quantas vezes / quanto pode usar? | 10 relatórios por mês | regras por plano + contadores |
| Concessão | Exceção autorizada e rastreável | acesso a um recurso por 14 dias | `UserFeatureOverride` / `AccessGrant` |
| Log administrativo | Quem alterou quê e por quê? | admin estendeu teste | `AdminAuditLog` |

### 1.3 Fluxos comerciais-alvo

**Assinante:** visita página de planos → cria conta ou faz login → escolhe plano → é direcionado ao **fluxo de pagamento já existente do gateway próprio**, quando sua integração estiver configurada → Claritas recebe e **valida** o evento e, se necessário, consulta o gateway → assinatura/período pago são atualizados → permissões são recalculadas → usa a ferramenta. Alteração de plano, faturas e cancelamento devem apontar para o gateway/portal existente **se essas funcionalidades estiverem disponíveis**, sem criar cobranças paralelas.

**Administrador:** faz login na conta já existente → acessa `/admin` → lista usuários → abre detalhe → visualiza status, plano, acesso e histórico → pode conceder um teste, suspender acesso ou alterar uma exceção com motivo e validade → enxerga logs e indicadores operacionais.

**MVP antecipado sem integração concluída:** admin cria ou vincula uma assinatura **manual / cortesia** com período explícito, usuário recebe acesso controlado, fluxo é testado ponta a ponta. Isso **não representa cobrança** e deve permanecer distinto de uma assinatura efetivamente paga no gateway existente.

### 1.4 Recomendações comerciais priorizadas

| Prioridade | Entrega | Por que importa |
|---|---|---|
| **P0** | RBAC e proteção de API | impede acesso indevido e escalonamento de privilégio |
| **P0** | Planos + feature flags/entitlements + quotas | permite vender camadas diferentes do mesmo produto |
| **P0** | Painel admin para usuários, plano e acesso | possibilita suporte e primeiros clientes sem intervenção no banco |
| **P0** | Estado de assinatura e ativação manual auditada | viabiliza beta comercial controlado antes do gateway |
| **P1** | Conta/assinatura do assinante e telas de upgrade | experiência mínima de produto pago |
| **P1** | **Conector para gateway próprio existente**, webhooks, status e conciliação | provisionamento automático sem reconstruir o sistema de pagamento |
| **P1** | Página de preços, aquisição e onboarding | converte visitante em assinante |
| **P1** | Auditoria e telemetria de uso/acesso | confiabilidade e suporte |
| **P2** | Cupons/campanhas, referral e afiliados | aquisição escalável depois de validar proposta de valor |
| **P2** | E-mails de ciclo de vida e recuperação de pagamento | retenção e menor churn |
| **P2** | Painel comercial com MRR/churn/coortes | medir negócio além de contas cadastradas |
| **P3** | Times, múltiplos assentos, B2B, SSO e revenda | somente se houver demanda empresarial |

---

## 2. DESIGN SYSTEM CLARITAS — CONTRATO DE NÃO REGRESSÃO

O Plano 01 definiu o visual original como fonte de verdade. Antes de criar `/admin`, `/pricing`, `/account` ou telas bloqueadas, identificar **arquivos efetivos** de tokens, fontes, componentes e layouts no repositório. Não presumir caminhos a partir deste exemplo.

### 2.1 Identidade confirmada no HTML original do Plano 01 (referência, conferir no repositório)

- Cor de fundo principal: `#0A0A0A` (`--ink-950`); painéis próximos de `#0F0F0F`; cinzas/quase preto.
- Dourado areia como **voz da análise Claritas**: `--sand-400: #C8B28E`, ligado semanticamente a `--accent`.
- Alta de mercado: tons osso/neutros; baixa: terracota dessaturada. **Não trocar por verde/vermelho neon**.
- `Geist` na interface; `Geist Mono` nos números/tabelas; `Instrument Serif` nas frases editoriais e títulos de análise.
- Sombras muito discretas e bordas finas; efeitos glow exclusivos de elementos ativos / eventos de dados.
- Animações de movimento contextual: “data moves; chrome doesn't”. Respeitar `prefers-reduced-motion`.
- Componentes existentes no protótipo incluem `Panel`, `Badge`, `CandleChart`, `TickerTape`, `SignalCard` e `ConfidenceMeter`; confirmar implementações e nomenclaturas atuais antes de reuso.

### 2.2 Regras de aplicação no módulo SaaS

- Admin deve parecer parte do **mesmo Claritas Terminal**, não outro produto.
- Usar tokens semânticos; não espalhar hexadecimais ou classes Tailwind arbitrárias repetidas.
- Criar componentes de administração reaproveitando padrões de tabela, badge, botão, modal, input, tooltip e painel existentes.
- Status de cobrança e permissões precisam de **rótulos legíveis**, não apenas cor (acessibilidade).
- A página de preços pode ter layout menos denso, mas manter a linguagem tipográfica e cromática.
- Bloqueio de feature: **overlay contextual discreto** ou tela clara de upgrade, sem impedir leitura das áreas públicas/autorizadas.
- Preservar leitura de gráficos, navegação, scrolling e performance em desktop. Testar explicitamente `1366×768`, `1440×900`, `1920×1080` e mobile sem quebra crítica.
- Registrar capturas de referência antes e depois da implementação. Não redesenhar Pregão, Scanner ou Relatório somente para acomodar faturamento.

---

## 3. ARQUITETURA-ALVO E LIMITES DE RESPONSABILIDADE

```text
Browser (Claritas / Next.js)
  ├── Terminal / Scanner / Relatórios
  ├── Conta / Meu plano / Preços
  ├── Administração (só ADMIN)
  └── Componentes do design system Claritas
           |
           | sessão/autenticação EXISTENTE
           v
Node.js / Fastify — API Claritas
  ├── Auth Adapter [reusar mecanismo atual]
  ├── RBAC / Authorize Policy (deny-by-default)
  ├── EntitlementsService (source of truth)
  ├── UsageQuotaService (limites e consumo atômico)
  ├── SubscriptionService (estado comercial)
  ├── PlanCatalogService
  ├── AdminService + AuditService
  ├── Market Data Service EXISTENTE
  ├── OwnGatewayAdapter (API/checkout externo existentes, se disponíveis)
  ├── GatewayWebhookController (eventos verificados e idempotentes)
  └── GatewayReconciliation (consulta/reprocessamento, se disponível)
           |
           v
PostgreSQL / Prisma (schema existente + migrações incrementais)
           |
           +--> **Gateway PRÓPRIO JÁ EXISTENTE** (checkout/cobrança/recorrência ficam fora do Claritas)
```

**Frontend não consulta assinatura de forma independente para conceder privilégios.** Ele usa `GET /api/me/access` para apresentar UI; backend checa cada operação real.

### 3.1 Organização sugerida — ADAPTAR AO REPOSITÓRIO

```text
/                              # raiz NEXT EXISTENTE
├── app/ ou src/app/             # preservar layout atual
│   ├── (terminal)/...
│   ├── (commercial)/pricing/
│   ├── (protected)/account/
│   └── (admin)/admin/
├── components/                 # Claritas reutilizável
│   └── commercial/             # novos elementos coerentes com Claritas
├── services/api/               # backend Fastify existente (conferir)
│   └── src/modules/
│       ├── authorization/
│       ├── entitlements/
│       ├── plans/
│       ├── subscriptions/
│       ├── billing/
│       ├── admin/
│       ├── usage/
│       └── audit/
├── packages/shared/            # apenas se a estrutura já permitir/justificar
├── prisma/                     # usar localização REAL encontrada
├── docs/
│   ├── SAAS_AUDIT.md
│   ├── SAAS_DECISIONS.md
│   ├── SAAS_ROUTES.md
│   ├── SAAS_SECURITY.md
│   ├── SAAS_RUNBOOK.md
│   └── SAAS_HANDOFF.md
└── PLANO_02_CLARITAS_SAAS_COMERCIAL.md
```

**Não mover monorepo ou duplicar Prisma por estética arquitetural.** Primeiro determinar o layout presente e minimizar mudanças.

---

## 4. AUTENTICAÇÃO, RBAC E POLÍTICA DE AUTORIZAÇÃO

### 4.1 Autenticação já existe: NÃO recriar

Auditar mecanismo real de login (biblioteca ou solução própria), sessões/cookies/JWT, persistência, expiração, rotas de logout, refresh/revogação, recuperação de senha, verificação de e-mail, tratamento de falhas e proteção contra abuso. Se existir deficiência de segurança, corrigir incrementalmente com migração segura, sem resetar senhas.

**Nunca autorizar com `userId`/`role` vindo de body, query ou header controlado pelo navegador.** Obter identidade de sessão autenticada/verificada. Se Next e Fastify usam mecanismos diferentes, definir um contrato de autenticação seguro entre ambos, respeitando cookies `HttpOnly`, `Secure`, `SameSite`, CORS e CSRF, conforme topologia efetiva.

### 4.2 Roles MVP

- `USER`: acesso à área pessoal e às features que lhe foram concedidas.
- `ADMIN`: administração de usuários/planos/assinaturas, auditoria e suporte. **Cargo não habilita automaticamente uma assinatura comercial ilimitada**. Se administrador precisa testar terminal, conceder escopo de teste explícito.
- Não criar `SUPER_ADMIN`, `MODERATOR` ou hierarquias complexas sem necessidade demonstrada.
- `ADMIN` não pode ser atribuído via formulário público, parâmetros de cadastro, querystring, localStorage, cliente ou checkout.
- Criar comando seguro de bootstrap/promover primeiro admin **somente para identidade preexistente e previamente verificada**, executado com credenciais privilegiadas no ambiente correto, com confirmação explícita do operador e log. Nunca promover automaticamente o primeiro visitante que se cadastra.
- Opcional recomendado: confirmação adicional (reautenticação e/ou MFA) para operações financeiras e de privilégios.

### 4.3 Estado da conta

`PENDING_VERIFICATION | ACTIVE | SUSPENDED | DEACTIVATED` (ajustar enum ao que existe). Suspenso/Desativado implica negação para terminal e admin; sessão deve ser invalidada/reavaliada rapidamente. Mudança de senha, logout global, exclusão e revogação de sessões devem estar protegidos.

### 4.4 Política de autorização centralizada

Função de referência:

```ts
interface AuthorizationContext {
  userId: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'PENDING_VERIFICATION';
  role: 'USER' | 'ADMIN';
}

interface AccessDecision {
  allowed: boolean;
  reason:
    | 'ALLOWED_BY_PLAN'
    | 'ALLOWED_BY_GRANT'
    | 'ADMIN_PERMISSION'
    | 'UNAUTHENTICATED'
    | 'ACCOUNT_BLOCKED'
    | 'SUBSCRIPTION_INACTIVE'
    | 'FEATURE_NOT_INCLUDED'
    | 'FEATURE_EXPLICITLY_DENIED'
    | 'QUOTA_EXCEEDED';
  expiresAt?: string;
  limit?: number;
  remaining?: number;
}

// Assinatura e feature NÃO são sinônimos de role.
authorizeAdmin(ctx: AuthorizationContext, action: string): Promise<AccessDecision>
canUseFeature(ctx: AuthorizationContext, featureKey: string): Promise<AccessDecision>
consumeQuota(ctx: AuthorizationContext, featureKey: string): Promise<AccessDecision>
```

### 4.5 Matriz de acesso inicial

| Recurso/ação | Visitante | USER sem licença | USER licenciado | ADMIN |
|---|---|---|---|---|
| Página pública de preços | sim | sim | sim | sim |
| Login / recuperar senha | sim | sim | sim | sim |
| Minha conta | não | sim | sim | sim |
| Ver status da assinatura | não | sim | sim | sim |
| Pregão ao Vivo | não | não* | conforme entitlement | conforme entitlement explícito |
| Scanner | não | não* | conforme entitlement | conforme entitlement explícito |
| Relatório de Fechamento | não | não* | conforme entitlement | conforme entitlement explícito |
| Gerenciar outros usuários | não | não | não | sim |
| Alterar plano/preços | não | não | não | sim, operação auditada |
| Dar acesso temporário | não | não | não | sim, operação auditada |
| Consultar trilha administrativa | não | não | não | sim |

\* Recursos limitados/gratuitos podem ser explicitamente liberados após decisão comercial; nunca por omissão de checagem.

### 4.6 Pontos obrigatórios de defesa

1. No Next, proteger layout/rota para UX e SSR, mas **isso não substitui a validação segura no servidor**.
2. No Fastify, exigir sessão válida e política apropriada em **todas** as rotas e métodos, não só em GET.
3. Em Server Actions e handlers Next, revalidar sessão/permissão quando atuarem como ponto de escrita/ponte para API.
4. Verificar **pertencimento dos dados** (`subscription.userId === authenticatedUser.id`, etc.); evitar IDOR / escalonamento horizontal.
5. No WebSocket de mercado (se exposto ao browser), checar autenticação/entitlement na abertura, novas subscriptions de símbolo, mudança de plano e periodicamente/na revogação. Desconectar ou restringir streams após perda de acesso; **não confiar apenas na autenticação inicial**.
6. Não expor endpoints internos ou credenciais de billing no cliente nem dar acesso direto a conexão Prisma.
7. Retornar `401` para não autenticado, `403` para autenticado sem permissão, e erro comercial padronizado para acesso expirado/limite atingido; nunca revelar dados sensíveis na resposta.
8. Usar rate limit no login, recuperação, endpoints admin, geração de vínculos/links para checkout externo, webhook do gateway próprio (sem impedir retentativas legítimas) e operações de consumo de quotas.

---

## 5. MODELAGEM DE PLANOS, FEATURES, QUOTAS E OVERRIDES

### 5.1 Catálogo inicial de features (identificadores estáveis)

| Chave técnica | Descrição | Tipo |
|---|---|---|
| `terminal.access` | Abrir terminal e receber candles | boolean |
| `terminal.timeframe.advanced` | Períodos avançados do gráfico | boolean |
| `terminal.indicators.advanced` | Indicadores técnicos avançados | boolean |
| `scanner.access` | Abrir o Scanner | boolean |
| `scanner.scan` | Executar varredura | contador por janela |
| `reports.access` | Abrir Relatório de Fechamento | boolean |
| `reports.export` | Exportar relatórios | contador por janela |
| `watchlist.max_assets` | Limite de ativos observados | quantidade |
| `alerts.max_active` | Limite de alertas configurados, **se existirem** | quantidade |
| `history.max_days` | Histórico acessível, dentro da licença da fonte | quantidade |

**ATENÇÃO:** cadastrar uma feature no catálogo **não significa** que ela já está implementada. Confirmar cada uma no código; `alerts.max_active`, exportação e timeframes avançados entram no catálogo apenas quando existentes ou em planejamento com estado `NOT_IMPLEMENTED`. Jamais cobrar por funcionalidades inexistentes.

### 5.2 Planos conceituais — SEM preço comercial aprovado

Como proposta inicial de empacotamento (ajustar após pesquisa comercial):

| Categoria sugerida | Proposta | Observações |
|---|---|---|
| Acesso inicial / Trial | Janela de teste temporal definida | duração **a decidir**, sem autorização automática indefinida |
| **Essencial** | terminal + gráfico e recursos básicos | foco em primeira compra |
| **Pro** | recursos básicos + scanner/relatórios + maior limite | provável plano principal |
| **Premium** | módulos avançados quando estiverem entregues | evitar plano vazio/de fachada |
| Cortesia/manual | conta administrada internamente com validade | **não é recebimento de pagamento** |

Nomes, preços, moedas, periodicidade, duração do teste, downgrade e grace period são **configuráveis e não aprovados neste documento**. Uma oferta configurada não pode retroativamente alterar benefícios de assinaturas antigas sem regra comercial de versionamento/contrato.

### 5.3 Regra de avaliação central (`EntitlementsService`)

1. Conta não verificada/suspensa/desativada ⇒ negar.
2. Identificar assinatura, período de validade, origem e estado de acesso; distinguir `trial`, pagamento confirmado, cortesia ou concessão administrativa.
3. Para acesso comercial recorrente, verificar **validade temporal** e política de inadimplência; não confiar apenas em `status=ACTIVE` sem conferir datas.
4. Calcular features habilitadas pelo plano vigente, com **snapshot/versionamento** apropriado dos benefícios contratados.
5. Aplicar override individual válido (`allow/deny`, com motivo, datas e autor). `DENY` explícito tem precedência sobre `ALLOW`; override positivo não deve ignorar suspensão de conta.
6. Se não houver assinatura/trial válido, não liberar acesso comercial **exceto AccessGrant válido e explícito** incluindo a feature base necessária (ex.: `terminal.access`).
7. Aplicar cotas/limites atomically; não permitir que `GET /api/me/access` debite cotas.
8. Retornar decisão tipada (`allowed`, `reason`, `expiresAt`, `remaining`) sem dados de cobrança internos.
9. Mudanças administrativas ou de cobrança invalidam caches/sessões autorizadoras com tempo máximo documentado.
10. **Admin não bypassa assinaturas automaticamente.** Permissões de admin são verificadas por `authorizeAdmin` separadamente.

### 5.4 Limites e consumo

- Usar janela temporal explícita, por exemplo **UTC diário ou mensal**, escolhida por feature (definir e documentar sem confundir fuso local e UTC).
- Leituras simples (`GET /quotes`) não devem gastar quota de scanners; cobrar/contar somente operação real que consome recurso.
- Escritas de `UsageCounter` precisam ser atômicas (transação, incremento condicional, lock ou técnica compatível com banco).
- Identificar cada consumo por `requestId`/`idempotencyKey` único para evitar dupla contagem em retries.
- Evitar cache que permita exceder quota por corrida entre instâncias.
- Quando atingido o limite, erro estável e UX amigável com botão “Ver planos”.
- Registrar métricas de consumo agregadas, evitando armazenar todos os candles/consultas do usuário sem necessidade.

---

## 6. DADOS / PRISMA — PROPOSTA CONCEITUAL, NÃO UM SCHEMA PRONTO

**O campo `User` JÁ EXISTE ou foi implementado no Plano 01. Não duplicar entidade.** Antes de escrever migrações, comparar com schema real e anotar diferenças. A estrutura abaixo é o **contrato lógico** a ser ajustado à versão instalada do Prisma e aos relacionamentos já existentes.

| Entidade | Campos relevantes | Invariantes / índices |
|---|---|---|
| `User` **existente** | `id`, `email`, `role`, `status`, timestamps | e-mail único conforme regra atual; preservar hashes e relacionamentos |
| `Plan` | `id`, `code`, `name`, `description`, `status`, `version`, datas | `code+version` único; plan immutable published/versionado ou snapshot |
| `Feature` | `id`, `key`, `name`, `type`, `isImplemented` | `key` imutável e única |
| `PlanFeature` | `planId`, `featureId`, `enabled`, `limitValue`, `window` | `(planId,featureId)` único, tipo consistente |
| `Subscription` | `id`, `userId`, `planId`/snapshot, `status`, `source`, períodos, `accessUntil`, cancelamento, `gatewayKey`, `externalSubscriptionId` | um entitlement principal ativo por usuário; regras de concorrência e renovações claras |
| `AccessGrant` | `id`, `userId`, `featureKey` ou escopo de plano, `startsAt`, `endsAt`, `reason`, `createdByAdminId`, `revokedAt` | exige duração explícita, autor e motivo; nenhum grant infinito silencioso |
| `UserFeatureOverride` | `id`, `userId`, `featureId`, `effect`, `limitValue?`, `startsAt`, `endsAt`, `reason`, `createdByAdminId`, `revokedAt` | nenhuma override sem motivo e expiração; precedência definida |
| `UsageCounter` | `userId`, `featureId`, `windowStart`, `windowEnd`, `used` | unique composta; incrementar atomicamente |
| `GatewayCustomerLink` (ou reutilizar `BillingCustomer`) | `userId`, `gatewayKey`, `externalCustomerId`, `createdAt` | vínculo verificável e exclusivo quando aplicável; sem confiar em e-mail isolado |
| `GatewayEvent` (ou reutilizar `BillingEvent`) | `gatewayKey`, `externalEventId`, `eventType`, `status`, `payloadRef?`, `receivedAt`, `processedAt`, `error`, `retryCount` | `gatewayKey+externalEventId` único quando o evento trouxer ID estável; idempotência alternativa se não trouxer; dados sensíveis redigidos |
| `PaymentReference`/`Invoice` (somente se necessário) | `subscriptionId`, `externalPaymentId`, `externalOrderId`, `amountMinor`, `currency`, `status`, `paidAt`, `periodStart`, `periodEnd` | referência espelhada do gateway; **não** emitir/capturar cobrança no Claritas; IDs externos únicos |
| `AdminAuditLog` | `actorId`, `targetType`, `targetId`, `action`, `reason`, `before`, `after`, `requestId`, `createdAt` | append-only; campos sensíveis mascarados; sem senha/token |
| `Invitation` (se necessário) | `email`, `tokenHash`, `role=USER`, `expiresAt`, `usedAt`, `createdBy` | token único, expira, uso único, sem promover ADMIN |
| `ConsentRecord` (se necessário) | `userId`, `documentType`, `documentVersion`, `acceptedAt`, `source` | trilha de aceite de termos e privacidade |

### 6.1 Enums conceituais

```ts
type Role = 'USER' | 'ADMIN';
type UserStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
type PlanStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type SubscriptionSource = 'OWN_GATEWAY' | 'MANUAL' | 'COMPLIMENTARY';
type SubscriptionStatus =
  | 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE'
  | 'CANCELED' | 'EXPIRED' | 'SUSPENDED';
type OverrideEffect = 'ALLOW' | 'DENY';
```

**Atenção importante:** o gateway próprio terá **eventos e estados que precisam ser conhecidos em sua documentação/código real**. Mapear para estado interno por `OwnGatewayAdapter`; não presumir nomes, campos ou semânticas de eventos. `CANCELED` pode significar cancelada com acesso até `currentPeriodEnd`; representar explicitamente `cancelAtPeriodEnd` e `accessUntil` na política de acesso. Uma assinatura programada para cancelamento **pode continuar ativa até o fim do período pago**. Documentar transições reais.

### 6.2 Política de integridade

- Não criar assinaturas duplicadas ativas durante redirecionamentos ou retentativas do checkout **externo**; duplicações de eventos e cliques não devem renovar duas vezes.
- Garantir unicidade de identificadores externos de assinatura/pagamento por `gatewayKey`, quando presentes, e vinculação idempotente com os IDs internos do Claritas.
- Armazenar dinheiro em unidade mínima inteira (`amountMinor`) e moeda ISO, jamais usar float para centavos.
- Assinatura manual não deve criar `Invoice` marcada como paga sem transação confirmada.
- Usar `ON DELETE RESTRICT`/soft delete em relações financeiras relevantes; exclusão/anonimização de dados somente com política de retenção adequada.
- Migrar de modo incremental, sem `prisma db push --force-reset`, `migrate reset` em produção ou drop de tabelas existentes.
- Antes de migrar: backup, plano de rollback, validação em cópia do banco e verificação de índices únicos com dados atuais.

---

## 7. INTERFACES — ADMINISTRADOR

**Rota-alvo:** `/admin`, protegida no servidor e na API. A renderização dos menus é uma conveniência, **não o controle de acesso**.

### 7.1 `/admin` — Visão geral

Exibir somente indicadores úteis e verificáveis: total de usuários, ativos com acesso válido, em teste, assinaturas vencidas, acesso por cortesia e atividades administrativas recentes. Com a integração ao gateway próprio ativa, acrescentar receita recorrente **verificada** (se houver recorrência); não fabricar MRR em cima de cortesias ou pagamentos avulsos.

### 7.2 `/admin/users` — Gestão de usuários (P0)

- Tabela paginada com pesquisa por e-mail/nome, filtro de status/role/plano e ordenação.
- Colunas sugeridas: usuário, e-mail, status, plano, assinatura, acesso efetivo, data de cadastro, último acesso **se esse dado existir**.
- Abrir detalhe de usuário; suspender/reativar com motivo; visualizar acesso efetivo.
- Admin pode configurar teste/cortesia temporária e features específicas, com expiração.
- Administradores **não podem promover qualquer pessoa a ADMIN pela tabela comum**. Criar fluxo protegido e auditado, com confirmação reforçada, se esse requisito surgir.
- Paginação no servidor; não fazer `findMany()` irrestrito de todos os usuários.
- PII mínima: e-mail e dados essenciais; nunca retornar hashes de senha, tokens ou informações sensíveis de pagamento.

### 7.3 `/admin/users/[id]` — Detalhe do usuário (P0)

- Identidade, estado da conta, sessões relevantes e eventos recentes (sem credenciais).
- Plano/assinatura, datas, modalidade (gateway/manual/cortesia) e estado efetivo do acesso.
- Quadro “Funcionalidades liberadas” com **por que** está liberado ou negado (plano, grant, override, suspensão, expiração, quota).
- Formulário de concessão individual: feature, efeito, validade início/fim, motivo obrigatório, confirmação, ator e log.
- Alteração de plano comercial pago deve ser iniciada pelo gateway próprio (quando suportado) ou tratada via suporte; no MVP manual, apontar claramente “alteração de acesso sem cobrança”.
- Timeline de alterações.
- Proteções: impedir autossuspensão e última remoção de admin sem segundo operador / fluxo seguro; proibir edição direta de hash de senha.

### 7.4 `/admin/plans` — Catálogo de planos (P0)

- Criar rascunho de plano, editar benefícios/limites e publicar versão.
- Exibir matriz plano × feature com valor permitido/limite.
- Diferenciar “não implementado” de “não incluído”; impedir oferta pública com feature inexistente.
- Publicar alteração somente após prévia de impacto para assinantes existentes; versões publicadas com contratos ativos não podem mudar silenciosamente.
- Sem preços reais, usar modo rascunho e valores a definir; só publicar preço após aprovação comercial.

### 7.5 `/admin/subscriptions` — Gestão comercial (P0/P1)

- Listagem filtrável: cliente, plano, status, fonte, início/fim, renovação, data de cancelamento.
- Ação segura para criar assinatura manual/cortesia com validade explícita.
- Estender prazo somente com motivo e trilha de auditoria.
- Com a integração ao gateway próprio ativa: ver eventos, falhas, reconciliações pendentes e IDs externos; não alterar status pago manualmente para contornar o gateway.

### 7.6 `/admin/audit` — Auditoria (P1)

Exibir ator, ação, alvo, data UTC, resumo de antes/depois, motivo e requestId. Paginação e acesso restrito a admin. Filtros por usuário/data/ação. Operações sensíveis não podem apagar o próprio log.

### 7.7 Padrões UX para admin

- Estados vazios, erro, carregamento e confirmação destrutiva.
- Badge de status com texto e cor coerentes com Claritas.
- Limites de largura para tabelas e fallback mobile.
- Acessibilidade de teclado, foco, contraste e `prefers-reduced-motion`.
- Opção de visualização **somente leitura** do estado efetivo das permissões antes de qualquer alteração.

---

## 8. INTERFACES — ASSINANTE E AQUISIÇÃO

### 8.1 `/account` e `/account/subscription` (P1)

- Dados básicos da conta e ações de segurança já existentes (reutilizar).
- Plano atual, benefícios liberados, limitações, status de assinatura, `accessUntil`, próxima renovação quando aplicável.
- Mostrar quando o acesso for cortesia, sem criar impressão de pagamento efetuado.
- Link para o **checkout/portal de assinante já existente no gateway próprio**, quando disponível; nunca coletar ou armazenar número completo de cartão/CVV no Claritas.
- Cancelamento com confirmação, data efetiva e feedback. **Delegar o cancelamento financeiro ao gateway existente** quando houver API/portal; se não houver, direcionar ao atendimento e não fingir que a cobrança recorrente foi cancelada. Respeitar política acordada de término do período pago.
- Possibilidade de atualizar e-mail/senha apenas segundo mecanismo de autenticação atual e verificações adequadas.

### 8.2 `/pricing` (P1)

- Design Claritas, tabela concisa de benefícios **reais**, periodicidade e preço somente após decisão aprovada.
- CTA contextual “Assinar”, “Experimentar”, “Falar com suporte” conforme funcionalidade disponível.
- Estado de pagamento pendente/erro/sucesso; disponibilizar **redirecionamento/link para checkout já existente** só quando o vínculo comercial e a integração estiverem configurados.
- Não gerar assinatura paga com base em redirect da página de sucesso do gateway existente. Confirmação é **server-side**, a partir de evento verificado e, quando necessário, consulta autenticada ao gateway.
- Exibir transparência de cobrança recorrente, periodicidade, cancelamento e condições.

### 8.3 Paywall/FeatureLock (P0)

Criar componente `FeatureGate`/`FeatureLock` reutilizável, com:

- obtenção de permissões efetivas via `GET /api/me/access`;
- distinção entre `NEEDS_LOGIN`, `UPGRADE_REQUIRED`, `TRIAL_EXPIRED`, `ACCOUNT_SUSPENDED`, `QUOTA_REACHED`, `FEATURE_UNAVAILABLE`;
- ações apropriadas por caso;
- comportamento SSR/CSR sem flashes indevidos de premium (não considerar loading como authorized);
- integração com telas já existentes sem alterar design dos gráficos.

**Ao clicar em recurso bloqueado, a API também deve negar sua execução.** Se houver API direta de `scanner`, exportações, relatórios e streams, proteger uma por uma.

### 8.4 Onboarding comercial (P1)

Na primeira utilização, orientar escolha de ativo/timeframe, uso do gráfico e benefício claro do produto. Evitar tours longos: máximo poucos passos opcionais, pular e retomar. Coletar sinal de ativação (ex.: primeiro gráfico aberto) sem rastrear informação financeira sensível desnecessária.

---

## 9. INTEGRAÇÃO COM O GATEWAY PRÓPRIO EXISTENTE — SEM REIMPLEMENTAR PAGAMENTOS

### 9.1 Decisão aprovada e fronteira entre sistemas

**Decisão confirmada pelo responsável em 17/10/2026:** já existe **um gateway de pagamento próprio em produção para outros produtos**. A equipe Claritas **NÃO deve desenvolver um novo gateway, processador de cartões, módulo de cobrança recorrente, split, antifraude ou checkout próprio**. Toda cobrança e operações financeiras permanecem no gateway já desenvolvido. A responsabilidade do Claritas é **vincular clientes/planos e refletir pagamentos validados em entitlements**.

| Sistema | É responsável por | Não deve fazer |
|---|---|---|
| **Gateway próprio existente** | checkout/pagamento/recorrência/estorno/cancelamento financeiro, conforme capacidades reais | atribuir `role=ADMIN`, decidir permissão de recurso interno ou acessar Prisma do Claritas |
| **Claritas API / Fastify** | mapear IDs externos, receber e validar webhooks, normalizar eventos, conciliar, atualizar assinaturas e liberar/revogar acesso via EntitlementsService | capturar cartões, criar pagamentos paralelos, confiar em sinal vindo diretamente do navegador |
| **Claritas frontend / Next.js** | exibir planos, abrir link/checkout externo, mostrar estado real de assinatura e recursos, dar feedback de pendência | alterar assinatura por `success_url`, receber segredo do gateway ou conceder acesso pelo cliente |

**Não confundir “temos gateway próprio” com “já sabemos o contrato de integração”.** São necessários documentação ou acesso autorizado ao código/API reais antes da implementação final. Não presumir que existem endpoints REST, assinatura HMAC, recorrência automática, links públicos ou sandbox.

### 9.2 Auditoria do gateway — tarefa obrigatória antes da integração

Gerar `docs/OWN_GATEWAY_INTEGRATION_AUDIT.md` e registrar o seguinte, com evidências do sistema externo:

1. URL/base de API, domínios autorizados, ambientes DEV/STAGING/PROD e credenciais **apenas pelos nomes das variáveis**, nunca valores.
2. Como iniciar uma compra **aproveitando o checkout existente**: URL com sessão criada pelo gateway, API de link de pagamento, portal do produto, ou procedimento manual. Se não houver integração programável, registrar lacuna; **não desenvolver um checkout alternativo**.
3. Quais identificadores existem e quais são estáveis: cliente, pedido, pagamento, assinatura, produto/plano, evento e período pago.
4. Como o gateway sabe a qual usuário Claritas atribuir o pagamento: `claritasUserId`/`externalReference`/metadata/ID de vínculo, com tratamento de cadastro por e-mail divergente e prevenção de associação indevida.
5. Quais eventos efetivamente existem: pagamento confirmado, pendente, recusado, renovação, cancelamento, expiração, estorno, chargeback, alteração de plano e outros; mapear apenas os suportados.
6. Como validar autenticidade: assinatura de payload bruto, segredo compartilhado, mTLS, consulta autenticada ao gateway ou outro método documentado; verificar replay/janela de timestamp se aplicável. **Nunca aceitar apenas um token escolhido pelo browser nem somente IP de origem como prova suficiente.**
7. Formato real dos payloads, ordem/reentrega, garantia de IDs, timeout, política de retry, existência de endpoint para consulta de transação/assinatura e disponibilidade de ambiente de teste.
8. Modelo de recorrência no gateway: se o plano é periódico, se pagamento de renovação emite evento, se o gateway controla `currentPeriodEnd`, como tratar pagamentos avulsos e qual é o sistema-fonte de validade.
9. Como executar alteração de plano, cancelamento, estorno, emissão de recibo/documento fiscal (se houver), reembolso e portal de cobrança; **não atribuir ao Claritas operações que o gateway não suporta**.
10. Códigos de erro e SLAs de reconsulta/reprocessamento. **Sem documentação suficiente, concluir as partes independentes e registrar etapa 7 como BLOQUEADA POR CONTRATO EXTERNO**, não reconstruir funções desconhecidas.

### 9.3 Contrato do conector (somente métodos realmente existentes)

Implementar adaptador isolado `OwnGatewayAdapter` com interfaces normalizadas; não inventar endpoints concretos. A assinatura de métodos abaixo é um **contrato conceitual** e métodos opcionais só devem ser implementados quando o gateway os oferecer.

```ts
type GatewayEventKind =
  | 'PAYMENT_CONFIRMED' | 'PAYMENT_FAILED' | 'PAYMENT_PENDING'
  | 'SUBSCRIPTION_RENEWED' | 'SUBSCRIPTION_CANCELED'
  | 'SUBSCRIPTION_EXPIRED' | 'PAYMENT_REFUNDED' | 'CHARGEBACK'
  | 'UNKNOWN';

interface NormalizedGatewayEvent {
  gatewayKey: 'OWN_GATEWAY';
  eventId: string; // real ID de evento ou chave deduplicadora definida e auditada
  kind: GatewayEventKind;
  occurredAt: string;
  customerExternalId?: string;
  subscriptionExternalId?: string;
  orderExternalId?: string;
  paymentExternalId?: string;
  externalReference?: string; // referência criada pelo Claritas e vinculada no servidor
  planExternalId?: string;
  amountMinor?: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
}

interface OwnGatewayAdapter {
  verifyAndNormalizeWebhook(rawBody: Buffer, headers: Record<string, string | undefined>):
    Promise<NormalizedGatewayEvent>;
  getPayment?(externalPaymentId: string): Promise<NormalizedGatewayPayment>;
  getSubscription?(externalSubscriptionId: string): Promise<NormalizedGatewaySubscription>;
  createCheckoutLink?(input: {
    userId: string;
    externalReference: string;
    gatewayProductOrPlanId: string;
    idempotencyKey: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; externalReference: string }>;
  getCustomerPortalUrl?(externalCustomerId: string): Promise<string>;
  requestCancellation?(externalSubscriptionId: string, atPeriodEnd: boolean): Promise<void>;
}
```

**Não inferir que `getPayment`, `createCheckoutLink` ou `requestCancellation` existam.** `NormalizedGatewayPayment`/`NormalizedGatewaySubscription` são DTOs internos a definir somente após examinar os contratos reais. O backend só aceita planos/códigos de produtos presentes em **mapeamento administrativo confiável**, jamais `planId`/preço enviados livremente pelo usuário.

### 9.4 Fluxo operacional de assinatura paga (caminho feliz)

```text
Usuário logado escolhe um plano publicado no Claritas
  -> Claritas cria intenção/vínculo pendente (IDs internos + externalReference não adivinhável)
  -> Obtém link/sessão no GATEWAY JÁ EXISTENTE (se suportado)
  -> Usuário conclui pagamento no checkout EXTERNO
  -> Gateway envia webhook ao Fastify
  -> Fastify autentica evento e valida a integridade do payload
  -> Persiste evento/ID externo idempotentemente
  -> Resolve a referência para usuário e plano corretos
  -> (Se necessário/possível) confirma transação pela API autenticada do gateway
  -> Transação no PostgreSQL atualiza estado e período pago da assinatura
  -> Invalida cache de permissões e registra auditoria
  -> GET /api/me/access retorna novos entitlements
  -> UI passa a liberar recursos sem confiar no redirect do checkout
```

Se o gateway não permitir criação de sessão/link via API, o plano pode apresentar **apenas link seguro de compra ou procedimento de vinculação comprovado**; não criar um endpoint fictício. Para o estado de compra pendente, usar exibição de processamento/atualização por polling do **Claritas API** e nunca assumir compra aprovada.

### 9.5 Webhook: segurança, transações e idempotência (obrigatório)

- Rota proposta: `POST /api/integrations/own-gateway/webhook` (Fastify, sem sessão de usuário, **mas autenticada pelo mecanismo real do gateway**). Evitar rota pública genérica com `:provider` desnecessário.
- Verificar assinatura/autenticidade no **corpo bruto** quando aplicável; usar comparação segura, controle de timestamp/replay se o protocolo fornecer, limites de tamanho, timeout, rate limit e segredo separado por ambiente.
- **Se não houver assinatura confiável**, não ativar assinaturas com base somente no payload. Exigir confirmação ativa pela API segura do gateway ou outro mecanismo comprovável e documentado. Se a verificação não puder ser feita, manter `PENDING_REVIEW`, registrar bloqueio e alertar admin.
- **IDs externos não são identidade de usuário**: resolver vínculo previamente cadastrado (`externalReference`, `customerExternalId`, `subscriptionExternalId`, IDs de compra), exigir coerência de produto/plano/valor/moeda e usar conferência manual para eventos sem correspondência; não liberar acesso por mero e-mail no payload.
- Persistir um **inbox de eventos** (`GatewayEvent`) durável, com chave única (`gatewayKey`, `eventId`) ou estratégia equivalente documentada. Duplicatas devem retornar ACK sem reaplicar efeitos; eventos inválidos não alteram o banco.
- Receber `2xx` somente após **persistência durável** que viabilize processamento posterior; em falhas transitórias de gravação responder status passível de retry. Implementar reprocessamento seguro com backoff e limite de tentativas, sem depender de fila distribuída inicialmente.
- Não presumir ordem de entrega. Correlacionar `occurredAt`, versão/estado atual no gateway e período afetado; um evento atrasado **não pode reativar acesso cancelado/estornado** nem reduzir inconsistemente uma renovação válida.
- Para confirmação real, gravar pagamento externo e intervalo `paidFrom`/`paidThrough` (ou datas equivalentes verificadas), renovar/ativar o `Subscription` e invalidar permissões. **Nunca aceitar como pagamento efetivado** evento `PENDING`, página `success`, clique em botão ou objeto sem status final comprovado.
- Reembolso/chargeback/suspensão: calcular efeitos para o **pagamento e período correspondentes**, registrar reversão auditável e política de acesso definida; não apagar histórico.
- Cancelamento de renovação automática pode manter acesso até `accessUntil` efetivamente pago; **não revogar simplesmente pela palavra CANCELED** sem a semântica do gateway.
- Não armazenar dados completos de cartão, CVV, segredos de autenticação ou payload sensível em logs. Proteger a persistência de evidências e restringir leitura a admin autorizado.
- Operações externas lentas não devem ficar dentro da transação Prisma. Erros de negócio previsíveis geram pendência visível no painel admin e não uma liberação tácita.

### 9.6 Conciliação e recuperação operacional

1. Se o gateway oferecer consulta autenticada, implementar `reconcileSubscription` e `reconcilePayment` por ID externo, reconciliando com períodos e status internos. Executar agendamento moderado + botão administrativo auditado de reconsulta.
2. Na ausência de API de consulta, registrar o gap e configurar trilha de pendências/manual review com evidências verificadas; não inventar transações/renovações. O fluxo automático completo fica condicionado à integração real.
3. Reprocessar eventos que falharam após persistência, com proteção de duplicidade e limite de tentativas; monitorar atraso desde `receivedAt` até `processedAt`.
4. Criar visão em `/admin/integrations/payments` para status do conector, eventos sem vínculo, falhas, reprocessamentos, pagamentos confirmados, conciliações e referência externa (sem segredos).
5. Disponibilizar runbook `docs/OWN_GATEWAY_RUNBOOK.md`: configurar webhook, rotação de segredo, eventos ausentes, chargeback, conciliação, rollback e incidentes.
6. Se gateway oferecer apenas pagamentos avulsos, **não chamar isso de cobrança recorrente automatizada**. A renovação de acesso só ocorre após pagamento confirmado correspondente ao novo período.

### 9.7 Testes de integração obrigatórios

Em ambiente de **teste do gateway próprio** (se disponível), ou com fixtures de eventos **produzidas a partir do contrato real e assinadas pelo mesmo mecanismo** em staging:

- Pagamento confirmado vinculado ao usuário/plano correto => acesso liberado até a data paga.
- Pagamento pendente/recusado => nenhuma ativação.
- Webhook sem autenticação válida ou com assinatura adulterada => nenhuma ativação.
- Replay/duplicata => **um único lançamento de evento/pagamento** e mesmo estado final.
- Entrega fora de ordem => estado e período corretos, sem regressão.
- Evento para usuário desconhecido, plano errado, valor/moeda divergente => pendência/erro, sem acesso.
- Renovação legítima => amplia `accessUntil` uma vez; renovação repetida não estende duas vezes.
- Estorno/chargeback => aplicação correta da política aprovada e trilha de auditoria.
- Cancelamento ao fim do período versus cancelamento imediato => semântica exata documentada.
- Webhook com falha de DB => retry/reprocessamento sem perda nem efeito duplo.
- Falha ou indisponibilidade do gateway => Claritas mantém funcionamento do terminal para acessos previamente válidos e não inventa pagamentos novos.

**Nunca executar pagamentos reais de teste ou conectar chaves de produção sem aprovação explícita.** Se não houver ambiente de testes, tratar integração como pendente de validação real mesmo com testes locais passando.

### 9.8 Variáveis de ambiente (nomes sugestivos; adaptar à integração real)

```env
OWN_GATEWAY_ENV=staging
OWN_GATEWAY_API_BASE_URL=
OWN_GATEWAY_API_KEY=
OWN_GATEWAY_WEBHOOK_SECRET=
OWN_GATEWAY_CHECKOUT_BASE_URL=
OWN_GATEWAY_WEBHOOK_ENABLED=false
```

O arquivo `.env.example` contém **apenas nomes e descrições**. Não expor segredos no Next.js (`NEXT_PUBLIC_*`), logs, repositório ou mensagens a outra LLM. Os campos não utilizados pelo gateway (por exemplo, HMAC ou API de consultas) **não devem ser exigidos ficticiamente**. Segredos de produção e staging separados.

### 9.9 Decisões comerciais ainda pendentes — NÃO inventar

- Nomes, preços, moedas e versionamento das ofertas; mapeamento `ClaritasPlan <-> GatewayProductOrPlan`.
- Ciclo de cobrança existente no gateway: recorrência real versus pagamento avulso; regras de vigência e renovação.
- Trial, carência de inadimplência, notificação, bloqueio, downgrade/upgrade, pró-rata (se o gateway oferecer), renovação e cancelamento.
- Regras de estorno, chargeback, recuperação e contato de suporte; portal do assinante existente ou atendimento manual.
- Aspectos fiscais/contratuais, marca/razão social vendedora e licença comercial de exibição dos dados Binance.

**Não codificar valores ou prazos definitivos. O gateway está escolhido; o que falta definir é seu CONTRATO DE INTEGRAÇÃO, não um novo fornecedor.**

## 10. ENDPOINTS DE API (CONTRATO INICIAL)

Use prefixos/versionamento compatíveis com as rotas Fastify **já existentes**. Não duplicar se endpoints equivalentes já estiverem presentes. Especificar requests/responses em Zod/OpenAPI e manter DTOs sem PII desnecessária.

### 10.1 Usuário logado

| Método | Endpoint sugerido | Autorização | Objetivo |
|---|---|---|---|
| GET | `/api/me` | autenticado | identidade resumida, papel e status |
| GET | `/api/me/access` | autenticado | snapshot de features, quotas e motivos de bloqueio |
| GET | `/api/me/subscription` | autenticado | plano/assinatura apenas do próprio usuário |
| GET | `/api/plans/public` | público | ofertas publicadas e realmente vendáveis |
| POST | `/api/me/billing/checkout-link` | autenticado | **obter vínculo/link do checkout já existente no gateway próprio, somente se API suportada** |
| POST | `/api/me/subscription/cancel-request` | autenticado | solicitar cancelamento **via API do gateway próprio se suportado**; caso contrário, orientar fluxo externo/suporte sem alterar cobrança |

### 10.2 Administração

| Método | Endpoint sugerido | Regra |
|---|---|---|
| GET | `/api/admin/summary` | ADMIN |
| GET | `/api/admin/users` | ADMIN, paginação/filtros |
| GET | `/api/admin/users/:id` | ADMIN |
| PATCH | `/api/admin/users/:id/status` | ADMIN, motivo e log |
| GET | `/api/admin/users/:id/access` | ADMIN |
| POST | `/api/admin/users/:id/grants` | ADMIN, motivo + expiração + log |
| POST | `/api/admin/users/:id/overrides` | ADMIN, motivo + expiração + log |
| DELETE | `/api/admin/users/:id/grants/:grantId` | ADMIN, revogação auditada (soft) |
| GET | `/api/admin/plans` | ADMIN |
| POST | `/api/admin/plans` | ADMIN, rascunho |
| POST | `/api/admin/plans/:id/publish` | ADMIN, validação/versionamento |
| GET | `/api/admin/subscriptions` | ADMIN |
| POST | `/api/admin/subscriptions/manual` | ADMIN, cortesia/manual sem fake pagamento |
| GET | `/api/admin/audit` | ADMIN, paginação |
| GET | `/api/admin/integrations/payments` | ADMIN, eventos/pendências do gateway próprio |

### 10.3 Webhooks e sistema

- `POST /api/integrations/own-gateway/webhook` — público apenas no sentido de **sem sessão de usuário**; exige autenticação/verificação real do gateway próprio e persistência idempotente.
- `GET /api/health` — mínimo, sem expor configuração/dados de clientes.
- Endpoints existentes de candles/quotes/Scanner/Relatórios: **adicionar enforcement específico** de autenticação, recurso e quota (se aplicável).
- Cada endpoint tem testes para 401, 403, usuário certo, outro usuário, acesso expirado e resposta autorizada.

### 10.4 Exemplo de resposta de acesso

```json
{
  "userId": "u_example",
  "role": "USER",
  "accountStatus": "ACTIVE",
  "subscription": {
    "status": "ACTIVE",
    "source": "MANUAL",
    "planCode": "pro",
    "accessUntil": "2026-11-17T23:59:59.000Z"
  },
  "features": {
    "terminal.access": { "allowed": true, "reason": "ALLOWED_BY_PLAN" },
    "scanner.access": { "allowed": true, "reason": "ALLOWED_BY_PLAN" },
    "reports.export": { "allowed": false, "reason": "FEATURE_NOT_INCLUDED" },
    "scanner.scan": {
      "allowed": true,
      "reason": "ALLOWED_BY_PLAN",
      "limit": 50,
      "remaining": 32
    }
  }
}
```

**Exemplo didático:** valores e períodos acima não são preço/plano/contrato aprovado nem prova de uma assinatura real. Em produção, usar payload filtrado e não confiar nele para validar ações no backend.

---

## 11. IMPLEMENTAÇÃO POR ETAPAS — ORDEM DE EXECUÇÃO E CRITÉRIOS DE ACEITE

### ETAPA 0 — Auditoria do repositório (BLOQUEANTE)

**Objetivo:** conhecer precisamente o Claritas que já funciona, sem começar por suposições.

Tarefas:

- [ ] Ler Plano 01 e este Plano 02 na íntegra.
- [ ] Inspecionar árvore do projeto, package manager, scripts, `package.json`, `tsconfig`, deploy e variáveis usadas (somente **nomes**, sem expor segredos).
- [ ] Localizar e entender login existente: provider/library, cookies/JWT, sessão, persistência, logout, verificação de e-mail, recovery.
- [ ] Inspecionar Prisma schema/migrations/índices reais, existência de usuários e ambientes.
- [ ] Inspecionar rotas Fastify e autorização atual, incluindo WebSockets/canais de market data.
- [ ] Inventariar design system e telas existentes. Registrar screenshots baseline em resoluções acordadas.
- [ ] Identificar o que já existe de gestão de usuários, planos, cobrança e administração para **não duplicar**.
- [ ] Avaliar riscos de migração, necessidade de backup, compatibilidade de versões, exposição de APIs e contratos.
- [ ] Produzir `docs/SAAS_AUDIT.md`, com matriz EXISTE / FALTA / AJUSTAR / DESCONHECIDO.
- [ ] Atualizar `docs/SAAS_DECISIONS.md` e a execução §18.

**Aceite:** nenhuma alteração estrutural antes de existir inventário verificável de auth, schema e design system; arquitetura proposta reconciliada com arquivos reais.

### ETAPA 1 — Hardening do login existente + roles

- [ ] Aproveitar sistema de autenticação atual; não criar login paralelo.
- [ ] Adicionar `role` e `status` ao usuário existente com backfill seguro (`USER` como padrão para contas comuns).
- [ ] Criar `authorizeAdmin` e `requireAuthenticatedUser` no backend; testes de identidade não forjável.
- [ ] Criar bootstrap seguro para primeiro admin, com identidade previamente verificada e confirmação operacional.
- [ ] Proteger `/admin` e rotas de administração no servidor, inclusive chamadas diretas.
- [ ] Validar sessão suspensa/desativada, logout/revogação, segurança de cookies e CSRF/CORS conforme implantação atual.
- [ ] Testar attempts de escalar role, editar outro usuário e acessar API de admin sem role.

**Aceite:** `USER` recebe 403 nas APIs admin; `ADMIN` autorizado consegue acesso; quem está suspenso não usa terminal/admin; sem novo login duplicado e sem perda de usuários.

### ETAPA 2 — Prisma comercial + migrações

- [ ] Modelar `Plan`, `Feature`, `PlanFeature`, `Subscription`, grants/overrides, quota, auditoria e estruturas para **IDs/vínculos/eventos do gateway próprio**; sem implementar cobrança.
- [ ] Definir status, datas, origem, estados de cancelamento e unicidade.
- [ ] Elaborar migrações incrementais, checar impacto com dados reais, criar backup/rollback.
- [ ] Criar sementes idempotentes **apenas** do catálogo interno, sem assinaturas pagas ou administradores automáticos.
- [ ] Criar fixtures e factories de teste segregadas dos dados reais.
- [ ] Verificar transações e integridade sob concorrência.

**Aceite:** migração segura em staging, usuários preservados, constraints verificadas; esquema explicável e testável.

### ETAPA 3 — Motor de entitlement/quotas e enforcement

- [ ] Implementar `EntitlementsService`, precedência e motivo por decisão.
- [ ] Implementar `GET /api/me/access` com apenas dados autorizados.
- [ ] Integrar autorização por feature em terminal, Scanner, Relatório e APIs correspondentes.
- [ ] Proteger WebSockets/canais ativos, incluindo revogação após downgrade/suspensão/expiração.
- [ ] Implementar quotas com consumo transacional e idempotente apenas para recursos que realmente existem.
- [ ] Atualizar frontend com `FeatureGate`/`FeatureLock` usando o design system Claritas.
- [ ] Testar expiração real de acesso, override `DENY`, grant pontual, cache e paralelismo.

**Aceite:** não há bypass por URL, chamada API direta ou WebSocket; controles de UI e backend concordam; quotas não permitem consumo além do limite em corrida.

### ETAPA 4 — Painel administrativo de usuários

- [ ] Criar `/admin` e `/admin/users` no visual original.
- [ ] Criar busca, filtros, paginação, status, perfil e detalhamento do acesso efetivo.
- [ ] Permitir suspender/reativar, conceder trial/cortesia temporária e feature override por usuário, com motivo e validade.
- [ ] Registrar `AdminAuditLog` em operações sensíveis; conferir integridade do autor.
- [ ] Criar confirmação para revogações e evitar escalonamento via edição do payload.
- [ ] Testar UI responsiva, navegação e regressão visual.

**Aceite:** admin gerencia contas sem SQL manual; USER nunca vê dados de outros clientes; log e estados de acesso refletem mudanças reais.

### ETAPA 5 — Catálogo de planos + assinaturas manuais

- [ ] Criar `/admin/plans` com recursos, limites e publicação/versionamento.
- [ ] Criar `/admin/subscriptions` e ações de concessão manual/cortesia com prazo.
- [ ] Definir políticas para troca de plano sem cobrança e expiração automática.
- [ ] Implementar job/processo de verificação de validade **ou** enforcement temporal a cada autorização (ambos podem coexistir; job não é única defesa).
- [ ] Configurar visualização de status sem fazer parecer que uma cortesia é pagamento.
- [ ] Cobrir transições com testes: novo, ativo, trial, expirado, suspenso, revogado.

**Aceite:** admin concede acesso por 1 período definido; após expirar o backend nega recurso mesmo que job não rode; não há fatura paga fictícia.

### ETAPA 6 — Minha conta, planos e upgrade contextual

- [ ] Criar `/account/subscription` com acesso efetivo, benefícios e datas.
- [ ] Criar `/pricing` com planos **publicáveis apenas quando preço/benefícios estiverem aprovados**.
- [ ] Integrar CTA de upgrade às features bloqueadas de forma discreta e consistente.
- [ ] Garantir que cliente nunca consiga editar role, status de pagamento ou dados de outra conta.
- [ ] Definir estados de carregamento/erro e testes E2E.

**Aceite:** usuário entende o que possui, o que falta e como desbloquear; se o conector ao gateway ainda não estiver configurado, não oferecer checkout fictício; quando configurado, apontar para o checkout existente.

### ETAPA 7 — Integrar gateway próprio EXISTENTE (CONTRATO EXTERNO A AUDITAR)

- [ ] **Auditar documentação/código autorizados do gateway já usado em outros produtos**, conforme §9.2, e registrar `docs/OWN_GATEWAY_INTEGRATION_AUDIT.md`. Não escolher nem implementar uma processadora alternativa.
- [ ] Identificar checkout/link **já existentes**, identificadores de cliente, pedido, pagamento, assinatura, evento, recorrência e status de API.
- [ ] Definir e persistir vínculo verificável entre usuário/plano Claritas e IDs/metadata do gateway, sem confiar apenas em e-mail.
- [ ] Implementar `OwnGatewayAdapter` apenas para operações confirmadas pelo contrato externo; não criar checkout/cartão/recorrência internos.
- [ ] Implementar rota webhook dedicada, autenticação confiável, payload validado, armazenamento de evento durável e idempotência.
- [ ] Implementar confirmação e sincronização de pagamento/período de vigência; renovação apenas com evento confirmado real.
- [ ] Implementar reprocessamento e conciliação com API existente quando disponível, com fila simples/pendências auditadas caso necessário.
- [ ] Tratar pagamento pendente/recusado, renovação, cancelamento, estorno e chargeback conforme **eventos realmente expostos** pelo gateway; documentar lacunas.
- [ ] Integrar frontend ao checkout/portal **externos existentes** se disponíveis. Caso contrário, orientar suporte/manual sem falsear automação.
- [ ] Criar painel de eventos/pendências e runbook operacional; usar segredos separados por ambiente.
- [ ] Testar as matrizes de §9.7 em sandbox do gateway, ou staging com fixtures assinadas que respeitem o contrato real.
- [ ] Aprovar política comercial, fiscal e permissões de publicação antes de ativar cobrança em produção.

**Aceite:** evento comprovado de pagamento real do gateway próprio habilita o plano/intervalo corretos; evento falso, duplicado ou fora de ordem não altera indevidamente acesso; cancelamento/estorno refletem regra aprovada. **O gateway está escolhido**, mas a etapa fica **BLOQUEADA POR DOCUMENTAÇÃO/ACESSO/VALIDAÇÃO EXTERNOS** somente se os contratos ou ambientes necessários forem indisponíveis. Não recriar gateway nem marcar integração concluída por mocks.

### ETAPA 8 — Onboarding, suporte e notificações (P1/P2)

- [ ] Criar onboarding curto contextual, retomável e sem poluição visual.
- [ ] Criar estado “teste chegando ao fim”, “pagamento pendente/falhou”, “acesso bloqueado” com mensagens claras.
- [ ] Definir provedor transacional de e-mail apenas quando necessário.
- [ ] Criar estrutura para notificações de boas-vindas, renovação, alerta de expiração e recuperação sem spam, respeitando consentimento/legalidade.
- [ ] Adicionar link de suporte e FAQ de assinatura/cancelamento.

**Aceite:** mensagens coerentes com estado verdadeiro; não enviar e-mails não solicitados nem mostrar preço/status inventados.

### ETAPA 9 — Métricas comerciais e de adoção (P2)

- [ ] Instrumentar eventos: `signup_completed`, `first_chart_viewed`, `scanner_used`, `trial_started`, `subscription_activated`, `upgrade_clicked`, `subscription_canceled`, com identificação minimizada.
- [ ] Medir usuários ativos, ativação, uso por feature, taxa de teste→pago, churn.
- [ ] Calcular MRR/ARR **somente com base em assinaturas realmente recorrentes e pagas no gateway próprio, reconciliadas**, excluindo pagamento avulso, cortesia, duplicatas e períodos de teste.
- [ ] Criar dashboards agregados em `/admin` e relatórios exportáveis quando justificado.
- [ ] Definir coortes e regras de cancelamento; não misturar “usuário cadastrado” com “assinante pagante”.

**Aceite:** métricas rastreáveis a dados reais e fórmulas documentadas; eventos não vazam dados bancários/cookies.

### ETAPA 10 — Segurança, privacidade, testes e preparação para lançamento

- [ ] Testes de autorização vertical/horizontal, IDOR, CSRF, sessão, token, rate limit, **webhook próprio** (autenticidade/replay/idempotência), quotas e WS.
- [ ] Validar integrações com Binance e design atual sem regressão.
- [ ] Verificar logs (sem segredos), observabilidade, alertas e backups.
- [ ] Criar runbook de suporte: como bloquear usuário, reverter grant, conciliar com gateway próprio, lidar com contestação e incidente.
- [ ] Confirmar termos de uso, política de privacidade, LGPD, retenção, cancelamento, direito de arrependimento quando aplicável, emissão fiscal e licença de exibição/redistribuição de market data. Encaminhar temas jurídicos/contábeis para validação especializada antes de cobrança pública.
- [ ] Executar lint, tsc, testes, build, E2E e capturas de regressão visual.
- [ ] Fazer checklist de configuração de secrets, HTTPS, ambiente de staging e produção.
- [ ] Preparar rollout por feature flag, backup e rollback.

**Aceite:** Definition of Done do §20 comprovado; ambiente de produção só com serviços externos/configuração legal aprovados.

---

## 12. TESTES DE NEGÓCIO E SEGURANÇA — MATRIZ MÍNIMA

| Cenário | Resultado esperado |
|---|---|
| Usuário sem login acessa `/admin` | redirecionamento/401 na UI e API nega |
| USER autenticado chama `GET /api/admin/users` | 403 |
| USER muda payload `role=ADMIN` | ignorado/rejeitado; role intacta |
| USER chama API de detalhes de outro usuário | 403/404 sem revelar dados |
| USER sem assinatura chama Scanner diretamente | 403 com motivo comercial estável |
| USER sem assinatura abre conexão WS premium | negada ou fechada |
| Usuário perde permissão durante WS ativo | canal revogado dentro da janela documentada |
| Admin concede Scanner por prazo | libera apenas recurso e período indicados |
| Override DENY e plano ALLOW simultâneos | bloqueado |
| Conta suspensa com assinatura paga | bloqueada |
| Assinatura expira com status antigo ACTIVE | bloqueada pelo relógio/período |
| Assinatura cancelada no fim do período pago | continua até o último instante autorizado, depois bloqueia |
| Dois requests consomem última quota simultaneamente | no máximo um tem sucesso |
| Duplicação de webhook do gateway próprio | apenas uma transição/lançamento; períodos não são estendidos duas vezes |
| Webhook sem autenticidade comprovada do gateway próprio | não altera acesso; fica rejeitado/em revisão |
| Webhook antigo depois de cancelamento ou estorno | não reativa indevidamente |
| Checkout externo retorna sucesso sem evento/consulta confirmada | continua pendente, não concede |
| Evento do gateway sem vínculo confiável com usuário/plano | não concede acesso; gera pendência para admin |
| Assinatura manual/cortesia | não gera fatura paga e não entra em MRR |
| Admin tenta suspender a própria conta | regra de proteção impede perda acidental |
| Recuperação de senha/logout | sessões revogadas conforme contrato de auth |
| Troca de feature/plan em production | preserva snapshot/contrato de quem já assinou |
| Usuário tem plano Pro, mas feature ainda não existe | não anunciar feature como operacional |
| Reconexão Binance após troca de plano | regras comerciais continuam válidas |
| Teste em 1366×768 e 1920×1080 | estrutura Claritas preservada sem clipping crítico |

Testes unitários: política RBAC, cálculo temporal, precedence, quotas, mapeamento de estados. Integração: Fastify+Prisma staging/test db, autenticação e webhook. E2E: admin e assinante. Segurança: acesso direto, concorrência, duplicidade. Visual: screenshots comparativos e contraste.

---

## 13. OBSERVABILIDADE, SUPORTE E OPERAÇÃO

- Logs estruturados com `requestId`, rota, resultado, ID interno, duração e categoria de erro; **não** registrar senha, JWT, refresh token, payload íntegro de cartão ou PII desnecessária.
- Métricas: taxa 401/403, falhas na abertura do checkout **externo existente**, eventos do gateway próprio atrasados, webhooks duplicados/inválidos, eventos não vinculados, falhas de conciliação, tempo para aplicação da revogação.
- Alarmes em ambiente de produção para pico de erros 5xx, fila/reprocessamento billing, crescimento de falhas e desconexões de streams.
- Runbook administrativo: investigar assinatura, corrigir grant com motivo, verificar evento no **gateway próprio**, executar reconciliação segura; nunca editar banco sem auditoria.
- Backup do banco, retenção e restauração **testada**, segregação staging/prod e chaves distintas por ambiente.
- Limites de API Binance, conformidade com termos do fornecedor e custos de redistribuição comercial de market data precisam de revisão antes da venda pública. **Ter feed público gratuito para desenvolvimento não equivale automaticamente a licença comercial de redistribuição.**

---

## 14. ROADMAP COMERCIAL APÓS MVP

Não bloquear a implementação do MVP aguardando features avançadas. Assim que P0 estiver validado, priorizar de acordo com receita e uso observados:

1. **Onboarding e ativação:** primeiro gráfico real, clareza do valor, ajuda contextual.
2. **Paywall contextual:** upgrade quando o usuário encontra benefício concreto, sem modal agressivo.
3. **Assinatura simples:** utilizar **cobrança/recorrência já existentes** no gateway próprio, com status e cancelamento transparentes no Claritas.
4. **Trial e reativação:** testes com expiração definida e recuperação de inadimplência.
5. **Produto mensurável:** conversão, retenção, churn, receita líquida, uso por feature e suporte.
6. **Cupons e indicação:** só depois de entender CAC/conversão e evitar abuso.
7. **Planos B2B ou times:** apenas quando demanda justificar multiusuário/assentos.
8. **Feedback de funcionalidades:** telemetria + coleta voluntária de feedback e priorização do roadmap.
9. **Landing e SEO:** clareza de benefícios, depoimentos autorizados e performance; evitar promessa de rentabilidade.
10. **Separação comercial de APIs:** eventual metering/custos por recurso, sem transformar market data redistribuído em produto sem licença.

**Não adotar de início:** afiliados complexos, carteira interna, micropagamentos por candle, cobrança por minuto, módulo de execução de ordens, sistema de comissão multinível, dezenas de planos ou infraestrutura multi-tenant pesada.

---

## 15. DECISÕES QUE PRECISAM SER REVISITADAS PELO RESPONSÁVEL

| ID | Decisão | Situação inicial | Como avançar sem bloquear tudo |
|---|---|---|---|
| D-01 | **Gateway de pagamento** | **DECIDIDO: PRÓPRIO, JÁ EXISTENTE** | auditar contrato de integração, webhooks, ambiente de testes e fluxos de recorrência; NÃO implementar alternativa |
| D-02 | Nomes, preços e oferta dos planos | **PENDENTE** | catálogo rascunho, feature matrix conceitual sem publicação enganosa |
| D-03 | Trial: duração/com cartão | **PENDENTE** | suportar datas parametrizadas, não publicar trial automático ainda |
| D-04 | Grace period/past due | **PENDENTE** | negar ao expirar direito de acesso, parametrizar mudança de política aprovada |
| D-05 | Forma de cancelamento/estorno | **PENDENTE** | suportar imediato e ao fim do ciclo; não cobrar sem política |
| D-06 | Cadastro público vs convite | **PENDENTE** | respeitar login existente; introduzir convite/manual sem desabilitar cadastros atuais à revelia |
| D-07 | E-mails / domínio / canais | **PENDENTE** | construir modelo de eventos sem envios externos até configurado |
| D-08 | Regras tributárias, fiscal e LGPD | **PENDENTE** | revisão jurídico-contábil antes de cobrança real |
| D-09 | Licença e exibição comercial da Binance | **PENDENTE** | revisar termos atuais antes de divulgação comercial aberta |
| D-10 | Componentes realmente disponíveis no repositório | **AUDITORIA** | preencher na Etapa 0, sem suposições |
| D-11 | Documentação/API/payloads e verificação dos webhooks do gateway próprio | **PENDENTE DE AUDITORIA EXTERNA** | obter contrato real, sem inventar endpoints, eventos ou assinatura |
| D-12 | Gateway suporta recorrência, consulta e cancelamento por API? | **NÃO VERIFICADO** | implementar somente operações comprovadas; se ausentes, marcar limitações e fluxo de suporte |
| D-13 | Como vincular cliente e produto Claritas no gateway próprio | **PENDENTE DE AUDITORIA EXTERNA** | definir `externalReference`, IDs de cliente/pedido/pagamento e mapeamento confiável de plano |

Decisões aprovadas devem ser transferidas para `docs/SAAS_DECISIONS.md` com data, autor e justificativa. A LLM não deve perguntar todos esses itens de uma vez; executar o que for independente e isolar bloqueios por decisão.

---

## 16. RECOMENDAÇÕES SOBRE COMPLIANCE, PRIVACIDADE E SEGURANÇA

- Dados pessoais: coletar somente o necessário, definir retenção, exclusão/anonimização quando legalmente possível, acesso restrito e base legal apropriada. Termos e política de privacidade serão validados antes de lançamento.
- Cartões: **usar somente o checkout já existente do gateway próprio**; Claritas não deve coletar, tokenizar ou armazenar dados de cartão/CVV nem implementar nova UI financeira. Autenticação entre sistemas somente no servidor.
- Evitar apresentar análises automatizadas como recomendação financeira garantida ou promessa de lucro. Produto é ferramenta analítica; revisar comunicação comercial.
- Verificar marco regulatório, obrigações fiscais, emissão de documentos e políticas de renovação/cancelamento com assessoria apropriada.
- Administração: privilégio mínimo, separação de admin e usuário, rastreabilidade e proteção da conta fundadora.
- Sessões: revisão de cookies, revogação, política de senha, recuperação segura, MFA para admin como hardening recomendado.
- Dev, staging e produção com bancos/chaves separados e endpoints/segredos de webhooks distintos; confirmar no gateway próprio a existência dos ambientes e procedimentos de teste.

---

## 17. FONTES TÉCNICAS E CRITÉRIOS DE VERIFICAÇÃO

As referências abaixo são guias gerais de segurança e implementação. **A fonte obrigatória para a integração financeira agora é a DOCUMENTAÇÃO OU CÓDIGO AUTORIZADO DO GATEWAY PRÓPRIO, ainda não disponibilizados nesta conversa**. Revalidar versões e URLs no dia da implementação:

- Next.js — autenticação, autorização e proteção da Data Access Layer / Server Actions: https://nextjs.org/docs/app/guides/authentication
- OWASP — Authorization Cheat Sheet (deny-by-default e privilégio mínimo): https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Prisma — transações e operações idempotentes: https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions (usar documentação correspondente à versão do projeto)
- OWASP — segurança de webhooks/APIs: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- **Gateway próprio:** documentação interna, API, payloads reais expurgados, especificação de autenticação e registros de sandbox (a obter na auditoria §9.2).
- Fontes do projeto: `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md`, código real do repositório e documentação criada na Etapa 0.

O fato de o gateway próprio já operar em outros produtos **não comprova automaticamente** que ele tenha integração compatível, assinaturas recorrentes ou contrato de uso aprovado para o Claritas. Verificar as capacidades reais e as condições comerciais/fiscais antes de ativar produção.

---

## 18. DIÁRIO DE EXECUÇÃO — ATUALIZAR A CADA ETAPA

**Este documento é o registro de estado do projeto. NÃO marcar concluído sem rodar a implementação.**

| Etapa | Estado | Evidência/PR/commit/testes | Próximo passo |
|---|---|---|---|
| 0 — Auditoria | **CONCLUÍDA** (17/10) | `docs/SAAS_AUDIT.md`, `docs/SAAS_DECISIONS.md` | — |
| 1 — Roles/auth | **CONCLUÍDA** (17/10) | `User.role/status` (migração `20261017100000_roles`); política de rotas deny-by-default; login recusa conta bloqueada; suspensão revoga sessões e streams; CLI auditado `npm run admin:role`; `/admin` protegido na API e na UI (`AdminFrame`) | promover o 1º admin em produção (autorização) |
| 2 — Prisma comercial | **CONCLUÍDA** (17/10) | migração aditiva `20261017110000_commercial` (+ índice parcial, CHECKs, trigger append-only); seed idempotente só do catálogo; testada do zero em banco local | aplicar no Neon só com autorização |
| 3 — Entitlements | **CONCLUÍDA** (17/10) | `EntitlementsService`/`evaluate.ts`, `/me/access`, enforcement em mercado/análise/scanner/relatório/watchlist/WS, quotas atômicas e idempotentes, `FeatureGate`/`AccessBanner` no frontend | — |
| 4 — Admin usuários | **CONCLUÍDA** (17/10) | `/admin`, `/admin/usuarios`, `/admin/usuarios/[id]` (acesso efetivo com motivo, suspender/reativar, concessões com prazo e motivo, linha do tempo), `/admin/auditoria`; `DataTable`/`StatTile` no DS | — |
| 5 — Planos/manual | **CONCLUÍDA** (17/10) | `/admin/planos` (rascunho → publicar imutável → nova versão), `/admin/assinaturas`, concessão teste/manual/cortesia com prazo, prorrogar/revogar, expiração pelo relógio + job | aprovar planos/preços (D-02) |
| 6 — Conta e pricing | **CONCLUÍDA** (17/10) | `/conta` (plano, origem, validade, benefícios, cobrança/cancelamento honestos), `/planos` (só publicados; "preço a definir"; sem checkout), CTAs de upgrade nos bloqueios | preços aprovados → checkout externo na Etapa 7 |
| 7 — Gateway próprio | **ADIADA — AGUARDANDO INTEGRAÇÃO FUTURA** (decisão do responsável, 17/10) | só estrutura (`GatewayCustomerLink`, `GatewayEvent`, campos externos e origem `OWN_GATEWAY` reservados); `/admin/integracoes` e API respondem `DEFERRED` | auditar o contrato do gateway (§9.2) quando liberado |
| 8 — Onboarding | **CONCLUÍDA (partes independentes do gateway)** (17/10) | onboarding de 3 passos retomável/dispensável (`/me/onboarding`), estados de acesso (sem liberação, teste perto do fim/encerrado, conta bloqueada, limite), `/ajuda` (FAQ + suporte configurável) | e-mails transacionais (D-07); estados de pagamento (Etapa 7) |
| 9 — Métricas | **CONCLUÍDA (sem receita)** (17/10) | `ProductEvent` + `/admin` com fórmulas em `docs/SAAS_METRICS.md`; receita/MRR/conversão marcados PENDENTES | receita após Etapa 7 |
| 10 — Hardening | **CONCLUÍDA no escopo atual** (17/10) | lint, typecheck, 139 unitários, 36 de banco real, 13 de integração Binance, 41 visuais (Playwright), build; `docs/SAAS_SECURITY.md`, `SAAS_RUNBOOK.md`, `SAAS_ROUTES.md` | Playwright `live` (porta 4000 ocupada por API do responsável ligada ao Neon); testes de webhook (Etapa 7); revisão jurídica |

#### Execução [2026-10-17 UTC] — Etapas 0 a 3 e 5 (backend)
- Estado: Etapa 0 CONCLUÍDA; Etapas 1, 2, 3 e 5 CONCLUÍDAS no backend; 4, 8 e 9 EM PROGRESSO; 7 ADIADA.
- Código existente reutilizado: login/sessões próprios (ADR-018), guarda por rota, `Database`, `AppError`, contratos Zod, testes de banco local descartável, `FakeStreamSource`.
- Arquivos criados: `packages/contracts/src/commercial.ts`; `services/api/src/modules/{authorization,entitlements,plans,subscriptions,admin,me,audit,metrics}/*`; `services/api/scripts/admin-role.ts`; migrações `20261017100000_roles`, `20261017110000_commercial`; testes `entitlements.test.ts`, `route-policy.test.ts`, `saas.db.test.ts`, `helpers/test-db.ts`.
- Migrações executadas: somente PostgreSQL local descartável (testes). **Neon não alterado.**
- Testes: `npm run typecheck` OK; `vitest --project api --project contracts --project web` 139/139; `npm run test:db` 36/36.
- Critérios de aceite validados: USER → 403 em admin; ADMIN → 200; suspenso bloqueado (sessões revogadas, login 403, WS fechado com 4403); deny-by-default; expiração pelo relógio sem depender do job; DENY > ALLOW; concessão pontual com prazo; quota concorrente (10 requisições, limite 3 → 3); assinatura manual sem pagamento; plano publicado imutável; auditoria append-only no banco.
- Pendências: frontend (Etapas 4, 5, 6, 8, 9), E2E, documentação de rotas/segurança/runbook.
- Próxima ação exata: componentes de design system para tabela e aviso de acesso; cliente/estado de acesso no frontend; `FeatureGate` nas três telas; páginas `/admin/*`, `/conta`, `/planos`.

#### Execução [2026-10-17 UTC] — Etapas 4, 5, 6, 8, 9 e 10 (frontend, docs e verificação)
- Estado: Etapas 0–6 e 8–10 CONCLUÍDAS no escopo atual; Etapa 7 ADIADA.
- Código existente reutilizado: shell do terminal, `AuthGate`, `use-session`, cliente de API, design system (Panel, Badge, Button, Dialog, Input, Select, Checkbox, Tabs, TextLink), fixture de API congelada da suíte visual.
- Arquivos criados (frontend): `design-system/components/core/{DataTable,StatTile}.tsx`, `feedback/AccessNotice.tsx` (+ `.md`, lint, showcase); `lib/api/commercial.ts`; `lib/auth/{use-access,access-copy}.ts`; `components/commercial/{FeatureGate,AccessBanner,AccountScreen,PricingScreen,HelpScreen,PublicShell,Onboarding}.tsx`; `components/admin/*`; rotas `app/(terminal)/{conta,admin/**}`, `app/(public)/{planos,ajuda}`.
- Docs: `SAAS_ROUTES.md`, `SAAS_SECURITY.md`, `SAAS_RUNBOOK.md`, `SAAS_METRICS.md`, `SAAS_HANDOFF.md`, `SAAS_DECISIONS.md` (D-S18..D-S21), README, `.env.example`, `DEPLOY.md`.
- Migrações executadas: só bancos locais descartáveis. **Neon não alterado.**
- Testes: `npm run lint` OK · `npm run typecheck` OK · `npm test` 139/139 · `npm run test:db` 36/36 · `npm run test:integration` 13/13 · `playwright --project=visual` 41/41 (18 novos da área comercial; baselines revisadas a olho em 1440 e 390) · `npm run build` OK (19 rotas).
- Critérios de aceite validados na UI: admin restrito a ADMIN sem chamadas à API administrativa; conta sem acesso não vê nem chama mercado; bloqueios com motivo e ações (planos/conta/suporte), sem checkout; cortesia/manual rotulados como "sem cobrança"; receita "pendente"; motivo obrigatório antes de qualquer concessão.
- Pendências ou limitações: Playwright `live` não executado (porta 4000 ocupada por `npm run dev` do responsável apontando para o Neon, que ainda não tem as migrações); recuperação de senha/MFA (D-07); termos/LGPD/licença Binance (D-08/D-09); Etapa 7.
- Próxima ação exata: com autorização — migrar Neon, promover o 1º admin e conceder acessos (runbook); rodar `npm run test:e2e` com a API local de E2E; depois auditar o contrato do gateway (Etapa 7).
- Commit: branch `feat/saas-comercial` (ver `git log`), sem push.

### Modelo obrigatório de atualização após cada etapa

```md
#### Execução [AAAA-MM-DD HH:MM UTC] — Etapa N
- Estado: EM PROGRESSO | CONCLUÍDA | BLOQUEADA | PARCIAL
- Código existente encontrado e reutilizado:
- Arquivos alterados/criados:
- Migrações executadas (ambiente):
- Testes executados (comandos e resultado):
- Critérios de aceite validados:
- Pendências ou limitações:
- Decisões arquiteturais relevantes:
- Próxima ação exata:
- Identificador de commit/PR (quando houver):
```

---

## 19. HANDOFF — COMO CONTINUAR APÓS PERDA DE CONTEXTO

Sempre criar/atualizar `docs/SAAS_HANDOFF.md` incluindo:

1. Data/hora e branch/commit atual.
2. Plano 01 e Plano 02 lidos e localização efetiva de cada um.
3. Resultado da auditoria de auth, Prisma, Fastify, Next e design system.
4. Quais etapas de SaaS foram **verificadamente** concluídas.
5. Última execução de lint, typecheck, unit/integration/E2E/build e seus resultados.
6. Migrações aplicadas, bancos afetados e backups disponíveis.
7. Segredos/variáveis necessários **somente por NOME**, nunca valores.
8. Decisões aprovadas e bloqueios externos (ex.: falta de documentação, credenciais, sandbox ou webhook do gateway próprio).
9. Próximo arquivo/função/rota específica a implementar ou testar.
10. Problemas conhecidos e instruções de reprodução.

### Prompt para agente futuro

> Leia integralmente `PLANO_IMPLEMENTACAO_CLARITAS_TERMINAL.md`, `PLANO_02_CLARITAS_SAAS_COMERCIAL.md`, `docs/SAAS_AUDIT.md`, `docs/SAAS_DECISIONS.md`, `docs/SAAS_HANDOFF.md` e a seção 18 deste plano. Confira o estado REAL do repositório antes de implementar. Preserve o design system Claritas e a autenticação existente, execute a próxima etapa não concluída com testes e atualize logs/handoff. Não reconstrua etapas completas e não marque tarefas não executadas como concluídas. O gateway JÁ FOI DECIDIDO: é o sistema próprio existente. Audite seu contrato de integração antes da Etapa 7, conclua tudo que independe dessa auditoria e não crie checkout ou gateway alternativo nem invente pagamentos.

---

## 20. DEFINITION OF DONE (DOD) — CHECKLIST FINAL

### Segurança de identidade e acesso

- [x] Login **existente** foi auditado e preservado; não há sistemas de sessão duplicados. (`SAAS_AUDIT.md` §2)
- [x] Roles `USER`/`ADMIN` e estados de usuário aplicados server-side. (`route-policy.ts`, `saas.db.test.ts`)
- [x] Admin inacessível a USER por URL, API direta e Server Actions. (não há Server Actions; API 403 + UI restrita — `route-policy.test.ts`, `commercial.spec.ts`)
- [x] Operações de usuário não expõem outros usuários (IDOR testado). (`saas.db.test.ts`)
- [x] Bootstrap de admin é seguro e auditado; nenhuma promoção automática pública. (`npm run admin:role`)
- [x] Acesso de usuário suspenso/expirado é revogado, inclusive em streams ativos. (WS fechado com 4403 — `saas.db.test.ts`)

### Produto e design

- [x] Pregão, Scanner e Relatório existentes preservam identidade, funcionalidade e dados reais. (baselines visuais anteriores mantidas; integração Binance 13/13)
- [x] Nova área administrativa e área de conta usam tokens, fontes e componentes Claritas reais.
- [x] Acesso a recursos por feature/plano é aplicado no backend e visível na UI.
- [x] Bloqueio comercial é explicado sem layout quebrado ou falso erro técnico.
- [x] Regressão visual desktop e mobile verificada. (1440/1366/390; 41 capturas — 1920×1080 não capturado)

### Comercial e operação

- [x] Planos e benefícios são configuráveis, com versionamento ou snapshots para assinantes existentes.
- [x] Admin lista/filtra contas, vê detalhes e concede/revoga acesso com prazo e auditoria.
- [x] Quotas são aplicadas com proteção de concorrência e sem cobranças duplicadas.
- [x] Assinaturas manuais e cortesias são corretamente distinguíveis de pagamentos.
- [x] Usuário consegue consultar seu estado e benefícios.
- [ ] **Gateway próprio existente** integrado — **ADIADO por decisão do responsável (Etapa 7). Automação de assinaturas NÃO concluída.**
- [ ] Eventos financeiros duplicados, inválidos e fora de ordem — **pendente da Etapa 7** (só estrutura de dados com unicidade `gatewayKey+externalEventId`).
- [x] Métricas de receita excluem gratuidades e dados não conciliados. (receita marcada PENDENTE; cortesias/manuais nunca entram)

### Qualidade e handoff

- [x] Lint, typecheck e build passam.
- [~] Testes unitários, API/integração, E2E e autorização/quotas pertinentes passam — **exceto** Playwright `live` (não executado: porta ocupada por API ligada ao Neon) e webhooks (Etapa 7).
- [x] Migrações testadas sem destruir contas reais. (aditivas, aplicadas do zero em banco local; Neon não alterado)
- [x] Runbook, README, audit, decisões, status, handoff e evidências atualizados.
- [ ] Questões jurídicas/fiscais/licença de dados — **sinalizadas como bloqueio para lançamento comercial** (D-08, D-09).

### Definição de conclusão

**MVP Comercial P0 concluído** = etapas 0 a 5 + proteções essenciais da etapa 10, testadas, com liberação manual de acesso e painel admin, **sem prometer billing automático**.

**SaaS pronto para cobrar** = MVP P0 + etapas 6 e 7 (**integração com gateway próprio comprovada**, webhooks seguros, conciliação testada e uso do checkout já existente) + páginas/termos/políticas aprovados + controles de produção. A implementação pode estar tecnicamente pronta e mesmo assim a **venda pública** ficar bloqueada por licença de dados, política comercial ou conformidade.

**Plano 02 100% concluído** = todos os requisitos efetivamente aprovados e executáveis cumpridos, documentação e testes comprovados; qualquer API, acesso ou capacidade ausente do gateway próprio explicitado como bloqueio (não presumido concluído).

---

## 21. INSTRUÇÃO DE ARRANQUE PARA LLM EXECUTORA

> Você é responsável por transformar o Claritas Terminal atual em SaaS. Execute o arquivo `PLANO_02_CLARITAS_SAAS_COMERCIAL.md`, **começando necessariamente na Etapa 0**, sem duplicar o login existente ou reescrever o design system. Trabalhe continuamente por etapas, aplicando migrações seguras, testes e revisão. Mantenha o diário §18 e o handoff §19 atualizados. Priorize o MVP comercial P0: roles, entitlements, painel admin, planos e concessões manuais. Depois implemente conta, precificação e o restante possível. O gateway já existe e foi escolhido; a Etapa 7 depende da **auditoria de integração de sua API/checkout/webhook**, não da escolha de provedor. Nunca desenvolva pagamentos ou checkout dentro do Claritas. Não invente pagamentos, recursos existentes ou validações. Pare apenas quando o que é executável estiver concluído e com evidência, ou quando limites reais do ambiente impedirem a continuação; nesses casos registre os bloqueios de forma objetiva.

**FIM DO PLANO 02 — executar a Etapa 0 primeiro.**
