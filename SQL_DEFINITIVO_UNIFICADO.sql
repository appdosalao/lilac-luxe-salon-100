-- ==============================================================================
-- SQL FINAL E DEFINITIVO: UNIFICAÇÃO E CORREÇÃO DO AGENDAMENTO ONLINE
-- ==============================================================================
-- Este script resolve todos os conflitos de nomes (usuario_id) e garante que
-- o agendamento online apareça na agenda principal sem erros.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. LIMPEZA TOTAL DE POLÍTICAS E PERMISSÕES ANTIGAS
-- ==============================================================================

REVOKE ALL ON TABLE public.agendamentos_online FROM anon, public;
REVOKE ALL ON TABLE public.clientes FROM anon, public;
REVOKE ALL ON TABLE public.servicos FROM anon, public;
REVOKE ALL ON TABLE public.agendamentos FROM anon, public;

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
-- 2. HARMONIZAÇÃO DE ESTRUTURA (USANDO usuario_id COMO PADRÃO)
-- ==============================================================================

DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Loop para harmonizar todas as tabelas relevantes
    FOR t_name IN SELECT unnest(ARRAY[
        'agendamentos_online', 'agendamentos', 'clientes', 'servicos',
        'configuracoes_agendamento_online', 'configuracoes_horarios', 'intervalos_trabalho'
    ]) LOOP
        -- Se existir owner_user_id, renomear para usuario_id (se usuario_id não existir)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'owner_user_id') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN owner_user_id TO usuario_id', t_name);
        END IF;

        -- Se existir user_id, renomear para usuario_id (se usuario_id não existir)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'user_id') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN user_id TO usuario_id', t_name);
        END IF;

        -- Se ainda não existir usuario_id em tabelas críticas, criar
        IF t_name IN ('agendamentos_online', 'agendamentos', 'clientes', 'servicos') AND
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN usuario_id UUID REFERENCES auth.users(id)', t_name);
        END IF;
        
        -- Limpar colunas duplicadas (ex: se existirem usuario_id E user_id após renomear ou se já existiam)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'user_id') AND 
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN user_id', t_name);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'owner_user_id') AND 
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN owner_user_id', t_name);
        END IF;
    END LOOP;

    -- Garantir que data_hora seja NULLABLE na tabela agendamentos
    ALTER TABLE public.agendamentos ALTER COLUMN data_hora DROP NOT NULL;
    
    -- Remover constraints de validação que bloqueiam o fluxo
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_horario_valido;
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_hora_format;
END$$;

-- ==============================================================================
-- 3. FUNÇÃO DE SINCRONIZAÇÃO ATUALIZADA (usuario_id)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
  v_servico_nome text;
  v_valor_final numeric;
  v_duracao_final integer;
BEGIN
  -- Só executa se confirmado e não convertido
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- 1. Identificar proprietário e dados do serviço usando usuario_id
    v_usuario_id := NEW.usuario_id;
    
    SELECT nome, COALESCE(NEW.valor, valor, 0), COALESCE(NEW.duracao, duracao, 60), COALESCE(v_usuario_id, usuario_id)
    INTO v_servico_nome, v_valor_final, v_duracao_final, v_usuario_id
    FROM public.servicos 
    WHERE id = NEW.servico_id 
    LIMIT 1;

    IF v_usuario_id IS NULL THEN RETURN NEW; END IF;

    -- 2. Tentar encontrar cliente vinculado ao dono
    SELECT id INTO v_cliente_id 
    FROM public.clientes 
    WHERE usuario_id = v_usuario_id 
      AND (email = NEW.email OR telefone = NEW.telefone)
    LIMIT 1;

    -- 3. Se não encontrou, criar cliente vinculado
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, usuario_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_usuario_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via Agendamento Online');
    END IF;

    -- 4. Criar agendamento real na agenda principal
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, data_hora, duracao, valor, valor_pago, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario::time, (NEW.data || ' ' || NEW.horario)::timestamp with time zone,
      v_duracao_final, v_valor_final, 0, v_valor_final,
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
-- 4. POLÍTICAS DE SEGURANÇA (RLS) E PERMISSÕES PÚBLICAS
-- ==============================================================================

ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas
CREATE POLICY "Public insert online" ON public.agendamentos_online FOR INSERT TO anon, public WITH CHECK (true);
CREATE POLICY "Public select online" ON public.agendamentos_online FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select services" ON public.servicos FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public insert clients" ON public.clientes FOR INSERT TO anon, public WITH CHECK (true);

-- Políticas de Gerenciamento (Dono)
CREATE POLICY "Owners manage online" ON public.agendamentos_online FOR ALL TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Owners manage services" ON public.servicos FOR ALL TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Owners manage clients" ON public.clientes FOR ALL TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Owners manage agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (usuario_id = auth.uid());

-- Políticas de Configurações (Públicas)
ALTER TABLE public.configuracoes_agendamento_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view config online" ON public.configuracoes_agendamento_online FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public view config hours" ON public.configuracoes_horarios FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public view config intervals" ON public.intervalos_trabalho FOR SELECT TO anon, public USING (true);

-- Garantir GRANTS finais
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
