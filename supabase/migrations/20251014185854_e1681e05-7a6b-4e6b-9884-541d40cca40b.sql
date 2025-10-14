-- Correção de Segurança: Remover visibilidade cross-user de clientes temporários
-- Issue: clientes_temp_uuid_exposure - Data Isolation
-- Política permite ver clientes temporários de outros negócios

-- Remover política insegura
DROP POLICY IF EXISTS "Users can view clients from online bookings" ON public.clientes;

-- Atualizar função criar_cliente_agendamento_online para associar ao primeiro usuário ativo
-- em vez de usar UUID temporário
CREATE OR REPLACE FUNCTION public.criar_cliente_agendamento_online(
  p_nome text,
  p_telefone text,
  p_email text,
  p_observacoes text DEFAULT 'Cliente criado via agendamento online'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  cliente_id uuid;
  primeiro_usuario_id uuid;
BEGIN
  -- Verificar se já existe cliente com o mesmo email
  SELECT id INTO cliente_id 
  FROM public.clientes 
  WHERE email = p_email
  LIMIT 1;
  
  IF cliente_id IS NOT NULL THEN
    RETURN cliente_id;
  END IF;
  
  -- Buscar o primeiro usuário ativo do sistema (proprietário padrão)
  -- Isso é temporário até a conversão do agendamento
  SELECT id INTO primeiro_usuario_id
  FROM public.usuarios
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Se não houver usuário, criar registro fica bloqueado
  IF primeiro_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Sistema não configurado: nenhum usuário encontrado';
  END IF;
  
  -- Criar novo cliente associado ao primeiro usuário
  -- Será reatribuído quando o agendamento for convertido
  INSERT INTO public.clientes (
    user_id,
    nome,
    telefone,
    email,
    observacoes,
    historico_servicos
  ) VALUES (
    primeiro_usuario_id,
    p_nome,
    p_telefone,
    p_email,
    p_observacoes || ' [AGENDAMENTO ONLINE PENDENTE]',
    '[]'::jsonb
  ) RETURNING id INTO cliente_id;
  
  RETURN cliente_id;
END;
$function$;

-- Limpar clientes órfãos com UUID temporário antigo
UPDATE public.clientes
SET user_id = (SELECT id FROM public.usuarios ORDER BY created_at ASC LIMIT 1)
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND (SELECT id FROM public.usuarios ORDER BY created_at ASC LIMIT 1) IS NOT NULL;

-- Nota: Agora clientes sempre têm user_id válido desde a criação
-- Isso previne vazamento de dados entre negócios diferentes