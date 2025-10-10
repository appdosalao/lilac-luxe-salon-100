-- Criar view otimizada para estatísticas de marketing
CREATE OR REPLACE VIEW estatisticas_marketing AS
SELECT 
  u.id AS user_id,
  
  -- Total de clientes
  (SELECT COUNT(*) FROM clientes WHERE user_id = u.id) AS total_clientes,
  
  -- Programas de fidelidade ativos
  (SELECT COUNT(*) FROM programas_fidelidade WHERE user_id = u.id AND ativo = true) AS programas_ativos,
  
  -- Total de pontos distribuídos
  (SELECT COALESCE(SUM(pontos_totais), 0) FROM pontos_fidelidade WHERE user_id = u.id) AS total_pontos_distribuidos,
  
  -- Pontos disponíveis
  (SELECT COALESCE(SUM(pontos_disponiveis), 0) FROM pontos_fidelidade WHERE user_id = u.id) AS pontos_disponiveis,
  
  -- Pontos resgatados
  (SELECT COALESCE(SUM(pontos_resgatados), 0) FROM pontos_fidelidade WHERE user_id = u.id) AS pontos_resgatados,
  
  -- Clientes com pontos
  (SELECT COUNT(DISTINCT cliente_id) FROM pontos_fidelidade WHERE user_id = u.id AND pontos_totais > 0) AS clientes_com_pontos,
  
  -- Distribuição por nível
  (SELECT COUNT(*) FROM pontos_fidelidade WHERE user_id = u.id AND nivel = 'bronze') AS clientes_bronze,
  (SELECT COUNT(*) FROM pontos_fidelidade WHERE user_id = u.id AND nivel = 'prata') AS clientes_prata,
  (SELECT COUNT(*) FROM pontos_fidelidade WHERE user_id = u.id AND nivel = 'ouro') AS clientes_ouro,
  (SELECT COUNT(*) FROM pontos_fidelidade WHERE user_id = u.id AND nivel = 'platina') AS clientes_platina

FROM usuarios u;

-- Adicionar RLS policy para a view
ALTER VIEW estatisticas_marketing SET (security_invoker = true);

-- Comentário explicativo
COMMENT ON VIEW estatisticas_marketing IS 'View otimizada para dashboard de marketing com todas as estatísticas consolidadas';