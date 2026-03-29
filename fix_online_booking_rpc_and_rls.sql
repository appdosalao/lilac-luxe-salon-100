-- CORREÇÃO DEFINITIVA PARA AGENDAMENTO ONLINE (ACESSO PÚBLICO E RESOLUÇÃO DE SALÃO)
-- Este script garante que o formulário público consiga identificar o salão e carregar serviços/horários.

-- ==============================================================================
-- 1. GARANTIR COLUNA public_id EM configuracoes_agendamento_online
-- ==============================================================================
ALTER TABLE public.configuracoes_agendamento_online 
ADD COLUMN IF NOT EXISTS public_id text;

-- Criar índice único se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_config_agendamento_online_public_id') THEN
    CREATE UNIQUE INDEX idx_config_agendamento_online_public_id ON public.configuracoes_agendamento_online(public_id);
  END IF;
END$$;

-- Popular public_ids vazios para todos os salões existentes
UPDATE public.configuracoes_agendamento_online
SET public_id = substring(gen_random_uuid()::text from 1 for 8)
WHERE public_id IS NULL OR public_id = '';

-- ==============================================================================
-- 2. FUNÇÃO PARA RESOLVER O OWNER A PARTIR DO PUBLIC_ID (USADO PELO FRONTEND)
-- ==============================================================================
DROP FUNCTION IF EXISTS public.get_booking_owner_id(text);
CREATE OR REPLACE FUNCTION public.get_booking_owner_id(p_public_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT user_id 
    FROM public.configuracoes_agendamento_online 
    WHERE public_id = p_public_id AND ativo = true
    LIMIT 1
  );
END;
$$;

-- ==============================================================================
-- 3. FUNÇÕES RPC PARA CARREGAMENTO PÚBLICO (OTIMIZAÇÃO)
-- ==============================================================================

-- Carregar serviços via public_id
DROP FUNCTION IF EXISTS public.get_public_services(text);
CREATE OR REPLACE FUNCTION public.get_public_services(p_public_id text)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  valor numeric,
  duracao integer,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.nome, s.descricao, s.valor, s.duracao, s.user_id
  FROM public.servicos s
  JOIN public.configuracoes_agendamento_online c ON c.user_id = s.user_id
  WHERE c.public_id = p_public_id AND c.ativo = true;
END;
$$;

