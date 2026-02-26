-- Create servicos table
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  duracao INTEGER NOT NULL, -- em minutos
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own services" 
ON public.servicos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services" 
ON public.servicos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" 
ON public.servicos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
ON public.servicos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_servicos_user_id ON public.servicos(user_id);
CREATE INDEX idx_servicos_nome ON public.servicos(nome);
CREATE INDEX idx_servicos_valor ON public.servicos(valor);