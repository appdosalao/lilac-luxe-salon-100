-- CORREÇÃO DE ERRO DE TIPO NA TRIGGER DE AGENDAMENTO
-- O erro "split_part(time without time zone...)" ocorre porque estamos tentando usar uma função de string
-- em um campo que é do tipo TIME. Precisamos fazer o cast explícito.

CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
  v_horario_str text;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Identificar proprietário
    SELECT user_id INTO v_user_id
    FROM public.servicos
    WHERE id = NEW.servico_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Não foi possível identificar o profissional responsável pelo serviço %', NEW.servico_id;
    END IF;

    -- Tentar encontrar cliente existente
    SELECT c.id INTO v_cliente_id
    FROM public.clientes c
    WHERE c.user_id = v_user_id
      AND (
        (COALESCE(c.email,'') <> '' AND c.email = NEW.email)
        OR 
        (COALESCE(c.telefone,'') <> '' AND c.telefone = NEW.telefone)
      )
    LIMIT 1;

    -- Se não encontrou, cria novo cliente
    IF v_cliente_id IS NULL THEN
      INSERT INTO public.clientes (
        id, user_id, nome, nome_completo, email, telefone, observacoes
      )
      VALUES (
        gen_random_uuid(), v_user_id, NEW.nome_completo, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via agendamento online'
      )
      RETURNING id INTO v_cliente_id;
    END IF;

    -- Converter horário para string HH:MM para evitar erro de tipo se o destino for TEXT
    -- Se NEW.horario for TIME, fazemos o cast. Se já for TEXT, mantemos.
    v_horario_str := to_char(NEW.horario::time, 'HH24:MI');

    -- Criar agendamento
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento,
      status, origem, confirmado, observacoes
    ) VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, 
      v_horario_str, -- Usamos a string formatada explicitamente
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto',
      'agendado', 'online', true, NEW.observacoes
    );

    -- Atualizar o agendamento online
    UPDATE public.agendamentos_online
    SET agendamento_id = v_ag_id,
        status = 'convertido',
        updated_at = now()
    WHERE id = NEW.id;
    
  END IF;

  RETURN NEW;
END;
$$;
