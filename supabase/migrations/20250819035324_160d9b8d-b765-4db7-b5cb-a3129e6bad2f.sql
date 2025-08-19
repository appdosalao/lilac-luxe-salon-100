-- Criar tabela cronogramas
CREATE TABLE public.cronogramas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  servico_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  dia_semana INTEGER NOT NULL, -- 0=domingo, 1=segunda, etc
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  recorrencia TEXT NOT NULL DEFAULT 'semanal', -- semanal, quinzenal, mensal
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cronogramas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own cronogramas" 
ON public.cronogramas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cronogramas" 
ON public.cronogramas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cronogramas" 
ON public.cronogramas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cronogramas" 
ON public.cronogramas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para updated_at
CREATE TRIGGER update_cronogramas_updated_at
BEFORE UPDATE ON public.cronogramas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela retornos para cronogramas
CREATE TABLE public.retornos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cronograma_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  servico_id UUID NOT NULL,
  data_retorno DATE NOT NULL,
  hora_retorno TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, agendado, concluido, cancelado
  observacoes TEXT,
  agendamento_id UUID, -- referência ao agendamento criado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para retornos
ALTER TABLE public.retornos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para retornos
CREATE POLICY "Users can view their own retornos" 
ON public.retornos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own retornos" 
ON public.retornos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retornos" 
ON public.retornos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retornos" 
ON public.retornos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar trigger para updated_at em retornos
CREATE TRIGGER update_retornos_updated_at
BEFORE UPDATE ON public.retornos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();