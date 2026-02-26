-- Melhorar a função de buscar horários para considerar corretamente conflitos de duração
CREATE OR REPLACE FUNCTION public.buscar_horarios_com_multiplos_intervalos(
  data_selecionada date, 
  user_id_param uuid, 
  duracao_servico integer DEFAULT 30
)
RETURNS TABLE(horario time without time zone, disponivel boolean, bloqueio_motivo text)
LANGUAGE plpgsql
AS $function$
DECLARE
  config_horario RECORD;
  horario_atual time;
  horario_fim_servico time;
  dia_semana_param integer;
BEGIN
  -- Obter dia da semana (0=domingo, 6=sábado)
  dia_semana_param := EXTRACT(DOW FROM data_selecionada);
  
  -- Buscar configuração de horário para o dia
  SELECT * INTO config_horario
  FROM configuracoes_horarios
  WHERE user_id = user_id_param 
    AND dia_semana = dia_semana_param 
    AND ativo = true;
    
  -- Se não há configuração, não há horários disponíveis
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Gerar horários de 30 em 30 minutos
  horario_atual := config_horario.horario_abertura;
  
  WHILE horario_atual + (duracao_servico || ' minutes')::interval <= config_horario.horario_fechamento LOOP
    horario_fim_servico := horario_atual + (duracao_servico || ' minutes')::interval;
    
    -- Verificar se está em algum intervalo de almoço (da configuração original)
    IF config_horario.intervalo_inicio IS NOT NULL 
       AND config_horario.intervalo_fim IS NOT NULL
       AND (
         (horario_atual >= config_horario.intervalo_inicio AND horario_atual < config_horario.intervalo_fim) OR
         (horario_fim_servico > config_horario.intervalo_inicio AND horario_fim_servico <= config_horario.intervalo_fim) OR
         (horario_atual < config_horario.intervalo_inicio AND horario_fim_servico > config_horario.intervalo_fim)
       ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo de almoço'::text;
    
    -- Verificar se está em algum intervalo personalizado
    ELSIF EXISTS (
      SELECT 1 FROM intervalos_trabalho it
      WHERE it.user_id = user_id_param
        AND it.dia_semana = dia_semana_param
        AND it.ativo = true
        AND (
          (horario_atual >= it.hora_inicio AND horario_atual < it.hora_fim) OR
          (horario_fim_servico > it.hora_inicio AND horario_fim_servico <= it.hora_fim) OR
          (horario_atual < it.hora_inicio AND horario_fim_servico > it.hora_fim)
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo personalizado'::text;
    
    -- Verificar conflitos com agendamentos regulares (considerando duração)
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.user_id = user_id_param
        AND a.data = data_selecionada
        AND a.status NOT IN ('cancelado', 'reagendado')
        AND (
          -- Novo agendamento começa durante um existente
          (horario_atual >= a.hora AND horario_atual < (a.hora + (a.duracao * interval '1 minute'))) OR
          -- Novo agendamento termina durante um existente
          (horario_fim_servico > a.hora AND horario_fim_servico <= (a.hora + (a.duracao * interval '1 minute'))) OR
          -- Novo agendamento engloba um existente
          (horario_atual < a.hora AND horario_fim_servico > (a.hora + (a.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento regular'::text;
    
    -- Verificar conflitos com agendamentos online (considerando duração)
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos_online ao
      WHERE ao.data = data_selecionada
        AND ao.status IN ('pendente', 'confirmado')
        AND (
          -- Novo agendamento começa durante um existente
          (horario_atual >= ao.horario AND horario_atual < (ao.horario + (ao.duracao * interval '1 minute'))) OR
          -- Novo agendamento termina durante um existente
          (horario_fim_servico > ao.horario AND horario_fim_servico <= (ao.horario + (ao.duracao * interval '1 minute'))) OR
          -- Novo agendamento engloba um existente
          (horario_atual < ao.horario AND horario_fim_servico > (ao.horario + (ao.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento online'::text;
    
    ELSE
      -- Horário disponível
      RETURN QUERY SELECT horario_atual, true, null::text;
    END IF;
    
    -- Avançar para próximo horário
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$function$;