-- Remover constraint antiga
ALTER TABLE lancamentos DROP CONSTRAINT IF EXISTS lancamentos_origem_tipo_check;

-- Adicionar nova constraint com valores atualizados
ALTER TABLE lancamentos ADD CONSTRAINT lancamentos_origem_tipo_check 
  CHECK (origem_tipo IN ('agendamento', 'conta_fixa', 'manual', 'compra_produto', 'venda_produto'));