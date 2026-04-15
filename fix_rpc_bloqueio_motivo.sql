-- ==============================================================================
-- CORREÇÃO: REMOVER COLUNA INEXISTENTE 'bloqueio_motivo' DAS FUNÇÕES RPC
-- ==============================================================================
-- As funções de busca de horários estavam tentando retornar 'bloqueio_motivo',
-- que não existe nas tabelas do banco, causando erro 42703.
-- ==============================================================================

BEGIN;

-- 1. Corrigir a função base de busca de horários
-- É necessário dar o DROP primeiro pois o tipo de retorno mudou (removendo bloqueio_motivo)
DROP FUNCTION IF EXISTS public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer);

CREATE OR REPLACE FUNCTION public.buscar_horarios_com_multiplos_intervalos(
  data_selecionada date, 
  user_id_param uuid, 
  duracao_servico integer DEFAULT 30
)
RETURNS TABLE(horario time without time zone, disponivel boolean)
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
      RETURN QUERY SELECT horario_atual, false;
    
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
      RETURN QUERY SELECT horario_atual, false;
    
    -- Verificar conflitos com agendamentos regulares (considerando duração)
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.user_id = user_id_param
        AND a.data = data_selecionada
        AND a.status NOT IN ('cancelado', 'reagendado', 'excluido')
        AND (
          -- Novo agendamento começa durante um existente
          (horario_atual >= a.hora AND horario_atual < (a.hora + (a.duracao * interval '1 minute'))) OR
          -- Novo agendamento termina durante um existente
          (horario_fim_servico > a.hora AND horario_fim_servico <= (a.hora + (a.duracao * interval '1 minute'))) OR
          -- Novo agendamento engloba um existente
          (horario_atual < a.hora AND horario_fim_servico > (a.hora + (a.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false;
    
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
      RETURN QUERY SELECT horario_atual, false;
    
    ELSE
      -- Horário disponível
      RETURN QUERY SELECT horario_atual, true;
    END IF;
    
    -- Avançar para próximo horário
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$function$;

-- 2. Corrigir a função de interface pública
DROP FUNCTION IF EXISTS public.get_public_time_slots(text, date, uuid);
CREATE OR REPLACE FUNCTION public.get_public_time_slots(
  p_public_id text,
  p_data date,
  p_servico_id uuid
)
RETURNS TABLE (
  horario time,
  disponivel boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_duracao integer;
BEGIN
  -- Obter o owner_id
  SELECT user_id INTO v_user_id 
  FROM public.configuracoes_agendamento_online 
  WHERE public_id = p_public_id AND ativo = true;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Obter duração do serviço
  SELECT duracao INTO v_duracao FROM public.servicos WHERE id = p_servico_id;
  v_duracao := COALESCE(v_duracao, 60);

  -- Chamar a função base de busca de horários
  RETURN QUERY
  SELECT h.horario, h.disponivel
  FROM public.buscar_horarios_com_multiplos_intervalos(p_data, v_user_id, v_duracao) h;
END;
$$;

COMMIT;
