-- CORREÇÃO FINAL DE SIGNUP E RLS DA TABELA USUARIOS
-- Este script:
-- 1. Remove qualquer trigger ou política antiga que possa estar causando conflito.
-- 2. Define uma função handle_new_user_signup robusta que trata erros de duplicidade.
-- 3. Configura RLS para permitir que o usuário APENAS leia/atualize seu perfil, mas NÃO insira diretamente (pois a trigger faz isso).
-- 4. Garante que o trigger seja a única fonte de criação de usuários na tabela public.usuarios.

-- ==============================================================================
-- 1. LIMPEZA DE TRIGGERS E FUNÇÕES ANTIGAS
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

-- ==============================================================================
-- 2. CRIAÇÃO DA FUNÇÃO HANDLE_NEW_USER_SIGNUP ROBUSTA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta inserir o perfil. Se já existir (race condition), apenas atualiza o trial.
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'tema_preferencia', 'feminino'),
    NOW(),      -- Trial start
    FALSE,      -- Trial used
    'trial',    -- Status
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW(),
    -- Garante que se o usuário reaparecer, o trial seja verificado/mantido se válido
    trial_start_date = COALESCE(public.usuarios.trial_start_date, EXCLUDED.trial_start_date);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro (opcional, mas útil para debug)
  RAISE WARNING 'Erro ao criar usuário na tabela public: %', SQLERRM;
  RETURN NEW; -- Não impede a criação do auth user, mesmo se o perfil falhar (fail-safe)
END;
$$;

-- Recriar trigger na tabela auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ==============================================================================
-- 3. CORREÇÃO DE POLÍTICAS RLS (PERMISSÕES)
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas de insert existentes para evitar confusão
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.usuarios;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.usuarios;

-- Política de SELECT: Usuário vê apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
CREATE POLICY "Users can view their own profile"
ON public.usuarios FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política de UPDATE: Usuário atualiza apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
CREATE POLICY "Users can update their own profile"
ON public.usuarios FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- IMPORTANTE: NÃO criar política de INSERT para 'authenticated'.
-- A inserção deve ser feita EXCLUSIVAMENTE pela trigger (Security Definer).
-- Isso evita o erro "Database error saving new user" causado por dupla tentativa de inserção (Client + Trigger).

-- Conceder permissões para a role de serviço (trigger usa security definer, mas bom garantir)
GRANT ALL ON public.usuarios TO service_role;
GRANT SELECT, UPDATE ON public.usuarios TO authenticated;
