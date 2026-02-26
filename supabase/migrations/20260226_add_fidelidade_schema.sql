CREATE TABLE IF NOT EXISTS programas_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pontos_por_real NUMERIC,
  data_inicio DATE,
  expiracao_pontos_dias INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT,
  beneficios TEXT,
  pontos_minimos INTEGER DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recompensas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  pontos_necessarios INTEGER NOT NULL,
  classe_id UUID REFERENCES classes_fidelidade(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  validade_dias INTEGER,
  valor_desconto NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pontos_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  origem TEXT NOT NULL,
  origem_id UUID,
  descricao TEXT,
  data_ganho DATE DEFAULT CURRENT_DATE,
  data_expiracao DATE,
  expirado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS niveis_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nivel TEXT,
  pontos_totais INTEGER,
  pontos_disponiveis INTEGER,
  total_resgates INTEGER,
  data_atualizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historico_resgates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  recompensa_id UUID NOT NULL REFERENCES recompensas(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  pontos_gastos INTEGER NOT NULL,
  data_resgate TIMESTAMPTZ DEFAULT now(),
  data_utilizacao TIMESTAMPTZ,
  data_expiracao DATE,
  utilizado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE programas_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveis_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_resgates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pf_select" ON programas_fidelidade;
DROP POLICY IF EXISTS "pf_insert" ON programas_fidelidade;
DROP POLICY IF EXISTS "pf_update" ON programas_fidelidade;
DROP POLICY IF EXISTS "pf_delete" ON programas_fidelidade;
CREATE POLICY "pf_select" ON programas_fidelidade FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pf_insert" ON programas_fidelidade FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pf_update" ON programas_fidelidade FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pf_delete" ON programas_fidelidade FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cf_select" ON classes_fidelidade;
DROP POLICY IF EXISTS "cf_insert" ON classes_fidelidade;
DROP POLICY IF EXISTS "cf_update" ON classes_fidelidade;
DROP POLICY IF EXISTS "cf_delete" ON classes_fidelidade;
CREATE POLICY "cf_select" ON classes_fidelidade FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cf_insert" ON classes_fidelidade FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_update" ON classes_fidelidade FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cf_delete" ON classes_fidelidade FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "re_select" ON recompensas;
DROP POLICY IF EXISTS "re_insert" ON recompensas;
DROP POLICY IF EXISTS "re_update" ON recompensas;
DROP POLICY IF EXISTS "re_delete" ON recompensas;
CREATE POLICY "re_select" ON recompensas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "re_insert" ON recompensas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "re_update" ON recompensas FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "re_delete" ON recompensas FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pt_select" ON pontos_fidelidade;
DROP POLICY IF EXISTS "pt_insert" ON pontos_fidelidade;
DROP POLICY IF EXISTS "pt_update" ON pontos_fidelidade;
DROP POLICY IF EXISTS "pt_delete" ON pontos_fidelidade;
CREATE POLICY "pt_select" ON pontos_fidelidade FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pt_insert" ON pontos_fidelidade FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pt_update" ON pontos_fidelidade FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pt_delete" ON pontos_fidelidade FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "nv_select" ON niveis_fidelidade;
DROP POLICY IF EXISTS "nv_insert" ON niveis_fidelidade;
DROP POLICY IF EXISTS "nv_update" ON niveis_fidelidade;
DROP POLICY IF EXISTS "nv_delete" ON niveis_fidelidade;
CREATE POLICY "nv_select" ON niveis_fidelidade FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "nv_insert" ON niveis_fidelidade FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nv_update" ON niveis_fidelidade FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "nv_delete" ON niveis_fidelidade FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hr_select" ON historico_resgates;
DROP POLICY IF EXISTS "hr_insert" ON historico_resgates;
DROP POLICY IF EXISTS "hr_update" ON historico_resgates;
DROP POLICY IF EXISTS "hr_delete" ON historico_resgates;
CREATE POLICY "hr_select" ON historico_resgates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "hr_insert" ON historico_resgates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hr_update" ON historico_resgates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hr_delete" ON historico_resgates FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_programas_user ON programas_fidelidade(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_user ON classes_fidelidade(user_id);
CREATE INDEX IF NOT EXISTS idx_recompensas_user ON recompensas(user_id);
CREATE INDEX IF NOT EXISTS idx_pontos_user_cliente ON pontos_fidelidade(user_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_niveis_user_cliente ON niveis_fidelidade(user_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_resgates_user_cliente ON historico_resgates(user_id, cliente_id);

CREATE OR REPLACE VIEW estatisticas_fidelidade AS
SELECT
  u.id AS user_id,
  COALESCE((SELECT SUM(p.pontos) FROM pontos_fidelidade p WHERE p.user_id = u.id AND p.origem <> 'resgate'), 0) AS total_pontos_distribuidos,
  COALESCE((SELECT SUM(h.pontos_gastos) FROM historico_resgates h WHERE h.user_id = u.id), 0) AS total_pontos_resgatados,
  COALESCE((SELECT COUNT(DISTINCT n.cliente_id) FROM niveis_fidelidade n WHERE n.user_id = u.id), 0) AS total_clientes_programa,
  COALESCE((SELECT COUNT(DISTINCT p2.cliente_id) FROM pontos_fidelidade p2 WHERE p2.user_id = u.id AND p2.created_at >= now() - interval '30 days'), 0) AS clientes_ativos_30d
FROM usuarios u;

CREATE OR REPLACE VIEW ranking_fidelidade AS
WITH pontos AS (
  SELECT
    n.user_id,
    n.cliente_id,
    n.pontos_totais,
    n.pontos_disponiveis,
    n.total_resgates
  FROM niveis_fidelidade n
),
classe AS (
  SELECT
    c.user_id,
    c.id AS classe_id,
    c.nome AS classe_nome,
    c.cor AS classe_cor,
    c.pontos_minimos
  FROM classes_fidelidade c
)
SELECT
  p.user_id,
  p.cliente_id,
  cl.nome AS cliente_nome,
  p.pontos_totais,
  p.pontos_disponiveis,
  p.total_resgates,
  (
    SELECT c2.nome FROM classes_fidelidade c2
    WHERE c2.user_id = p.user_id AND c2.pontos_minimos <= COALESCE(p.pontos_totais,0)
    ORDER BY c2.pontos_minimos DESC
    LIMIT 1
  ) AS classe_nome,
  (
    SELECT c2.cor FROM classes_fidelidade c2
    WHERE c2.user_id = p.user_id AND c2.pontos_minimos <= COALESCE(p.pontos_totais,0)
    ORDER BY c2.pontos_minimos DESC
    LIMIT 1
  ) AS classe_cor,
  ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY COALESCE(p.pontos_totais,0) DESC) AS ranking,
  cl.telefone
FROM pontos p
LEFT JOIN clientes cl ON cl.id = p.cliente_id;

CREATE OR REPLACE VIEW saldo_pontos AS
WITH ganhos AS (
  SELECT user_id, cliente_id, COALESCE(SUM(pontos),0) AS pontos_ganhos
  FROM pontos_fidelidade
  WHERE origem <> 'resgate'
  GROUP BY user_id, cliente_id
),
gastos AS (
  SELECT user_id, cliente_id, COALESCE(SUM(pontos_gastos),0) AS pontos_gastos
  FROM historico_resgates
  GROUP BY user_id, cliente_id
),
transacoes AS (
  SELECT user_id, cliente_id, COUNT(*) AS total_transacoes
  FROM pontos_fidelidade
  GROUP BY user_id, cliente_id
)
SELECT
  COALESCE(g.user_id, ga.user_id) AS user_id,
  COALESCE(g.cliente_id, ga.cliente_id) AS cliente_id,
  c.nome AS cliente_nome,
  COALESCE(ga.pontos_ganhos,0) AS pontos_ganhos,
  COALESCE(g.pontos_gastos,0) AS pontos_gastos,
  COALESCE(n.pontos_disponiveis, COALESCE(ga.pontos_ganhos,0) - COALESCE(g.pontos_gastos,0)) AS pontos_disponiveis,
  COALESCE(t.total_transacoes,0) AS total_transacoes
FROM gastos g
FULL JOIN ganhos ga
  ON g.user_id = ga.user_id AND g.cliente_id = ga.cliente_id
LEFT JOIN transacoes t
  ON COALESCE(g.user_id, ga.user_id) = t.user_id AND COALESCE(g.cliente_id, ga.cliente_id) = t.cliente_id
LEFT JOIN niveis_fidelidade n
  ON COALESCE(g.user_id, ga.user_id) = n.user_id AND COALESCE(g.cliente_id, ga.cliente_id) = n.cliente_id
LEFT JOIN clientes c
  ON COALESCE(g.cliente_id, ga.cliente_id) = c.id;

