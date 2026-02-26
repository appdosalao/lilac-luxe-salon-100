-- Criar função security definer para obter email do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Atualizar agendamentos online" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Deletar agendamentos online" ON public.agendamentos_online;

-- Criar novas políticas usando a função security definer
CREATE POLICY "Atualizar agendamentos online" ON public.agendamentos_online
FOR UPDATE 
TO authenticated
USING (email = public.get_current_user_email())
WITH CHECK (status = ANY (ARRAY['pendente'::text, 'cancelado'::text]));

CREATE POLICY "Deletar agendamentos online" ON public.agendamentos_online
FOR DELETE 
TO authenticated
USING (email = public.get_current_user_email() AND status = 'pendente'::text);