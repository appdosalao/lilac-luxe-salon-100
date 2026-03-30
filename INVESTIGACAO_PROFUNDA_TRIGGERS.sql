-- INVESTIGAR TODOS OS TRIGGERS NA TABELA AGENDAMENTOS_ONLINE
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    event_manipulation AS event, 
    action_statement AS action,
    action_timing AS timing
FROM information_schema.triggers 
WHERE event_object_table = 'agendamentos_online';

-- INVESTIGAR TODAS AS FUNÇÕES QUE PODEM CONTER 'owner_user_id'
SELECT 
    proname AS function_name, 
    prosrc AS function_body
FROM pg_proc 
WHERE prosrc ILIKE '%owner_user_id%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
