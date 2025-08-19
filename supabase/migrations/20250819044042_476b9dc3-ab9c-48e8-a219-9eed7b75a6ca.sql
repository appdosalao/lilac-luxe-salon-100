-- Criar tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS public.categorias_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'investimento')),
  cor TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Criar tabela de contas fixas
CREATE TABLE IF NOT EXISTS public.contas_fixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data_vencimento INTEGER NOT NULL CHECK (data_vencimento >= 1 AND data_vencimento <= 31),
  categoria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('pago', 'em_aberto')),
  observacoes TEXT,
  repetir BOOLEAN NOT NULL DEFAULT true,
  frequencia TEXT NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
  proximo_vencimento DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de lançamentos
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT,
  origem_id UUID,
  origem_tipo TEXT CHECK (origem_tipo IN ('agendamento', 'conta_fixa', 'manual')),
  cliente_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para categorias_financeiras
CREATE POLICY "Users can view their own categorias" ON public.categorias_financeiras
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorias" ON public.categorias_financeiras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorias" ON public.categorias_financeiras
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias" ON public.categorias_financeiras
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas RLS para contas_fixas
CREATE POLICY "Users can view their own contas fixas" ON public.contas_fixas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contas fixas" ON public.contas_fixas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contas fixas" ON public.contas_fixas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contas fixas" ON public.contas_fixas
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas RLS para lancamentos
CREATE POLICY "Users can view their own lancamentos" ON public.lancamentos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lancamentos" ON public.lancamentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lancamentos" ON public.lancamentos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lancamentos" ON public.lancamentos
  FOR DELETE USING (auth.uid() = user_id);

-- Adicionar foreign keys opcionais
ALTER TABLE public.lancamentos 
ADD CONSTRAINT fk_lancamentos_cliente 
FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

ALTER TABLE public.lancamentos 
ADD CONSTRAINT fk_lancamentos_agendamento 
FOREIGN KEY (origem_id) REFERENCES public.agendamentos(id) ON DELETE SET NULL;

-- Criar triggers para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON public.categorias_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contas_fixas_updated_at
  BEFORE UPDATE ON public.contas_fixas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_updated_at
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar replica identity para real-time updates
ALTER TABLE public.categorias_financeiras REPLICA IDENTITY FULL;
ALTER TABLE public.contas_fixas REPLICA IDENTITY FULL;
ALTER TABLE public.lancamentos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias_financeiras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contas_fixas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos;