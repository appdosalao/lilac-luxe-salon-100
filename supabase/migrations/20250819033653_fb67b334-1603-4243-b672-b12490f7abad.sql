-- Create clientes table
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  endereco TEXT,
  data_nascimento DATE,
  observacoes TEXT,
  historico_servicos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Create policies for clientes
CREATE POLICY "Users can view their own clients" 
ON public.clientes 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own clients" 
ON public.clientes 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own clients" 
ON public.clientes 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own clients" 
ON public.clientes 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create agendamentos table
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  servico_id UUID NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  duracao INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  valor_devido DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT DEFAULT 'fiado',
  status_pagamento TEXT DEFAULT 'em_aberto',
  status TEXT DEFAULT 'agendado',
  origem TEXT DEFAULT 'manual',
  confirmado BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for agendamentos
CREATE POLICY "Users can view their own appointments" 
ON public.agendamentos 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own appointments" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own appointments" 
ON public.agendamentos 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_clientes()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_updated_at_agendamentos()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_clientes();

CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_agendamentos();