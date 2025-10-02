-- Remove configurações duplicadas, mantendo apenas a mais recente para cada dia
-- Isso resolve o problema de não conseguir agendar no horário 13:00

-- Primeiro, vamos identificar as configurações que devem ser mantidas (as mais recentes)
WITH configuracoes_unicas AS (
  SELECT DISTINCT ON (user_id, dia_semana) 
    id
  FROM configuracoes_horarios
  WHERE ativo = true
  ORDER BY user_id, dia_semana, updated_at DESC
)
-- Desativar todas as configurações duplicadas (que não estão na lista de únicas)
UPDATE configuracoes_horarios
SET ativo = false
WHERE ativo = true 
  AND id NOT IN (SELECT id FROM configuracoes_unicas);

-- Adicionar constraint para evitar duplicatas no futuro
-- Isso garante que cada usuário tenha apenas uma configuração ativa por dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_config_per_day 
ON configuracoes_horarios (user_id, dia_semana) 
WHERE ativo = true;