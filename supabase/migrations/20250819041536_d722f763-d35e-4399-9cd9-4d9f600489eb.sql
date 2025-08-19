-- Verificar se as tabelas cronogramas_novos e retornos_novos existem
-- Se não existirem, criar as tabelas baseadas na estrutura atual

-- Criar tabela de cronogramas se não existir
CREATE TABLE IF NOT EXISTS public.cronogramas_novos (
  id_cronograma UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  cliente_nome TEXT NOT NULL,
  servico_id UUID NOT NULL,
  tipo_servico TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  recorrencia TEXT NOT NULL CHECK (recorrencia IN ('Semanal', 'Quinzenal', 'Mensal', 'Personalizada')),
  intervalo_dias INTEGER,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'concluido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de retornos se não existir
CREATE TABLE IF NOT EXISTS public.retornos_novos (
  id_retorno UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  id_cliente UUID NOT NULL,
  id_cronograma UUID NOT NULL,
  data_retorno DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Realizado', 'Cancelado')),
  id_agendamento_retorno UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.cronogramas_novos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retornos_novos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para cronogramas_novos
CREATE POLICY "Users can view their own cronogramas" ON public.cronogramas_novos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cronogramas" ON public.cronogramas_novos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cronogramas" ON public.cronogramas_novos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cronogramas" ON public.cronogramas_novos
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas RLS para retornos_novos
CREATE POLICY "Users can view their own retornos" ON public.retornos_novos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own retornos" ON public.retornos_novos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retornos" ON public.retornos_novos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retornos" ON public.retornos_novos
  FOR DELETE USING (auth.uid() = user_id);

-- Criar triggers para updated_at
CREATE TRIGGER update_cronogramas_novos_updated_at
  BEFORE UPDATE ON public.cronogramas_novos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retornos_novos_updated_at
  BEFORE UPDATE ON public.retornos_novos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();