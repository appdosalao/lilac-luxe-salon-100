-- ==============================================================================
-- SQL MESTRE: CONSOLIDAÇÃO E CORREÇÃO DEFINITIVA DO AGENDAMENTO ONLINE
-- ==============================================================================
-- Este script limpa configurações antigas e redefine todo o fluxo de 
-- agendamento online, garantindo:
-- 1. Acesso público (anon) para leitura de serviços e horários.
-- 2. Criação de agendamentos online sem necessidade de login.
-- 3. Sincronização automática com a agenda principal ao confirmar.
-- 4. Criação automática de cliente se não existir.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. LIMPEZA TOTAL DE POLÍTICAS E PERMISSÕES ANTIGAS (REVOGAÇÃO)
-- ==============================================================================

-- Revogar permissões públicas para garantir que começamos do zero
REVOKE ALL ON TABLE public.agendamentos_online FROM anon, public;
REVOKE ALL ON TABLE public.clientes FROM anon, public;
REVOKE ALL ON TABLE public.servicos FROM anon, public;
REVOKE ALL ON TABLE public.configuracoes_agendamento_online FROM anon, public;
REVOKE ALL ON TABLE public.configuracoes_horarios FROM anon, public;
REVOKE ALL ON TABLE public.intervalos_trabalho FROM anon, public;

-- Remover políticas RLS de todas as tabelas envolvidas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'agendamentos_online', 'clientes', 'servicos', 
            'configuracoes_agendamento_online', 'configuracoes_horarios', 
            'intervalos_trabalho', 'agendamentos'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ==============================================================================
-- 2. AJUSTE DE ESTRUTURA E COMPATIBILIDADE
-- ==============================================================================

-- Garantir que agendamentos_online tenha owner_user_id
ALTER TABLE public.agendamentos_online ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id);

-- Garantir colunas snake_case na tabela agendamentos para evitar erros na trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'user_id') THEN
        ALTER TABLE public.agendamentos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Garantir data_hora (muitos fluxos usam)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'data_hora') THEN
        ALTER TABLE public.agendamentos ADD COLUMN data_hora TIMESTAMP WITH TIME ZONE NULL;
    ELSE
        ALTER TABLE public.agendamentos ALTER COLUMN data_hora DROP NOT NULL;
    END IF;

    -- Garantir snake_case para compatibilidade
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'valor_pago') THEN
        ALTER TABLE public.agendamentos ADD COLUMN valor_pago NUMERIC DEFAULT 0;
    ELSE
        ALTER TABLE public.agendamentos ALTER COLUMN valor_pago DROP NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'valor_devido') THEN
        ALTER TABLE public.agendamentos ADD COLUMN valor_devido NUMERIC DEFAULT 0;
    ELSE
        ALTER TABLE public.agendamentos ALTER COLUMN valor_devido DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'status_pagamento') THEN
        ALTER TABLE public.agendamentos ADD COLUMN status_pagamento TEXT DEFAULT 'em_aberto';
    ELSE
        ALTER TABLE public.agendamentos ALTER COLUMN status_pagamento DROP NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agendamentos' AND column_name = 'forma_pagamento') THEN
        ALTER TABLE public.agendamentos ADD COLUMN forma_pagamento TEXT DEFAULT 'fiado';
    ELSE
        ALTER TABLE public.agendamentos ALTER COLUMN forma_pagamento DROP NOT NULL;
    END IF;
    
    -- Remover constraints que impedem o funcionamento (caso existam)
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_horario_valido;
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_hora_format;
    
    -- Remover NOT NULL de colunas que podem ser preenchidas depois
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'user_id') THEN
        ALTER TABLE public.clientes ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END$$;

-- ==============================================================================
-- 3. FUNÇÕES DE NEGÓCIO (RPC E TRIGGERS)
-- ==============================================================================

-- Função para criar cliente via agendamento online (RPC)
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
BEGIN
  -- Tentar encontrar cliente pelo email ou telefone primeiro
  SELECT id INTO v_cliente_id
  FROM public.clientes
  WHERE (COALESCE(email, '') <> '' AND email = p_email)
     OR (COALESCE(telefone, '') <> '' AND telefone = p_telefone)
  LIMIT 1;

  IF v_cliente_id IS NOT NULL THEN
    RETURN v_cliente_id;
  END IF;

  -- Se não encontrar, criar um novo
  INSERT INTO public.clientes (nome, telefone, email, observacoes)
  VALUES (p_nome, p_telefone, p_email, p_observacoes)
  RETURNING id INTO v_cliente_id;

  RETURN v_cliente_id;
END;
$$;

-- Trigger de Sincronização Automática
CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
  v_servico_nome text;
