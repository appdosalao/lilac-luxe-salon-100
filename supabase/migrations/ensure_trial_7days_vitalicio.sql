ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS subscription_status text;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS plan_type text;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS paid_access boolean DEFAULT false;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

UPDATE public.usuarios
SET
  subscription_status = 'active',
  plan_type = 'vitalicio'
WHERE paid_access IS TRUE;

UPDATE public.usuarios
SET
  trial_start_date = COALESCE(trial_start_date, created_at, now()),
  trial_used = true,
  subscription_status = 'trial'
WHERE
  paid_access IS NOT TRUE
  AND (trial_start_date IS NOT NULL OR subscription_status IS NULL OR subscription_status = '' OR subscription_status = 'inactive')
  AND COALESCE(trial_start_date, created_at, now()) > now() - interval '7 days';

UPDATE public.usuarios
SET
  trial_used = true
WHERE trial_start_date IS NOT NULL;

UPDATE public.usuarios
SET
  subscription_status = 'inactive'
WHERE
  paid_access IS NOT TRUE
  AND trial_start_date IS NOT NULL
  AND now() >= trial_start_date + interval '7 days';

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := COALESCE(NEW.email, '');

  INSERT INTO public.usuarios (
    id,
    email,
    nome_completo,
    nome_personalizado_app,
    telefone,
    tema_preferencia,
    trial_start_date,
    trial_used,
    subscription_status,
    plan_type,
    paid_access,
    paid_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tema_preferencia', 'feminino'),
    now(),
    true,
    'trial',
    NULL,
    false,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome_completo = CASE WHEN public.usuarios.nome_completo IS NULL OR public.usuarios.nome_completo = '' THEN EXCLUDED.nome_completo ELSE public.usuarios.nome_completo END,
    nome_personalizado_app = CASE WHEN public.usuarios.nome_personalizado_app IS NULL OR public.usuarios.nome_personalizado_app = '' THEN EXCLUDED.nome_personalizado_app ELSE public.usuarios.nome_personalizado_app END,
    telefone = CASE WHEN public.usuarios.telefone IS NULL OR public.usuarios.telefone = '' THEN EXCLUDED.telefone ELSE public.usuarios.telefone END,
    tema_preferencia = COALESCE(public.usuarios.tema_preferencia, EXCLUDED.tema_preferencia),
    trial_start_date = COALESCE(public.usuarios.trial_start_date, EXCLUDED.trial_start_date),
    trial_used = (public.usuarios.trial_used OR EXCLUDED.trial_used),
    subscription_status = COALESCE(public.usuarios.subscription_status, EXCLUDED.subscription_status),
    updated_at = now();

  RETURN NEW;
END;
$$;

