-- ==============================================================================
-- SQL DE CORREÇÃO: VISIBILIDADE DE HORÁRIOS NO AGENDAMENTO ONLINE
-- ==============================================================================
-- Este script garante que o público possa ver os horários disponíveis,
-- liberando permissões nas tabelas de configuração e funções de busca.
-- ==============================================================================

BEGIN;

-- 1. Garantir que as tabelas de horários tenham RLS e políticas públicas
ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view schedules" ON public.configuracoes_horarios;
CREATE POLICY "Public view schedules" ON public.configuracoes_horarios 
FOR SELECT TO anon, public USING (ativo = true);

DROP POLICY IF EXISTS "Public view work intervals" ON public.intervalos_trabalho;
CREATE POLICY "Public view work intervals" ON public.intervalos_trabalho 
FOR SELECT TO anon, public USING (ativo = true);

-- 2. Garantir permissões de acesso (GRANT)
GRANT SELECT ON TABLE public.configuracoes_horarios TO anon, public;
GRANT SELECT ON TABLE public.intervalos_trabalho TO anon, public;
GRANT SELECT ON TABLE public.agendamentos TO anon, public; -- Necessário para checar conflitos

-- 3. Liberar execução das funções RPC de busca de horários
-- Substitua os nomes se suas funções forem diferentes
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_time_slots(text, date, uuid) TO anon, public;

COMMIT;
