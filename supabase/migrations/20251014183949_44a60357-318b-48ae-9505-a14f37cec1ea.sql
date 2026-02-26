-- Corrigir sistema de pontos e níveis de fidelidade

-- 1. Atualizar função de cálculo de nível para usar classes personalizadas
CREATE OR REPLACE FUNCTION calcular_nivel_cliente(p_user_id uuid, pontos_totais integer)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_classe_nome text;
BEGIN
  -- Buscar a classe apropriada baseada nos pontos
  SELECT nome INTO v_classe_nome
  FROM classes_fidelidade
  WHERE user_id = p_user_id
    AND ativo = true
    AND pontos_totais >= pontos_minimos
  ORDER BY pontos_minimos DESC
  LIMIT 1;
  
  -- Se não encontrou classe, retorna bronze como padrão
  RETURN COALESCE(v_classe_nome, 'bronze');
END;
$$;

-- 2. Recriar trigger de atualização de nível
DROP TRIGGER IF EXISTS trigger_atualizar_nivel ON pontos_fidelidade;

CREATE OR REPLACE FUNCTION atualizar_nivel_cliente()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pontos_totais INTEGER;
  v_pontos_disponiveis INTEGER;
  v_total_resgates INTEGER;
  v_novo_nivel TEXT;
BEGIN
  -- Calcular totais
  SELECT 
    COALESCE(SUM(CASE WHEN pontos > 0 THEN pontos ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN expirado = false THEN pontos ELSE 0 END), 0)
  INTO v_pontos_totais, v_pontos_disponiveis
  FROM pontos_fidelidade
  WHERE cliente_id = NEW.cliente_id AND user_id = NEW.user_id;

  SELECT COUNT(*) INTO v_total_resgates
  FROM historico_resgates
  WHERE cliente_id = NEW.cliente_id AND user_id = NEW.user_id;

  -- Calcular novo nível usando função atualizada
  v_novo_nivel := calcular_nivel_cliente(NEW.user_id, v_pontos_totais);

  -- Inserir ou atualizar nível
  INSERT INTO niveis_fidelidade (user_id, cliente_id, nivel, pontos_totais, pontos_disponiveis, total_resgates)
  VALUES (NEW.user_id, NEW.cliente_id, v_novo_nivel, v_pontos_totais, v_pontos_disponiveis, v_total_resgates)
  ON CONFLICT (user_id, cliente_id) 
  DO UPDATE SET
    nivel = v_novo_nivel,
    pontos_totais = v_pontos_totais,
    pontos_disponiveis = v_pontos_disponiveis,
    total_resgates = v_total_resgates,
    data_atualizacao = NOW();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_atualizar_nivel
AFTER INSERT OR UPDATE ON pontos_fidelidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_nivel_cliente();

-- 3. Recriar trigger de registro de pontos em agendamentos
DROP TRIGGER IF EXISTS trigger_registrar_pontos ON agendamentos;

CREATE OR REPLACE FUNCTION registrar_pontos_agendamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_programa RECORD;
  v_pontos_ganhos INTEGER;
BEGIN
  -- Só adiciona pontos quando status muda para 'concluido'
  IF NEW.status = 'concluido' AND (OLD IS NULL OR OLD.status != 'concluido') THEN
    
    -- Buscar programa ativo
    SELECT * INTO v_programa
    FROM programas_fidelidade
    WHERE user_id = NEW.user_id 
      AND ativo = true
      AND (data_inicio IS NULL OR data_inicio <= CURRENT_DATE)
    LIMIT 1;

    -- Se programa ativo, adicionar pontos
    IF v_programa.id IS NOT NULL THEN
      v_pontos_ganhos := FLOOR(NEW.valor * v_programa.pontos_por_real);
      
      IF v_pontos_ganhos > 0 THEN
        INSERT INTO pontos_fidelidade (
          user_id, 
          cliente_id, 
          pontos, 
          origem, 
          origem_id, 
          descricao,
          data_expiracao,
          expirado
        ) VALUES (
          NEW.user_id,
          NEW.cliente_id,
          v_pontos_ganhos,
          'agendamento',
          NEW.id,
          'Pontos ganhos no serviço realizado',
          CASE 
            WHEN v_programa.expiracao_pontos_dias > 0 
            THEN CURRENT_DATE + v_programa.expiracao_pontos_dias 
            ELSE NULL 
          END,
          false
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_registrar_pontos
AFTER INSERT OR UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION registrar_pontos_agendamento();

-- 4. Melhorar view de ranking
DROP VIEW IF EXISTS ranking_fidelidade CASCADE;

CREATE VIEW ranking_fidelidade AS
WITH niveis_com_classe AS (
  SELECT 
    nf.user_id,
    nf.cliente_id,
    nf.nivel,
    nf.pontos_totais,
    nf.pontos_disponiveis,
    nf.total_resgates,
    nf.data_atualizacao,
    (
      SELECT cf.nome
      FROM classes_fidelidade cf
      WHERE cf.user_id = nf.user_id
        AND cf.ativo = true
        AND nf.pontos_totais >= cf.pontos_minimos
      ORDER BY cf.pontos_minimos DESC
      LIMIT 1
    ) as classe_nome,
    (
      SELECT cf.cor
      FROM classes_fidelidade cf
      WHERE cf.user_id = nf.user_id
        AND cf.ativo = true
        AND nf.pontos_totais >= cf.pontos_minimos
      ORDER BY cf.pontos_minimos DESC
      LIMIT 1
    ) as classe_cor
  FROM niveis_fidelidade nf
)
SELECT 
  nc.user_id,
  nc.cliente_id,
  c.nome as cliente_nome,
  c.telefone,
  nc.nivel,
  nc.pontos_totais,
  nc.pontos_disponiveis,
  nc.total_resgates,
  nc.classe_nome,
  nc.classe_cor,
  ROW_NUMBER() OVER (
    PARTITION BY nc.user_id 
    ORDER BY nc.pontos_totais DESC, nc.data_atualizacao DESC
  ) as ranking
FROM niveis_com_classe nc
JOIN clientes c ON c.id = nc.cliente_id;

-- 5. Garantir que todos os clientes existentes tenham registro de nível
INSERT INTO niveis_fidelidade (user_id, cliente_id, nivel, pontos_totais, pontos_disponiveis, total_resgates)
SELECT 
  c.user_id,
  c.id,
  'bronze',
  0,
  0,
  0
FROM clientes c
WHERE c.user_id != '00000000-0000-0000-0000-000000000000'
  AND NOT EXISTS (
    SELECT 1 FROM niveis_fidelidade nf 
    WHERE nf.cliente_id = c.id AND nf.user_id = c.user_id
  )
ON CONFLICT (user_id, cliente_id) DO NOTHING;