-- Adicionar política para permitir visualização pública dos serviços no agendamento online
CREATE POLICY "Public can view services for online booking" 
ON public.servicos 
FOR SELECT 
USING (true);

-- Também vamos adicionar política para permitir que usuários públicos vejam configurações de horários
CREATE POLICY "Public can view schedule configs for online booking" 
ON public.configuracoes_horarios 
FOR SELECT 
USING (ativo = true);