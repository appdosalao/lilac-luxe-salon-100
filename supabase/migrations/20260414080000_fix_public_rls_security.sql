-- Migration: Fix Public RLS Security (Anti Cross-Tenant)
-- Created at: 2026-04-14

BEGIN;

-- 1. Correção para a tabela de SERVIÇOS
DROP POLICY IF EXISTS "Public select services" ON public.servicos;
DROP POLICY IF EXISTS "Public can view active services" ON public.servicos;
DROP POLICY IF EXISTS "servicos_public_select" ON public.servicos;

CREATE POLICY "Public select services" 
ON public.servicos FOR SELECT 
TO anon 
USING (user_id = ( 
  SELECT user_id FROM public.configuracoes_agendamento_online 
  WHERE public_id = current_setting('request.jwt.claims', true)::json->>'salon_slug' 
  AND ativo = true
  LIMIT 1 
));

-- 2. Correção para a tabela de AGENDAMENTOS ONLINE
DROP POLICY IF EXISTS "Public select online" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Public can view availability" ON public.agendamentos_online;

CREATE POLICY "Public select online" 
ON public.agendamentos_online FOR SELECT 
TO anon 
USING ( (
  SELECT user_id FROM public.servicos s WHERE s.id = agendamentos_online.servico_id
) = ( 
  SELECT user_id FROM public.configuracoes_agendamento_online 
  WHERE public_id = current_setting('request.jwt.claims', true)::json->>'salon_slug' 
  AND ativo = true
  LIMIT 1 
));

COMMIT;
