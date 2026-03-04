-- CORREÇÃO CRÍTICA E DEFINITIVA DO ERRO "split_part"
-- Este script:
-- 1. Remove triggers antigas que podem estar usando a função split_part incorretamente em campos de tempo.
-- 2. Implementa uma nova validação de agendamento segura e tipada corretamente.
-- 3. Garante que a sincronização online use tipos compatíveis.

-- ==============================================================================
-- 1. REMOÇÃO DE TRIGGERS E FUNÇÕES ANTIGAS/PROBLEMÁTICAS
-- ==============================================================================
DROP TRIGGER IF EXISTS validar_horario_agendamento ON public.agendamentos;
DROP FUNCTION IF EXISTS public.validar_horario_agendamento();

DROP TRIGGER IF EXISTS validar_agendamento_completo_trigger ON public.agendamentos;
DROP FUNCTION IF EXISTS public.validar_agendamento_completo();

DROP TRIGGER IF EXISTS check_horario_disponivel ON public.agendamentos;
DROP FUNCTION IF EXISTS public.check_horario_disponivel();

DROP TRIGGER IF EXISTS validar_horario_funcionamento ON public.agendamentos;

-- ==============================================================================
-- 2. CRIAÇÃO DE NOVA FUNÇÃO DE VALIDAÇÃO ROBUSTA (v3)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.validar_agendamento_v3()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_dia_semana INTEGER;
    v_configuracao RECORD;
    v_hora_agendamento TIME;
    v_conflitos INTEGER;
BEGIN
    -- Converter para TIME de forma segura, aceitando tanto string 'HH:MM' quanto objeto TIME
    BEGIN
        v_hora_agendamento := NEW.hora::time;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Formato de hora inválido para agendamento: %', NEW.hora;
    END;

    -- Validar horário de funcionamento (apenas se houver configuração ativa para o dia)
    -- Converte data string (YYYY-MM-DD) para DATE para extrair dia da semana
    v_dia_semana := EXTRACT(DOW FROM NEW.data::date);
    
    SELECT * INTO v_configuracao 
    FROM public.configuracoes_horarios 
    WHERE user_id = NEW.user_id 
      AND dia_semana = v_dia_semana 
      AND ativo = true
    LIMIT 1;

    IF v_configuracao IS NOT NULL THEN
        -- Verifica horário de abertura/fechamento
        IF v_hora_agendamento < v_configuracao.horario_abertura OR 
           v_hora_agendamento >= v_configuracao.horario_fechamento THEN
            RAISE EXCEPTION 'Horário % fora do expediente (Abertura: %, Fechamento: %)', 
                v_hora_agendamento, v_configuracao.horario_abertura, v_configuracao.horario_fechamento;
        END IF;

        -- Verifica intervalo de almoço
        IF v_configuracao.intervalo_inicio IS NOT NULL AND 
           v_configuracao.intervalo_fim IS NOT NULL AND
           v_hora_agendamento >= v_configuracao.intervalo_inicio AND 
           v_hora_agendamento < v_configuracao.intervalo_fim THEN
            RAISE EXCEPTION 'Horário % está dentro do intervalo de pausa', v_hora_agendamento;
        END IF;
    END IF;

    -- Validar conflitos de horário (apenas agendamentos ativos)
    SELECT COUNT(*) INTO v_conflitos
    FROM public.agendamentos
    WHERE user_id = NEW.user_id
      AND data = NEW.data
      AND hora::time = v_hora_agendamento -- Comparação segura de TIME
      AND status NOT IN ('cancelado')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_conflitos > 0 THEN
        RAISE EXCEPTION 'Já existe um agendamento confirmado para este horário (%)', v_hora_agendamento;
    END IF;

    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. APLICAÇÃO DA NOVA TRIGGER
-- ==============================================================================
CREATE TRIGGER validar_agendamento_v3_trigger
    BEFORE INSERT OR UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_agendamento_v3();

-- ==============================================================================
-- 4. GARANTIA DA FUNÇÃO DE SINCRONIZAÇÃO (CAST EXPLÍCITO)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
  v_horario_time time;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    SELECT user_id INTO v_user_id FROM public.servicos WHERE id = NEW.servico_id LIMIT 1;

    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado para o serviço'; END IF;

    SELECT c.id INTO v_cliente_id FROM public.clientes c
    WHERE c.user_id = v_user_id AND ((COALESCE(c.email,'') <> '' AND c.email = NEW.email) OR (COALESCE(c.telefone,'') <> '' AND c.telefone = NEW.telefone)) LIMIT 1;

    IF v_cliente_id IS NULL THEN
      INSERT INTO public.clientes (id, user_id, nome, nome_completo, email, telefone, observacoes)
      VALUES (gen_random_uuid(), v_user_id, NEW.nome_completo, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via agendamento online')
      RETURNING id INTO v_cliente_id;
    END IF;

    -- Cast explícito e seguro
    v_horario_time := NEW.horario::time;

    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id, data, hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    ) VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id, NEW.data, 
      v_horario_time, -- Valor TIME seguro
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    UPDATE public.agendamentos_online SET agendamento_id = v_ag_id, status = 'convertido', updated_at = now() WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
