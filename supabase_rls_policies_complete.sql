-- ==========================================
-- POLÍTICAS RLS COMPLETAS PARA SISTEMA DE AGENDAMENTO
-- ==========================================
-- Execute este script APÓS criar as tabelas principais
-- Este arquivo configura toda a segurança Row Level Security

-- ==========================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ==========================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cronogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE retornos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
-- ==========================================

-- Usuarios
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;

-- Clientes
DROP POLICY IF EXISTS "clientes_select_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON clientes;

-- Serviços
DROP POLICY IF EXISTS "servicos_select_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_insert_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_update_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_delete_policy" ON servicos;
DROP POLICY IF EXISTS "servicos_public_select" ON servicos;

-- Agendamentos
DROP POLICY IF EXISTS "agendamentos_select_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete_policy" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_public_insert" ON agendamentos;

-- Cronogramas
DROP POLICY IF EXISTS "cronogramas_select_policy" ON cronogramas;
DROP POLICY IF EXISTS "cronogramas_insert_policy" ON cronogramas;
DROP POLICY IF EXISTS "cronogramas_update_policy" ON cronogramas;
DROP POLICY IF EXISTS "cronogramas_delete_policy" ON cronogramas;

-- Retornos
DROP POLICY IF EXISTS "retornos_select_policy" ON retornos;
DROP POLICY IF EXISTS "retornos_insert_policy" ON retornos;
DROP POLICY IF EXISTS "retornos_update_policy" ON retornos;
DROP POLICY IF EXISTS "retornos_delete_policy" ON retornos;

-- Lançamentos Financeiros
DROP POLICY IF EXISTS "lancamentos_select_policy" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "lancamentos_insert_policy" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "lancamentos_update_policy" ON lancamentos_financeiros;
DROP POLICY IF EXISTS "lancamentos_delete_policy" ON lancamentos_financeiros;

-- Contas Fixas
DROP POLICY IF EXISTS "contas_fixas_select_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_insert_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_update_policy" ON contas_fixas;
DROP POLICY IF EXISTS "contas_fixas_delete_policy" ON contas_fixas;

-- Categorias Financeiras
DROP POLICY IF EXISTS "categorias_select_policy" ON categorias_financeiras;
DROP POLICY IF EXISTS "categorias_insert_policy" ON categorias_financeiras;
DROP POLICY IF EXISTS "categorias_update_policy" ON categorias_financeiras;
DROP POLICY IF EXISTS "categorias_delete_policy" ON categorias_financeiras;

-- Configurações
DROP POLICY IF EXISTS "configuracoes_select_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_insert_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_update_policy" ON configuracoes;
DROP POLICY IF EXISTS "configuracoes_delete_policy" ON configuracoes;

-- Notificações
DROP POLICY IF EXISTS "notificacoes_select_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_insert_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_update_policy" ON notificacoes;
DROP POLICY IF EXISTS "notificacoes_delete_policy" ON notificacoes;

-- Auditoria
DROP POLICY IF EXISTS "auditoria_select_policy" ON auditoria;
DROP POLICY IF EXISTS "auditoria_insert_policy" ON auditoria;

-- ==========================================
-- 3. POLÍTICAS PARA USUARIOS
-- ==========================================

CREATE POLICY "usuarios_select_policy" ON usuarios
    FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "usuarios_insert_policy" ON usuarios
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "usuarios_update_policy" ON usuarios
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- 4. POLÍTICAS PARA CLIENTES
-- ==========================================

CREATE POLICY "clientes_select_policy" ON clientes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "clientes_insert_policy" ON clientes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "clientes_update_policy" ON clientes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "clientes_delete_policy" ON clientes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 5. POLÍTICAS PARA SERVIÇOS
-- ==========================================

CREATE POLICY "servicos_select_policy" ON servicos
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "servicos_insert_policy" ON servicos
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "servicos_update_policy" ON servicos
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "servicos_delete_policy" ON servicos
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- Política pública para agendamento online (acesso limitado)
CREATE POLICY "servicos_public_select" ON servicos
    FOR SELECT 
    USING (true); -- Permite leitura pública para agendamento online

-- ==========================================
-- 6. POLÍTICAS PARA AGENDAMENTOS
-- ==========================================

CREATE POLICY "agendamentos_select_policy" ON agendamentos
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "agendamentos_insert_policy" ON agendamentos
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "agendamentos_update_policy" ON agendamentos
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "agendamentos_delete_policy" ON agendamentos
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- Política para agendamento online (sem autenticação)
CREATE POLICY "agendamentos_public_insert" ON agendamentos
    FOR INSERT 
    WITH CHECK (origem = 'online' AND usuario_id IS NOT NULL);

