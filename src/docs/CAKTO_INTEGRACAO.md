# Integração Cakto

Este projeto usa a Cakto como checkout hospedado.

## Visão geral

- O frontend redireciona o usuário para um link `https://pay.cakto.com.br/...`.
- O vínculo entre compra e usuário do app é feito pelo parâmetro `sck`, que recebe o `auth.user.id` do Supabase.
- O backend recebe webhooks e atualiza a tabela `public.usuarios` no Supabase.

## Autenticação na API (opcional)

A API da Cakto é REST e usa OAuth2 com `client_id` e `client_secret`.

- Base URL: `https://api.cakto.com.br/`
- Token: `POST https://api.cakto.com.br/public_api/token/` com `Content-Type: application/x-www-form-urlencoded`
- O token expira conforme `expires_in`; quando expirar, deve ser solicitado novamente.

## Configuração do checkout

No `.env` do frontend:

- `VITE_CAKTO_CHECKOUT_MENSAL_URL`
- `VITE_CAKTO_CHECKOUT_VITALICIO_URL`

O app adiciona automaticamente:

- `sck=<id do usuário>`
- `name`, `email`, `confirmEmail`, `phone` (quando disponíveis no perfil)

## Configuração do webhook

No painel da Cakto, crie um webhook apontando para:

- `POST https://SEU_PROJETO.functions.supabase.co/cakto-webhook`

Selecione, no mínimo:

- `purchase_approved`

Defina uma chave secreta no webhook e configure a mesma no backend:

- `CAKTO_WEBHOOK_SECRET`

### Supabase Edge Function (sem Railway)

Se você quiser eliminar o Railway, use a Edge Function `cakto-webhook`.

Secrets necessárias no Supabase:

- `CAKTO_WEBHOOK_SECRET`
- `CAKTO_VERIFY_BY_API` (opcional, `true`/`false`)
- `CAKTO_CLIENT_ID` e `CAKTO_CLIENT_SECRET` (opcional, para validar pedidos via API)
- `CAKTO_MENSAL_PRODUCT_ID`, `CAKTO_VITALICIO_PRODUCT_ID` e/ou `CAKTO_MENSAL_OFFER_ID`, `CAKTO_VITALICIO_OFFER_ID` (opcional)

## Validação do pedido via API (recomendado)

Para reduzir o risco de payload incompleto/forjado, o backend pode consultar o pedido na API.

No `.env` do backend:

- `CAKTO_CLIENT_ID`
- `CAKTO_CLIENT_SECRET`
- `CAKTO_VERIFY_BY_API=true`

O backend tenta obter o pedido em `public_api/orders/{id}/` e usa os dados retornados para atualizar o usuário.

## Mapeamento de planos

Para o backend identificar o plano (`mensal` vs `vitalicio`), configure pelo menos um dos pares abaixo:

- `CAKTO_MENSAL_PRODUCT_ID` e `CAKTO_VITALICIO_PRODUCT_ID`
- `CAKTO_MENSAL_OFFER_ID` e `CAKTO_VITALICIO_OFFER_ID`

## Campos atualizados no Supabase

O backend atualiza `public.usuarios` com:

- `payment_provider='cakto'`
- `subscription_status` (`active`, `trial`, `inactive`, `expired`)
- `plan_type` (`mensal` ou `vitalicio`)
- metadados da Cakto: `cakto_order_id`, `cakto_order_ref_id`, `cakto_last_event`, `cakto_last_status`, etc.

## Retorno para o app após o checkout

Após concluir o checkout, o usuário deve retornar para o app.

- Rota do app: `/pagamento/retorno`
- Exemplo de URL: `https://SEU_APP/pagamento/retorno?status=success`

Essa página faz polling no Supabase e libera automaticamente quando `subscription_status` muda para `active`.
