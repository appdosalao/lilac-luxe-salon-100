-- Criar tabelas do programa de fidelidade

-- Tabela de programas de fidelidade (configuração por salão)
CREATE TABLE programas_fidelidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Programa de Fidelidade',
  ativo BOOLEAN DEFAULT true,
  pontos_por_real NUMERIC DEFAULT 0.1, -- 1 ponto a cada R$10
  expiracao_pontos_dias INTEGER DEFAULT 365,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabela de pontos (histórico de ganhos/perdas)
CREATE TABLE pontos_fidelidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  origem TEXT NOT NULL, -- 'agendamento', 'referencia', 'bonus', 'resgate', 'expiracao'
  origem_id UUID, -- ID do agendamento/referencia que gerou os pontos
  descricao TEXT,
  data_ganho TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao DATE,
  expirado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de recompensas (catálogo configurável)
CREATE TABLE recompensas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  pontos_necessarios INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('desconto_percentual', 'desconto_valor', 'servico_gratis')),
  valor_desconto NUMERIC DEFAULT 0,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  validade_dias INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de resgates (histórico)
CREATE TABLE historico_resgates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id UUID NOT NULL REFERENCES recompensas(id) ON DELETE CASCADE,
  pontos_gastos INTEGER NOT NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  data_resgate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao DATE,
  utilizado BOOLEAN DEFAULT false,
  data_utilizacao TIMESTAMP WITH TIME ZONE
);

-- Tabela de níveis (calculado automaticamente)
CREATE TABLE niveis_fidelidade (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nivel TEXT DEFAULT 'bronze' CHECK (nivel IN ('bronze', 'prata', 'ouro', 'platina')),
  pontos_totais INTEGER DEFAULT 0,
  pontos_disponiveis INTEGER DEFAULT 0,
  total_resgates INTEGER DEFAULT 0,
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cliente_id)
);

-- Tabela de referências
CREATE TABLE referencias_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_referenciador_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  codigo_referencia TEXT NOT NULL UNIQUE,
  cliente_referenciado_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  pontos_ganhos INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'expirado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cliente_referenciador_id)
);

-- Índices para performance
CREATE INDEX idx_pontos_cliente ON pontos_fidelidade(cliente_id, data_ganho DESC);
CREATE INDEX idx_pontos_user ON pontos_fidelidade(user_id);
CREATE INDEX idx_niveis_cliente ON niveis_fidelidade(cliente_id);
CREATE INDEX idx_resgates_cliente ON historico_resgates(cliente_id, data_resgate DESC);
CREATE INDEX idx_referencias_codigo ON referencias_clientes(codigo_referencia);

-- View para saldo de pontos por cliente
CREATE VIEW saldo_pontos AS
SELECT 
  pf.user_id,
  pf.cliente_id,
  c.nome as cliente_nome,
  COALESCE(SUM(CASE WHEN pf.pontos > 0 AND pf.expirado = false THEN pf.pontos ELSE 0 END), 0) as pontos_ganhos,
  COALESCE(SUM(CASE WHEN pf.pontos < 0 THEN ABS(pf.pontos) ELSE 0 END), 0) as pontos_gastos,
  COALESCE(SUM(CASE WHEN pf.expirado = false THEN pf.pontos ELSE 0 END), 0) as pontos_disponiveis,
  COUNT(*) as total_transacoes
FROM pontos_fidelidade pf
JOIN clientes c ON c.id = pf.cliente_id
GROUP BY pf.user_id, pf.cliente_id, c.nome;

-- View para estatísticas do programa
CREATE VIEW estatisticas_fidelidade AS
SELECT 
  pf.user_id,
  COUNT(DISTINCT pf.cliente_id) as total_clientes_programa,
  SUM(CASE WHEN pf.pontos > 0 THEN pf.pontos ELSE 0 END) as total_pontos_distribuidos,
  SUM(CASE WHEN pf.pontos < 0 THEN ABS(pf.pontos) ELSE 0 END) as total_pontos_resgatados,
  COUNT(DISTINCT CASE WHEN pf.data_ganho >= NOW() - INTERVAL '30 days' THEN pf.cliente_id END) as clientes_ativos_30d
FROM pontos_fidelidade pf
GROUP BY pf.user_id;

-- View para ranking de clientes
CREATE VIEW ranking_fidelidade AS
SELECT 
  nf.user_id,
  nf.cliente_id,
  c.nome as cliente_nome,
  c.telefone,
  nf.nivel,
  nf.pontos_totais,
  nf.pontos_disponiveis,
  nf.total_resgates,
  ROW_NUMBER() OVER (PARTITION BY nf.user_id ORDER BY nf.pontos_totais DESC) as ranking
