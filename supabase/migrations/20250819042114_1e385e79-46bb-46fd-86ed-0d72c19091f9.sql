-- Criar foreign keys para relacionamentos entre tabelas
-- Adicionar constraints de chave estrangeira para cronogramas_novos
ALTER TABLE public.cronogramas_novos 
ADD CONSTRAINT fk_cronogramas_cliente 
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

ALTER TABLE public.cronogramas_novos 
ADD CONSTRAINT fk_cronogramas_servico 
FOREIGN KEY (servico_id) REFERENCES public.servicos(id) ON DELETE CASCADE;

-- Adicionar constraints de chave estrangeira para retornos_novos
ALTER TABLE public.retornos_novos 
ADD CONSTRAINT fk_retornos_cliente 
FOREIGN KEY (id_cliente) REFERENCES public.clientes(id) ON DELETE CASCADE;

ALTER TABLE public.retornos_novos 
ADD CONSTRAINT fk_retornos_cronograma 
FOREIGN KEY (id_cronograma) REFERENCES public.cronogramas_novos(id_cronograma) ON DELETE CASCADE;

-- Opcional: relacionar retorno com agendamento se existir
ALTER TABLE public.retornos_novos 
ADD CONSTRAINT fk_retornos_agendamento 
FOREIGN KEY (id_agendamento_retorno) REFERENCES public.agendamentos(id) ON DELETE SET NULL;

-- Habilitar replica identity para real-time updates
ALTER TABLE public.cronogramas_novos REPLICA IDENTITY FULL;
ALTER TABLE public.retornos_novos REPLICA IDENTITY FULL;
ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER TABLE public.servicos REPLICA IDENTITY FULL;
ALTER TABLE public.agendamentos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cronogramas_novos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retornos_novos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.servicos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;

-- Criar view para cronogramas com dados relacionados
CREATE OR REPLACE VIEW public.cronogramas_completos AS
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
LEFT JOIN public.clientes cl ON c.cliente_id = cl.id
LEFT JOIN public.servicos s ON c.servico_id = s.id
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

-- Criar view para retornos com dados relacionados
CREATE OR REPLACE VIEW public.retornos_completos AS
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
LEFT JOIN public.clientes cl ON r.id_cliente = cl.id
LEFT JOIN public.cronogramas_novos c ON r.id_cronograma = c.id_cronograma
LEFT JOIN public.agendamentos a ON r.id_agendamento_retorno = a.id;