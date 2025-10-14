-- Correção de Segurança: Remover referências à tabela historico_pontos inexistente
-- Issue: historico_pontos_missing_table - Schema Integrity
-- Funções tentam inserir em tabela que foi removida em migração anterior

-- A tabela historico_pontos foi removida na migração 20251011113748
-- Precisamos remover as referências nas funções de fidelidade

-- Atualizar trigger de registro de pontos (remover INSERT em historico_pontos)
CREATE OR REPLACE FUNCTION public.registrar_pontos_agendamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_programa RECORD;
  v_pontos_ganhos INTEGER;
BEGIN
  -- Só adiciona pontos quando status muda para 'concluido'
  IF NEW.status = 'concluido' AND (OLD IS NULL OR OLD.status != 'concluido') THEN
    
    -- Buscar programa ativo
    SELECT * INTO v_programa
    FROM programas_fidelidade
    WHERE user_id = NEW.user_id 
      AND ativo = true
      AND (data_inicio IS NULL OR data_inicio <= CURRENT_DATE)
    LIMIT 1;

    -- Se programa ativo, adicionar pontos
    IF v_programa.id IS NOT NULL THEN
      v_pontos_ganhos := FLOOR(NEW.valor * v_programa.pontos_por_real);
      
      IF v_pontos_ganhos > 0 THEN
        INSERT INTO pontos_fidelidade (
          user_id, 
          cliente_id, 
          pontos, 
          origem, 
          origem_id, 
          descricao,
          data_expiracao,
          expirado
        ) VALUES (
          NEW.user_id,
          NEW.cliente_id,
          v_pontos_ganhos,
          'agendamento',
          NEW.id,
          'Pontos ganhos no serviço realizado',
          CASE 
            WHEN v_programa.expiracao_pontos_dias > 0 
            THEN CURRENT_DATE + v_programa.expiracao_pontos_dias 
            ELSE NULL 
          END,
          false
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Atualizar função de cadastro (remover INSERT em historico_pontos)
CREATE OR REPLACE FUNCTION public.cadastrar_clientes_programa_fidelidade(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar registros de nível para clientes que ainda não têm
  INSERT INTO niveis_fidelidade (user_id, cliente_id, nivel, pontos_totais, pontos_disponiveis)
  SELECT 
    c.user_id,
    c.id,
    'bronze',
    0,
    0
  FROM clientes c
  WHERE c.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM niveis_fidelidade nf 
      WHERE nf.cliente_id = c.id AND nf.user_id = c.user_id
    );
END;
$function$;

-- Nota: A tabela pontos_fidelidade serve como histórico completo de pontos
-- Não é necessária uma tabela separada historico_pontos