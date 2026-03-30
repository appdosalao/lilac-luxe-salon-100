-- ==============================================================================
-- SQL DE LIMPEZA E SINCRONIZAÇÃO FINAL: REMOVENDO owner_user_id
-- ==============================================================================
-- Este script elimina de vez o erro "record 'new' has no field 'owner_user_id'"
-- removendo triggers fantasmas e atualizando a sincronização.
-- ==============================================================================

BEGIN;

-- 1. REMOVER TRIGGERS FANTASMAS QUE USAM owner_user_id
DROP TRIGGER IF EXISTS trg_set_agendamento_online_owner_user_id ON public.agendamentos_online;
DROP FUNCTION IF EXISTS public.set_agendamento_online_owner_user_id();

-- 2. GARANTIR QUE A TABELA agendamentos_online USE APENAS user_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agendamentos_online' AND column_name = 'owner_user_id') THEN
        ALTER TABLE public.agendamentos_online DROP COLUMN owner_user_id;
    END IF;
END$$;

-- 3. ATUALIZAR FUNÇÃO DE SINCRONIZAÇÃO (Padrão user_id)
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
    
    -- 1. Identificar proprietário e nome do serviço (usando user_id)
    v_user_id := NEW.user_id;
    
    SELECT nome INTO v_servico_nome 
    FROM public.servicos 
    WHERE id = NEW.servico_id 
    LIMIT 1;

    -- Se não veio user_id no agendamento, tenta pegar do serviço
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.servicos WHERE id = NEW.servico_id;
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
      VALUES (v_cliente_id, v_user_id, NEW.nome_completo, NEW.email, NEW.telefone, 'Agendamento Online');
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
      COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), 0, COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    );

    -- 5. Marcar agendamento online como convertido e vincular ID
    NEW.agendamento_id := v_ag_id;
    NEW.status := 'convertido';
    
  END IF;
  RETURN NEW;
END;
$$;

-- 4. RE-VINCULAR TRIGGER DE SINCRONIZAÇÃO
DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
BEFORE INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

COMMIT;