FROM niveis_fidelidade nf
JOIN clientes c ON c.id = nf.cliente_id;

-- Habilitar RLS
ALTER TABLE programas_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_resgates ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveis_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE referencias_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users manage own fidelity programs" ON programas_fidelidade FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own fidelity points" ON pontos_fidelidade FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own rewards" ON recompensas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own redemptions" ON historico_resgates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own levels" ON niveis_fidelidade FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own references" ON referencias_clientes FOR ALL USING (auth.uid() = user_id);

-- Função para calcular nível baseado em pontos
CREATE OR REPLACE FUNCTION calcular_nivel_cliente(pontos_totais INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF pontos_totais >= 1000 THEN
    RETURN 'platina';
  ELSIF pontos_totais >= 500 THEN
    RETURN 'ouro';
  ELSIF pontos_totais >= 200 THEN
    RETURN 'prata';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para atualizar nível do cliente
CREATE OR REPLACE FUNCTION atualizar_nivel_cliente()
RETURNS TRIGGER AS $$
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

  -- Calcular novo nível
  v_novo_nivel := calcular_nivel_cliente(v_pontos_totais);

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
$$ LANGUAGE plpgsql;

-- Trigger para atualizar nível quando pontos mudam
CREATE TRIGGER trigger_atualizar_nivel
AFTER INSERT OR UPDATE ON pontos_fidelidade
FOR EACH ROW
EXECUTE FUNCTION atualizar_nivel_cliente();

-- Função para registrar pontos de agendamento
CREATE OR REPLACE FUNCTION registrar_pontos_agendamento()
RETURNS TRIGGER AS $$
DECLARE
  v_pontos_por_real NUMERIC;
  v_pontos_ganhos INTEGER;
  v_expiracao_dias INTEGER;
BEGIN
  -- Só adiciona pontos quando status muda para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    
    -- Buscar configuração do programa
    SELECT pontos_por_real, expiracao_pontos_dias
    INTO v_pontos_por_real, v_expiracao_dias
    FROM programas_fidelidade
    WHERE user_id = NEW.user_id AND ativo = true
    LIMIT 1;

    -- Se programa ativo, adicionar pontos
    IF v_pontos_por_real IS NOT NULL THEN
      v_pontos_ganhos := FLOOR(NEW.valor * v_pontos_por_real);
      
      IF v_pontos_ganhos > 0 THEN
        INSERT INTO pontos_fidelidade (
          user_id, 
          cliente_id, 
          pontos, 
          origem, 
          origem_id, 
          descricao,
          data_expiracao
        ) VALUES (
          NEW.user_id,
          NEW.cliente_id,
          v_pontos_ganhos,
          'agendamento',
          NEW.id,
          'Pontos ganhos no serviço realizado',
          CASE WHEN v_expiracao_dias > 0 THEN CURRENT_DATE + v_expiracao_dias ELSE NULL END
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para adicionar pontos automaticamente
CREATE TRIGGER trigger_registrar_pontos
AFTER INSERT OR UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION registrar_pontos_agendamento();

-- Função para expirar pontos
CREATE OR REPLACE FUNCTION aplicar_expiracao_pontos()
RETURNS void AS $$
BEGIN
  UPDATE pontos_fidelidade
  SET expirado = true
  WHERE data_expiracao IS NOT NULL 
    AND data_expiracao < CURRENT_DATE 
    AND expirado = false
    AND pontos > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para cadastrar clientes existentes no programa
CREATE OR REPLACE FUNCTION cadastrar_clientes_programa_fidelidade(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Criar registros de nível para clientes que ainda não têm
  INSERT INTO niveis_fidelidade (user_id, cliente_id, nivel, pontos_totais, pontos_disponiveis)
  SELECT 
    c.user_id,
    c.id,
    'bronze',
    0,
    0
  FROM clientes c
  WHERE c.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM niveis_fidelidade nf 
      WHERE nf.cliente_id = c.id AND nf.user_id = c.user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger para cadastrar novos clientes automaticamente no programa
CREATE OR REPLACE FUNCTION trigger_cadastrar_clientes_novo_programa()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um programa é ativado, cadastrar todos os clientes existentes
  IF NEW.ativo = true AND (OLD.ativo IS NULL OR OLD.ativo = false) THEN
    PERFORM cadastrar_clientes_programa_fidelidade(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cadastrar_clientes_programa
AFTER INSERT OR UPDATE ON programas_fidelidade
FOR EACH ROW
EXECUTE FUNCTION trigger_cadastrar_clientes_novo_programa();