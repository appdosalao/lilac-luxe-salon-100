-- Primeiro, vamos limpar dados inconsistentes
-- Cancelar agendamentos online que têm servico_id null
UPDATE public.agendamentos_online 
SET status = 'cancelado' 
WHERE servico_id IS NULL AND status != 'cancelado';

-- Agora vamos criar uma constraint para evitar a exclusão de serviços com agendamentos online ativos
-- Função para verificar se um serviço pode ser excluído
CREATE OR REPLACE FUNCTION public.check_servico_delete_constraint()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se existem agendamentos online ativos usando este serviço
    IF EXISTS (
        SELECT 1 FROM public.agendamentos_online 
        WHERE servico_id = OLD.id 
        AND status IN ('pendente', 'confirmado')
    ) THEN
        RAISE EXCEPTION 'Não é possível excluir este serviço. Existem agendamentos online ativos que o utilizam. Cancele ou converta os agendamentos primeiro.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS servico_delete_constraint ON public.servicos;
CREATE TRIGGER servico_delete_constraint
    BEFORE DELETE ON public.servicos
    FOR EACH ROW
    EXECUTE FUNCTION public.check_servico_delete_constraint();

-- Alternativamente, vamos criar uma função para cancelar agendamentos online quando um serviço for excluído
CREATE OR REPLACE FUNCTION public.handle_servico_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Cancelar todos os agendamentos online que usam este serviço
    UPDATE public.agendamentos_online 
    SET status = 'cancelado',
        observacoes = COALESCE(observacoes, '') || ' - Serviço foi removido pelo estabelecimento'
    WHERE servico_id = OLD.id 
    AND status IN ('pendente', 'confirmado');
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Substituir o trigger anterior por este
DROP TRIGGER IF EXISTS servico_delete_constraint ON public.servicos;
CREATE TRIGGER handle_servico_deletion_trigger
    BEFORE DELETE ON public.servicos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_servico_deletion();