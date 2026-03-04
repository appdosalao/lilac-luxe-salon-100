-- CORREÇÃO DE PERMISSÕES (RLS) PARA AGENDAMENTOS - VERSÃO CORRIGIDA
-- Execute este script no Editor SQL do Supabase.
-- Removemos a parte que causou erro na view 'servicos_public'.

-- 1. Habilitar RLS na tabela agendamentos_online
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos (Removemos várias versões de nomes possíveis)
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir modificação para usuários autenticados" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir inserção para todos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agendamentos_online;

-- 3. NOVA LEI: Permitir que QUALQUER UM crie um agendamento
-- Isso resolve o erro "new row violates row-level security policy" na criação
CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos_online
FOR INSERT
TO public
WITH CHECK (true);

-- 4. NOVA LEI: Permitir que VOCÊ (autenticado) veja e gerencie tudo
CREATE POLICY "Permitir acesso total para autenticados"
ON public.agendamentos_online
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- NOTA: Não é necessário aplicar RLS na view 'servicos_public', pois ela herda ou encapsula permissões.
