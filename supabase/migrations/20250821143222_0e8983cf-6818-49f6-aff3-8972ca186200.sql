-- Corrigir a função validar_agendamento_completo que está causando erro
DROP TRIGGER IF EXISTS validar_agendamento_completo_trigger ON agendamentos;
DROP FUNCTION IF EXISTS validar_agendamento_completo();

-- Recriar a função sem o campo max_agendamentos_simultaneos
CREATE OR REPLACE FUNCTION public.validar_agendamento_completo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE 
    v_configuracao RECORD;
    v_dia_semana INTEGER;
    v_horarios_ocupados INTEGER;
BEGIN
    v_dia_semana := EXTRACT(DOW FROM NEW.data);

    -- Busca configuração de horário
    SELECT * INTO v_configuracao 
    FROM configuracoes_horarios 
    WHERE 
        user_id = NEW.user_id AND 
        dia_semana = v_dia_semana AND 
        ativo = true;

    -- Verifica se há configuração para o dia
    IF v_configuracao IS NULL THEN
        RAISE EXCEPTION 'Não há configuração de horário para este dia';
    END IF;

    -- Conta agendamentos no mesmo horário
    SELECT COUNT(*) INTO v_horarios_ocupados
    FROM agendamentos
    WHERE 
        user_id = NEW.user_id AND 
        data = NEW.data AND 
        hora = NEW.hora AND
        id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) AND
        status != 'cancelado';

    -- Permite apenas 1 agendamento por horário por padrão
    IF v_horarios_ocupados >= 1 THEN
        RAISE EXCEPTION 'Já existe um agendamento para este horário';
    END IF;

    -- Validações de horário de funcionamento
    IF NEW.hora < v_configuracao.horario_abertura OR 
       NEW.hora >= v_configuracao.horario_fechamento THEN
        RAISE EXCEPTION 'Horário fora do período de trabalho';
    END IF;

    -- Verifica intervalo
    IF v_configuracao.intervalo_inicio IS NOT NULL AND 
       v_configuracao.intervalo_fim IS NOT NULL AND
       NEW.hora >= v_configuracao.intervalo_inicio AND 
       NEW.hora < v_configuracao.intervalo_fim THEN
        RAISE EXCEPTION 'Horário de intervalo não permite agendamentos';
    END IF;

    RETURN NEW;
END;
$function$;

-- Recriar o trigger
CREATE TRIGGER validar_agendamento_completo_trigger
    BEFORE INSERT OR UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validar_agendamento_completo();