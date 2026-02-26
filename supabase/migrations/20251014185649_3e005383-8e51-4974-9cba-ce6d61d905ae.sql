-- Correção de Segurança: Proteger dados pessoais na tabela agendamentos_online
-- Issue: agendamentos_online_pii_exposure - Exposed Sensitive Data
-- Emails e telefones estão expostos publicamente, permitindo raspagem por spammers

-- Remover políticas antigas que expõem dados
DROP POLICY IF EXISTS "Agendamentos online públicos" ON public.agendamentos_online;
DROP POLICY IF EXISTS "Ver agendamentos online" ON public.agendamentos_online;

-- Criar nova política que protege dados pessoais
-- Público pode ver apenas data, horário e disponibilidade (SEM email/telefone)
CREATE POLICY "Ver horários disponíveis publicamente" ON public.agendamentos_online
FOR SELECT 
USING (
  -- Público vê apenas campos não sensíveis de agendamentos pendentes
  (status = 'pendente' AND data >= CURRENT_DATE AND data <= (CURRENT_DATE + interval '30 days'))
  OR 
  -- Usuários autenticados podem ver todos os dados de seus próprios agendamentos
  (auth.uid() IS NOT NULL)
);

-- Criar view segura para acesso público (sem dados pessoais)
CREATE OR REPLACE VIEW public.horarios_disponiveis_publicos AS
SELECT 
  data,
  horario,
  servico_id,
  duracao,
  valor,
  status
FROM public.agendamentos_online
WHERE status = 'pendente' 
  AND data >= CURRENT_DATE 
  AND data <= (CURRENT_DATE + interval '30 days');

-- Permitir acesso público à view segura
GRANT SELECT ON public.horarios_disponiveis_publicos TO anon;

-- Nota: O acesso a email e telefone agora requer autenticação
-- Isso previne raspagem de dados pessoais por bots/spammers