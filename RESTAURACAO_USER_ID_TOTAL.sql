-- ==============================================================================
-- SUPER RESTAURAÇÃO: VOLTAR TUDO PARA O PADRÃO 'user_id'
-- ==============================================================================
-- Este script é a correção definitiva para restaurar o acesso aos dados
-- e garantir que o agendamento online funcione sem quebrar o resto do app.
-- ==============================================================================

BEGIN;

-- 1. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. HARMONIZAÇÃO AGRESSIVA DE TODAS AS TABELAS PARA 'user_id'
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        
        -- Caso exista usuario_id e NÃO exista user_id -> RENOMEAR
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'usuario_id') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN usuario_id TO user_id', t_name);
        END IF;

        -- Caso exista owner_user_id e NÃO exista user_id -> RENOMEAR
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'owner_user_id') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN owner_user_id TO user_id', t_name);
        END IF;

        -- Caso existam AMBOS (user_id e usuario_id) -> REMOVER o usuario_id para evitar conflito
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'usuario_id') AND 
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN usuario_id', t_name);
        END IF;

        -- Garantir que tabelas vitais tenham user_id
        IF t_name IN ('agendamentos', 'clientes', 'servicos', 'configuracoes', 'financeiro', 'configuracoes_agendamento_online') AND
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID REFERENCES auth.users(id)', t_name);
        END IF;

    END LOOP;
END $$;

-- 3. AJUSTES DE CONSTRAINTS E COLUNAS OBRIGATÓRIAS
ALTER TABLE public.agendamentos ALTER COLUMN data_hora DROP NOT NULL;
ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_horario_valido;
ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_hora_format;

-- 4. RE-CRIAR TRIGGER DE SINCRONIZAÇÃO (Padrão user_id)
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
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Pegar o dono do serviço
    SELECT user_id, nome INTO v_user_id, v_servico_nome 
    FROM public.servicos 
    WHERE id = NEW.servico_id 
    LIMIT 1;

    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    -- Tentar achar cliente
    SELECT id INTO v_cliente_id 
    FROM public.clientes 
    WHERE user_id = v_user_id 
      AND (email = NEW.email OR telefone = NEW.telefone)
    LIMIT 1;

    -- Criar cliente se não existir
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, user_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Online');
    END IF;

    -- Criar agendamento real
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, data_hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario::text, (NEW.data || ' ' || NEW.horario)::timestamp with time zone,
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- 5. POLÍTICAS RLS (user_id)
DO $$
DECLARE
    t_name TEXT;
BEGIN
    FOR t_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
        
        -- Política para o dono (user_id)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('CREATE POLICY "Owner access %I" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid())', t_name, t_name);
        END IF;
    END LOOP;
END $$;

-- Polices Públicas Adicionais para Agendamento Online
CREATE POLICY "Public insert online" ON public.agendamentos_online FOR INSERT TO anon, public WITH CHECK (true);
CREATE POLICY "Public select online" ON public.agendamentos_online FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select services" ON public.servicos FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public insert clients" ON public.clientes FOR INSERT TO anon, public WITH CHECK (true);
CREATE POLICY "Public view config online" ON public.configuracoes_agendamento_online FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public view configs" ON public.configuracoes_horarios FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public view intervals" ON public.intervalos_trabalho FOR SELECT TO anon, public USING (true);

-- 6. GRANTS FINAIS
GRANT USAGE ON SCHEMA public TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.clientes TO anon, public, authenticated;
GRANT ALL ON TABLE public.servicos TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos TO anon, public, authenticated;
GRANT ALL ON TABLE public.configuracoes_agendamento_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.configuracoes_horarios TO anon, public, authenticated;
GRANT ALL ON TABLE public.intervalos_trabalho TO anon, public, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, public, authenticated;

COMMIT;
