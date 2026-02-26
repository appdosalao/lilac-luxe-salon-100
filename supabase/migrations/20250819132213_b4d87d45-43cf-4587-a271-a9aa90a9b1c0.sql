-- Função para criar cliente a partir de agendamento online
CREATE OR REPLACE FUNCTION public.criar_cliente_agendamento_online(
  p_nome text,
  p_telefone text,
  p_email text,
  p_observacoes text DEFAULT 'Cliente criado via agendamento online'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cliente_id uuid;
BEGIN
  -- Verificar se já existe cliente com o mesmo email
  SELECT id INTO cliente_id 
  FROM public.clientes 
  WHERE email = p_email
  LIMIT 1;
  
  IF cliente_id IS NOT NULL THEN
    RETURN cliente_id;
  END IF;
  
  -- Criar novo cliente com user_id temporário
  -- Será associado ao proprietário quando o agendamento for convertido
  INSERT INTO public.clientes (
    user_id,
    nome,
    telefone,
    email,
    observacoes,
    historico_servicos
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- UUID temporário
    p_nome,
    p_telefone,
    p_email,
    p_observacoes,
    '[]'::jsonb
  ) RETURNING id INTO cliente_id;
  
  RETURN cliente_id;
END;
$$;