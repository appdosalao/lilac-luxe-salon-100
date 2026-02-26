-- Políticas RLS (Row Level Security) para o Sistema de Agendamento
-- Execute este script APÓS criar as tabelas e ANTES de inserir dados

-- ==========================================
-- REMOVER POLÍTICAS EXISTENTES (se houver)
-- ==========================================

-- Usuarios
DROP POLICY IF EXISTS "Usuários podem ver próprios dados" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;

-- Clientes
DROP POLICY IF EXISTS "Usuários podem gerenciar próprios clientes" ON clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON clientes;

-- Serviços
DROP POLICY IF EXISTS "Usuários podem gerenciar próprios serviços" ON servicos;
DROP POLICY IF EXISTS "servicos_select_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_insert_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_update_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_delete_policy" ON servicos;

-- Agendamentos
DROP POLICY IF EXISTS "Usuários podem gerenciar próprios agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_select_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON agendamentos;

-- Configurações
DROP POLICY IF EXISTS "Usuários podem gerenciar próprias configurações" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_select_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_insert_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_update_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_delete_policy" ON configuracoes;

-- Contas Fixas
DROP POLICY IF EXISTS "Usuários podem gerenciar próprias contas fixas" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_select_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_insert_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_update_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_delete_policy" ON contas_fixas;

-- Financeiro
DROP POLICY IF EXISTS "Usuários podem gerenciar próprio financeiro" ON financeiro;
DROP POLICY IF EXISTS "financeiro_select_policy" ON financeiro;
DROP POLICY IF EXISTS "financeiro_insert_policy" ON financeiro;
DROP POLICY IF EXISTS "financeiro_update_policy" ON financeiro;
DROP POLICY IF EXISTS "financeiro_delete_policy" ON financeiro;

-- Notificações
DROP POLICY IF EXISTS "Usuários podem gerenciar próprias notificações" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_select_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_update_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_delete_policy" ON notificacoes;

-- Auditoria
DROP POLICY IF EXISTS "Usuários podem ver própria auditoria" ON auditoria;
DROP POLICY IF EXISTS "auditoria_select_policy" ON auditoria;
DROP POLICY IF EXISTS "auditoria_insert_policy" ON auditoria;

-- Profissionais
DROP POLICY IF EXISTS "Usuários podem gerenciar próprios profissionais" ON profissionais;
DROP POLICY IF EXISTS "profissionais_select_policy" ON profissionais;
DROP POLICY IF EXISTS "profissionais_insert_policy" ON profissionais;
DROP POLICY IF EXISTS "profissionais_update_policy" ON profissionais;
DROP POLICY IF EXISTS "profissionais_delete_policy" ON profissionais;

-- ==========================================
-- POLÍTICAS PARA TABELA USUARIOS
-- ==========================================

-- Usuários podem ver seus próprios dados
CREATE POLICY "usuarios_select_policy" ON usuarios
    FOR SELECT 
    USING (auth.uid() = id);

-- Usuários podem inserir seus próprios dados
CREATE POLICY "usuarios_insert_policy" ON usuarios
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "usuarios_update_policy" ON usuarios
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- POLÍTICAS PARA TABELA CLIENTES
-- ==========================================

-- Usuários podem ver seus próprios clientes
CREATE POLICY "clientes_select_policy" ON clientes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir clientes para si mesmos
CREATE POLICY "clientes_insert_policy" ON clientes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar seus próprios clientes
CREATE POLICY "clientes_update_policy" ON clientes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar seus próprios clientes
CREATE POLICY "clientes_delete_policy" ON clientes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA SERVICOS
-- ==========================================

-- Usuários podem ver seus próprios serviços
CREATE POLICY "servicos_select_policy" ON servicos
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir serviços para si mesmos
CREATE POLICY "servicos_insert_policy" ON servicos
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar seus próprios serviços
CREATE POLICY "servicos_update_policy" ON servicos
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar seus próprios serviços
CREATE POLICY "servicos_delete_policy" ON servicos
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA AGENDAMENTOS
-- ==========================================

-- Usuários podem ver seus próprios agendamentos
CREATE POLICY "agendamentos_select_policy" ON agendamentos
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir agendamentos para si mesmos
CREATE POLICY "agendamentos_insert_policy" ON agendamentos
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar seus próprios agendamentos
CREATE POLICY "agendamentos_update_policy" ON agendamentos
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar seus próprios agendamentos
CREATE POLICY "agendamentos_delete_policy" ON agendamentos
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA CONFIGURACOES
-- ==========================================

