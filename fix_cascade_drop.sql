-- CORREÇÃO COM CASCADE E REMOÇÃO DE TRIGGERS
-- Use CASCADE para remover objetos dependentes (triggers) automaticamente.

-- 1. REMOÇÃO DE TRIGGERS E FUNÇÕES ANTIGAS COM CASCADE
DROP FUNCTION IF EXISTS public.validar_horario_agendamento() CASCADE;
DROP FUNCTION IF EXISTS public.validar_agendamento_completo() CASCADE;
DROP FUNCTION IF EXISTS public.check_horario_disponivel() CASCADE;

-- Remover triggers explicitamente caso o cascade não pegue tudo ou tenha nomes diferentes
DROP TRIGGER IF EXISTS verificar_horario_agendamento ON public.agendamentos;
DROP TRIGGER IF EXISTS validar_horario_agendamento ON public.agendamentos;
DROP TRIGGER IF EXISTS validar_agendamento_completo_trigger ON public.agendamentos;
DROP TRIGGER IF EXISTS check_horario_disponivel ON public.agendamentos;
DROP TRIGGER IF EXISTS validar_horario_funcionamento ON public.agendamentos;

-- 2. CRIAÇÃO DE NOVA FUNÇÃO DE VALIDAÇÃO ROBUSTA (v3)
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
    -- Converter para TIME de forma segura
    BEGIN
        v_hora_agendamento := NEW.hora::time;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Formato de hora inválido para agendamento: %', NEW.hora;
    END;

    -- Validar conflitos de horário (apenas agendamentos ativos)
    SELECT COUNT(*) INTO v_conflitos
    FROM public.agendamentos
    WHERE user_id = NEW.user_id
      AND data = NEW.data
      AND hora::time = v_hora_agendamento
      AND status NOT IN ('cancelado')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_conflitos > 0 THEN
        RAISE EXCEPTION 'Já existe um agendamento confirmado para este horário (%)', v_hora_agendamento;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. APLICAÇÃO DA NOVA TRIGGER
DROP TRIGGER IF EXISTS validar_agendamento_v3_trigger ON public.agendamentos;

CREATE TRIGGER validar_agendamento_v3_trigger
    BEFORE INSERT OR UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_agendamento_v3();

-- 4. ATUALIZAR FUNÇÃO DE SYNC (Garantia de tipo)
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
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Profissional não encontrado'; END IF;

    SELECT c.id INTO v_cliente_id FROM public.clientes c
    WHERE c.user_id = v_user_id AND ((COALESCE(c.email,'') <> '' AND c.email = NEW.email) OR (COALESCE(c.telefone,'') <> '' AND c.telefone = NEW.telefone)) LIMIT 1;

    IF v_cliente_id IS NULL THEN
      INSERT INTO public.clientes (id, user_id, nome, nome_completo, email, telefone, observacoes)
      VALUES (gen_random_uuid(), v_user_id, NEW.nome_completo, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via online')
      RETURNING id INTO v_cliente_id;
    END IF;

    v_horario_time := NEW.horario::time;

    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id, data, hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    ) VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id, NEW.data, v_horario_time, 
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    UPDATE public.agendamentos_online SET agendamento_id = v_ag_id, status = 'convertido', updated_at = now() WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