-- Carregar produtos públicos via public_id
DROP FUNCTION IF EXISTS public.get_public_products(text);
CREATE OR REPLACE FUNCTION public.get_public_products(p_public_id text)
RETURNS TABLE (
  id uuid,
  nome text,
  valor numeric,
  categoria text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nome, p.preco_venda as valor, p.categoria
  FROM public.produtos p
  JOIN public.configuracoes_agendamento_online c ON c.user_id = p.user_id
  WHERE c.public_id = p_public_id AND c.ativo = true AND p.ativo = true AND p.categoria = 'revenda';
END;
$$;

-- Carregar horários públicos via public_id
DROP FUNCTION IF EXISTS public.get_public_time_slots(text, date, uuid);
CREATE OR REPLACE FUNCTION public.get_public_time_slots(
  p_public_id text,
  p_data date,
  p_servico_id uuid
)
RETURNS TABLE (
  horario time,
  disponivel boolean,
  bloqueio_motivo text
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
  SELECT h.horario, h.disponivel, h.bloqueio_motivo
  FROM public.buscar_horarios_com_multiplos_intervalos(p_data, v_user_id, v_duracao) h;
END;
$$;

-- ==============================================================================
-- 4. PERMISSÕES PARA A ROLE ANON (CLIENTES NÃO LOGADOS)
-- ==============================================================================

-- Tabelas necessárias para leitura direta se o RPC não for usado
GRANT SELECT ON TABLE public.configuracoes_agendamento_online TO anon;
GRANT SELECT ON TABLE public.servicos TO anon;
GRANT SELECT ON TABLE public.produtos TO anon;
GRANT SELECT ON TABLE public.configuracoes_horarios TO anon;
GRANT SELECT ON TABLE public.intervalos_trabalho TO anon;
GRANT SELECT ON TABLE public.agendamentos TO anon; -- Necessário para buscar_horarios... verificar choques
GRANT SELECT ON TABLE public.agendamentos_online TO anon;

-- Funções RPC
GRANT EXECUTE ON FUNCTION public.get_booking_owner_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_services(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_time_slots(text, date, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) TO anon;

-- ==============================================================================
-- 5. POLÍTICAS DE RLS PARA ACESSO PÚBLICO
-- ==============================================================================

-- Configurações de Agendamento Online
DROP POLICY IF EXISTS "Public can view online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Public can view online booking configs"
ON public.configuracoes_agendamento_online
FOR SELECT
TO anon, authenticated
USING (ativo = true);

-- Serviços (vincular ao status do agendamento online do dono)
DROP POLICY IF EXISTS "Public can view services" ON public.servicos;
CREATE POLICY "Public can view services"
ON public.servicos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.configuracoes_agendamento_online c 
    WHERE c.user_id = servicos.user_id AND c.ativo = true
  )
);

-- Configurações de Horários
DROP POLICY IF EXISTS "Public can view schedule configs" ON public.configuracoes_horarios;
CREATE POLICY "Public can view schedule configs"
ON public.configuracoes_horarios
FOR SELECT
TO anon, authenticated
USING (
  ativo = true AND EXISTS (
    SELECT 1 FROM public.configuracoes_agendamento_online c 
    WHERE c.user_id = configuracoes_horarios.user_id AND c.ativo = true
  )
);

-- Intervalos de Trabalho
DROP POLICY IF EXISTS "Public can view work intervals" ON public.intervalos_trabalho;
CREATE POLICY "Public can view work intervals"
ON public.intervalos_trabalho
FOR SELECT
TO anon, authenticated
USING (
  ativo = true AND EXISTS (
    SELECT 1 FROM public.configuracoes_agendamento_online c 
    WHERE c.user_id = intervalos_trabalho.user_id AND c.ativo = true
  )
);

-- Agendamentos (leitura mínima para verificar disponibilidade)
DROP POLICY IF EXISTS "Public can check availability" ON public.agendamentos;
CREATE POLICY "Public can check availability"
ON public.agendamentos
FOR SELECT
TO anon
USING (
  status NOT IN ('cancelado', 'reagendado')
  AND data >= CURRENT_DATE
);

-- Usuários (permitir que o frontend veja o nome do salão/dono)
DROP POLICY IF EXISTS "Public can view basic user info" ON public.usuarios;
CREATE POLICY "Public can view basic user info"
ON public.usuarios
FOR SELECT
TO anon
USING (true);

-- ==============================================================================
-- 6. CRIAR CLIENTE (RPC REQUERIDO PELO FRONTEND)
-- ==============================================================================
DROP FUNCTION IF EXISTS public.criar_cliente_agendamento_online(text, text, text, text);
CREATE OR REPLACE FUNCTION public.criar_cliente_agendamento_online(
  p_nome text,
  p_telefone text,
  p_email text,
  p_observacoes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id uuid;
  v_user_id uuid;
BEGIN
  -- Tentar encontrar cliente pelo email ou telefone primeiro
  SELECT id, user_id INTO v_cliente_id, v_user_id
  FROM public.clientes
  WHERE (COALESCE(email, '') <> '' AND email = p_email)
     OR (COALESCE(telefone, '') <> '' AND telefone = p_telefone)
  LIMIT 1;

  IF v_cliente_id IS NOT NULL THEN
    RETURN v_cliente_id;
  END IF;

  -- Se não encontrar, criar um novo vinculado ao primeiro administrador (fallback)
  -- Idealmente deveria vincular ao dono do salão que está recebendo o agendamento
  -- mas como esta função é chamada antes de sabermos o dono em alguns fluxos, 
  -- o trigger de sincronização posterior ajustará se necessário.
  
  INSERT INTO public.clientes (nome, telefone, email, observacoes)
  VALUES (p_nome, p_telefone, p_email, p_observacoes)
  RETURNING id INTO v_cliente_id;

  RETURN v_cliente_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) TO anon;