-- Usuários podem ver suas próprias configurações
CREATE POLICY "configuracoes_select_policy" ON configuracoes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir configurações para si mesmos
CREATE POLICY "configuracoes_insert_policy" ON configuracoes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar suas próprias configurações
CREATE POLICY "configuracoes_update_policy" ON configuracoes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar suas próprias configurações
CREATE POLICY "configuracoes_delete_policy" ON configuracoes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA CONTAS_FIXAS
-- ==========================================

-- Usuários podem ver suas próprias contas fixas
CREATE POLICY "contas_fixas_select_policy" ON contas_fixas
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir contas fixas para si mesmos
CREATE POLICY "contas_fixas_insert_policy" ON contas_fixas
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar suas próprias contas fixas
CREATE POLICY "contas_fixas_update_policy" ON contas_fixas
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar suas próprias contas fixas
CREATE POLICY "contas_fixas_delete_policy" ON contas_fixas
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA FINANCEIRO
-- ==========================================

-- Usuários podem ver seus próprios lançamentos financeiros
CREATE POLICY "financeiro_select_policy" ON financeiro
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir lançamentos financeiros para si mesmos
CREATE POLICY "financeiro_insert_policy" ON financeiro
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar seus próprios lançamentos financeiros
CREATE POLICY "financeiro_update_policy" ON financeiro
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar seus próprios lançamentos financeiros
CREATE POLICY "financeiro_delete_policy" ON financeiro
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA NOTIFICACOES
-- ==========================================

-- Usuários podem ver suas próprias notificações
CREATE POLICY "notificacoes_select_policy" ON notificacoes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Sistema pode inserir notificações para usuários
CREATE POLICY "notificacoes_insert_policy" ON notificacoes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "notificacoes_update_policy" ON notificacoes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "notificacoes_delete_policy" ON notificacoes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS PARA TABELA AUDITORIA
-- ==========================================

-- Usuários podem ver seus próprios logs de auditoria
CREATE POLICY "auditoria_select_policy" ON auditoria
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Sistema pode inserir logs de auditoria
CREATE POLICY "auditoria_insert_policy" ON auditoria
    FOR INSERT 
    WITH CHECK (true); -- Permite inserção do sistema

-- ==========================================
-- POLÍTICAS PARA TABELA PROFISSIONAIS
-- ==========================================

-- Usuários podem ver seus próprios profissionais
CREATE POLICY "profissionais_select_policy" ON profissionais
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Usuários podem inserir profissionais para si mesmos
CREATE POLICY "profissionais_insert_policy" ON profissionais
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem atualizar seus próprios profissionais
CREATE POLICY "profissionais_update_policy" ON profissionais
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

-- Usuários podem deletar seus próprios profissionais
CREATE POLICY "profissionais_delete_policy" ON profissionais
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- POLÍTICAS ESPECIAIS PARA AGENDAMENTO ONLINE
-- ==========================================

-- Política para permitir inserção de agendamentos online (sem autenticação)
-- ATENÇÃO: Esta política deve ser usada com cuidado e apenas para o formulário público
CREATE POLICY "agendamentos_public_insert" ON agendamentos
    FOR INSERT 
    WITH CHECK (origem = 'online' AND usuario_id IS NOT NULL);

-- Política para permitir leitura limitada de serviços para agendamento online
-- ATENÇÃO: Esta política expõe dados públicos dos serviços
CREATE POLICY "servicos_public_select" ON servicos
    FOR SELECT 
    USING (true); -- Permite leitura pública dos serviços

-- ==========================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- ==========================================

-- Verificar status do RLS em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'usuarios', 'clientes', 'servicos', 'agendamentos', 
    'configuracoes', 'contas_fixas', 'financeiro', 
    'notificacoes', 'auditoria', 'profissionais'
);

-- ==========================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- ==========================================

/*
IMPORTANTE:

1. As políticas "public" para serviços e agendamentos online devem ser 
   usadas com cuidado em produção.

2. Para maior segurança, considere criar uma view pública para serviços
   que exponha apenas os campos necessários.

3. Para agendamentos online, implemente validação adicional no frontend
   para garantir que apenas dados válidos sejam inseridos.

4. Monitore os logs de auditoria regularmente para detectar atividades
   suspeitas.

5. Considere implementar rate limiting para prevenir spam de agendamentos.

6. As políticas de auditoria permitem inserção livre para logs do sistema,
   mas considere restringir isso em produção.

7. Para ambiente de desenvolvimento, você pode temporariamente desabilitar
   RLS com: ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;

8. Para reabilitar: ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;
*/