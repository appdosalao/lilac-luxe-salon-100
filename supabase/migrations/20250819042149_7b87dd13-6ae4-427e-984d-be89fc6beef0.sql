-- Corrigir problemas de segurança das views
-- Recriar views sem SECURITY DEFINER e adicionar RLS policies

-- Remover views antigas
DROP VIEW IF EXISTS public.cronogramas_completos;
DROP VIEW IF EXISTS public.retornos_completos;

-- Criar views normais sem SECURITY DEFINER
CREATE VIEW public.cronogramas_completos AS
SELECT 
    c.id_cronograma,
    c.user_id,
    c.cliente_id,
    c.cliente_nome,
    c.servico_id,
    c.tipo_servico,
    c.data_inicio,
    c.hora_inicio,
    c.duracao_minutos,
    c.recorrencia,
    c.intervalo_dias,
    c.observacoes,
    c.status,
    c.created_at,
    c.updated_at,
    -- Dados do cliente
    cl.nome as cliente_nome_real,
    cl.telefone as cliente_telefone,
    cl.email as cliente_email,
    -- Dados do serviço
    s.nome as servico_nome_real,
    s.valor as servico_valor,
    s.duracao as servico_duracao,
    -- Contagem de retornos
    COALESCE(r.total_retornos, 0) as total_retornos,
    COALESCE(r.retornos_pendentes, 0) as retornos_pendentes,
    COALESCE(r.retornos_realizados, 0) as retornos_realizados,
    r.proximo_retorno
FROM public.cronogramas_novos c
LEFT JOIN public.clientes cl ON c.cliente_id = cl.id AND cl.user_id = c.user_id
LEFT JOIN public.servicos s ON c.servico_id = s.id AND s.user_id = c.user_id
LEFT JOIN (
    SELECT 
        id_cronograma,
        COUNT(*) as total_retornos,
        COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as retornos_pendentes,
        COUNT(CASE WHEN status = 'Realizado' THEN 1 END) as retornos_realizados,
        MIN(CASE WHEN status = 'Pendente' THEN data_retorno END) as proximo_retorno
    FROM public.retornos_novos
    GROUP BY id_cronograma
) r ON c.id_cronograma = r.id_cronograma;

CREATE VIEW public.retornos_completos AS
SELECT 
    r.id_retorno,
    r.user_id,
    r.id_cliente,
    r.id_cronograma,
    r.data_retorno,
    r.status,
    r.id_agendamento_retorno,
    r.created_at,
    r.updated_at,
    -- Dados do cliente
    cl.nome as cliente_nome,
    cl.telefone as cliente_telefone,
    -- Dados do cronograma
    c.tipo_servico,
    c.hora_inicio,
    c.recorrencia,
    -- Dados do agendamento relacionado (se existir)
    a.data as agendamento_data,
    a.hora as agendamento_hora,
    a.status as agendamento_status
FROM public.retornos_novos r
LEFT JOIN public.clientes cl ON r.id_cliente = cl.id AND cl.user_id = r.user_id
LEFT JOIN public.cronogramas_novos c ON r.id_cronograma = c.id_cronograma AND c.user_id = r.user_id
LEFT JOIN public.agendamentos a ON r.id_agendamento_retorno = a.id AND a.user_id = r.user_id;

-- Habilitar RLS nas views
ALTER VIEW public.cronogramas_completos SET (security_barrier = true);
ALTER VIEW public.retornos_completos SET (security_barrier = true);