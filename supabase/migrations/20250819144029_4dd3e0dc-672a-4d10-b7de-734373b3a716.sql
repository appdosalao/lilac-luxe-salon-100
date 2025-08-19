-- Função de diagnóstico para verificar permissões de exclusão
CREATE OR REPLACE FUNCTION public.test_delete_permissions(table_name text, record_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
    record_exists boolean := false;
    user_owns_record boolean := false;
    result json;
BEGIN
    -- Obter o ID do usuário autenticado
    current_user_id := auth.uid();
    
    -- Verificar se o usuário está autenticado
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authenticated',
            'user_id', null
        );
    END IF;
    
    -- Verificar se o registro existe e se o usuário é o proprietário
    IF table_name = 'servicos' THEN
        SELECT EXISTS(SELECT 1 FROM servicos WHERE id = record_id) INTO record_exists;
        SELECT EXISTS(SELECT 1 FROM servicos WHERE id = record_id AND user_id = current_user_id) INTO user_owns_record;
    ELSIF table_name = 'clientes' THEN
        SELECT EXISTS(SELECT 1 FROM clientes WHERE id = record_id) INTO record_exists;
        SELECT EXISTS(SELECT 1 FROM clientes WHERE id = record_id AND user_id = current_user_id) INTO user_owns_record;
    ELSIF table_name = 'agendamentos' THEN
        SELECT EXISTS(SELECT 1 FROM agendamentos WHERE id = record_id) INTO record_exists;
        SELECT EXISTS(SELECT 1 FROM agendamentos WHERE id = record_id AND user_id = current_user_id) INTO user_owns_record;
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', 'Table not supported',
            'user_id', current_user_id
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user_id', current_user_id,
        'record_exists', record_exists,
        'user_owns_record', user_owns_record,
        'can_delete', record_exists AND user_owns_record
    );
END;
$$;