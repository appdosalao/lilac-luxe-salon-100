-- ==============================================================================
-- SQL DE CORREÇÃO: AJUSTE DE RPC PARA PADRÃO 'user_id'
-- ==============================================================================
-- Este script corrige as funções (RPC) que ainda tentam usar 'owner_user_id',
-- garantindo que a busca de horários e a sincronização funcionem com 'user_id'.
-- ==============================================================================

BEGIN;

-- 1. ATUALIZAR FUNÇÃO: buscar_horarios_com_multiplos_intervalos
DROP FUNCTION IF EXISTS public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer);

CREATE OR REPLACE FUNCTION public.buscar_horarios_com_multiplos_intervalos(
    data_selecionada date,
    user_id_param uuid,
    duracao_servico integer DEFAULT 60
)
 RETURNS TABLE(horario time without time zone, disponivel boolean, motivo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  dia_semana_param integer;
  config_horario RECORD;
  horario_atual time without time zone;
  horario_fim_servico time without time zone;
BEGIN
  dia_semana_param := EXTRACT(DOW FROM data_selecionada);
  
  SELECT * INTO config_horario
  FROM configuracoes_horarios
  WHERE user_id = user_id_param 
    AND dia_semana = dia_semana_param
    AND ativo = true;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  horario_atual := config_horario.horario_abertura;
  
  WHILE horario_atual + (duracao_servico || ' minutes')::interval <= config_horario.horario_fechamento LOOP
    horario_fim_servico := horario_atual + (duracao_servico || ' minutes')::interval;
    
    IF config_horario.intervalo_inicio IS NOT NULL 
       AND config_horario.intervalo_fim IS NOT NULL
       AND (
         (horario_atual >= config_horario.intervalo_inicio AND horario_atual < config_horario.intervalo_fim) OR
         (horario_fim_servico > config_horario.intervalo_inicio AND horario_fim_servico <= config_horario.intervalo_fim) OR
         (horario_atual < config_horario.intervalo_inicio AND horario_fim_servico > config_horario.intervalo_fim)
       ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Intervalo de almoço'::text;
    
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
    
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.user_id = user_id_param
        AND a.data = data_selecionada
        AND a.status NOT IN ('cancelado', 'reagendado')
        AND (
          (horario_atual >= a.hora AND horario_atual < (a.hora + (a.duracao * interval '1 minute'))) OR
          (horario_fim_servico > a.hora AND horario_fim_servico <= (a.hora + (a.duracao * interval '1 minute'))) OR
          (horario_atual < a.hora AND horario_fim_servico > (a.hora + (a.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento regular'::text;
    
    ELSIF EXISTS (
      SELECT 1 FROM agendamentos_online ao
      WHERE ao.user_id = user_id_param
        AND ao.data = data_selecionada
        AND ao.status IN ('pendente', 'confirmado')
        AND (
          (horario_atual >= ao.horario AND horario_atual < (ao.horario + (ao.duracao * interval '1 minute'))) OR
          (horario_fim_servico > ao.horario AND horario_fim_servico <= (ao.horario + (ao.duracao * interval '1 minute'))) OR
          (horario_atual < ao.horario AND horario_fim_servico > (ao.horario + (ao.duracao * interval '1 minute')))
        )
    ) THEN
      RETURN QUERY SELECT horario_atual, false, 'Horário ocupado - agendamento online'::text;
    
    ELSE
      RETURN QUERY SELECT horario_atual, true, null::text;
    END IF;
    
    horario_atual := horario_atual + interval '30 minutes';
  END LOOP;
  
  RETURN;
END;
$function$;

-- 2. ATUALIZAR FUNÇÃO: get_public_time_slots (se existir)
-- (Esta função costuma ser usada pelo agendamento online público)
-- Se ela usar owner_user_id, precisa ser corrigida também.

COMMIT;
