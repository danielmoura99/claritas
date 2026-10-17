# Runbook operacional — Plano 02

Toda operação abaixo é auditada. **Nunca edite o banco à mão** para mudar acesso: use o painel `/admin` ou os comandos descritos.

## Antes do primeiro deploy desta versão (produção)

> Exige autorização do responsável (R-03). Neon tem dados reais.

1. Branch de backup no Neon.
2. `npm run db:migrate` (aplica `20261017100000_roles` e `20261017110000_commercial`, aditivas) e `npm run db:seed` (catálogo + planos em rascunho; não cria contas, assinaturas nem admins).
3. Promover o primeiro admin (conta **já cadastrada**):
   `npm run admin:role -- promote --email voce@exemplo.com --confirm voce@exemplo.com --reason "fundador da operação"`
4. **Deny-by-default:** sem concessão, ninguém usa o terminal — inclusive o admin. Entre em `/admin/usuarios/<você>` → "Conceder acesso" (ex.: plano Pro, acesso manual, 365 dias) e repita para quem já usava o produto.
5. Deploy da API e depois da web (ordem de `docs/DEPLOY.md`).

## Conceder acesso a um cliente

`/admin/usuarios` → buscar → abrir → **Conceder acesso**: plano, modalidade (Teste / Acesso manual / Cortesia), duração, motivo. Termina sozinho no fim do prazo (o servidor nega pelo relógio). Trocar de plano: marque "Substituir a assinatura atual".

## Liberar ou negar uma funcionalidade pontual

Detalhe do usuário → **Nova exceção**: funcionalidade, Liberar/Negar, duração (≤ 366 dias), limite opcional, motivo. Negação vence o plano.

## Bloquear um usuário

Detalhe → **Suspender** (ou Desativar) com motivo. Efeito imediato: sessões apagadas, streams fechados, login bloqueado. Reverter: **Reativar**.

## Reverter uma concessão

Detalhe → assinatura corrente → **Revogar** (acesso termina agora) ou **Prazo** (novo fim). Exceções: **Revogar** na lista de concessões. Histórico preservado.

## Publicar um plano

`/admin/planos` → rascunho → **Editar** (features e limites) → **Publicar** (motivo). Só features implementadas; limites obrigatórios para quotas/limites. Versão publicada é imutável: para mudar, **Nova versão** e publique-a (a anterior é arquivada; assinaturas existentes mantêm o snapshot).

## Investigar "por que a pessoa não tem acesso?"

Detalhe do usuário → quadro **Funcionalidades liberadas — e por quê** mostra o motivo exato (sem assinatura válida, não incluído, negado por exceção, conta bloqueada, limite atingido, ainda não existe). A **Linha do tempo** mostra quem mudou o quê.

## Remover um admin

`npm run admin:role -- demote --email ... --confirm ... --reason "..."` (recusa remover o último admin ativo).

## Assinaturas vencidas

O job (`SUBSCRIPTION_EXPIRY_JOB_MINUTES`, padrão 60) marca `EXPIRED` e audita como `sistema:expiração`. Mesmo parado, o acesso já é negado no instante do vencimento.

## Pagamentos (Etapa 7 — adiada)

Não há checkout, webhook nem conciliação. Contestação, estorno e cobrança acontecem fora do Claritas. Não marque nada como "pago" no Claritas.
