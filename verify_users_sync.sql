-- VERIFICAÇÃO E SINCRONIZAÇÃO DA TABELA USUARIOS
-- Este script ajuda a verificar se todos os usuários registrados (auth.users)
-- possuem um registro correspondente na tabela pública 'usuarios'.
-- Se faltar alguém, ele tenta corrigir.

-- 1. Relatório de Usuários Registrados vs Tabela Pública
DO $$
DECLARE
    v_total_auth INTEGER;
    v_total_public INTEGER;
    v_missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_auth FROM auth.users;
    SELECT COUNT(*) INTO v_total_public FROM public.usuarios;
    
    v_missing := v_total_auth - v_total_public;
    
    RAISE NOTICE 'Total em Auth (Login): %', v_total_auth;
    RAISE NOTICE 'Total em Public (Perfil): %', v_total_public;
    
    IF v_missing > 0 THEN
        RAISE WARNING 'ATENÇÃO: Existem % usuários sem perfil na tabela pública!', v_missing;
    ELSE
        RAISE NOTICE 'SUCESSO: Todos os usuários possuem perfil sincronizado.';
    END IF;
END $$;

-- 2. Sincronização Manual (Correção de falhas anteriores)
-- Insere na tabela usuarios quem está no auth.users mas não tem perfil
INSERT INTO public.usuarios (
    id,
    email,
    nome_completo,
    nome_personalizado_app,
    telefone,
    tema_preferencia,
    trial_start_date,
    trial_used,
    subscription_status,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'nome_completo', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'nome_personalizado_app', 'Meu Salão'),
    COALESCE(au.raw_user_meta_data->>'telefone', ''),
    'light',
    NOW(), -- Inicia trial agora para quem estava sem
    FALSE,
    'trial',
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.usuarios u ON au.id = u.id
WHERE u.id IS NULL;

-- 3. Listagem de confirmação (Top 10 mais recentes)
SELECT 
    email, 
    nome_completo, 
    subscription_status, 
    trial_start_date,
    created_at 
FROM public.usuarios 
ORDER BY created_at DESC 
LIMIT 10;
