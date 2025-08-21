-- Corrigir configurações de horário para todos os dias da semana
UPDATE configuracoes_horarios 
SET ativo = true 
WHERE user_id IN (SELECT id FROM usuarios);

-- Inserir configurações faltantes para todos os dias da semana para todos os usuários
INSERT INTO configuracoes_horarios (user_id, dia_semana, horario_abertura, horario_fechamento, intervalo_inicio, intervalo_fim, ativo)
SELECT 
  u.id,
  s.dia_semana,
  '08:00:00'::time as horario_abertura,
  '18:00:00'::time as horario_fechamento,
  '12:00:00'::time as intervalo_inicio,
  '13:00:00'::time as intervalo_fim,
  true as ativo
FROM usuarios u
CROSS JOIN (SELECT generate_series(0, 6) as dia_semana) s
WHERE NOT EXISTS (
  SELECT 1 FROM configuracoes_horarios ch 
  WHERE ch.user_id = u.id AND ch.dia_semana = s.dia_semana
)
ON CONFLICT (user_id, dia_semana) DO NOTHING;