-- Tabela para armazenar subscriptions de push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Tabela para preferências de notificações
CREATE TABLE IF NOT EXISTS public.notificacoes_preferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  novo_agendamento BOOLEAN DEFAULT true,
  cancelamento_agendamento BOOLEAN DEFAULT true,
  lembrete_agendamento BOOLEAN DEFAULT true,
  alerta_financeiro BOOLEAN DEFAULT true,
  retorno_cronograma BOOLEAN DEFAULT true,
  confirmacao_cliente BOOLEAN DEFAULT false,
  lembrete_cliente BOOLEAN DEFAULT false,
  ofertas_fidelidade BOOLEAN DEFAULT false,
  som_notificacao TEXT DEFAULT 'notification',
  vibracao BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_preferencias ENABLE ROW LEVEL SECURITY;

-- Políticas para push_subscriptions
CREATE POLICY "Usuários podem ver suas próprias subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para notificacoes_preferencias
CREATE POLICY "Usuários podem ver suas próprias preferências"
  ON public.notificacoes_preferencias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias preferências"
  ON public.notificacoes_preferencias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias preferências"
  ON public.notificacoes_preferencias FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificacoes_preferencias_updated_at
  BEFORE UPDATE ON public.notificacoes_preferencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar preferências padrão ao criar usuário
CREATE OR REPLACE FUNCTION public.criar_preferencias_notificacao_padrao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notificacoes_preferencias (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para criar preferências ao criar usuário
CREATE TRIGGER on_user_created_notificacoes
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION criar_preferencias_notificacao_padrao();