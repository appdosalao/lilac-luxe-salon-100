-- CORREÇÃO DE DEPENDÊNCIAS DE RLS (Foreign Keys e Triggers)
-- Execute este script no Editor SQL do Supabase.

-- O erro "new row violates row-level security policy" muitas vezes ocorre porque
-- a inserção verifica uma Chave Estrangeira (servico_id) em uma tabela que o usuário não pode ler.

-- 1. Liberar LEITURA pública na tabela de SERVIÇOS (Necessário para validar o ID do serviço)
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de serviços"
ON public.servicos
FOR SELECT
TO public
USING (true);

-- 2. Liberar criação de CLIENTES (Se houver trigger criando cliente automaticamente)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

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

-- 3. Reforçar permissão na tabela AGENDAMENTOS_ONLINE
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.agendamentos_online;

CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos_online
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Garantir que a tabela de PRODUTOS também seja legível (caso seja usada em validações)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de produtos"
ON public.produtos
FOR SELECT
TO public
USING (true);
