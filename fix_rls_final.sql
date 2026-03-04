-- SCRIPT FINAL E CONSOLIDADO DE CORREÇÃO DE PERMISSÕES
-- Execute este script inteiro no Editor SQL do Supabase.
-- Ele remove as políticas antigas antes de criar as novas para evitar o erro "policy already exists".

-- ==============================================================================
-- 1. TABELA AGENDAMENTOS_ONLINE
-- ==============================================================================
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar erro "policy already exists"
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir acesso total para autenticados" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir modificação para usuários autenticados" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Permitir inserção para todos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agendamentos_online;

-- Criar novas políticas
CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos_online
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir acesso total para autenticados"
ON public.agendamentos_online
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 2. TABELA SERVICOS (Necessária para validar FK na criação do agendamento)
-- ==============================================================================
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de serviços" ON public.servicos;

CREATE POLICY "Permitir leitura pública de serviços"
ON public.servicos
FOR SELECT
TO public
USING (true);


-- ==============================================================================
-- 3. TABELA CLIENTES (Necessária se o agendamento criar/buscar cliente)
-- ==============================================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir criação de clientes por todos" ON public.clientes;

CREATE POLICY "Permitir leitura pública de clientes"
ON public.clientes
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir criação de clientes por todos"
ON public.clientes
FOR INSERT
TO public
WITH CHECK (true);


-- ==============================================================================
-- 4. TABELA PRODUTOS (Caso haja validação ou trigger envolvendo produtos)
-- ==============================================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de produtos" ON public.produtos;

CREATE POLICY "Permitir leitura pública de produtos"
ON public.produtos
FOR SELECT
TO public
USING (true);
