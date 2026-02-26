-- Fix SECURITY DEFINER functions to set search_path
-- This prevents privilege escalation through schema search path manipulation attacks

-- Fix all remaining SECURITY DEFINER functions that don't have search_path set
ALTER FUNCTION public.converter_agendamento_online(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_current_user_email() SET search_path = public;
ALTER FUNCTION public.associar_clientes_agendamento_online(uuid) SET search_path = public;
ALTER FUNCTION public.criar_cliente_agendamento_online(text, text, text, text) SET search_path = public;
ALTER FUNCTION public.test_delete_permissions(text, uuid) SET search_path = public;
ALTER FUNCTION public.inserir_configuracao_horario(integer, time, time, time, time, boolean, integer, integer) SET search_path = public;
ALTER FUNCTION public.obter_configuracoes_horario() SET search_path = public;
ALTER FUNCTION public.validar_agendamento_simultaneo(uuid, date, time, integer) SET search_path = public;
ALTER FUNCTION public.aplicar_expiracao_pontos() SET search_path = public;
ALTER FUNCTION public.cadastrar_clientes_programa_fidelidade(uuid) SET search_path = public;
ALTER FUNCTION public.calcular_nivel_cliente(uuid, integer) SET search_path = public;
ALTER FUNCTION public.calcular_nivel_cliente(integer) SET search_path = public;
ALTER FUNCTION public.validar_horario_agendamento() SET search_path = public;
ALTER FUNCTION public.trigger_cadastrar_clientes_novo_programa() SET search_path = public;
ALTER FUNCTION public.calcular_disponibilidade(uuid, date) SET search_path = public;
ALTER FUNCTION public.proximo_horario_disponivel(uuid, date, integer) SET search_path = public;
ALTER FUNCTION public.validar_agendamento(uuid, date, time) SET search_path = public;
ALTER FUNCTION public.buscar_horarios_disponiveis(date, uuid) SET search_path = public;
ALTER FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) SET search_path = public;