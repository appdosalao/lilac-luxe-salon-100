-- Política para permitir que usuários autenticados vejam clientes criados via agendamento online
CREATE POLICY "Users can view clients from online bookings"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid AND 
   EXISTS (
     SELECT 1 FROM public.agendamentos_online ao 
     WHERE ao.email = clientes.email AND ao.status = 'pendente'
   ))
);

-- Função para associar clientes de agendamento online ao usuário
CREATE OR REPLACE FUNCTION public.associar_clientes_agendamento_online(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Associar clientes de agendamentos online pendentes ao usuário
  UPDATE public.clientes 
  SET user_id = p_user_id
  WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND email IN (
    SELECT DISTINCT email 
    FROM public.agendamentos_online 
    WHERE status = 'pendente'
  );
END;
$$;