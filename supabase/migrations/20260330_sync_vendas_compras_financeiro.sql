-- ==========================================
-- MELHORIA NO FLUXO DE VENDAS E FINANCEIRO
-- ==========================================

-- 1. Adicionar coluna lancamento_id na tabela de agendamentos se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='agendamentos' AND COLUMN_NAME='lancamento_id') THEN
        ALTER TABLE public.agendamentos ADD COLUMN lancamento_id UUID REFERENCES public.lancamentos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Função de sincronização para VENDAS (vendas_produtos)
CREATE OR REPLACE FUNCTION public.sync_venda_to_financeiro()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id UUID;
BEGIN
    -- Prevenir recursão infinita
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.valor_total = NEW.valor_total AND 
            OLD.data_venda = NEW.data_venda AND 
            OLD.cliente_id IS NOT DISTINCT FROM NEW.cliente_id AND
            OLD.lancamento_id IS NOT DISTINCT FROM NEW.lancamento_id) THEN
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        -- Criar lançamento financeiro
        INSERT INTO public.lancamentos (
            user_id,
            tipo,
            valor,
            data,
            descricao,
            categoria,
            origem_id,
            origem_tipo,
            cliente_id
        ) VALUES (
            NEW.user_id,
            'entrada',
            NEW.valor_total,
            NEW.data_venda,
            'Venda de produtos',
            'Venda de Produtos',
            NEW.id,
            'venda_produto',
            NEW.cliente_id
        ) RETURNING id INTO v_lancamento_id;

        -- Vincular o lançamento à venda
        UPDATE public.vendas_produtos SET lancamento_id = v_lancamento_id WHERE id = NEW.id;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NEW.lancamento_id IS NOT NULL) THEN
            UPDATE public.lancamentos SET
                valor = NEW.valor_total,
                data = NEW.data_venda,
                cliente_id = NEW.cliente_id,
                updated_at = now()
            WHERE id = NEW.lancamento_id;
        ELSE
            -- Se não tem lançamento mas agora tem valor, cria um
            INSERT INTO public.lancamentos (
                user_id,
                tipo,
                valor,
                data,
                descricao,
                categoria,
                origem_id,
                origem_tipo,
                cliente_id
            ) VALUES (
                NEW.user_id,
                'entrada',
                NEW.valor_total,
                NEW.data_venda,
                'Venda de produtos',
                'Venda de Produtos',
                NEW.id,
                'venda_produto',
                NEW.cliente_id
            ) RETURNING id INTO v_lancamento_id;
            
            UPDATE public.vendas_produtos SET lancamento_id = v_lancamento_id WHERE id = NEW.id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.lancamento_id IS NOT NULL THEN
            DELETE FROM public.lancamentos WHERE id = OLD.lancamento_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Função de sincronização para COMPRAS
CREATE OR REPLACE FUNCTION public.sync_compra_to_financeiro()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id UUID;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.valor_total = NEW.valor_total AND 
            OLD.data_compra = NEW.data_compra AND 
            OLD.numero_nota IS NOT DISTINCT FROM NEW.numero_nota AND
            OLD.lancamento_id IS NOT DISTINCT FROM NEW.lancamento_id) THEN
            RETURN NEW;
        END IF;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.lancamentos (
            user_id,
            tipo,
            valor,
            data,
            descricao,
            categoria,
            origem_id,
            origem_tipo
        ) VALUES (
            NEW.user_id,
            'saida',
            NEW.valor_total,
            NEW.data_compra,
            'Compra de produtos' || COALESCE(' - Nota ' || NEW.numero_nota, ''),
            'Compra de Produtos',
            NEW.id,
            'compra_produto'
        ) RETURNING id INTO v_lancamento_id;

        UPDATE public.compras SET lancamento_id = v_lancamento_id WHERE id = NEW.id;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NEW.lancamento_id IS NOT NULL) THEN
            UPDATE public.lancamentos SET
                valor = NEW.valor_total,
                data = NEW.data_compra,
                descricao = 'Compra de produtos' || COALESCE(' - Nota ' || NEW.numero_nota, ''),
                updated_at = now()
            WHERE id = NEW.lancamento_id;
        ELSE
            INSERT INTO public.lancamentos (
                user_id,
                tipo,
                valor,
                data,
                descricao,
                categoria,
                origem_id,
                origem_tipo
            ) VALUES (
                NEW.user_id,
                'saida',
                NEW.valor_total,
                NEW.data_compra,
                'Compra de produtos' || COALESCE(' - Nota ' || NEW.numero_nota, ''),
                'Compra de Produtos',
                NEW.id,
                'compra_produto'
            ) RETURNING id INTO v_lancamento_id;
            
            UPDATE public.compras SET lancamento_id = v_lancamento_id WHERE id = NEW.id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.lancamento_id IS NOT NULL THEN
            DELETE FROM public.lancamentos WHERE id = OLD.lancamento_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Função de sincronização para AGENDAMENTOS
