-- Produtos públicos para formulário online
-- Executar no Supabase: esta migration cria a view, políticas e a sincronização do online -> agendamentos

-- 1) View pública de produtos (somente ativos)
CREATE OR REPLACE VIEW public.produtos_public AS
SELECT id, nome, valor, ativo, usuario_id
FROM public.produtos
WHERE ativo = true;

-- 2) RLS e políticas de leitura pública de produtos (somente ativos)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'produtos' AND policyname = 'produtos_public_select') THEN
    EXECUTE 'DROP POLICY produtos_public_select ON public.produtos';
  END IF;
END$$;

CREATE POLICY produtos_public_select
ON public.produtos
FOR SELECT
TO anon
USING (ativo = true);

-- 3) Sincronização: quando online confirmar, criar agendamento e vincular
CREATE OR REPLACE FUNCTION public.sync_online_para_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
  v_ag_id uuid;
BEGIN
  IF TG_OP IN ('UPDATE', 'INSERT') AND NEW.status = 'confirmado' AND NEW.agendamento_id IS NULL THEN
    -- Identificar proprietário pelo serviço
    SELECT user_id INTO v_user_id
    FROM public.servicos
    WHERE id = NEW.servico_id
    LIMIT 1;

    -- Criar/obter cliente (função auxiliar)
    BEGIN
      SELECT public.criar_cliente_agendamento_online(
        p_email      := NEW.email,
        p_nome       := NEW.nome_completo,
        p_observacoes:= NEW.observacoes,
        p_telefone   := NEW.telefone
      ) INTO v_cliente_id;
    EXCEPTION
      WHEN undefined_function THEN
        -- Fallback: tentar localizar cliente por email/telefone
        SELECT c.id INTO v_cliente_id
        FROM public.clientes c
        WHERE (COALESCE(c.email,'') <> '' AND c.email = NEW.email)
           OR (COALESCE(c.telefone,'') <> '' AND c.telefone = NEW.telefone)
        LIMIT 1;
        IF v_cliente_id IS NULL THEN
          INSERT INTO public.clientes (id, usuario_id, nome, nome_completo, email, telefone, observacoes)
          VALUES (gen_random_uuid(), v_user_id, NEW.nome_completo, NEW.nome_completo, NEW.email, NEW.telefone, 'Criado via online')
          RETURNING id INTO v_cliente_id;
        END IF;
    END;

    -- Criar agendamento
    v_ag_id := gen_random_uuid();
    INSERT INTO public.agendamentos (
      id, usuario_id, cliente_id, servico_id,
      data, hora, duracao, valor, valor_devido,
      forma_pagamento, status_pagamento,
      status, origem, confirmado, observacoes
    ) VALUES (
      v_ag_id, v_user_id, v_cliente_id, NEW.servico_id,
      NEW.data, NEW.horario::time, COALESCE(NEW.duracao, 60), COALESCE(NEW.valor, 0), COALESCE(NEW.valor, 0),
      'fiado', 'em_aberto',
      'agendado', 'online', true, NEW.observacoes
    );

    -- Vincular no online e marcar 'convertido'
    UPDATE public.agendamentos_online
    SET agendamento_id = v_ag_id,
        status = 'convertido',
        updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
AFTER INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

