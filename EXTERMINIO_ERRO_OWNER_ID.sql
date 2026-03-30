-- ==============================================================================
-- SQL DE EXTERMÍNIO: LIMPANDO GATILHOS FANTASMAS (owner_user_id)
-- ==============================================================================
-- Este script localiza e apaga QUALQUER regra que mencione 'owner_user_id',
-- limpando o caminho para o agendamento online funcionar.
-- ==============================================================================

DO $$
DECLARE
    trig_record RECORD;
    func_record RECORD;
BEGIN
    -- 1. Localizar e apagar todos os TRIGGERS que referenciam funções com 'owner_user_id'
    -- ou que estejam na tabela agendamentos_online
    FOR trig_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE event_object_table = 'agendamentos_online' 
           OR trigger_name ILIKE '%owner_user_id%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig_record.trigger_name, trig_record.event_object_table);
    END LOOP;

    -- 2. Localizar e apagar todas as FUNÇÕES que contenham o texto 'owner_user_id'
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND (prosrc ILIKE '%owner_user_id%' OR proname ILIKE '%owner_user_id%')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
    END LOOP;

END $$;

-- 3. GARANTIR QUE A TABELA NÃO TENHA A COLUNA PROBLEMÁTICA
ALTER TABLE public.agendamentos_online DROP COLUMN IF EXISTS owner_user_id;

-- 4. REINSTALAR A SINCRONIZAÇÃO LIMPA (Padrão user_id)
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
BEGIN
  IF NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Tentar pegar o user_id do agendamento ou do serviço
    v_user_id := NEW.user_id;
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.servicos WHERE id = NEW.servico_id LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    -- Cliente
    SELECT id INTO v_cliente_id FROM public.clientes 
    WHERE user_id = v_user_id AND (email = NEW.email OR telefone = NEW.telefone) LIMIT 1;

    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, user_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Cliente Online');
    END IF;

    -- Agendamento Real
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, user_id, cliente_id, servico_id,
      data, hora, data_hora, duracao, valor, valor_pago, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario::time, (NEW.data || ' ' || NEW.horario)::timestamp with time zone,
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), 0, COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. VINCULAR TRIGGER
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- 6. PERMISSÕES
GRANT ALL ON TABLE public.agendamentos_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.clientes TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos TO anon, public, authenticated;
