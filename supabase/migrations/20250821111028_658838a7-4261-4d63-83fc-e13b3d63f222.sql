-- Verificar e remover trigger problemático
DROP TRIGGER IF EXISTS trigger_delete_agendamento ON public.agendamentos_online;

-- Verificar se há função relacionada e removê-la se necessário  
DROP FUNCTION IF EXISTS public.sync_delete_agendamento() CASCADE;