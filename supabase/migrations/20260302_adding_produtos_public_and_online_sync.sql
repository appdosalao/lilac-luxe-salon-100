-- Produtos públicos para formulário online
-- Executar no Supabase: esta migration cria a view, políticas e a sincronização do online -> agendamentos

-- 1) View pública de produtos (somente ativos)
CREATE OR REPLACE VIEW public.produtos_public AS
SELECT 
  id, 
  nome, 
  preco_venda AS valor, 
  ativo, 
  usuario_id,
  categoria,
  categoria_id
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

    -- Criar venda de produto se houver intenção em observações
    IF NEW.observacoes IS NOT NULL AND POSITION('Compra de produto:' IN NEW.observacoes) > 0 THEN
      DECLARE
        v_json_text text;
        v_compra jsonb;
        v_produto_id uuid;
        v_qtd int;
        v_forma text;
        v_unit numeric;
        v_total numeric;
        v_venda_id uuid;
      BEGIN
        -- Extrair JSON após o marcador
        v_json_text := SUBSTRING(NEW.observacoes FROM POSITION('Compra de produto:' IN NEW.observacoes) + CHAR_LENGTH('Compra de produto:'));
        -- Truncar em eventual quebra de linha
        IF POSITION(E'\n' IN v_json_text) > 0 THEN
          v_json_text := SUBSTRING(v_json_text FROM 1 FOR POSITION(E'\n' IN v_json_text)-1);
        END IF;
        v_compra := v_json_text::jsonb;
        v_produto_id := (v_compra->>'produto_id')::uuid;
        v_qtd := COALESCE((v_compra->>'quantidade')::int, 1);
        v_forma := COALESCE(NULLIF(v_compra->>'forma_pagamento_produto',''), 'fiado');

        -- Buscar preço de venda do produto
        SELECT preco_venda INTO v_unit FROM public.produtos WHERE id = v_produto_id;
        v_total := COALESCE(v_unit, 0) * v_qtd;
        v_venda_id := gen_random_uuid();

        -- Inserir venda
        INSERT INTO public.vendas_produtos (
          id, user_id, cliente_id, agendamento_id,
          data_venda, forma_pagamento, status_pagamento,
          valor_total, observacoes
        ) VALUES (
          v_venda_id, v_user_id, v_cliente_id, v_ag_id,
          NOW()::date, v_forma, 'pendente',
          v_total, 'Criada via agendamento online'
        );

        -- Inserir item
        INSERT INTO public.itens_venda (
          id, venda_id, produto_id, quantidade, valor_unitario, valor_total, created_at
        ) VALUES (
          gen_random_uuid(), v_venda_id, v_produto_id, v_qtd, COALESCE(v_unit,0), v_total, NOW()
        );

        -- Anexar no histórico do cliente
        UPDATE public.clientes
        SET historico_servicos = COALESCE(historico_servicos, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'tipo', 'compra_produto',
            'produto_id', v_produto_id,
            'produto_nome', (SELECT nome FROM public.produtos WHERE id = v_produto_id),
            'quantidade', v_qtd,
            'valor_total', v_total,
            'data', NOW()
          )
        )
        WHERE id = v_cliente_id;
      EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro na venda, apenas registra e prossegue
        RAISE NOTICE 'Falha ao criar venda_produtos vinculada: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_sync_online_para_agendamento ON public.agendamentos_online;
CREATE TRIGGER trg_sync_online_para_agendamento
AFTER INSERT OR UPDATE OF status ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.sync_online_para_agendamento();

-- 4) Lançamento e baixa de estoque quando a venda for paga
CREATE OR REPLACE FUNCTION public.on_vendas_produtos_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lanc_id uuid;
  v_item RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status_pagamento = 'pago' AND (OLD.status_pagamento IS DISTINCT FROM 'pago') THEN
    -- Lançamento financeiro
    INSERT INTO public.lancamentos (
      id, user_id, tipo, valor, data, descricao, categoria, origem_id, origem_tipo, cliente_id, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), NEW.user_id, 'entrada', NEW.valor_total, NOW()::date,
      'Venda de produto (agendamento) ', 'Produtos Vendidos', NEW.id, 'venda', NEW.cliente_id, NOW(), NOW()
    )
    RETURNING id INTO v_lanc_id;

    UPDATE public.vendas_produtos
    SET lancamento_id = v_lanc_id
    WHERE id = NEW.id;

    -- Baixa de estoque para cada item
    FOR v_item IN SELECT * FROM public.itens_venda WHERE venda_id = NEW.id LOOP
      INSERT INTO public.movimentacoes_estoque (
        id, user_id, produto_id, quantidade, tipo, origem_id, origem_tipo, motivo, valor_unitario, valor_total, created_at
      ) VALUES (
        gen_random_uuid(), NEW.user_id, v_item.produto_id, v_item.quantidade, 'saida',
        NEW.id, 'venda', 'Venda de produto (pagamento confirmado)', v_item.valor_unitario, v_item.valor_total, NOW()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_on_vendas_produtos_pago ON public.vendas_produtos;
CREATE TRIGGER trg_on_vendas_produtos_pago
AFTER UPDATE OF status_pagamento ON public.vendas_produtos
FOR EACH ROW
EXECUTE FUNCTION public.on_vendas_produtos_pago();
