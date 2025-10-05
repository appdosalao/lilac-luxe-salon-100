-- Adicionar sistema de níveis e benefícios aos programas de fidelidade
ALTER TABLE programas_fidelidade 
ADD COLUMN IF NOT EXISTS niveis_config jsonb DEFAULT '[
  {
    "nivel": "bronze",
    "nome": "Bronze",
    "pontos_minimos": 0,
    "multiplicador_pontos": 1.0,
    "desconto_percentual": 0,
    "cor": "#CD7F32",
    "beneficios": ["Acúmulo padrão de pontos"]
  },
  {
    "nivel": "prata",
    "nome": "Prata",
    "pontos_minimos": 500,
    "multiplicador_pontos": 1.2,
    "desconto_percentual": 5,
    "cor": "#C0C0C0",
    "beneficios": ["20% mais pontos", "5% de desconto"]
  },
  {
    "nivel": "ouro",
    "nome": "Ouro",
    "pontos_minimos": 1500,
    "multiplicador_pontos": 1.5,
    "desconto_percentual": 10,
    "cor": "#FFD700",
    "beneficios": ["50% mais pontos", "10% de desconto", "Atendimento prioritário"]
  },
  {
    "nivel": "platina",
    "nome": "Platina",
    "pontos_minimos": 3000,
    "multiplicador_pontos": 2.0,
    "desconto_percentual": 15,
    "cor": "#E5E4E2",
    "beneficios": ["Dobro de pontos", "15% de desconto", "Atendimento VIP", "Brindes exclusivos"]
  }
]'::jsonb,
ADD COLUMN IF NOT EXISTS expiracao_pontos_dias integer,
ADD COLUMN IF NOT EXISTS bonus_aniversario integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_indicacao integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS recompensas jsonb DEFAULT '[]'::jsonb;

-- Adicionar campo de expiração aos pontos
ALTER TABLE pontos_fidelidade
ADD COLUMN IF NOT EXISTS data_expiracao date;

-- Adicionar campos no histórico de pontos
ALTER TABLE historico_pontos
ADD COLUMN IF NOT EXISTS nivel_cliente text DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS multiplicador_aplicado numeric DEFAULT 1.0;

-- Criar view para ranking de clientes
CREATE OR REPLACE VIEW ranking_fidelidade AS
SELECT 
  pf.id,
  pf.cliente_id,
  pf.programa_id,
  pf.pontos_totais,
  pf.pontos_disponiveis,
  pf.nivel,
  c.nome as cliente_nome,
  c.email as cliente_email,
  c.telefone as cliente_telefone,
  ROW_NUMBER() OVER (PARTITION BY pf.programa_id ORDER BY pf.pontos_totais DESC) as posicao_ranking
FROM pontos_fidelidade pf
JOIN clientes c ON c.id = pf.cliente_id
WHERE pf.pontos_disponiveis > 0
ORDER BY pf.pontos_totais DESC;

-- Criar função para calcular nível baseado em pontos
CREATE OR REPLACE FUNCTION calcular_nivel_cliente(
  p_programa_id uuid,
  p_pontos_totais integer
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_niveis jsonb;
  v_nivel_atual text := 'bronze';
  v_nivel record;
BEGIN
  -- Buscar configuração de níveis do programa
  SELECT niveis_config INTO v_niveis
  FROM programas_fidelidade
  WHERE id = p_programa_id;
  
  -- Determinar nível baseado nos pontos
  FOR v_nivel IN 
    SELECT * FROM jsonb_to_recordset(v_niveis) AS x(
      nivel text,
      pontos_minimos integer
    )
    ORDER BY pontos_minimos DESC
  LOOP
    IF p_pontos_totais >= v_nivel.pontos_minimos THEN
      v_nivel_atual := v_nivel.nivel;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_nivel_atual;
END;
$$;

-- Criar função para atualizar nível automaticamente
CREATE OR REPLACE FUNCTION atualizar_nivel_cliente()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_novo_nivel text;
BEGIN
  -- Calcular novo nível
  v_novo_nivel := calcular_nivel_cliente(NEW.programa_id, NEW.pontos_totais);
  
  -- Atualizar se mudou
  IF v_novo_nivel != NEW.nivel THEN
    NEW.nivel := v_novo_nivel;
    
    -- Registrar mudança de nível no histórico
    INSERT INTO historico_pontos (
      user_id,
      cliente_id,
      programa_id,
      pontos,
      tipo,
      descricao,
      nivel_cliente
    ) VALUES (
      NEW.user_id,
      NEW.cliente_id,
      NEW.programa_id,
      0,
      'nivel_up',
      'Subiu para o nível ' || v_novo_nivel,
      v_novo_nivel
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar nível automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_nivel ON pontos_fidelidade;
CREATE TRIGGER trigger_atualizar_nivel
BEFORE UPDATE OF pontos_totais ON pontos_fidelidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_nivel_cliente();

-- Criar função para aplicar expiração de pontos
CREATE OR REPLACE FUNCTION aplicar_expiracao_pontos()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Expirar pontos vencidos
  UPDATE pontos_fidelidade pf
  SET 
    pontos_disponiveis = GREATEST(0, pontos_disponiveis - (
      SELECT COALESCE(SUM(hp.pontos), 0)
      FROM historico_pontos hp
      WHERE hp.cliente_id = pf.cliente_id
        AND hp.programa_id = pf.programa_id
        AND hp.tipo = 'ganho'
        AND hp.created_at < CURRENT_DATE - INTERVAL '1 day' * (
          SELECT COALESCE(expiracao_pontos_dias, 365)
          FROM programas_fidelidade
          WHERE id = pf.programa_id
        )
    ))
  WHERE EXISTS (
    SELECT 1 FROM programas_fidelidade
    WHERE id = pf.programa_id
      AND expiracao_pontos_dias IS NOT NULL
  );
  
  -- Registrar pontos expirados
  INSERT INTO historico_pontos (user_id, cliente_id, programa_id, pontos, tipo, descricao)
  SELECT 
    pf.user_id,
    pf.cliente_id,
    pf.programa_id,
    -hp.pontos_expirados,
    'expiracao',
    'Pontos expirados após ' || pr.expiracao_pontos_dias || ' dias'
  FROM pontos_fidelidade pf
  CROSS JOIN LATERAL (
    SELECT COALESCE(SUM(hp.pontos), 0) as pontos_expirados
    FROM historico_pontos hp
    WHERE hp.cliente_id = pf.cliente_id
      AND hp.programa_id = pf.programa_id
      AND hp.tipo = 'ganho'
      AND hp.created_at < CURRENT_DATE - INTERVAL '1 day' * (
        SELECT COALESCE(expiracao_pontos_dias, 365)
        FROM programas_fidelidade
        WHERE id = pf.programa_id
      )
  ) hp
  JOIN programas_fidelidade pr ON pr.id = pf.programa_id
  WHERE pr.expiracao_pontos_dias IS NOT NULL
    AND hp.pontos_expirados > 0;
END;
$$;