CREATE OR REPLACE FUNCTION public.sync_agendamento_to_financeiro()
RETURNS TRIGGER AS $$
DECLARE
    v_lancamento_id UUID;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.valor_pago = NEW.valor_pago AND 
            OLD.data = NEW.data AND 
            OLD.status = NEW.status AND
            OLD.cliente_id IS NOT DISTINCT FROM NEW.cliente_id AND
            OLD.lancamento_id IS NOT DISTINCT FROM NEW.lancamento_id) THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Lógica: Sincronizar apenas se estiver concluído e tiver valor pago
    IF (NEW.status = 'concluido' AND NEW.valor_pago > 0) THEN
        IF (NEW.lancamento_id IS NULL) THEN
            INSERT INTO public.lancamentos (
                user_id,
                tipo,
                valor,
                data,
                descricao,
                categoria,
                origem_id,
                origem_tipo,
                cliente_id
            ) VALUES (
                NEW.user_id,
                'entrada',
                NEW.valor_pago,
                NEW.data,
                'Serviço prestado (Concluído)',
                'Serviços Prestados',
                NEW.id,
                'agendamento',
                NEW.cliente_id
            ) RETURNING id INTO v_lancamento_id;

            UPDATE public.agendamentos SET lancamento_id = v_lancamento_id WHERE id = NEW.id;
        ELSE
            UPDATE public.lancamentos SET
                valor = NEW.valor_pago,
                data = NEW.data,
                cliente_id = NEW.cliente_id,
                updated_at = now()
            WHERE id = NEW.lancamento_id;
        END IF;
    ELSE
        -- Se não está mais concluído ou valor pago zerou, mas tinha lançamento, remove
        IF (OLD.lancamento_id IS NOT NULL) THEN
            DELETE FROM public.lancamentos WHERE id = OLD.lancamento_id;
            -- Limpar o ID na tabela de agendamentos (será feito via trigger de update recursivo controlado)
            UPDATE public.agendamentos SET lancamento_id = NULL WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Criar Triggers
DROP TRIGGER IF EXISTS trigger_sync_venda_financeiro ON public.vendas_produtos;
CREATE TRIGGER trigger_sync_venda_financeiro
AFTER INSERT OR UPDATE OR DELETE ON public.vendas_produtos
FOR EACH ROW EXECUTE FUNCTION public.sync_venda_to_financeiro();

DROP TRIGGER IF EXISTS trigger_sync_compra_financeiro ON public.compras;
CREATE TRIGGER trigger_sync_compra_financeiro
AFTER INSERT OR UPDATE OR DELETE ON public.compras
FOR EACH ROW EXECUTE FUNCTION public.sync_compra_to_financeiro();

DROP TRIGGER IF EXISTS trigger_sync_agendamento_financeiro ON public.agendamentos;
CREATE TRIGGER trigger_sync_agendamento_financeiro
AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.sync_agendamento_to_financeiro();
