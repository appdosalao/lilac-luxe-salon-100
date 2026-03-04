-- ATUALIZAÇÃO DO PERÍODO DE TRIAL PARA 7 DIAS (TODOS OS MÉTODOS DE LOGIN)
-- Este script garante que qualquer novo usuário (Google, Facebook, Email) receba automaticamente 7 dias grátis.

-- 1. Atualizar a função que lida com novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
BEGIN
  -- Insere o usuário na tabela pública 'usuarios' com os dados iniciais
  -- Define explicitamente o início do trial como AGORA e o status como 'trial'
  INSERT INTO public.usuarios (
    id,
    email,
    nome_completo,
    nome_personalizado_app,
    telefone,
    tema_preferencia,
    trial_start_date,    -- Data de início do teste
    trial_used,          -- Se já usou (false no início)
    subscription_status  -- Status da assinatura ('trial')
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    'light',
    NOW(),      -- Inicia o trial agora
    FALSE,      -- Ainda não "gastou" o trial (está usando agora)
    'trial'     -- Status inicial é trial
  );

  -- Insere configurações padrão (horários, dias ativos, etc)
  -- A trigger 'trigger_configuracoes_padrao' já faria isso, mas podemos garantir aqui ou deixar a trigger atuar
  -- Como existe a trigger 'trigger_configuracoes_padrao' AFTER INSERT ON usuarios, não precisamos duplicar aqui.

  RETURN NEW;
END;
$$;

-- 2. Atualizar a função que verifica se o trial ainda é válido
CREATE OR REPLACE FUNCTION public.check_trial_status(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  days_since_trial INTEGER;
BEGIN
  SELECT trial_start_date, trial_used, subscription_status 
  INTO user_record
  FROM public.usuarios 
  WHERE id = user_id;
  
  -- Se não encontrou usuário
  IF user_record IS NULL THEN
    RETURN 'expired';
  END IF;

  -- Se já tem assinatura ativa PAGA
  IF user_record.subscription_status = 'active' THEN
    RETURN 'active';
  END IF;
  
  -- Se nunca iniciou trial (caso antigo ou erro), considera expirado ou não iniciado
  -- Para novos usuários, trial_start_date sempre será preenchido pela trigger acima
  IF user_record.trial_start_date IS NULL THEN
    -- Se status for 'trial' mas sem data, define data agora (autocorreção)
    IF user_record.subscription_status = 'trial' THEN
        UPDATE public.usuarios SET trial_start_date = NOW() WHERE id = user_id;
        RETURN 'trial';
    END IF;
    RETURN 'expired';
  END IF;
  
  -- Calcular dias desde início do trial
  days_since_trial := EXTRACT(DAY FROM (NOW() - user_record.trial_start_date));
  
  -- Lógica de 7 dias
  IF days_since_trial < 7 THEN
    RETURN 'trial'; -- Ainda dentro dos 7 dias
  ELSE
    -- Se passou dos 7 dias e não pagou, marca como expirado
    IF user_record.subscription_status = 'trial' THEN
        UPDATE public.usuarios SET subscription_status = 'expired' WHERE id = user_id;
    END IF;
    RETURN 'expired';
  END IF;
END;
$$;
