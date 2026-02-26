-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, nome)
);

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  codigo_barras TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('uso_profissional', 'revenda', 'consumo')),
  estoque_atual NUMERIC DEFAULT 0 NOT NULL,
  estoque_minimo NUMERIC DEFAULT 0 NOT NULL,
  unidade_medida TEXT DEFAULT 'un' NOT NULL,
  preco_custo NUMERIC DEFAULT 0 NOT NULL,
  preco_venda NUMERIC DEFAULT 0 NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de compras
CREATE TABLE IF NOT EXISTS public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  numero_nota TEXT,
  data_compra DATE DEFAULT CURRENT_DATE NOT NULL,
  data_vencimento DATE,
  valor_total NUMERIC DEFAULT 0 NOT NULL,
  valor_pago NUMERIC DEFAULT 0 NOT NULL,
  valor_devido NUMERIC DEFAULT 0 NOT NULL,
  status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago_parcial', 'pago', 'vencido')),
  forma_pagamento TEXT,
  observacoes TEXT,
  lancamento_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de itens de compra
CREATE TABLE IF NOT EXISTS public.itens_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID REFERENCES public.compras(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE RESTRICT NOT NULL,
  quantidade NUMERIC NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade NUMERIC NOT NULL,
  valor_unitario NUMERIC DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  motivo TEXT,
  origem_id UUID,
  origem_tipo TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de vendas de produtos
CREATE TABLE IF NOT EXISTS public.vendas_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  data_venda DATE DEFAULT CURRENT_DATE NOT NULL,
  valor_total NUMERIC DEFAULT 0 NOT NULL,
  status_pagamento TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago')),
  forma_pagamento TEXT,
  observacoes TEXT,
  lancamento_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar tabela de itens de venda
CREATE TABLE IF NOT EXISTS public.itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas_produtos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE RESTRICT NOT NULL,
  quantidade NUMERIC NOT NULL,
  valor_unitario NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor_id ON public.produtos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_user_id ON public.compras(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_fornecedor_id ON public.compras(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_itens_compra_compra_id ON public.itens_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_itens_compra_produto_id ON public.itens_compra(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_user_id ON public.movimentacoes_estoque(user_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON public.movimentacoes_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_vendas_user_id ON public.vendas_produtos(user_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON public.vendas_produtos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda_id ON public.itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON public.itens_venda(produto_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fornecedores
CREATE POLICY "Users can view own fornecedores" ON public.fornecedores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fornecedores" ON public.fornecedores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fornecedores" ON public.fornecedores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fornecedores" ON public.fornecedores
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para produtos
CREATE POLICY "Users can view own produtos" ON public.produtos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own produtos" ON public.produtos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own produtos" ON public.produtos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own produtos" ON public.produtos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para compras
CREATE POLICY "Users can view own compras" ON public.compras
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compras" ON public.compras
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compras" ON public.compras
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compras" ON public.compras
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para itens_compra
CREATE POLICY "Users can view own itens_compra" ON public.itens_compra
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.compras WHERE compras.id = itens_compra.compra_id AND compras.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own itens_compra" ON public.itens_compra
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.compras WHERE compras.id = itens_compra.compra_id AND compras.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own itens_compra" ON public.itens_compra
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.compras WHERE compras.id = itens_compra.compra_id AND compras.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own itens_compra" ON public.itens_compra
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.compras WHERE compras.id = itens_compra.compra_id AND compras.user_id = auth.uid()
  ));

-- Políticas RLS para movimentacoes_estoque
CREATE POLICY "Users can view own movimentacoes" ON public.movimentacoes_estoque
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own movimentacoes" ON public.movimentacoes_estoque
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para vendas_produtos
CREATE POLICY "Users can view own vendas" ON public.vendas_produtos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vendas" ON public.vendas_produtos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vendas" ON public.vendas_produtos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vendas" ON public.vendas_produtos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para itens_venda
CREATE POLICY "Users can view own itens_venda" ON public.itens_venda
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.vendas_produtos WHERE vendas_produtos.id = itens_venda.venda_id AND vendas_produtos.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own itens_venda" ON public.itens_venda
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.vendas_produtos WHERE vendas_produtos.id = itens_venda.venda_id AND vendas_produtos.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own itens_venda" ON public.itens_venda
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.vendas_produtos WHERE vendas_produtos.id = itens_venda.venda_id AND vendas_produtos.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own itens_venda" ON public.itens_venda
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.vendas_produtos WHERE vendas_produtos.id = itens_venda.venda_id AND vendas_produtos.user_id = auth.uid()
  ));

-- Triggers para atualizar updated_at
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_updated_at BEFORE UPDATE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas_produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estoque
CREATE OR REPLACE FUNCTION atualizar_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE produtos 
    SET estoque_atual = estoque_atual + NEW.quantidade
    WHERE id = NEW.produto_id;
  ELSIF NEW.tipo IN ('saida', 'perda') THEN
    UPDATE produtos 
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.produto_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE produtos 
    SET estoque_atual = NEW.quantidade
    WHERE id = NEW.produto_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar estoque
CREATE TRIGGER trigger_atualizar_estoque 
AFTER INSERT ON public.movimentacoes_estoque
FOR EACH ROW EXECUTE FUNCTION atualizar_estoque_produto();

-- Função para calcular valor devido de compras
CREATE OR REPLACE FUNCTION calcular_valor_devido_compra()
RETURNS TRIGGER AS $$
BEGIN
  NEW.valor_devido := NEW.valor_total - NEW.valor_pago;
  
  IF NEW.valor_devido <= 0 THEN
    NEW.status_pagamento := 'pago';
  ELSIF NEW.valor_pago > 0 THEN
    NEW.status_pagamento := 'pago_parcial';
  ELSIF NEW.data_vencimento IS NOT NULL AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status_pagamento := 'vencido';
  ELSE
    NEW.status_pagamento := 'pendente';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular valor devido
CREATE TRIGGER trigger_calcular_valor_devido 
BEFORE INSERT OR UPDATE ON public.compras
FOR EACH ROW EXECUTE FUNCTION calcular_valor_devido_compra();