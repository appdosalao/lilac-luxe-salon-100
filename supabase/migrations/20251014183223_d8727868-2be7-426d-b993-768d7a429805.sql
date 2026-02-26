-- Garantir foreign keys corretas em todas as tabelas de fidelidade

-- Adicionar foreign key em pontos_fidelidade para clientes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pontos_fidelidade_cliente_id_fkey'
  ) THEN
    ALTER TABLE pontos_fidelidade 
    ADD CONSTRAINT pontos_fidelidade_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em niveis_fidelidade para clientes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'niveis_fidelidade_cliente_id_fkey'
  ) THEN
    ALTER TABLE niveis_fidelidade 
    ADD CONSTRAINT niveis_fidelidade_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em historico_resgates para clientes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'historico_resgates_cliente_id_fkey'
  ) THEN
    ALTER TABLE historico_resgates 
    ADD CONSTRAINT historico_resgates_cliente_id_fkey 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em historico_resgates para recompensas (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'historico_resgates_recompensa_id_fkey'
  ) THEN
    ALTER TABLE historico_resgates 
    ADD CONSTRAINT historico_resgates_recompensa_id_fkey 
    FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar foreign key em historico_resgates para agendamentos (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'historico_resgates_agendamento_id_fkey'
  ) THEN
    ALTER TABLE historico_resgates 
    ADD CONSTRAINT historico_resgates_agendamento_id_fkey 
    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar foreign key em referencias_clientes para clientes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'referencias_clientes_referenciador_fkey'
  ) THEN
    ALTER TABLE referencias_clientes 
    ADD CONSTRAINT referencias_clientes_referenciador_fkey 
    FOREIGN KEY (cliente_referenciador_id) REFERENCES clientes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'referencias_clientes_referenciado_fkey'
  ) THEN
    ALTER TABLE referencias_clientes 
    ADD CONSTRAINT referencias_clientes_referenciado_fkey 
    FOREIGN KEY (cliente_referenciado_id) REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recriar view de saldo_pontos com informações mais completas
DROP VIEW IF EXISTS saldo_pontos CASCADE;
CREATE VIEW saldo_pontos AS
SELECT 
  pf.user_id,
  pf.cliente_id,
  c.nome as cliente_nome,
  COALESCE(SUM(CASE WHEN pf.pontos > 0 AND NOT pf.expirado THEN pf.pontos ELSE 0 END), 0) as pontos_ganhos,
  COALESCE(SUM(CASE WHEN pf.pontos < 0 THEN ABS(pf.pontos) ELSE 0 END), 0) as pontos_gastos,
  COALESCE(SUM(CASE WHEN NOT pf.expirado THEN pf.pontos ELSE 0 END), 0) as pontos_disponiveis,
  COUNT(*) as total_transacoes
FROM pontos_fidelidade pf
JOIN clientes c ON c.id = pf.cliente_id
GROUP BY pf.user_id, pf.cliente_id, c.nome;

-- Recriar view de estatisticas_fidelidade
DROP VIEW IF EXISTS estatisticas_fidelidade CASCADE;
CREATE VIEW estatisticas_fidelidade AS
SELECT 
  nf.user_id,
  COUNT(DISTINCT nf.cliente_id) as total_clientes_programa,
  COALESCE(SUM(nf.pontos_totais), 0) as total_pontos_distribuidos,
  COALESCE((
    SELECT SUM(hr.pontos_gastos) 
    FROM historico_resgates hr 
    WHERE hr.user_id = nf.user_id
  ), 0) as total_pontos_resgatados,
  COUNT(DISTINCT CASE 
    WHEN EXISTS (
      SELECT 1 FROM pontos_fidelidade pf 
      WHERE pf.cliente_id = nf.cliente_id 
        AND pf.user_id = nf.user_id
        AND pf.data_ganho >= CURRENT_DATE - INTERVAL '30 days'
    ) THEN nf.cliente_id 
  END) as clientes_ativos_30d
FROM niveis_fidelidade nf
GROUP BY nf.user_id;

-- Recriar view de ranking_fidelidade com classes
DROP VIEW IF EXISTS ranking_fidelidade CASCADE;
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
  cf.nome as classe_nome,
  cf.cor as classe_cor,
  ROW_NUMBER() OVER (PARTITION BY nf.user_id ORDER BY nf.pontos_totais DESC, nf.data_atualizacao DESC) as ranking
FROM niveis_fidelidade nf
JOIN clientes c ON c.id = nf.cliente_id
LEFT JOIN (
  -- Encontrar a classe apropriada para cada cliente baseado em pontos
  SELECT DISTINCT ON (nf2.user_id, nf2.cliente_id)
    nf2.user_id,
    nf2.cliente_id,
    cf2.nome,
    cf2.cor
  FROM niveis_fidelidade nf2
  LEFT JOIN classes_fidelidade cf2 ON cf2.user_id = nf2.user_id 
    AND nf2.pontos_totais >= cf2.pontos_minimos
    AND cf2.ativo = true
  ORDER BY nf2.user_id, nf2.cliente_id, cf2.pontos_minimos DESC
) cf ON cf.user_id = nf.user_id AND cf.cliente_id = nf.cliente_id;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pontos_fidelidade_cliente ON pontos_fidelidade(cliente_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pontos_fidelidade_data ON pontos_fidelidade(data_ganho);
CREATE INDEX IF NOT EXISTS idx_pontos_fidelidade_expirado ON pontos_fidelidade(expirado) WHERE expirado = false;
CREATE INDEX IF NOT EXISTS idx_niveis_fidelidade_cliente ON niveis_fidelidade(cliente_id, user_id);
CREATE INDEX IF NOT EXISTS idx_historico_resgates_cliente ON historico_resgates(cliente_id, user_id);
CREATE INDEX IF NOT EXISTS idx_classes_fidelidade_ordem ON classes_fidelidade(user_id, ordem);
CREATE INDEX IF NOT EXISTS idx_recompensas_classe ON recompensas(classe_id) WHERE classe_id IS NOT NULL;