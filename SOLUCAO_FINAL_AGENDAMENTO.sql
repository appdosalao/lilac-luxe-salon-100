-- ==============================================================================
-- SQL DE LIMPEZA ABSOLUTA: REMOVENDO CONFLITOS DE 'owner_user_id'
-- ==============================================================================
-- Este script apaga TODAS as regras antigas que estão causando o erro 
-- "record 'new' has no field 'owner_user_id'" e redefine o agendamento online.
-- ==============================================================================

BEGIN;

-- 1. APAGAR TODOS OS TRIGGERS POSSÍVEIS (LIMPEZA TOTAL)
DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
DROP TRIGGER IF EXISTS trg_set_agendamento_online_owner_user_id ON public.agendamentos_online;
DROP TRIGGER IF EXISTS validar_agendamento_online_trigger ON public.agendamentos_online;
DROP TRIGGER IF EXISTS on_agendamento_online_confirmed ON public.agendamentos_online;
DROP TRIGGER IF EXISTS sync_online_booking_trigger ON public.agendamentos_online;

-- 2. APAGAR FUNÇÕES ANTIGAS QUE POSSAM CONTER O ERRO
DROP FUNCTION IF EXISTS public.set_agendamento_online_owner_user_id();
DROP FUNCTION IF EXISTS public.validar_agendamento_online();
DROP FUNCTION IF EXISTS public.sync_online_para_agendamento();

-- 3. GARANTIR QUE A TABELA SÓ TENHA A COLUNA CORRETA (user_id)
DO $$
BEGIN
    -- Se existir owner_user_id, tentamos renomear ou apagar se já tivermos user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_online' AND column_name = 'owner_user_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_online' AND column_name = 'user_id') THEN
            ALTER TABLE public.agendamentos_online RENAME COLUMN owner_user_id TO user_id;
        ELSE
            ALTER TABLE public.agendamentos_online DROP COLUMN owner_user_id;
        END IF;
    END IF;
    
    -- Se não tiver user_id, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_online' AND column_name = 'user_id') THEN
        ALTER TABLE public.agendamentos_online ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END$$;

-- 4. RE-CRIAR A FUNÇÃO DE SINCRONIZAÇÃO (LIMPA E MODERNA)
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
  -- Só executa se estiver confirmado e ainda não foi sincronizado
  IF NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Pegar o dono (user_id)
    v_user_id := NEW.user_id;
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.servicos WHERE id = NEW.servico_id LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    -- Tentar achar ou criar cliente
    SELECT id INTO v_cliente_id FROM public.clientes 
    WHERE user_id = v_user_id AND (email = NEW.email OR telefone = NEW.telefone) LIMIT 1;

    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      INSERT INTO public.clientes (id, user_id, nome, email, telefone, observacoes)
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Cliente Online');
    END IF;

    -- Criar o agendamento real na agenda do profissional
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

    -- Atualizar o registro online para saber que já foi para a agenda
    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
    
  END IF;
  RETURN NEW;
END;
$$;

-- 5. VINCULAR A TRIGGER NOVAMENTE
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- 6. PERMISSÕES FINAIS
GRANT ALL ON TABLE public.agendamentos_online TO anon, public, authenticated;
GRANT ALL ON TABLE public.clientes TO anon, public, authenticated;
GRANT ALL ON TABLE public.agendamentos TO anon, public, authenticated;

COMMIT;
