# Assinatura mensal (R$ 7,90) — Cakto + Supabase

Este documento descreve:

- Como o app está integrado hoje com a Cakto (checkout + webhook).
- Como será a nova versão baseada em assinatura mensal.
- Passo a passo de configuração na Cakto e no Supabase.

## 1) Como funciona hoje (estrutura atual)

### 1.1 Frontend (React)

- O app redireciona para a Cakto usando um link `https://pay.cakto.com.br/...`.
- Antes de redirecionar, o app adiciona um parâmetro `sck` com o `auth.user.id` do Supabase e preenche dados do comprador quando disponíveis (nome, email, telefone).
- O retorno pós-pagamento hoje usa `/payment/success` (mensagem e redirect) e também existe a rota `/pagamento/retorno` com polling para esperar a liberação do acesso.

Arquivos principais:

- [caktoCheckout.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/lib/caktoCheckout.ts)
- [Checkout.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/Checkout.tsx)
- [Planos.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/Planos.tsx)
- [PaywallScreen.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/components/PaywallScreen.tsx)
- [RetornoPagamento.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/RetornoPagamento.tsx)

### 1.2 Backend (Supabase Edge Function)

- O endpoint de webhook recomendado no projeto é a Edge Function `cakto-webhook`.
- Ela valida um segredo recebido no payload e atualiza o registro do usuário na tabela `public.usuarios` com:
  - `plan_type` (`mensal` ou `vitalicio`)
  - `subscription_status` (`trial | active | expired | inactive`)
  - metadados do pedido/assinatura da Cakto
  - `paid_access` (hoje está efetivamente “vitalício aprovado”)

Arquivo principal:

- [cakto-webhook/index.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/functions/cakto-webhook/index.ts)

### 1.3 Liberação de acesso

- O app usa o campo `usuarios.paid_access` como “fonte da verdade” para liberar o sistema (via `usePaidAccess` + `ProtectedRoute`).
- Se `paid_access=false`, o usuário ainda pode entrar somente durante o trial de 7 dias; após isso, aparece o paywall.

Arquivos:

- [usePaidAccess.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/hooks/usePaidAccess.ts)
- [ProtectedRoute.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/components/auth/ProtectedRoute.tsx)

## 2) Como será a nova versão (assinatura mensal)

### 2.1 Regras de negócio (primeiro plano)

- O app deixa de vender “vitalício” e passa a vender assinatura recorrente mensal.
- Valor inicial: R$ 7,90/mês.
- O acesso é liberado enquanto `subscription_status=active` para o plano mensal.
- Se a assinatura for cancelada, reembolsada/chargeback, ou ficar inativa/expirada, o acesso deve ser revogado.

### 2.2 Contrato de dados (o que o app vai considerar como “pago”)

Proposta mínima (reaproveitando estrutura atual):

- Continuar usando `usuarios.paid_access` como flag única de “acesso liberado agora”.
- Para mensal:
  - `paid_access=true` quando o webhook indicar `plan_type=mensal` e `subscription_status=active`.
  - `paid_access=false` quando `plan_type=mensal` e `subscription_status` virar `inactive` ou `expired`.

Melhoria recomendada (para ficar mais robusto no futuro):

- Adicionar uma data de expiração local do acesso (ex.: `access_expires_at`), preenchida pelo webhook (quando a Cakto enviar/permitir inferir o fim do período) para evitar depender 100% de evento de cancelamento.

### 2.3 Mudanças esperadas no app (UI/rotas)

- Textos e CTAs:
  - “Acesso vitalício / pagamento único” → “Assinatura mensal / R$ 7,90 por mês”
  - “Comprar” → “Assinar”
- Checkout:
  - Passar a usar a URL do checkout mensal (novo env do Vite).
- Assinatura (tela `/assinatura`):
  - Mostrar status da assinatura mensal (ativa/inativa) e informações de cobrança quando existirem.
- Paywall:
  - Oferecer “Assinar por R$ 7,90/mês” como desbloqueio.

## 3) Passo a passo — Configurar na Cakto

As referências oficiais úteis:

- Pedido possui campo `sck` como “parâmetro personalizado” (aparece em respostas de pedido). Fonte: documentação de “Obter Pedido”. <https://docs.cakto.com.br/api-reference/orders/retrieve>
- Webhook pode ter `fields.secret` e evento `purchase_approved`. Fonte: documentação de “Obter Webhook”. <https://docs.cakto.com.br/api-reference/webhooks/retrieve>

### 3.1 Criar o produto de assinatura mensal

