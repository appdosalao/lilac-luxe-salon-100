-- Remover política restritiva atual
DROP POLICY IF EXISTS "Deletar agendamentos online" ON public.agendamentos_online;

-- Criar nova política mais permissiva para usuários autenticados
CREATE POLICY "Usuarios autenticados podem deletar agendamentos online" ON public.agendamentos_online
FOR DELETE 
TO authenticated
USING (true);  -- Qualquer usuário autenticado pode deletar agendamentos online

-- Também permitir que usuários autenticados vejam todos os agendamentos para gerenciamento
DROP POLICY IF EXISTS "Ver agendamentos online" ON public.agendamentos_online;
CREATE POLICY "Ver agendamentos online" ON public.agendamentos_online
FOR SELECT 
USING (
  -- Público pode ver agendamentos pendentes recentes
  (status = 'pendente' AND data >= CURRENT_DATE AND data <= (CURRENT_DATE + interval '30 days'))
  OR 
  -- Usuários autenticados podem ver todos
  (auth.uid() IS NOT NULL)
);