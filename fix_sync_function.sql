-- CORREÇÃO DA FUNÇÃO TRIGGER DE SINCRONIZAÇÃO ONLINE
-- Execute este script no Editor SQL do Supabase para corrigir o erro "column usuario_id does not exist"

CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
BEGIN
  -- Só executa se o status for 'confirmado' e ainda não tiver sido convertido (agendamento_id IS NULL)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Identificar proprietário pelo serviço (busca user_id na tabela servicos)
    SELECT user_id INTO v_user_id
    FROM public.servicos
    WHERE id = NEW.servico_id
    LIMIT 1;

    -- Se não encontrar o dono do serviço, não pode prosseguir
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Não foi possível identificar o profissional responsável pelo serviço %', NEW.servico_id;
    END IF;

    -- Tentar encontrar cliente existente pelo email ou telefone
    SELECT c.id INTO v_cliente_id
    FROM public.clientes c
    WHERE c.user_id = v_user_id -- Importante: buscar apenas clientes desse profissional
      AND (
        (COALESCE(c.email,'') <> '' AND c.email = NEW.email)
        OR 
        (COALESCE(c.telefone,'') <> '' AND c.telefone = NEW.telefone)
      )
    LIMIT 1;

    -- Se não encontrou, cria novo cliente
    IF v_cliente_id IS NULL THEN
      INSERT INTO public.clientes (
        id, 
        user_id, -- CORRIGIDO: de usuario_id para user_id
        nome, 
        nome_completo, -- Campo opcional, pode não existir em algumas versões, mas mantendo conforme original
        email, 
        telefone, 
        observacoes
      )
      VALUES (
        gen_random_uuid(), 
        v_user_id, 
        NEW.nome_completo, 
        NEW.nome_completo, 
        NEW.email, 
        NEW.telefone, 
        'Criado via agendamento online'
      )
      RETURNING id INTO v_cliente_id;
    END IF;

    -- Criar agendamento
    v_ag_id := gen_random_uuid();
    
    INSERT INTO public.agendamentos (
      id, 
      user_id, -- CORRIGIDO: de usuario_id para user_id
      cliente_id, 
      servico_id,
      data, 
      hora, 
      duracao, 
      valor, 
      valor_devido,
      forma_pagamento, 
      status_pagamento,
      status, 
      origem, 
      confirmado, 
      observacoes
    ) VALUES (
      v_ag_id, 
      v_user_id, 
      v_cliente_id, 
      NEW.servico_id,
      NEW.data, 
      NEW.horario, -- Assume formato compatível (HH:MM)
      COALESCE(NEW.duracao, 60), 
      COALESCE(NEW.valor, 0), 
      COALESCE(NEW.valor, 0),
      'fiado', 
      'em_aberto',
      'agendado', 
      'online', 
      true, 
      NEW.observacoes
    );

    -- Atualizar o agendamento online para marcar como convertido e vincular o ID
    -- Isso previne loops infinitos se a trigger for disparada novamente no UPDATE
    UPDATE public.agendamentos_online
    SET agendamento_id = v_ag_id,
        status = 'convertido',
        updated_at = now()
    WHERE id = NEW.id;
    
  END IF;

  RETURN NEW;
END;
$$;
