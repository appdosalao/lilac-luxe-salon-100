-- ==============================================================================
-- SQL DE DIAGNÓSTICO PROFUNDO: AGENDAMENTO ONLINE
-- ==============================================================================
-- Este script não altera nada, apenas investiga o estado atual do banco
-- para descobrirmos o que está impedindo o agendamento.
-- ==============================================================================

-- 1. Verificar se as tabelas existem e têm as colunas corretas
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agendamentos_online', 'agendamentos', 'clientes')
ORDER BY table_name, column_name;

-- 2. Verificar políticas de RLS ativas
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('agendamentos_online', 'clientes', 'servicos');

-- 3. Verificar Triggers ativas (especialmente as de sincronização)
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    event_manipulation AS event, 
    action_statement AS action,
    action_timing AS timing
FROM information_schema.triggers 
WHERE event_object_table IN ('agendamentos_online', 'agendamentos');

-- 4. Verificar Constraints (Check, Foreign Key, Not Null) que podem estar bloqueando
SELECT 
    conrelid::regclass AS table_name, 
    conname AS constraint_name, 
    contype AS type, 
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint 
WHERE conrelid::regclass::text IN ('public.agendamentos_online', 'public.agendamentos', 'public.clientes');

-- 5. Verificar permissões de GRANT para a role 'anon'
SELECT 
    grantee, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('agendamentos_online', 'clientes', 'servicos')
AND grantee IN ('anon', 'public');
