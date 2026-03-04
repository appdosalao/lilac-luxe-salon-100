-- ==============================================================================
-- MIGRAÇÃO DE DADOS: LIMPEZA DE COLUNAS DUPLICADAS E PADRONIZAÇÃO PARA SNAKE_CASE
--
-- ATENÇÃO: Execute este script no SQL Editor do Supabase para unificar
-- os dados que estão fragmentados entre colunas snake_case e camelCase.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABELA DE CLIENTES
-- ------------------------------------------------------------------------------
-- Transferir dados de nomeCompleto para nome_completo caso nome_completo esteja nulo
UPDATE clientes
SET nome_completo = "nomeCompleto"
WHERE nome_completo IS NULL AND "nomeCompleto" IS NOT NULL;

-- Transferir servicoFrequente para servico_frequente
UPDATE clientes
SET servico_frequente = "servicoFrequente"
WHERE servico_frequente IS NULL AND "servicoFrequente" IS NOT NULL;

-- Transferir ultimaVisita para ultima_visita
UPDATE clientes
SET ultima_visita = "ultimaVisita"
WHERE ultima_visita IS NULL AND "ultimaVisita" IS NOT NULL;

-- Transferir historicoServicos para historico_servicos (criando se nao existir)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS historico_servicos JSONB DEFAULT '[]'::jsonb;
UPDATE clientes
SET historico_servicos = "historicoServicos"
WHERE "historicoServicos" IS NOT NULL AND "historicoServicos" != '[]'::jsonb;

-- Remover colunas camelCase de clientes
ALTER TABLE clientes DROP COLUMN IF EXISTS "nomeCompleto";
ALTER TABLE clientes DROP COLUMN IF EXISTS "servicoFrequente";
ALTER TABLE clientes DROP COLUMN IF EXISTS "ultimaVisita";
ALTER TABLE clientes DROP COLUMN IF EXISTS "historicoServicos";


-- ------------------------------------------------------------------------------
-- 2. TABELA DE SERVICOS
-- ------------------------------------------------------------------------------
-- Transferir createdAt para criado_em
UPDATE servicos
SET criado_em = "createdAt"
WHERE criado_em IS NULL AND "createdAt" IS NOT NULL;

-- Transferir updatedAt para updated_at
UPDATE servicos
SET updated_at = "updatedAt"
WHERE updated_at IS NULL AND "updatedAt" IS NOT NULL;

-- Remover colunas camelCase de servicos
ALTER TABLE servicos DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE servicos DROP COLUMN IF EXISTS "updatedAt";


-- ------------------------------------------------------------------------------
-- 3. TABELA DE AGENDAMENTOS
-- ------------------------------------------------------------------------------
-- Resolver valores financeiros
UPDATE agendamentos
SET valor_pago = "valorPago"
WHERE valor_pago = 0 AND "valorPago" > 0;

UPDATE agendamentos
SET valor_devido = "valorDevido"
WHERE valor_devido = 0 AND "valorDevido" > 0;

-- Resolver forma_pagamento
UPDATE agendamentos
SET forma_pagamento = "formaPagamento"
WHERE forma_pagamento IS NULL AND "formaPagamento" IS NOT NULL;

-- Resolver status_pagamento
UPDATE agendamentos
SET status_pagamento = "statusPagamento"
WHERE (status_pagamento IS NULL OR status_pagamento = 'em_aberto') AND "statusPagamento" IS NOT NULL AND "statusPagamento" != 'em_aberto';

-- Outros campos
UPDATE agendamentos
SET cronograma_id = "cronogramaId"
WHERE cronograma_id IS NULL AND "cronogramaId" IS NOT NULL;

UPDATE agendamentos
SET data_prevista_pagamento = "dataPrevistaPagamento"
WHERE data_prevista_pagamento IS NULL AND "dataPrevistaPagamento" IS NOT NULL;

UPDATE agendamentos
SET criado_em = "createdAt"
WHERE criado_em IS NULL AND "createdAt" IS NOT NULL;

-- Remover colunas camelCase de agendamentos
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "valorPago";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "valorDevido";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "formaPagamento";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "statusPagamento";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "cronogramaId";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "dataPrevistaPagamento";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "clienteNome";
ALTER TABLE agendamentos DROP COLUMN IF EXISTS "servicoNome";

COMMIT;