1. No painel da Cakto, crie um novo produto (ex.: “Salão de Bolso — Assinatura Mensal”).
2. Defina o tipo do produto como recorrente/assinatura (na API isso aparece como `type: subscription`).
3. Configure o valor como R$ 7,90 e periodicidade mensal.
4. Habilite métodos de pagamento desejados (Pix/cartão, etc.) conforme seu modelo.

Anote:

- `product_id` do produto
- `offer_id` (se você usar oferta/checkout específico)
- `checkoutUrl` (URL do checkout hospedado)

### 3.2 Garantir o vínculo do comprador com o usuário do app (sck)

1. O app sempre abrirá o checkout com `?sck=<supabase_user_id>`.
2. Confirme que o checkout da Cakto preserva o parâmetro `sck` e ele aparece no pedido/webhook.
3. Se existir configuração de “parâmetros/campos personalizados” no checkout, garanta que exista o campo `sck` vinculado ao valor do parâmetro de URL `sck`.

Fallback (já implementado no webhook):

- Se o `sck` não vier no payload, o sistema tenta localizar o usuário pelo email do comprador.

### 3.3 Configurar o webhook para ativar/desativar assinaturas

1. No painel da Cakto, crie um webhook apontando para o endpoint do Supabase:
   - `POST https://<PROJECT_REF>.supabase.co/functions/v1/cakto-webhook`
2. Configure um segredo no webhook (ex.: `fields.secret`).
3. Selecione eventos no mínimo para “compra aprovada” (na doc aparece como `purchase_approved`).
4. Se disponível, selecione também eventos de cancelamento e eventos ligados a reembolso/chargeback, para que o app revogue acesso rapidamente.

## 4) Passo a passo — Configurar no Supabase (webhook)

### 4.1 Definir secrets da Edge Function

No Supabase (Edge Functions → Secrets), configure:

- `CAKTO_WEBHOOK_SECRET` (igual ao segredo configurado no webhook da Cakto)
- `CAKTO_MENSAL_PRODUCT_ID` e/ou `CAKTO_MENSAL_OFFER_ID`

Opcional (recomendado para validar o pedido via API):

- `CAKTO_VERIFY_BY_API=true`
- `CAKTO_CLIENT_ID`
- `CAKTO_CLIENT_SECRET`

### 4.2 Ajuste necessário no webhook para mensal

Hoje o webhook libera `paid_access=true` apenas no vitalício. Para a assinatura mensal, a regra deve ser:

- Se `plan_type=mensal` e `subscription_status=active` → `paid_access=true`
- Se `plan_type=mensal` e (`subscription_status=inactive` ou `expired`) → `paid_access=false`

Ponto de alteração:

- [cakto-webhook/index.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/functions/cakto-webhook/index.ts)

### 4.3 Validar ponta-a-ponta

1. Crie um usuário novo no app.
2. Abra `/checkout` e confirme que a URL enviada para a Cakto contém `sck=<id do usuário>`.
3. Complete a compra no checkout.
4. Verifique no Supabase se `public.usuarios` foi atualizado com:
   - `plan_type='mensal'`
   - `subscription_status='active'`
   - `paid_access=true`

## 5) Passo a passo — Configurar no app (Vite/Frontend)

### 5.1 Variáveis de ambiente do Vite

Criar (ou substituir) a variável do checkout:

- `VITE_CAKTO_CHECKOUT_MENSAL_URL=https://pay.cakto.com.br/...`

Observação:

- Atualmente o app usa `VITE_CAKTO_CHECKOUT_VITALICIO_URL`. A nova versão deve trocar a origem do link para o plano mensal.

### 5.2 Páginas que devem ser atualizadas para mensal

- `/planos` ([Planos.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/Planos.tsx))
- `/checkout` ([Checkout.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/Checkout.tsx))
- paywall ([PaywallScreen.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/components/PaywallScreen.tsx))
- tela de assinatura ([Assinatura.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/pages/Assinatura.tsx))

## 6) Preparando para novos planos (futuro)

Como hoje `plan_type` está limitado a `mensal | vitalicio`, quando você quiser novos planos “mensais com melhorias”, existem dois caminhos:

1. Manter `plan_type='mensal'` para todos os planos recorrentes e introduzir `plan_code` (ex.: `mensal_basic`, `mensal_plus`, `mensal_pro`) para diferenciar níveis.
2. Criar uma tabela `planos` (com `code`, `nome`, `preco`, `ativo`, `cakto_product_id`, `cakto_offer_id`) e guardar em `usuarios` apenas o `plano_id`/`plano_code`.

O webhook passaria a resolver o plano por `productId/offerId` e gravar a referência do plano, mantendo `subscription_status` como estado de acesso.

