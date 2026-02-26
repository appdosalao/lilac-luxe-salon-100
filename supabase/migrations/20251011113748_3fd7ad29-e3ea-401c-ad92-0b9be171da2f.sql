-- Remover triggers
DROP TRIGGER IF EXISTS trigger_registrar_pontos ON agendamentos;
DROP TRIGGER IF EXISTS trigger_atualizar_nivel ON pontos_fidelidade;
DROP TRIGGER IF EXISTS trigger_cadastrar_clientes_programa ON programas_fidelidade;

-- Remover funções
DROP FUNCTION IF EXISTS registrar_pontos_agendamento() CASCADE;
DROP FUNCTION IF EXISTS atualizar_nivel_cliente() CASCADE;
DROP FUNCTION IF EXISTS calcular_nivel_cliente(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS calcular_pontos_com_nivel(numeric, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS aplicar_expiracao_pontos() CASCADE;
DROP FUNCTION IF EXISTS trigger_cadastrar_clientes_novo_programa() CASCADE;
DROP FUNCTION IF EXISTS cadastrar_clientes_programa_fidelidade(uuid) CASCADE;

-- Remover views
DROP VIEW IF EXISTS estatisticas_marketing CASCADE;
DROP VIEW IF EXISTS ranking_fidelidade CASCADE;
DROP VIEW IF EXISTS agendamentos_sem_pontos CASCADE;

-- Remover tabelas (ordem importa por causa das foreign keys)
DROP TABLE IF EXISTS log_automacoes CASCADE;
DROP TABLE IF EXISTS destinatarios_campanha CASCADE;
DROP TABLE IF EXISTS campanhas_marketing CASCADE;
DROP TABLE IF EXISTS automacoes_marketing CASCADE;
DROP TABLE IF EXISTS historico_pontos CASCADE;
DROP TABLE IF EXISTS pontos_fidelidade CASCADE;
DROP TABLE IF EXISTS programas_fidelidade CASCADE;