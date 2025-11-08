-- Criar tabela de configurações de agendamento online
CREATE TABLE IF NOT EXISTS public.configuracoes_agendamento_online (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  nome_salao TEXT NOT NULL DEFAULT 'Meu Salão',
  descricao TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  instagram TEXT,
  facebook TEXT,
  whatsapp TEXT,
  logo_url TEXT,
  taxa_sinal_percentual INTEGER NOT NULL DEFAULT 30,
  tempo_minimo_antecedencia INTEGER NOT NULL DEFAULT 60,
  tempo_maximo_antecedencia INTEGER NOT NULL DEFAULT 4320,
  mensagem_boas_vindas TEXT NOT NULL DEFAULT 'Olá! Estamos felizes em atendê-lo(a). Preencha os dados abaixo para agendar seu horário.',
  termos_condicoes TEXT NOT NULL DEFAULT 'Ao agendar, você concorda em chegar no horário marcado. Em caso de atraso superior a 15 minutos, o agendamento poderá ser cancelado.',
  mensagem_confirmacao TEXT NOT NULL DEFAULT 'Agendamento confirmado! Em breve você receberá uma confirmação no WhatsApp.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_agendamento_online ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own online booking configs"
  ON public.configuracoes_agendamento_online
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active booking configs for form display"
  ON public.configuracoes_agendamento_online
  FOR SELECT
  USING (ativo = true);

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_agendamento_online_updated_at
  BEFORE UPDATE ON public.configuracoes_agendamento_online
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();