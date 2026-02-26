-- Criar tabela para agendamentos online
CREATE TABLE public.agendamentos_online (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  data DATE NOT NULL,
  horario TIME WITHOUT TIME ZONE NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'convertido')),
  valor NUMERIC NOT NULL DEFAULT 0,
  duracao INTEGER NOT NULL DEFAULT 60,
  ip_address INET,
  user_agent TEXT,
  origem TEXT DEFAULT 'formulario_online',
  agendamento_id UUID REFERENCES public.agendamentos(id), -- Referência para agendamento convertido
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_agendamentos_online_email ON public.agendamentos_online(email);
CREATE INDEX idx_agendamentos_online_data ON public.agendamentos_online(data);
CREATE INDEX idx_agendamentos_online_status ON public.agendamentos_online(status);
CREATE INDEX idx_agendamentos_online_servico_id ON public.agendamentos_online(servico_id);
CREATE INDEX idx_agendamentos_online_data_horario ON public.agendamentos_online(data, horario);

-- RLS - Para agendamentos online, permitimos leitura pública mas controle de escrita
ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;

-- Política para visualização - qualquer pessoa pode visualizar (necessário para verificar conflitos)
CREATE POLICY "Anyone can view online appointments for availability" 
ON public.agendamentos_online 
FOR SELECT 
USING (true);

-- Política para criação - qualquer pessoa pode criar agendamentos online
CREATE POLICY "Anyone can create online appointments" 
ON public.agendamentos_online 
FOR INSERT 
WITH CHECK (true);

-- Políticas para atualização e exclusão - apenas usuários autenticados (profissionais)
CREATE POLICY "Authenticated users can update online appointments" 
ON public.agendamentos_online 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete online appointments" 
ON public.agendamentos_online 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_agendamentos_online_updated_at
BEFORE UPDATE ON public.agendamentos_online
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para converter agendamento online em agendamento regular
CREATE OR REPLACE FUNCTION public.converter_agendamento_online(
  agendamento_online_id UUID,
  user_id UUID
) RETURNS UUID AS $$
DECLARE
  agendamento_online_rec RECORD;
  cliente_id UUID;
  novo_agendamento_id UUID;
BEGIN
  -- Buscar o agendamento online
  SELECT * INTO agendamento_online_rec 
  FROM public.agendamentos_online 
  WHERE id = agendamento_online_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento online não encontrado';
  END IF;
  
  -- Verificar se já foi convertido
  IF agendamento_online_rec.status = 'convertido' THEN
    RAISE EXCEPTION 'Agendamento já foi convertido';
  END IF;
  
  -- Buscar ou criar cliente
  SELECT id INTO cliente_id 
  FROM public.clientes 
  WHERE email = agendamento_online_rec.email AND user_id = user_id;
  
  IF NOT FOUND THEN
    -- Criar novo cliente
    INSERT INTO public.clientes (
      user_id,
      nome,
      telefone,
      email,
      observacoes
    ) VALUES (
      user_id,
      agendamento_online_rec.nome_completo,
      agendamento_online_rec.telefone,
      agendamento_online_rec.email,
      'Cliente criado via agendamento online'
    ) RETURNING id INTO cliente_id;
  END IF;
  
  -- Criar agendamento regular
  INSERT INTO public.agendamentos (
    user_id,
    cliente_id,
    servico_id,
    data,
    hora,
    duracao,
    valor,
    valor_devido,
    status,
    observacoes,
    origem
  ) VALUES (
    user_id,
    cliente_id,
    agendamento_online_rec.servico_id,
    agendamento_online_rec.data,
    agendamento_online_rec.horario,
    agendamento_online_rec.duracao,
    agendamento_online_rec.valor,
    agendamento_online_rec.valor,
    'agendado',
    COALESCE(agendamento_online_rec.observacoes, '') || ' (Convertido de agendamento online)',
    'online'
  ) RETURNING id INTO novo_agendamento_id;
  
  -- Atualizar status do agendamento online
  UPDATE public.agendamentos_online 
  SET status = 'convertido', 
      agendamento_id = novo_agendamento_id,
      updated_at = now()
  WHERE id = agendamento_online_id;
  
  RETURN novo_agendamento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar para real-time
ALTER TABLE public.agendamentos_online REPLICA IDENTITY FULL;