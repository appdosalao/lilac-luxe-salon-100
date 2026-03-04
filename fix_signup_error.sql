-- CORREÇÃO CRÍTICA DO SIGNUP: TRIGGER, RLS E CONFLITOS
-- Este script resolve o erro "Database error saving new user" ao garantir que:
-- 1. A trigger 'handle_new_user_signup' trate corretamente metadados nulos e evite duplicidade.
-- 2. A política RLS permita inserção explícita pelo usuário (caso o client-side tente criar) OU pela trigger.
-- 3. O trial de 7 dias seja aplicado consistentemente.

-- ==============================================================================
-- 1. CORREÇÃO DA FUNÇÃO HANDLE_NEW_USER_SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tenta inserir o perfil do usuário.
  -- Usa ON CONFLICT DO NOTHING para evitar erros se o perfil já foi criado por outra via (ex: client-side)
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
    -- Garante valores padrão seguros para metadados
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    'light',
    NOW(),      -- Trial de 7 dias inicia agora
    FALSE,
    'trial'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Se já existe, garante que o trial e status estejam corretos se estiverem nulos
    trial_start_date = COALESCE(usuarios.trial_start_date, NOW()),
    subscription_status = COALESCE(usuarios.subscription_status, 'trial'),
    -- Atualiza campos se vierem preenchidos no novo login (opcional, mas bom para OAuth)
    nome_completo = CASE 
        WHEN usuarios.nome_completo IS NULL OR usuarios.nome_completo = '' THEN EXCLUDED.nome_completo 
        ELSE usuarios.nome_completo 
    END;

  RETURN NEW;
END;
$$;

-- Recriar a trigger para garantir que está ativa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ==============================================================================
-- 2. CORREÇÃO DAS POLÍTICAS RLS (PERMISSÕES)
-- ==============================================================================
-- Remover políticas antigas/conflitantes de INSERT
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.usuarios;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.usuarios;

-- Criar política permissiva para INSERT autenticado
-- Permite que o próprio usuário insira seu perfil (necessário se o front-end fizer o insert manual)
CREATE POLICY "Allow users to insert their own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Garantir políticas de SELECT e UPDATE
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
CREATE POLICY "Users can view their own profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
CREATE POLICY "Users can update their own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- 3. GARANTIA DE PERMISSÕES NA TABELA USUARIOS
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Conceder permissões básicas para roles autenticados e anon (necessário para fluxo de auth)
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usuarios TO service_role;

-- Anon normalmente não precisa de acesso direto a usuarios, mas em alguns fluxos de OAuth pode ser útil verificar existência
GRANT SELECT ON public.usuarios TO anon;
