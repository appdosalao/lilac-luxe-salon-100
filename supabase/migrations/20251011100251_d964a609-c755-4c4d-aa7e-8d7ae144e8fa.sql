-- Função para cadastrar automaticamente pontos quando um agendamento é marcado como pago
CREATE OR REPLACE FUNCTION public.registrar_pontos_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_programa RECORD;
  v_pontos_ganhos INTEGER;
  v_nivel_cliente TEXT;
  v_pontos_fidelidade RECORD;
BEGIN
  -- Apenas processa se o pagamento foi concluído (status_pagamento mudou para 'pago')
  IF NEW.status_pagamento = 'pago' AND (OLD.status_pagamento IS NULL OR OLD.status_pagamento != 'pago') THEN
    
    -- Buscar programa de fidelidade ativo do usuário
    SELECT * INTO v_programa
    FROM programas_fidelidade
    WHERE user_id = NEW.user_id
      AND ativo = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_programa.id IS NOT NULL THEN
      -- Verificar se já existe registro de pontos para este cliente
      SELECT * INTO v_pontos_fidelidade
      FROM pontos_fidelidade
      WHERE cliente_id = NEW.cliente_id
        AND programa_id = v_programa.id;
      
      -- Se não existe, criar registro inicial
      IF v_pontos_fidelidade.id IS NULL THEN
        INSERT INTO pontos_fidelidade (
          user_id,
          cliente_id,
          programa_id,
          pontos_totais,
          pontos_disponiveis,
          pontos_resgatados,
          nivel
        ) VALUES (
          NEW.user_id,
          NEW.cliente_id,
          v_programa.id,
          0,
          0,
          0,
          'bronze'
        ) RETURNING * INTO v_pontos_fidelidade;
      END IF;
      
      -- Calcular pontos com multiplicador do nível
      v_pontos_ganhos := calcular_pontos_com_nivel(
        NEW.valor_pago,
        v_programa.pontos_por_real,
        v_pontos_fidelidade.nivel
      );
      
      -- Atualizar pontos do cliente
      UPDATE pontos_fidelidade
      SET 
        pontos_totais = pontos_totais + v_pontos_ganhos,
        pontos_disponiveis = pontos_disponiveis + v_pontos_ganhos,
        updated_at = NOW()
      WHERE id = v_pontos_fidelidade.id;
      
      -- Registrar no histórico
      INSERT INTO historico_pontos (
        user_id,
        cliente_id,
        programa_id,
        agendamento_id,
        pontos,
        tipo,
        descricao,
        nivel_cliente,
        multiplicador_aplicado
      ) VALUES (
        NEW.user_id,
        NEW.cliente_id,
        v_programa.id,
        NEW.id,
        v_pontos_ganhos,
        'ganho',
        'Pontos ganhos por pagamento de serviço',
        v_pontos_fidelidade.nivel,
        CASE v_pontos_fidelidade.nivel
          WHEN 'prata' THEN 1.2
          WHEN 'ouro' THEN 1.5
          WHEN 'platina' THEN 2.0
          ELSE 1.0
        END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar pontos automaticamente
DROP TRIGGER IF EXISTS trigger_registrar_pontos_agendamento ON agendamentos;
CREATE TRIGGER trigger_registrar_pontos_agendamento
  AFTER INSERT OR UPDATE OF status_pagamento ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_pontos_agendamento();

-- Função para cadastrar automaticamente clientes elegíveis em um novo programa
CREATE OR REPLACE FUNCTION public.cadastrar_clientes_programa_fidelidade(p_programa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_programa RECORD;
  v_cliente RECORD;
  v_total_gasto NUMERIC;
  v_pontos_iniciais INTEGER;
  v_clientes_cadastrados INTEGER := 0;
BEGIN
  -- Buscar informações do programa
  SELECT * INTO v_programa
  FROM programas_fidelidade
  WHERE id = p_programa_id;
  
  IF v_programa.id IS NULL THEN
    RAISE EXCEPTION 'Programa de fidelidade não encontrado';
  END IF;
  
  -- Buscar todos os clientes do usuário que têm agendamentos pagos
  FOR v_cliente IN
    SELECT DISTINCT
      c.id as cliente_id,
      c.user_id,
      COALESCE(SUM(a.valor_pago), 0) as total_gasto
    FROM clientes c
    LEFT JOIN agendamentos a ON a.cliente_id = c.id AND a.status_pagamento = 'pago'
    WHERE c.user_id = v_programa.user_id
    GROUP BY c.id, c.user_id
    HAVING COALESCE(SUM(a.valor_pago), 0) > 0
  LOOP
    -- Verificar se cliente já está cadastrado neste programa
    IF NOT EXISTS (
      SELECT 1 FROM pontos_fidelidade
      WHERE cliente_id = v_cliente.cliente_id
        AND programa_id = p_programa_id
    ) THEN
      -- Calcular pontos baseado no histórico de gastos
      v_pontos_iniciais := FLOOR(v_cliente.total_gasto * v_programa.pontos_por_real);
      
      -- Cadastrar cliente no programa com pontos retroativos
      INSERT INTO pontos_fidelidade (
        user_id,
        cliente_id,
        programa_id,
        pontos_totais,
        pontos_disponiveis,
        pontos_resgatados,
        nivel
      ) VALUES (
        v_cliente.user_id,
        v_cliente.cliente_id,
        p_programa_id,
        v_pontos_iniciais,
        v_pontos_iniciais,
        0,
        'bronze'
      );
      
      -- Registrar no histórico
      INSERT INTO historico_pontos (
        user_id,
        cliente_id,
        programa_id,
        pontos,
        tipo,
        descricao,
        nivel_cliente
      ) VALUES (
        v_cliente.user_id,
        v_cliente.cliente_id,
        p_programa_id,
        v_pontos_iniciais,
        'ganho',
        'Pontos retroativos ao entrar no programa (baseado em R$ ' || v_cliente.total_gasto::TEXT || ' gastos)',
        'bronze'
      );
      
      v_clientes_cadastrados := v_clientes_cadastrados + 1;
    END IF;
  END LOOP;
  
  RETURN v_clientes_cadastrados;
END;
$$;

-- Trigger para cadastrar clientes automaticamente quando um programa é criado
CREATE OR REPLACE FUNCTION public.trigger_cadastrar_clientes_novo_programa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clientes_cadastrados INTEGER;
BEGIN
  -- Cadastrar clientes elegíveis automaticamente
  v_clientes_cadastrados := cadastrar_clientes_programa_fidelidade(NEW.id);
  
  RAISE NOTICE 'Programa % criado. % clientes cadastrados automaticamente.', NEW.nome, v_clientes_cadastrados;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_novo_programa_fidelidade ON programas_fidelidade;
CREATE TRIGGER trigger_novo_programa_fidelidade
  AFTER INSERT ON programas_fidelidade
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cadastrar_clientes_novo_programa();