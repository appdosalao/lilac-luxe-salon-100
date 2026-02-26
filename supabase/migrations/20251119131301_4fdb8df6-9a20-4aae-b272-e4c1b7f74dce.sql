-- Adicionar colunas necessárias para o sistema de trial/assinatura
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Criar índice para melhorar performance de consultas de status
CREATE INDEX IF NOT EXISTS idx_usuarios_subscription_status 
ON public.usuarios(subscription_status);

-- Comentários explicativos
COMMENT ON COLUMN public.usuarios.trial_start_date IS 'Data de início do período de trial de 7 dias';
COMMENT ON COLUMN public.usuarios.trial_used IS 'Indica se o usuário já utilizou o período de trial';
COMMENT ON COLUMN public.usuarios.subscription_status IS 'Status da assinatura: inactive, trial, active, expired';