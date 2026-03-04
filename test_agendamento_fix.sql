-- SCRIPT DE TESTE DE VALIDAÇÃO (SQL)
-- Execute este script APÓS aplicar a correção fix_critical_split_part.sql
-- Ele tenta inserir um agendamento de teste para verificar se o erro de split_part foi resolvido.

DO $$
DECLARE
    v_user_id uuid;
    v_cliente_id uuid;
    v_servico_id uuid;
    v_ag_id uuid;
BEGIN
    -- 1. Buscar um usuário válido (o primeiro que encontrar)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    IF v_user_id IS NULL THEN 
        RAISE NOTICE 'Teste pulado: Nenhum usuário encontrado no sistema.';
        RETURN;
    END IF;

    -- 2. Buscar ou criar cliente de teste
    SELECT id INTO v_cliente_id FROM public.clientes WHERE user_id = v_user_id LIMIT 1;
    IF v_cliente_id IS NULL THEN
        INSERT INTO public.clientes (user_id, nome, telefone) 
        VALUES (v_user_id, 'Cliente Teste SQL', '000000000') 
        RETURNING id INTO v_cliente_id;
    END IF;

    -- 3. Buscar ou criar serviço de teste
    SELECT id INTO v_servico_id FROM public.servicos WHERE user_id = v_user_id LIMIT 1;
    IF v_servico_id IS NULL THEN
        INSERT INTO public.servicos (user_id, nome, valor, duracao) 
        VALUES (v_user_id, 'Serviço Teste SQL', 50, 60) 
        RETURNING id INTO v_servico_id;
    END IF;

    -- 4. TENTATIVA DE INSERÇÃO (Onde ocorria o erro split_part)
    -- Usamos uma data futura para evitar conflitos com dados reais
    BEGIN
        INSERT INTO public.agendamentos (
            user_id, cliente_id, servico_id, 
            data, hora, duracao, valor, 
            status, origem, confirmado
        ) VALUES (
            v_user_id, v_cliente_id, v_servico_id,
            to_char(now() + interval '1 year', 'YYYY-MM-DD'), -- Data futura
            '10:00:00'::time, -- Passando TIME explicitamente
            60, 50,
            'agendado', 'manual', true
        ) RETURNING id INTO v_ag_id;

        RAISE NOTICE 'SUCESSO: Agendamento criado com ID % (Teste passou!)', v_ag_id;
        
        -- Limpeza (opcional, remova se quiser manter o registro de teste)
        DELETE FROM public.agendamentos WHERE id = v_ag_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'FALHA NO TESTE: Erro ao criar agendamento: %', SQLERRM;
    END;

END $$;
