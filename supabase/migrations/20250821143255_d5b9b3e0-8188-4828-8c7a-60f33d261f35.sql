-- Remover o trigger problemático corretamente
DROP TRIGGER IF EXISTS validar_agendamento_trigger ON agendamentos;
DROP TRIGGER IF EXISTS validar_agendamento_completo_trigger ON agendamentos;
DROP FUNCTION IF EXISTS validar_agendamento_completo() CASCADE;