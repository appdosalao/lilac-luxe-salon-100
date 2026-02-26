-- Atualizar função para associar cliente ao usuário correto
CREATE OR REPLACE FUNCTION public.converter_agendamento_online(agendamento_online_id uuid, user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  agendamento_online_rec RECORD;
  cliente_id UUID;
  novo_agendamento_id UUID;
BEGIN
  -- Buscar o agendamento online
  SELECT * INTO agendamento_online_rec 
  FROM public.agendamentos_online 
  WHERE id = agendamento_online_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento online não encontrado';
  END IF;
  
  -- Verificar se já foi convertido
  IF agendamento_online_rec.status = 'convertido' THEN
    RAISE EXCEPTION 'Agendamento já foi convertido';
  END IF;
  
  -- Buscar cliente pelo email (pode ter sido criado com user_id temporário)
  SELECT id INTO cliente_id 
  FROM public.clientes 
  WHERE email = agendamento_online_rec.email;
  
  IF cliente_id IS NOT NULL THEN
    -- Atualizar cliente para o user_id correto
    UPDATE public.clientes 
    SET user_id = user_id
    WHERE id = cliente_id;
  ELSE
    -- Criar novo cliente se não existir
    INSERT INTO public.clientes (
      user_id,
      nome,
      telefone,
      email,
      observacoes
    ) VALUES (
      user_id,
      agendamento_online_rec.nome_completo,
      agendamento_online_rec.telefone,
      agendamento_online_rec.email,
      'Cliente criado via agendamento online'
    ) RETURNING id INTO cliente_id;
  END IF;
  
  -- Criar agendamento regular
  INSERT INTO public.agendamentos (
    user_id,
    cliente_id,
    servico_id,
    data,
    hora,
    duracao,
    valor,
    valor_devido,
    status,
    observacoes,
    origem
  ) VALUES (
    user_id,
    cliente_id,
    agendamento_online_rec.servico_id,
    agendamento_online_rec.data,
    agendamento_online_rec.horario,
    agendamento_online_rec.duracao,
    agendamento_online_rec.valor,
    agendamento_online_rec.valor,
    'agendado',
    COALESCE(agendamento_online_rec.observacoes, '') || ' (Convertido de agendamento online)',
    'online'
  ) RETURNING id INTO novo_agendamento_id;
  
  -- Atualizar status do agendamento online
  UPDATE public.agendamentos_online 
  SET status = 'convertido', 
      agendamento_id = novo_agendamento_id,
      updated_at = now()
  WHERE id = agendamento_online_id;
  
  RETURN novo_agendamento_id;
END;
$function$;