-- Adicionar políticas RLS para a view ranking_fidelidade
-- A view precisa de policies na tabela base (pontos_fidelidade)

-- Atualizar funções com search_path seguro
ALTER FUNCTION calcular_nivel_cliente(uuid, integer) 
SET search_path = public;

ALTER FUNCTION atualizar_nivel_cliente() 
SET search_path = public;

ALTER FUNCTION aplicar_expiracao_pontos() 
SET search_path = public;

-- Recriar view ranking_fidelidade com SECURITY INVOKER (mais seguro)
DROP VIEW IF EXISTS ranking_fidelidade;
CREATE VIEW ranking_fidelidade 
WITH (security_invoker = true) AS
SELECT 
  pf.id,
  pf.cliente_id,
  pf.programa_id,
  pf.user_id,
  pf.pontos_totais,
  pf.pontos_disponiveis,
  pf.nivel,
  c.nome as cliente_nome,
  c.email as cliente_email,
  c.telefone as cliente_telefone,
  ROW_NUMBER() OVER (PARTITION BY pf.programa_id ORDER BY pf.pontos_totais DESC) as posicao_ranking
FROM pontos_fidelidade pf
JOIN clientes c ON c.id = pf.cliente_id
WHERE pf.pontos_disponiveis > 0
ORDER BY pf.pontos_totais DESC;

-- Comentário explicativo sobre a view
COMMENT ON VIEW ranking_fidelidade IS 'View com security_invoker para ranking de clientes por programa de fidelidade. As permissões são aplicadas através das tabelas base (pontos_fidelidade e clientes).';