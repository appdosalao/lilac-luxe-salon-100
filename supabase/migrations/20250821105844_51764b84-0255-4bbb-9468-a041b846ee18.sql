-- Corrigir função com search_path seguro
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $$
  SELECT email FROM public.usuarios WHERE id = auth.uid();
$$;