-- CORREÇÃO DE PERMISSÕES PARA AGENDAMENTO ONLINE (ACESSO PÚBLICO)
-- Este script garante que usuários não autenticados (clientes) possam:
-- 1. Ver informações do salão e serviços.
-- 2. Consultar horários disponíveis.
-- 3. Criar agendamentos online.

-- ==============================================================================
-- 1. PERMISSÕES PARA CONFIGURAÇÕES DE AGENDAMENTO (INFO DO SALÃO)
-- ==============================================================================
ALTER TABLE public.configuracoes_agendamento_online ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view online booking configs" ON public.configuracoes_agendamento_online;

CREATE POLICY "Public can view online booking configs"
ON public.configuracoes_agendamento_online
FOR SELECT
TO anon, authenticated
USING (true);

-- ==============================================================================
-- 2. PERMISSÕES PARA SERVIÇOS (VITRINE)
-- ==============================================================================
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view services" ON public.servicos;
DROP POLICY IF EXISTS "servicos_public_select" ON public.servicos;

CREATE POLICY "Public can view services"
ON public.servicos
FOR SELECT
TO anon, authenticated
USING (true);

-- ==============================================================================
-- 3. PERMISSÕES PARA CONFIGURAÇÕES DE HORÁRIOS (DISPONIBILIDADE)
-- ==============================================================================
ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;

-- Restaurar acesso público que foi removido anteriormente
DROP POLICY IF EXISTS "Public can view schedule configs" ON public.configuracoes_horarios;

CREATE POLICY "Public can view schedule configs"
ON public.configuracoes_horarios
FOR SELECT
TO anon, authenticated
USING (ativo = true);

-- Permissões para intervalos de trabalho (se usado)
ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view work intervals" ON public.intervalos_trabalho;

CREATE POLICY "Public can view work intervals"
ON public.intervalos_trabalho
FOR SELECT
TO anon, authenticated
USING (ativo = true);

-- ==============================================================================
-- 4. PERMISSÕES PARA USUÁRIOS (PERFIL PÚBLICO BÁSICO)
-- ==============================================================================
-- Necessário porque o frontend busca o ID do usuário para carregar configs
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view basic user info" ON public.usuarios;

CREATE POLICY "Public can view basic user info"
ON public.usuarios
FOR SELECT
TO anon
USING (true); -- Permite que o frontend encontre o usuário dono do salão

-- ==============================================================================
-- 5. PERMISSÕES PARA AGENDAMENTOS ONLINE (CRIAÇÃO)
-- ==============================================================================
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create online appointments" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Anyone can create online appointments" ON public.agendamentos_online;

CREATE POLICY "Public can create online appointments"
ON public.agendamentos_online
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política de leitura restrita para evitar exposição de dados (apenas disponibilidade)
DROP POLICY IF EXISTS "Public can check availability" ON public.agendamentos_online;

CREATE POLICY "Public can check availability"
ON public.agendamentos_online
FOR SELECT
TO anon
USING (
  -- Permite ver apenas agendamentos pendentes/confirmados futuros para cálculo de choque de horário
  (status IN ('pendente', 'confirmado') AND data >= CURRENT_DATE)
);

-- ==============================================================================
-- 6. PERMISSÕES PARA FUNÇÕES RPC
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trial_status(uuid) TO anon; -- Necessário se o frontend verificar algo
