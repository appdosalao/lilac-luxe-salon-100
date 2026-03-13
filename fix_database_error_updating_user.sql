BEGIN;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL DEFAULT '',
  nome_completo text NOT NULL DEFAULT '',
  nome_personalizado_app text NOT NULL DEFAULT 'Meu Salão',
  telefone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS tema_preferencia text DEFAULT 'feminino',
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.usuarios
  ALTER COLUMN email SET DEFAULT '',
  ALTER COLUMN nome_completo SET DEFAULT '';

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usuarios'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', p.policyname);
  END LOOP;
END$$;

CREATE POLICY "Users can view their own profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

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
  v_plan_type := COALESCE(NEW.raw_user_meta_data->>'plan_type', 'trial');
  v_trial_start := CASE WHEN v_plan_type = 'trial' THEN now() ELSE NULL END;
  v_subscription_status := CASE WHEN v_plan_type = 'paid' THEN 'inactive' ELSE v_plan_type END;

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
    subscription_status = CASE WHEN public.usuarios.subscription_status IS NULL OR public.usuarios.subscription_status = 'inactive' THEN EXCLUDED.subscription_status ELSE public.usuarios.subscription_status END,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_signup();

GRANT ALL ON public.usuarios TO service_role;
GRANT SELECT, UPDATE ON public.usuarios TO authenticated;

COMMIT;
