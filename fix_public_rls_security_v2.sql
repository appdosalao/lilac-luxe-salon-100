-- ==============================================================================
-- CORREÇÃO DE SEGURANÇA V2: POLÍTICAS RLS PÚBLICAS (COMPATÍVEL COM ANON)
-- ==============================================================================
-- O uso de current_setting('request.jwt.claims', true) falha para usuários
-- anônimos no Supabase. Esta versão utiliza a relação entre tabelas para
-- permitir a leitura pública apenas se o salão tiver o agendamento online ativo.
-- ==============================================================================

BEGIN;

-- 1. Correção para a tabela de SERVIÇOS
DROP POLICY IF EXISTS "Public select services" ON public.servicos;
DROP POLICY IF EXISTS "Public can view active services" ON public.servicos;

CREATE POLICY "Public select services" 
ON public.servicos FOR SELECT 
TO anon 
USING (EXISTS ( 
  SELECT 1 FROM public.configuracoes_agendamento_online 
  WHERE user_id = servicos.user_id 
  AND ativo = true
));

-- 2. Correção para a tabela de AGENDAMENTOS ONLINE
DROP POLICY IF EXISTS "Public select online" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Public can view availability" ON public.agendamentos_online;

CREATE POLICY "Public select online" 
ON public.agendamentos_online FOR SELECT 
TO anon 
USING (EXISTS ( 
  SELECT 1 FROM public.configuracoes_agendamento_online 
  WHERE user_id = (SELECT user_id FROM public.servicos s WHERE s.id = agendamentos_online.servico_id)
  AND ativo = true
));

COMMIT;
