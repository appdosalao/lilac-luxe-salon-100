ALTER TABLE public.configuracoes_agendamento_online ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view online booking configs" ON public.configuracoes_agendamento_online;
CREATE POLICY "Public can view online booking configs"
ON public.configuracoes_agendamento_online
FOR SELECT
TO anon, authenticated
USING (ativo = true);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view services" ON public.servicos;
CREATE POLICY "Public can view services"
ON public.servicos
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.configuracoes_agendamento_online c
    WHERE c.user_id = servicos.user_id
      AND c.ativo = true
  )
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS produtos_public_select ON public.produtos;
CREATE POLICY produtos_public_select
ON public.produtos
FOR SELECT
TO anon
USING (
  ativo = true
  AND EXISTS (
    SELECT 1
    FROM public.configuracoes_agendamento_online c
    WHERE c.user_id = produtos.user_id
      AND c.ativo = true
  )
);

ALTER TABLE public.configuracoes_horarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view schedule configs" ON public.configuracoes_horarios;
CREATE POLICY "Public can view schedule configs"
ON public.configuracoes_horarios
FOR SELECT
TO anon, authenticated
USING (
  ativo = true
  AND EXISTS (
    SELECT 1
    FROM public.configuracoes_agendamento_online c
    WHERE c.user_id = configuracoes_horarios.user_id
      AND c.ativo = true
  )
);

ALTER TABLE public.intervalos_trabalho ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view work intervals" ON public.intervalos_trabalho;
CREATE POLICY "Public can view work intervals"
ON public.intervalos_trabalho
FOR SELECT
TO anon, authenticated
USING (
  ativo = true
  AND EXISTS (
    SELECT 1
    FROM public.configuracoes_agendamento_online c
    WHERE c.user_id = intervalos_trabalho.user_id
      AND c.ativo = true
  )
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view basic user info" ON public.usuarios;

ALTER TABLE public.agendamentos_online ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can create online appointments" ON public.agendamentos_online;
CREATE POLICY "Public can create online appointments"
ON public.agendamentos_online
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.servicos s
    JOIN public.configuracoes_agendamento_online c
      ON c.user_id = s.user_id
     AND c.ativo = true
    WHERE s.id = agendamentos_online.servico_id
  )
);

DROP POLICY IF EXISTS "Public can check availability" ON public.agendamentos_online;
CREATE POLICY "Public can check availability"
ON public.agendamentos_online
FOR SELECT
TO anon
USING (
  status IN ('pendente', 'confirmado')
  AND data >= CURRENT_DATE
  AND EXISTS (
    SELECT 1
    FROM public.servicos s
    JOIN public.configuracoes_agendamento_online c
      ON c.user_id = s.user_id
     AND c.ativo = true
    WHERE s.id = agendamentos_online.servico_id
  )
);

GRANT SELECT ON TABLE public.configuracoes_agendamento_online TO anon;
GRANT SELECT ON TABLE public.servicos TO anon;
GRANT SELECT ON TABLE public.produtos TO anon;
GRANT SELECT ON TABLE public.configuracoes_horarios TO anon;
GRANT SELECT ON TABLE public.intervalos_trabalho TO anon;
GRANT SELECT ON TABLE public.agendamentos_online TO anon;
GRANT INSERT ON TABLE public.agendamentos_online TO anon;

GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) TO anon;