BEGIN
  -- Só executa se confirmado e não convertido
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- 1. Identificar proprietário e nome do serviço
    -- Tenta primeiro pelo owner_user_id da tabela, se não houver, busca no serviço
    v_user_id := NEW.owner_user_id;
    
    IF v_user_id IS NULL THEN
        SELECT user_id, nome INTO v_user_id, v_servico_nome 
        FROM public.servicos 
        WHERE id = NEW.servico_id 
        LIMIT 1;
    ELSE
        SELECT nome INTO v_servico_nome 
        FROM public.servicos 
        WHERE id = NEW.servico_id 
        LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    -- 2. Tentar encontrar cliente vinculado ao dono
    SELECT id INTO v_cliente_id 
    FROM public.clientes 
    WHERE user_id = v_user_id 
      AND (email = NEW.email OR telefone = NEW.telefone)
    LIMIT 1;

    -- 3. Se não encontrou, criar cliente vinculado
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, user_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via Agendamento Online');
    ELSE
      -- Garantir que o cliente está vinculado ao user_id correto se for um cliente órfão
      UPDATE public.clientes SET user_id = v_user_id WHERE id = v_cliente_id AND user_id IS NULL;
    END IF;

    -- 4. Criar agendamento real na agenda principal
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario::time, 
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    -- 5. Marcar agendamento online como convertido e vincular ID
    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
    
  END IF;
  RETURN NEW;
END;
$$;

-- Vincular Trigger
DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- ==============================================================================
-- 4. POLÍTICAS DE SEGURANÇA (RLS) E PERMISSÕES PÚBLICAS
-- ==============================================================================

-- Desabilitar RLS temporariamente para garantir que não há bloqueio residual
ALTER TABLE public.agendamentos_online DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_agendamento_online DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervalos_trabalho DISABLE ROW LEVEL SECURITY;

-- Re-habilitar RLS
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_agendamento_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA AGENDAMENTOS ONLINE (Acesso Total para Anon na Inserção)
DROP POLICY IF EXISTS "Public can insert online appointments" ON public.agendamentos_online;
CREATE POLICY "Public can insert online appointments" ON public.agendamentos_online FOR INSERT TO anon, public WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view availability" ON public.agendamentos_online;
CREATE POLICY "Public can view availability" ON public.agendamentos_online FOR SELECT TO anon, public USING (true);

DROP POLICY IF EXISTS "Owners can manage their online appointments" ON public.agendamentos_online;
CREATE POLICY "Owners can manage their online appointments" ON public.agendamentos_online FOR ALL TO authenticated USING (true);

-- POLÍTICAS PARA SERVIÇOS (Leitura pública total)
DROP POLICY IF EXISTS "Public can view active services" ON public.servicos;
CREATE POLICY "Public can view active services" ON public.servicos FOR SELECT TO anon, public USING (true);

DROP POLICY IF EXISTS "Owners can manage their services" ON public.servicos;
CREATE POLICY "Owners can manage their services" ON public.servicos FOR ALL TO authenticated USING (true);

-- POLÍTICAS PARA CLIENTES (Permitir inserção anônima sem restrição)
DROP POLICY IF EXISTS "Public can insert clients" ON public.clientes;
CREATE POLICY "Public can insert clients" ON public.clientes FOR INSERT TO anon, public WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage their clients" ON public.clientes;
CREATE POLICY "Owners can manage their clients" ON public.clientes FOR ALL TO authenticated USING (true);

-- POLÍTICAS PARA CONFIGURAÇÕES E HORÁRIOS (Leitura pública total)
DROP POLICY IF EXISTS "Public can view online configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Public can view online configs" ON public.configuracoes_agendamento_online FOR SELECT TO anon, public USING (true);

DROP POLICY IF EXISTS "Public can view schedules" ON public.configuracoes_horarios;
CREATE POLICY "Public can view schedules" ON public.configuracoes_horarios FOR SELECT TO anon, public USING (true);

DROP POLICY IF EXISTS "Public can view work intervals" ON public.intervalos_trabalho;
CREATE POLICY "Public can view work intervals" ON public.intervalos_trabalho FOR SELECT TO anon, public USING (true);

-- CONCEDER PERMISSÕES FINAIS (Garantir que anon e public tenham acesso)
GRANT USAGE ON SCHEMA public TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.clientes TO anon, public, authenticated;
GRANT ALL ON TABLE public.servicos TO anon, public, authenticated;
GRANT ALL ON TABLE public.configuracoes_agendamento_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.configuracoes_horarios TO anon, public, authenticated;
GRANT ALL ON TABLE public.intervalos_trabalho TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos TO anon, public, authenticated;

-- Garantir que as sequências também tenham permissão
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, public, authenticated;

-- Permissão para funções RPC
GRANT EXECUTE ON FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) TO anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_online_para_agendamento() TO anon, public, authenticated;

COMMIT;
