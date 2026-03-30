-- CORREÇÃO DEFINITIVA PARA AGENDAMENTO ONLINE E SINCRONIZAÇÃO
-- Este script resolve problemas de validação, permissões e sincronização automática.

BEGIN;

-- ==============================================================================
-- 1. AJUSTAR TABELA AGENDAMENTOS_ONLINE (REMOVER CONSTRAINTS RESTRITIVAS)
-- ==============================================================================

-- Remover constraints antigas se existirem
ALTER TABLE public.agendamentos_online DROP CONSTRAINT IF EXISTS check_telefone_format;
ALTER TABLE public.agendamentos_online DROP CONSTRAINT IF EXISTS check_nome_length;
ALTER TABLE public.agendamentos_online DROP CONSTRAINT IF EXISTS check_email_format;
ALTER TABLE public.agendamentos_online DROP CONSTRAINT IF EXISTS check_observacoes_length;

-- Adicionar constraints mais flexíveis
ALTER TABLE public.agendamentos_online 
ADD CONSTRAINT check_nome_length CHECK (length(nome_completo) >= 2 AND length(nome_completo) <= 255);

ALTER TABLE public.agendamentos_online 
ADD CONSTRAINT check_observacoes_length CHECK (observacoes IS NULL OR length(observacoes) <= 1000);

-- ==============================================================================
-- 2. GARANTIR COLUNAS NAS TABELAS PRINCIPAIS (COMPATIBILIDADE SNAKE/CAMEL)
-- ==============================================================================

-- Garantir colunas na tabela agendamentos
DO $$
BEGIN
    -- Garantir user_id (caso exista apenas usuario_id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'user_id') THEN
        ALTER TABLE public.agendamentos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Garantir data_hora (muitos fluxos usam)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'data_hora') THEN
        ALTER TABLE public.agendamentos ADD COLUMN data_hora TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Garantir que data_hora seja NULLABLE para evitar falhas se não for provido
    ALTER TABLE public.agendamentos ALTER COLUMN data_hora DROP NOT NULL;

    -- Garantir snake_case para compatibilidade
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'valor_pago') THEN
        ALTER TABLE public.agendamentos ADD COLUMN valor_pago NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'valor_devido') THEN
        ALTER TABLE public.agendamentos ADD COLUMN valor_devido NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'status_pagamento') THEN
        ALTER TABLE public.agendamentos ADD COLUMN status_pagamento TEXT DEFAULT 'em_aberto';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos' AND column_name = 'forma_pagamento') THEN
        ALTER TABLE public.agendamentos ADD COLUMN forma_pagamento TEXT DEFAULT 'fiado';
    END IF;
END$$;

-- Garantir colunas na tabela clientes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'user_id') THEN
        ALTER TABLE public.clientes ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Tornar user_id nullable para permitir criação via agendamento online antes do sync
    ALTER TABLE public.clientes ALTER COLUMN user_id DROP NOT NULL;
END$$;

-- ==============================================================================
-- 3. FUNÇÃO DE SINCRONIZAÇÃO ROBUSTA (SECURITY DEFINER)
-- ==============================================================================

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
    SELECT user_id, nome INTO v_user_id, v_servico_nome 
    FROM public.servicos 
    WHERE id = NEW.servico_id 
    LIMIT 1;

    IF v_user_id IS NULL THEN 
      -- Se não achar o serviço, não podemos criar o agendamento real
      RETURN NEW; 
    END IF;

    -- 2. Tentar encontrar cliente (usando snake_case preferencialmente)
    SELECT id INTO v_cliente_id 
    FROM public.clientes 
    WHERE user_id = v_user_id 
      AND (email = NEW.email OR telefone = NEW.telefone)
    LIMIT 1;

    -- 3. Se não encontrou, criar cliente
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, user_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via Agendamento Online');
    END IF;

    -- 4. Criar agendamento real
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, data_hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario, (NEW.data || ' ' || NEW.horario)::timestamptz,
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    -- 5. Marcar agendamento online como convertido
    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
    
  END IF;
  RETURN NEW;
END;
$$;

-- Re-vincular trigger
DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- ==============================================================================
-- 4. PERMISSÕES E RLS
-- ==============================================================================

-- Garantir RLS habilitado
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

-- Política de inserção pública (simplificada para evitar erros de FK em RLS)
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.agendamentos_online;
CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos_online
FOR INSERT
TO public
WITH CHECK (true);

-- Política de leitura para anon (necessária para verificar disponibilidade)
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Public can check availability" ON public.agendamentos_online;
CREATE POLICY "Public can check availability"
ON public.agendamentos_online
FOR SELECT
TO public
USING (status IN ('pendente', 'confirmado', 'convertido') AND data >= CURRENT_DATE);

-- Garantir permissões de acesso
GRANT SELECT, INSERT, UPDATE ON TABLE public.agendamentos_online TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.clientes TO anon, authenticated;
GRANT SELECT ON TABLE public.servicos TO anon, authenticated;
GRANT SELECT ON TABLE public.agendamentos TO anon, authenticated;

COMMIT;
