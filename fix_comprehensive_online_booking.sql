-- CORREÇÃO COMPREENSIVA E ROBUSTA PARA AGENDAMENTO ONLINE
-- Este script resolve o erro de "nome_completo" e previne falhas de "usuario_id" e permissões.

BEGIN;

-- 1. NORMALIZAR TABELA CLIENTES (Garantir que as colunas esperadas existam)
DO $$
BEGIN
    -- Garantir coluna nome (obrigatória)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'nome') THEN
        ALTER TABLE public.clientes ADD COLUMN nome TEXT;
    END IF;

    -- Garantir coluna nome_completo (opcional, mas usada em muitos scripts)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'nome_completo') THEN
        ALTER TABLE public.clientes ADD COLUMN nome_completo TEXT;
    END IF;

    -- Verificar se a coluna de vínculo é usuario_id ou user_id e garantir que aceite NULL temporariamente
    -- se for uma criação via agendamento online anônimo (será corrigido pela trigger de sync)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'usuario_id') THEN
        ALTER TABLE public.clientes ALTER COLUMN usuario_id DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'user_id') THEN
        ALTER TABLE public.clientes ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END$$;

-- 2. CORRIGIR FUNÇÃO DE CRIAÇÃO DE CLIENTE (RPC)
-- Agora ela é mais robusta e tenta identificar o campo de nome correto
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
BEGIN
  -- 1. Tentar encontrar cliente existente pelo email ou telefone
  -- Busca em toda a tabela (como é público, não temos o user_id aqui ainda)
  SELECT id INTO v_cliente_id
  FROM public.clientes
  WHERE (COALESCE(email, '') <> '' AND email = p_email)
     OR (COALESCE(telefone, '') <> '' AND telefone = p_telefone)
  LIMIT 1;

  IF v_cliente_id IS NOT NULL THEN
    RETURN v_cliente_id;
  END IF;

  -- 2. Se não encontrou, criar novo. 
  -- Inserimos tanto em 'nome' quanto em 'nome_completo' para garantir compatibilidade
  INSERT INTO public.clientes (nome, nome_completo, telefone, email, observacoes)
  VALUES (p_nome, p_nome, p_telefone, p_email, p_observacoes)
  RETURNING id INTO v_cliente_id;

  RETURN v_cliente_id;
END;
$$;

-- 3. CORRIGIR TRIGGER DE SINCRONIZAÇÃO (Garantir que use as colunas certas)
CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
  v_col_user text;
BEGIN
  -- Só executa se confirmado e não convertido
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    
    -- Identificar proprietário pelo serviço
    SELECT user_id INTO v_user_id FROM public.servicos WHERE id = NEW.servico_id LIMIT 1;
    IF v_user_id IS NULL THEN RETURN NEW; END IF;

    -- Descobrir se a coluna é user_id ou usuario_id
    SELECT column_name INTO v_col_user 
    FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name IN ('user_id', 'usuario_id') 
    LIMIT 1;

    -- Tentar encontrar cliente
    EXECUTE format('SELECT id FROM public.clientes WHERE %I = $1 AND (email = $2 OR telefone = $3) LIMIT 1', v_col_user)
    INTO v_cliente_id
    USING v_user_id, NEW.email, NEW.telefone;

    -- Se não encontrou, criar
    IF v_cliente_id IS NULL THEN
      v_cliente_id := gen_random_uuid();
      EXECUTE format(
        'INSERT INTO public.clientes (id, %I, nome, nome_completo, email, telefone, observacoes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)', v_col_user
      )
      USING v_cliente_id, v_user_id, NEW.nome_completo, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via Online';
    ELSE
      -- Se encontrou, garante que o vínculo de dono está correto
      EXECUTE format('UPDATE public.clientes SET %I = $1 WHERE id = $2', v_col_user)
      USING v_user_id, v_cliente_id;
    END IF;

    -- Criar agendamento real
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, usuario_id, cliente_id, servico_id,
      cliente_nome, servico_nome,
      data, hora, data_hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento, status, origem, confirmado, observacoes
    )
    SELECT 
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.nome_completo, s.nome,
      NEW.data, NEW.horario, (NEW.data || ' ' || NEW.horario)::timestamptz,
      COALESCE(s.duracao, 60), COALESCE(s.valor, 0), COALESCE(s.valor, 0),
      'fiado', 'em_aberto', 'agendado', 'online', true, NEW.observacoes
    FROM public.servicos s WHERE s.id = NEW.servico_id;

    -- Marcar como convertido
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

-- 4. PERMISSÕES FINAIS
GRANT EXECUTE ON FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.clientes TO anon;

COMMIT;
