-- Melhorias na sincronização automática de pontos de fidelidade

-- 1. Recriar view ranking_fidelidade com mais informações
DROP VIEW IF EXISTS public.ranking_fidelidade;

CREATE OR REPLACE VIEW public.ranking_fidelidade
WITH (security_invoker=true) AS
SELECT 
  pf.id,
  pf.user_id,
  pf.cliente_id,
  pf.programa_id,
  c.nome AS cliente_nome,
  c.telefone AS cliente_telefone,
  c.email AS cliente_email,
  pf.pontos_totais,
  pf.pontos_disponiveis,
  pf.pontos_resgatados,
  pf.nivel,
  pf.created_at,
  ROW_NUMBER() OVER (PARTITION BY pf.user_id ORDER BY pf.pontos_totais DESC) AS posicao_ranking
FROM public.pontos_fidelidade pf
JOIN public.clientes c ON c.id = pf.cliente_id
WHERE pf.pontos_totais > 0
ORDER BY pf.pontos_totais DESC;

-- 2. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pontos_fidelidade_user_programa 
  ON public.pontos_fidelidade(user_id, programa_id);

CREATE INDEX IF NOT EXISTS idx_pontos_fidelidade_pontos_totais 
  ON public.pontos_fidelidade(pontos_totais DESC);

CREATE INDEX IF NOT EXISTS idx_historico_pontos_agendamento 
  ON public.historico_pontos(agendamento_id) 
  WHERE agendamento_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agendamentos_status_data 
  ON public.agendamentos(user_id, status, data DESC);

-- 3. Função para calcular pontos com multiplicador baseado no nível
CREATE OR REPLACE FUNCTION public.calcular_pontos_com_nivel(
  p_valor numeric,
  p_pontos_por_real numeric,
  p_nivel text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_multiplicador numeric := 1.0;
  v_pontos integer;
BEGIN
  -- Buscar multiplicador baseado no nível
  CASE p_nivel
    WHEN 'prata' THEN v_multiplicador := 1.2;
    WHEN 'ouro' THEN v_multiplicador := 1.5;
    WHEN 'platina' THEN v_multiplicador := 2.0;
    ELSE v_multiplicador := 1.0; -- bronze
  END CASE;
  
  -- Calcular pontos
  v_pontos := FLOOR(p_valor * p_pontos_por_real * v_multiplicador);
  
  RETURN v_pontos;
END;
$$;

-- 4. View para agendamentos que precisam atribuir pontos
CREATE OR REPLACE VIEW public.agendamentos_sem_pontos
WITH (security_invoker=true) AS
SELECT 
  a.id AS agendamento_id,
  a.user_id,
  a.cliente_id,
  a.servico_id,
  a.data,
  a.valor,
  c.nome AS cliente_nome,
  s.nome AS servico_nome,
  pf.programa_id,
  pr.pontos_por_real,
  COALESCE(pf.nivel, 'bronze') AS nivel_atual
FROM public.agendamentos a
JOIN public.clientes c ON c.id = a.cliente_id
JOIN public.servicos s ON s.id = a.servico_id
LEFT JOIN public.pontos_fidelidade pf ON pf.cliente_id = a.cliente_id AND pf.user_id = a.user_id
LEFT JOIN public.programas_fidelidade pr ON pr.user_id = a.user_id AND pr.ativo = true
WHERE a.status = 'concluido'
  AND pr.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.historico_pontos hp 
    WHERE hp.agendamento_id = a.id 
      AND hp.programa_id = pr.id
  )
ORDER BY a.data DESC;

-- 5. Adicionar comentários para documentação
COMMENT ON VIEW public.ranking_fidelidade IS 
  'View com ranking de clientes por pontos de fidelidade, ordenado por pontos totais';

COMMENT ON VIEW public.agendamentos_sem_pontos IS 
  'View que identifica agendamentos concluídos que ainda não geraram pontos de fidelidade';

COMMENT ON FUNCTION public.calcular_pontos_com_nivel IS 
  'Calcula pontos de fidelidade aplicando multiplicador baseado no nível do cliente';