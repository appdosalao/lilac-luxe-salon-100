ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS plan_type text CHECK (plan_type IN ('mensal', 'vitalicio')),
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS cakto_order_id uuid,
ADD COLUMN IF NOT EXISTS cakto_order_ref_id text,
ADD COLUMN IF NOT EXISTS cakto_product_id text,
ADD COLUMN IF NOT EXISTS cakto_offer_id text,
ADD COLUMN IF NOT EXISTS cakto_subscription_id text,
ADD COLUMN IF NOT EXISTS cakto_last_event text,
ADD COLUMN IF NOT EXISTS cakto_last_status text,
ADD COLUMN IF NOT EXISTS cakto_customer_email text,
ADD COLUMN IF NOT EXISTS subscription_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_usuarios_cakto_order_id ON public.usuarios(cakto_order_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_cakto_customer_email ON public.usuarios(cakto_customer_email);

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type text;
  v_trial_start timestamptz;
  v_subscription_status text;
  v_email text;
BEGIN
  v_email := COALESCE(NEW.email, '');
  v_plan_type := NULLIF(NEW.raw_user_meta_data->>'plan_type', '');
  v_trial_start := now();
  v_subscription_status := 'trial';

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
    payment_provider,
    subscription_updated_at,
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
    v_trial_start,
    false,
    v_subscription_status,
    v_plan_type,
    NULL,
    now(),
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
    plan_type = COALESCE(public.usuarios.plan_type, EXCLUDED.plan_type),
    subscription_updated_at = COALESCE(public.usuarios.subscription_updated_at, EXCLUDED.subscription_updated_at),
    updated_at = now();

  RETURN NEW;
END;
$$;