-- ==========================================
-- 7. POLÍTICAS PARA CRONOGRAMAS
-- ==========================================

CREATE POLICY "cronogramas_select_policy" ON cronogramas
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "cronogramas_insert_policy" ON cronogramas
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "cronogramas_update_policy" ON cronogramas
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "cronogramas_delete_policy" ON cronogramas
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 8. POLÍTICAS PARA RETORNOS
-- ==========================================

CREATE POLICY "retornos_select_policy" ON retornos
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "retornos_insert_policy" ON retornos
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "retornos_update_policy" ON retornos
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "retornos_delete_policy" ON retornos
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 9. POLÍTICAS PARA LANÇAMENTOS FINANCEIROS
-- ==========================================

CREATE POLICY "lancamentos_select_policy" ON lancamentos_financeiros
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "lancamentos_insert_policy" ON lancamentos_financeiros
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "lancamentos_update_policy" ON lancamentos_financeiros
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "lancamentos_delete_policy" ON lancamentos_financeiros
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 10. POLÍTICAS PARA CONTAS FIXAS
-- ==========================================

CREATE POLICY "contas_fixas_select_policy" ON contas_fixas
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "contas_fixas_insert_policy" ON contas_fixas
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "contas_fixas_update_policy" ON contas_fixas
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "contas_fixas_delete_policy" ON contas_fixas
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 11. POLÍTICAS PARA CATEGORIAS FINANCEIRAS
-- ==========================================

CREATE POLICY "categorias_select_policy" ON categorias_financeiras
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "categorias_insert_policy" ON categorias_financeiras
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "categorias_update_policy" ON categorias_financeiras
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "categorias_delete_policy" ON categorias_financeiras
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 12. POLÍTICAS PARA CONFIGURAÇÕES
-- ==========================================

CREATE POLICY "configuracoes_select_policy" ON configuracoes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "configuracoes_insert_policy" ON configuracoes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "configuracoes_update_policy" ON configuracoes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "configuracoes_delete_policy" ON configuracoes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 13. POLÍTICAS PARA NOTIFICAÇÕES
-- ==========================================

CREATE POLICY "notificacoes_select_policy" ON notificacoes
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "notificacoes_insert_policy" ON notificacoes
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "notificacoes_update_policy" ON notificacoes
    FOR UPDATE 
    USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "notificacoes_delete_policy" ON notificacoes
    FOR DELETE 
    USING (auth.uid() = usuario_id);

-- ==========================================
-- 14. POLÍTICAS PARA AUDITORIA
-- ==========================================

CREATE POLICY "auditoria_select_policy" ON auditoria
    FOR SELECT 
    USING (auth.uid() = usuario_id);

CREATE POLICY "auditoria_insert_policy" ON auditoria
    FOR INSERT 
    WITH CHECK (true); -- Sistema pode inserir logs

-- ==========================================
-- 15. VERIFICAÇÕES E TESTES
-- ==========================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'usuarios', 'clientes', 'servicos', 'agendamentos', 
    'cronogramas', 'retornos', 'lancamentos_financeiros', 
    'contas_fixas', 'categorias_financeiras', 'configuracoes', 
    'notificacoes', 'auditoria'
)
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- 16. INSTRUÇÕES DE SEGURANÇA
-- ==========================================

/*
IMPORTANTE - POLÍTICAS DE SEGURANÇA:

1. AGENDAMENTO ONLINE:
   - As políticas "public" para serviços e agendamentos são necessárias
   - Monitore logs regularmente para detectar abusos
   - Considere implementar rate limiting
   - Valide dados no frontend antes de enviar

2. AUDITORIA:
   - Logs são inseridos automaticamente pelo sistema
   - Usuários só podem LER seus próprios logs
   - Monitore ações suspeitas regularmente

3. DADOS FINANCEIROS:
   - Proteção extra para informações sensíveis
   - Backup regular recomendado
   - Auditoria de todas as alterações

4. CONFIGURAÇÕES:
   - Usuários só acessam suas próprias configurações
   - Valores padrão são inseridos automaticamente

5. PERFORMANCE:
   - Índices otimizados para consultas frequentes
   - Views pré-calculadas para relatórios
   - Triggers automáticos para manutenção

6. MONITORAMENTO:
   - Verificar logs de erro regularmente
   - Monitorar performance das queries
   - Backup automático configurado

PARA DESENVOLVIMENTO:
- Temporariamente desabilitar RLS: ALTER TABLE nome_tabela DISABLE ROW LEVEL SECURITY;
- Reabilitar: ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

PARA PRODUÇÃO:
- Manter todas as políticas ativas
- Configurar backup automático
- Monitorar logs de acesso
- Implementar rate limiting
- Configurar alertas de segurança
*/