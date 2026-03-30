CREATE UNIQUE INDEX IF NOT EXISTS idx_niveis_fidelidade_user_cliente_unique
ON public.niveis_fidelidade(user_id, cliente_id);

CREATE OR REPLACE FUNCTION public.recalc_nivel_fidelidade(p_user_id uuid, p_cliente_id uuid)
RETURNS void AS $$
DECLARE
  v_pontos_totais integer;
  v_pontos_gastos integer;
  v_pontos_disponiveis integer;
  v_total_resgates integer;
  v_nivel text;
BEGIN
  SELECT COALESCE(SUM(p.pontos), 0)
  INTO v_pontos_totais
  FROM public.pontos_fidelidade p
  WHERE p.user_id = p_user_id
    AND p.cliente_id = p_cliente_id
    AND p.origem <> 'resgate';

  SELECT COALESCE(SUM(h.pontos_gastos), 0), COALESCE(COUNT(*), 0)
  INTO v_pontos_gastos, v_total_resgates
  FROM public.historico_resgates h
  WHERE h.user_id = p_user_id
    AND h.cliente_id = p_cliente_id;

  v_pontos_disponiveis := GREATEST(v_pontos_totais - v_pontos_gastos, 0);

  SELECT COALESCE((
    SELECT c.nome
    FROM public.classes_fidelidade c
    WHERE c.user_id = p_user_id
      AND c.ativo = true
      AND COALESCE(c.pontos_minimos, 0) <= COALESCE(v_pontos_totais, 0)
    ORDER BY COALESCE(c.pontos_minimos, 0) DESC
    LIMIT 1
  ), 'Bronze')
  INTO v_nivel;

  INSERT INTO public.niveis_fidelidade (
    user_id,
    cliente_id,
    nivel,
    pontos_totais,
    pontos_disponiveis,
    total_resgates,
    data_atualizacao,
    updated_at
  ) VALUES (
    p_user_id,
    p_cliente_id,
    v_nivel,
    v_pontos_totais,
    v_pontos_disponiveis,
    v_total_resgates,
    now(),
    now()
  )
  ON CONFLICT (user_id, cliente_id)
  DO UPDATE SET
    nivel = EXCLUDED.nivel,
    pontos_totais = EXCLUDED.pontos_totais,
    pontos_disponiveis = EXCLUDED.pontos_disponiveis,
    total_resgates = EXCLUDED.total_resgates,
    data_atualizacao = EXCLUDED.data_atualizacao,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_pontos_fidelidade_to_nivel()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);

  IF v_user_id IS NULL OR v_cliente_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.recalc_nivel_fidelidade(v_user_id, v_cliente_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sync_pontos_fidelidade_to_nivel ON public.pontos_fidelidade;
CREATE TRIGGER trigger_sync_pontos_fidelidade_to_nivel
AFTER INSERT OR UPDATE OR DELETE ON public.pontos_fidelidade
FOR EACH ROW EXECUTE FUNCTION public.sync_pontos_fidelidade_to_nivel();

CREATE OR REPLACE FUNCTION public.sync_resgates_to_nivel()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_cliente_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);

  IF v_user_id IS NULL OR v_cliente_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.recalc_nivel_fidelidade(v_user_id, v_cliente_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sync_resgates_to_nivel ON public.historico_resgates;
CREATE TRIGGER trigger_sync_resgates_to_nivel
AFTER INSERT OR UPDATE OR DELETE ON public.historico_resgates
FOR EACH ROW EXECUTE FUNCTION public.sync_resgates_to_nivel();

CREATE OR REPLACE FUNCTION public.creditar_pontos_por_agendamento()
RETURNS TRIGGER AS $$
DECLARE
  v_programa record;
  v_valor_base numeric;
  v_pontos integer;
  v_data_exp date;
  v_existe integer;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  SELECT *
  INTO v_programa
  FROM public.programas_fidelidade pf
  WHERE pf.user_id = NEW.user_id
  LIMIT 1;

  IF v_programa IS NULL OR v_programa.ativo IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'concluido' OR NEW.status_pagamento <> 'pago' THEN
    DELETE FROM public.pontos_fidelidade p
    WHERE p.user_id = NEW.user_id
      AND p.cliente_id = NEW.cliente_id
      AND p.origem = 'agendamento'
      AND p.origem_id = NEW.id;
    RETURN NEW;
  END IF;

  v_valor_base := COALESCE(NULLIF(NEW.valor_pago, 0), NEW.valor, 0);
  v_pontos := FLOOR(v_valor_base * COALESCE(v_programa.pontos_por_real, 0))::int;

  IF v_pontos <= 0 THEN
    DELETE FROM public.pontos_fidelidade p
    WHERE p.user_id = NEW.user_id
      AND p.cliente_id = NEW.cliente_id
      AND p.origem = 'agendamento'
      AND p.origem_id = NEW.id;
    RETURN NEW;
  END IF;

  IF COALESCE(v_programa.expiracao_pontos_dias, 0) > 0 THEN
    v_data_exp := (CURRENT_DATE + (v_programa.expiracao_pontos_dias || ' days')::interval)::date;
  ELSE
    v_data_exp := NULL;
  END IF;

  SELECT COUNT(*)
  INTO v_existe
  FROM public.pontos_fidelidade p
  WHERE p.user_id = NEW.user_id
    AND p.cliente_id = NEW.cliente_id
    AND p.origem = 'agendamento'
    AND p.origem_id = NEW.id;

  IF v_existe = 0 THEN
    INSERT INTO public.pontos_fidelidade (
      user_id,
      cliente_id,
      pontos,
      origem,
      origem_id,
      descricao,
      data_ganho,
      data_expiracao,
      expirado
    ) VALUES (
      NEW.user_id,
      NEW.cliente_id,
      v_pontos,
      'agendamento',
      NEW.id,
      'Pontos por consumo (agendamento)',
      CURRENT_DATE,
      v_data_exp,
      false
    );
  ELSE
    UPDATE public.pontos_fidelidade
    SET pontos = v_pontos,
        data_expiracao = v_data_exp
    WHERE user_id = NEW.user_id
      AND cliente_id = NEW.cliente_id
      AND origem = 'agendamento'
      AND origem_id = NEW.id;
  END IF;

  PERFORM public.recalc_nivel_fidelidade(NEW.user_id, NEW.cliente_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_creditar_pontos_agendamento ON public.agendamentos;
CREATE TRIGGER trigger_creditar_pontos_agendamento
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.creditar_pontos_por_agendamento();
