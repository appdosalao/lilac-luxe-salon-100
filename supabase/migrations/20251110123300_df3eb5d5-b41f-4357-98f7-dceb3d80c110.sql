-- Remove public SELECT policy from configuracoes_horarios
DROP POLICY IF EXISTS "Public can view schedule configs for online booking" ON configuracoes_horarios;

-- Create RPC to get only active days without exposing configuration details
CREATE OR REPLACE FUNCTION public.get_active_booking_days()
RETURNS TABLE(dia_semana integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ch.dia_semana
  FROM configuracoes_horarios ch
  WHERE ch.ativo = true
  ORDER BY ch.dia_semana;
$$;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION public.get_active_booking_days() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_booking_days() TO authenticated;

-- Ensure anonymous users can execute the existing time slots function
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.buscar_horarios_com_multiplos_intervalos(date, uuid, integer) TO authenticated;