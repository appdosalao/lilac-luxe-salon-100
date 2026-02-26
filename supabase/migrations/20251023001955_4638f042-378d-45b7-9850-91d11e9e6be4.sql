-- Remover políticas antigas da tabela usuarios
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.usuarios;

-- Política correta para permitir inserção durante o signup
-- O usuário pode inserir seu próprio perfil se o ID corresponder ao auth.uid()
-- OU se o perfil ainda não existe (para permitir o signup inicial)
CREATE POLICY "Allow users to insert their own profile"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  OR NOT EXISTS (
    SELECT 1 FROM public.usuarios WHERE id = auth.uid()
  )
);

-- Garantir que a política de SELECT permanece funcional
DROP POLICY IF EXISTS "Users can view their own profile" ON public.usuarios;
CREATE POLICY "Users can view their own profile"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Garantir que a política de UPDATE permanece funcional
DROP POLICY IF EXISTS "Users can update their own profile" ON public.usuarios;
CREATE POLICY "Users can update their own profile"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);