-- ==============================================================================
-- SQL DE RESTAURAÇÃO: CORREÇÃO DA HARMONIZAÇÃO (VOLTAR PARA user_id)
-- ==============================================================================
-- Este script reverte a renomeação indevida de colunas, voltando para 'user_id'
-- que é o padrão esperado por todo o código do aplicativo (hooks e componentes).
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. LIMPEZA DE POLÍTICAS ANTIGAS (REVOGAÇÃO)
-- ==============================================================================

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
-- 2. RESTAURAÇÃO DE ESTRUTURA (VOLTANDO PARA user_id)
-- ==============================================================================

DO $$
DECLARE
    t_name TEXT;
BEGIN
    -- Loop para restaurar todas as tabelas relevantes para 'user_id'
    FOR t_name IN SELECT unnest(ARRAY[
        'agendamentos_online', 'agendamentos', 'clientes', 'servicos',
        'configuracoes_agendamento_online', 'configuracoes_horarios', 'intervalos_trabalho'
    ]) LOOP
        -- Se existir usuario_id, renomear de volta para user_id (se user_id não existir)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'usuario_id') AND 
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I RENAME COLUMN usuario_id TO user_id', t_name);
        END IF;

        -- Se por algum motivo ainda não existir user_id em tabelas críticas, criar
        IF t_name IN ('agendamentos_online', 'agendamentos', 'clientes', 'servicos') AND
           NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t_name AND column_name = 'user_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id UUID REFERENCES auth.users(id)', t_name);
        END IF;
    END LOOP;

    -- Garantir que data_hora seja NULLABLE na tabela agendamentos
    ALTER TABLE public.agendamentos ALTER COLUMN data_hora DROP NOT NULL;
    
    -- Remover constraints de validação que bloqueiam o fluxo
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_horario_valido;
    ALTER TABLE public.agendamentos DROP CONSTRAINT IF EXISTS check_hora_format;
END$$;

-- ==============================================================================
-- 3. FUNÇÃO DE SINCRONIZAÇÃO ATUALIZADA (VOLTANDO PARA user_id)
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
  v_valor_final numeric;
  v_duracao_final integer;
BEGIN
  -- Só executa se confirmado e não convertido
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- 1. Identificar proprietário e dados do serviço usando user_id
    v_user_id := NEW.user_id;
    
    SELECT nome, COALESCE(NEW.valor, valor, 0), COALESCE(NEW.duracao, duracao, 60), COALESCE(v_user_id, user_id)
    INTO v_servico_nome, v_valor_final, v_duracao_final, v_user_id
    FROM public.servicos 
    WHERE id = NEW.servico_id 
    LIMIT 1;

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
      NEW.data, NEW.horario::text, (NEW.data || ' ' || NEW.horario)::timestamp with time zone,
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
-- 4. POLÍTICAS DE SEGURANÇA (RLS) RESTAURADAS (user_id)
-- ==============================================================================

-- Re-habilitar RLS
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas Públicas
CREATE POLICY "Public insert online" ON public.agendamentos_online FOR INSERT TO anon, public WITH CHECK (true);
CREATE POLICY "Public select online" ON public.agendamentos_online FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public select services" ON public.servicos FOR SELECT TO anon, public USING (true);
CREATE POLICY "Public insert clients" ON public.clientes FOR INSERT TO anon, public WITH CHECK (true);

-- Políticas de Gerenciamento (Dono usando user_id)
CREATE POLICY "Owners manage online" ON public.agendamentos_online FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners manage services" ON public.servicos FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners manage clients" ON public.clientes FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Owners manage agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (user_id = auth.uid());

-- Políticas de Configurações (Públicas)
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
