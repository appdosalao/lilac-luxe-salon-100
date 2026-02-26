-- Adicionar colunas para controle de trial grátis
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('trial', 'active', 'expired', 'inactive'));

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_trial ON usuarios(trial_start_date, trial_used, subscription_status);

-- Função para calcular status do trial
CREATE OR REPLACE FUNCTION check_trial_status(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_record RECORD;
  days_since_trial INTEGER;
BEGIN
  SELECT trial_start_date, trial_used, subscription_status 
  INTO user_record
  FROM usuarios 
  WHERE id = user_id;
  
  -- Se já tem assinatura ativa
  IF user_record.subscription_status = 'active' THEN
    RETURN 'active';
  END IF;
  
  -- Se nunca iniciou trial
  IF user_record.trial_start_date IS NULL THEN
    RETURN 'no_trial';
  END IF;
  
  -- Calcular dias desde início do trial
  days_since_trial := EXTRACT(DAY FROM (NOW() - user_record.trial_start_date));
  
  -- Se dentro do período de 7 dias
  IF days_since_trial < 7 THEN
    RETURN 'trial';
  ELSE
    RETURN 'expired';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar trigger para inicializar campos de trial
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.usuarios (
    id,
    email,
    nome_completo,
    nome_personalizado_app,
    telefone,
    tema_preferencia,
    trial_start_date,
    trial_used,
    subscription_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tema_preferencia', 'feminino'),
    -- Se escolheu trial, marcar data de início
    CASE 
      WHEN NEW.raw_user_meta_data->>'plan_type' = 'trial' 
      THEN NOW() 
      ELSE NULL 
    END,
    FALSE,
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'inactive')
  );
  RETURN NEW;
END;
$function$;