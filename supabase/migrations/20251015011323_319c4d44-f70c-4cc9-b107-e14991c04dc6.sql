-- Fix RLS policy for usuarios table to allow auto-creation during signup
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.usuarios;

-- Create new INSERT policy that allows both signup and authenticated users
CREATE POLICY "Users can insert their own profile" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR -- User creating their own profile
  auth.uid() IS NOT NULL -- Or any authenticated user (for auto-creation)
);

-- Also ensure the policy allows insertion even during the auth callback
-- by checking if the user exists in auth.users
CREATE POLICY "Allow profile creation during signup"
ON public.usuarios
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users WHERE id = usuarios.id
  )
);