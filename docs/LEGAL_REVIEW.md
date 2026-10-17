# Revisão de Termos, LGPD e fiscal — Claritas Terminal

**Data:** 17/10/2026 · **Escopo:** Termos de Uso, Política de Privacidade (LGPD) e enquadramento fiscal do SaaS. **Fora do escopo por decisão do responsável:** licença comercial dos dados da Binance (D-09) — será tratada depois, com a troca de fonte.

> Esta revisão foi feita por um agente de engenharia a partir do funcionamento **real** do sistema. Ela organiza obrigações, aponta lacunas e já implementa o que é técnico, mas **não substitui advogado nem contador**. Os pontos marcados ⚖ e 🧾 precisam de validação profissional antes da cobrança pública.

## 1. O que foi feito no produto

| Item | Implementação |
|---|---|
| Termos de Uso | `/termos` (versão `2026-10-17`), texto em `components/commercial/legal-content.ts` |
| Política de Privacidade | `/privacidade` (versão `2026-10-17`) |
| Aceite expresso no cadastro | caixa obrigatória "Li e aceito…" com links; a API recusa cadastro sem `acceptTerms: true` |
| Prova do aceite | tabela `ConsentRecord` (tipo, versão, data, origem), gravada na mesma transação da conta (migração `20261017120000_consent`) |
| Acesso e portabilidade (LGPD art. 18, II e V) | "Baixar meus dados" em `/conta` → `GET /api/v1/me/export` (JSON, sem hash de senha nem token) |
| Transparência de preço | `/planos` mostra preço, periodicidade, "sem renovação automática" e ausência de checkout nesta fase |
| Aviso de natureza do serviço | rodapés e Termos: ferramenta de análise, sem recomendação de investimento, sem execução de ordens |
| Minimização | sem cartão, sem dados sensíveis, sem cookies de publicidade; eventos de uso sem PII |

## 2. Termos de Uso — pontos revisados

| Tema | Situação | Pendência |
|---|---|---|
| Identificação do fornecedor (CDC art. 31; Decreto 7.962/2013 art. 2º — comércio eletrônico) | placeholders `[Razão social]`, `[CNPJ]`, `[endereço]`, `[e-mail]` | ⚖ preencher antes de vender |
| Natureza do serviço / não é recomendação | explícito (seção 2) | ⚖ confirmar que o produto não se enquadra como "análise de valores mobiliários" (Resolução CVM 20/2021) — hoje são regras descritivas sobre criptoativos, sem recomendação; reavaliar se surgirem sinais de compra/venda ou ativos da B3 |
| Direito de arrependimento (CDC art. 49) | 7 dias com devolução integral | ⚖ definir reembolso proporcional após 7 dias para semestral/anual |
| Renovação e cancelamento | sem cobrança/renovação automática nesta fase; cancelamento pelo suporte | ⚖ quando o gateway entrar: renovação só com informação clara e cancelamento tão fácil quanto a contratação |
| Limitação de responsabilidade | dentro do CDC (não exclui responsabilidade do fornecedor) | ⚖ revisar redação |
| Foro | domicílio do consumidor | — |
| Alteração dos termos | versão datada + re-aceite em mudança relevante | 🛠 implementar fluxo de re-aceite quando a versão mudar (o registro já suporta) |

## 3. LGPD — pontos revisados

| Requisito | Situação | Pendência |
|---|---|---|
| Bases legais por finalidade (art. 7º) | contrato (conta/serviço), legítimo interesse (segurança/métricas agregadas), obrigação legal (logs/fiscal) | ⚖ registrar o teste de balanceamento do legítimo interesse (art. 10) |
| Transparência (art. 9º) | Política com dados, finalidades, compartilhamento, retenção e direitos | ⚖ preencher controlador e encarregado |
| Encarregado/DPO (art. 41) | placeholder | ⚖ nomear (a ANPD dispensa agentes de pequeno porte em certas condições — Resolução CD/ANPD nº 2/2022; confirmar enquadramento) e publicar o canal |
| Direitos do titular (art. 18) | acesso/portabilidade pela própria conta; demais pelo encarregado em até 15 dias | 🛠 exclusão/anonimização de conta ainda é manual (pelo suporte) — automatizar |
| Operadores e transferência internacional (art. 33) | Neon (banco), Render (Frankfurt), Vercel | ⚖ confirmar região do Neon e anexar DPA/cláusulas de cada provedor; atualizar a Política |
| Registros de acesso (Marco Civil art. 15) | logs da API com IP e requisição (Render) | 🛠 garantir retenção mínima de 6 meses (o plano free do Render não guarda isso — exportar logs para armazenamento próprio) |
| Segurança (art. 46) e incidentes (art. 48) | hash scrypt, sessões revogáveis, HTTPS, RBAC, auditoria imutável | 🛠 plano de resposta a incidentes e contato com a ANPD; MFA para admins |
| Registro das operações (art. 37) | — | ⚖ criar o inventário (ROPA) a partir da seção 2 da Política |
| Menores | serviço para maiores de 18 | — |

## 4. Fiscal — revisão para cobrança do SaaS 🧾

O Claritas ainda **não cobra**; os itens abaixo precisam estar resolvidos **antes** de ativar o gateway (Etapa 7).

| Tema | Orientação a validar com contador |
|---|---|
| Pessoa jurídica e CNAE | CNPJ com CNAE compatível com SaaS — candidatos: 6311-9/00 (tratamento de dados, provedores de aplicação e hospedagem) ou 6203-1/00 (desenvolvimento e licenciamento de programas não customizáveis). |
| Imposto municipal (ISS) | Serviço da LC 116/2003 — enquadramento usual de SaaS no item 1.05 (licenciamento ou cessão de uso de programas) ou 1.03 (processamento/armazenamento de dados); alíquota do município, entre 2% e 5%. |
| Nota fiscal | Emissão de NFS-e para cada cobrança (o padrão nacional de NFS-e vem sendo adotado pelos municípios). Definir se o gateway emite ou se integra a um emissor. |
| Regime tributário | Simples Nacional (anexo III ou V conforme o Fator R) ou Lucro Presumido — escolha do contador. |
| Reforma tributária | EC 132/2023 e LC 214/2025: CBS e IBS em fase de teste em 2026 (alíquotas simbólicas, com destaque no documento fiscal); transição até 2033. Confirmar com o contador o que muda na NFS-e a partir de 2026. |
| Transparência de tributos | Lei 12.741/2012: informar o valor aproximado dos tributos no documento fiscal. |
| Preço exibido | R$ 299/mês, R$ 1.614/semestre e R$ 2.870/ano — valores de **teste** definidos pelo responsável em 17/10/2026; confirmar se são finais e se já incluem os tributos (preço ao consumidor deve ser o total). |
| Clientes no exterior | Exportação de serviço tem tratamento próprio (ISS/PIS/COFINS); avaliar antes de vender fora do Brasil. |

## 5. Próximos passos recomendados

1. ⚖ Advogado: revisar `/termos` e `/privacidade`, preencher dados da empresa e do encarregado, definir política de reembolso → publicar a versão final (nova data em `LEGAL_VERSIONS`).
2. 🧾 Contador: CNAE, regime, ISS do município, emissão de NFS-e e preço com tributos → decidir o fluxo fiscal junto com a Etapa 7.
3. 🛠 Engenharia: re-aceite de nova versão, exclusão/anonimização de conta, retenção de logs por 6 meses, MFA para admins.
