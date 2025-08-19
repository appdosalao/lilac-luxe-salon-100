-- Primeiro, vamos alterar a constraint para permitir SET NULL em vez de restringir
-- Isso permitirá que o serviço seja excluído e os agendamentos online ficarão com servico_id = NULL

-- Remover a constraint existente
ALTER TABLE public.agendamentos_online 
DROP CONSTRAINT IF EXISTS agendamentos_online_servico_id_fkey;

-- Recriar a constraint com ON DELETE SET NULL
ALTER TABLE public.agendamentos_online 
ADD CONSTRAINT agendamentos_online_servico_id_fkey 
FOREIGN KEY (servico_id) 
REFERENCES public.servicos(id) 
ON DELETE SET NULL;