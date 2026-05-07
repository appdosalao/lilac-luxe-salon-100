# Vistoria — Priorização de Correções (sem alterações aplicadas)

Este documento organiza, em ordem de prioridade, os principais pontos encontrados na vistoria ponta a ponta do sistema. O objetivo é reduzir risco de bugs em produção, vazamento de dados multi-tenant e inconsistência entre ambientes.

## P0 — Segurança / Vazamento de dados (corrigir primeiro)

### 1) RLS público permissivo (`USING (true)`) → risco de cross-tenant
- **Problema**: scripts/migrations habilitam SELECT público irrestrito em tabelas sensíveis (ou próximas de sensíveis). Em multi-tenant, isso pode permitir que um visitante veja dados de outros salões (dependendo de GRANTs).
- **Indícios no repo**:
  - `servicos`: policy pública com `USING (true)` em migration [20251110114344_6a18e166-47de-407b-ba40-aaa714afacbc.sql](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/migrations/20251110114344_6a18e166-47de-407b-ba40-aaa714afacbc.sql#L24-L32).
  - Script de permissões do agendamento online liberando `configuracoes_agendamento_online`, `servicos`, `usuarios` com `USING (true)`: [fix_online_booking_permissions.sql](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/fix_online_booking_permissions.sql#L10-L71).
  - `produtos`: policy pública apenas `ativo = true` (sem filtro de tenant): [20260302_adding_produtos_public_and_online_sync.sql](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/migrations/20260302_adding_produtos_public_and_online_sync.sql#L18-L33).
- **Ação recomendada**:
  - Definir um mecanismo de “identidade do salão” no público (ex.: `salon_slug` passado por query, mapeado para `user_id`/tenant em uma tabela pública segura) e reescrever as policies para filtrar por tenant.
  - Evitar depender de claim JWT em `anon` (o token público normalmente não terá `salon_slug`).

### 2) `SUPABASE_SERVICE_ROLE_KEY` exposta no `.env.example`
- **Problema**: o arquivo contém um valor preenchido, que é segredo de servidor.
- **Referência**: [.env.example](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/.env.example#L6-L8)
- **Ação recomendada**:
  - Remover valor e substituir por placeholder.
  - Rotacionar a service role key no Supabase se ela já foi usada/compartilhada publicamente.

### 3) Edge Functions com escopo amplo / sem validação de JWT
- **Problema**: funções que disparam e-mail/push podem ser abusadas se não exigirem autenticação/ownership.
- **Indícios**:
  - `enviar-backup-email` aceita payload e envia e-mail sem checar JWT (alto risco de abuso/custo).
  - `enviar-notificacao-push` usa service role para operar e valida token manualmente (funciona, mas aumenta blast radius se houver bug).
- **Ação recomendada**:
  - Padronizar: funções “de usuário” devem exigir JWT e usar client com anon key + `Authorization` do request; service role só em webhooks/batch administrativos.

## P1 — Pagamento/Assinatura (consistência e redução de “paguei e não liberou”)

### 4) Dois webhooks concorrentes (Supabase Edge Function vs Express)
- **Problema**: existem duas implementações com regras diferentes; a depender da URL configurada na Cakto, pode liberar ou não liberar (ou nunca revogar).
- **Referências**:
  - Edge Function: [supabase/functions/cakto-webhook/index.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/functions/cakto-webhook/index.ts)
  - Express: [src/routes/payment.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/routes/payment.ts)
- **Ação recomendada**:
  - Escolher uma única implementação como “oficial” (recomendado: Edge Function).
  - Garantir que o checkout e o webhook usem o mesmo identificador (ex.: sempre `sck`).

### 5) Protocolo de vínculo pedido↔usuário inconsistente (`sck` vs `external_id`)
- **Problema**: checkout do frontend injeta `sck=<user_id>`; Express gera checkout com `external_id=<user_id>`.
- **Referências**:
  - `sck`: [cakto-webhook/index.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/functions/cakto-webhook/index.ts#L144-L159)
  - `external_id`: [payment.ts](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/routes/payment.ts#L67-L69)
- **Ação recomendada**:
  - Padronizar no checkout e no webhook (um só campo).
  - Manter fallback por e-mail apenas como contingência, não como caminho principal.

### 6) Retorno pós-pagamento duplicado (`/pagamento/retorno` vs `/payment/success` + lógica no Dashboard)
- **Problema**: múltiplos caminhos para “confirmar pagamento” causam drift e UX inconsistente.
- **Indícios**: rotas registradas simultaneamente em [App.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/App.tsx#L83-L84).
- **Ação recomendada**:
  - Definir 1 rota canônica de retorno que faça polling/validação e redirecione (ex.: manter `/pagamento/retorno`).
  - Fazer as demais rotas virarem alias/redirecionamento, ou remover.

## P2 — Trial/Acesso (reduzir duplicação e inconsistência)

### 7) Lógica de trial duplicada em várias telas
- **Problema**: cálculo de 7 dias repetido em `ProtectedRoute`, `Assinatura`, `Dashboard` (e possivelmente outros pontos).
- **Referência exemplo**: [ProtectedRoute.tsx](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/src/components/auth/ProtectedRoute.tsx#L113-L125)
- **Ação recomendada**:
  - Extrair para um único helper/hook (`useTrialStatus(usuario)`) e reutilizar.
  - Definir “fonte de verdade”: o banco deve marcar `trial_start_date` e o app só exibe/decide baseado nisso, sem variações.

### 8) Semântica de `subscription_status` divergente (inactive vs expired)
- **Problema**: há scripts que setam `inactive` ao expirar 7 dias e outros usando `expired` para bloqueio.
- **Ação recomendada**:
  - Definir convenção única de status (ex.: `trial` durante o teste; ao expirar, `expired`; `inactive` para cancelamento manual/assinatura cancelada).

## P3 — Schema/Migrations (estabilidade entre ambientes)

### 9) Mistura de `user_id` e `usuario_id` em SQL/migrations
- **Problema**: existem trechos que claramente usam colunas diferentes para o mesmo conceito. Isso causa migração “passar” num ambiente e falhar noutro.
- **Referência**: [20260302_adding_produtos_public_and_online_sync.sql](file:///d:/IMPORTANTE/TRABALHOS%20DE%20PROGRAMA%C3%87%C3%83O/SALAO%20DE%20BOLSO/lilac-luxe-salon-100-main/supabase/migrations/20260302_adding_produtos_public_and_online_sync.sql#L68-L86)
- **Ação recomendada**:
  - Fazer uma auditoria de schema real do banco de produção e alinhar todas as migrations para um único padrão (`user_id`).
  - Mover SQL antigos/dumps para `docs/legacy/` com aviso (evitar aplicação acidental).

### 10) `handle_new_user_signup()` redefinida muitas vezes
- **Problema**: múltiplas definições divergentes no repo tornam o comportamento dependente de ordem de aplicação.
- **Evidência**: 11 arquivos com definição/uso encontrados no repo.
- **Ação recomendada**:
  - Consolidar em 1 migration “definitiva” e remover/arquivar as demais versões.

## P4 — Higiene de código (manutenibilidade e redução de regressões)

### 11) ESLint está muito “vermelho” (muitos `any` + hooks deps)
- **Problema**: o lint hoje não funciona como guardrail (tem erro demais para ser acionável).
- **Evidência**: `npm run lint` retorna centenas de erros, incluindo `src` e `supabase/functions`.
- **Ação recomendada**:
  - Separar lint de frontend vs supabase functions (configs diferentes).
  - Fazer um plano incremental: primeiro reduzir `any` nos módulos mais críticos (auth/pagamento/supabase clients).

### 12) Rotas/páginas de teste e páginas não roteadas
- **Problema**: aumenta superfície de manutenção e pode expor telas internas.
- **Ação recomendada**:
  - Remover rotas de teste do build de produção (ou proteger por flag).
  - Remover/arquivar páginas não usadas, ou recolocá-las no roteamento oficialmente.

