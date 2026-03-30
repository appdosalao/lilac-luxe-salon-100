-- ==============================================================================
-- SQL DE EMERGÊNCIA: RESTAURAR ACESSO À CONTA (TABELA USUÁRIOS)
-- ==============================================================================
-- Este script corrige a política da tabela 'usuarios' que foi removida 
-- indevidamente, permitindo que você volte a fazer login no sistema.
-- ==============================================================================

BEGIN;

-- 1. Garantir RLS habilitado na tabela de usuários
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Remover qualquer política residual que possa estar bloqueando
DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON public.usuarios;
DROP POLICY IF EXISTS "Owner access usuarios" ON public.usuarios;

-- 3. Criar a política correta (Usando ID pois usuários não têm user_id, eles SÃO o ID)
CREATE POLICY "usuarios_access_policy" ON public.usuarios
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Garantir permissão de leitura pública limitada (necessária para alguns fluxos de login)
CREATE POLICY "usuarios_public_read" ON public.usuarios
    FOR SELECT
    TO anon, public
    USING (true);

-- 5. Garantir permissões de acesso (GRANT)
GRANT ALL ON TABLE public.usuarios TO authenticated;
GRANT SELECT ON TABLE public.usuarios TO anon, public;

COMMIT;
