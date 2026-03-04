-- ==============================================================================
-- CORREÇÃO DEFINITIVA DE ERRO DE CADASTRO (Database error saving new user)
--
-- O erro persistiu porque o sistema de Assinaturas/Trial que foi implementado
-- atualizou a função de gatilho para inserir em várias outras colunas que
-- NÃO EXISTIAM no banco de dados.
--
-- Este script criará de forma segura todas as colunas de planos e assinaturas
-- necessárias para que o cadastro do usuário volte a funcionar 100%.
-- ==============================================================================

BEGIN;

-- 1. Adicionar TODAS as colunas relacionadas a Plano, Trial e Stripe
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS tema_preferencia TEXT DEFAULT 'feminino',
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- 2. Recriar a função garantindo que os nomes das colunas batam exatamente com o esperado
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere perfil básico usando metadados do signup
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
$$;

-- 3. Re-anexar o Gatilho para garantir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

COMMIT;
