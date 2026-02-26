import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

/**
 * Hook base genérico para operações CRUD com Supabase
 * Reduz duplicação de código entre hooks específicos
 */
export function useSupabaseBase<T>(tableName: string) {
  const { user } = useSupabaseAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função genérica para carregar dados
  const loadData = useCallback(async (
    selectQuery = '*',
    orderBy?: { column: string; ascending?: boolean }
  ) => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from(tableName as any)
        .select(selectQuery)
        .eq('user_id', user.id);

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      return result || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao carregar ${tableName}`;
      setError(errorMessage);
      console.error(`Erro ao carregar ${tableName}:`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, tableName]);

  // Função genérica para criar registro
  const createRecord = useCallback(async (
    record: Partial<T>,
    successMessage?: string
  ) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { data: result, error: insertError } = await supabase
        .from(tableName as any)
        .insert({ ...record, user_id: user.id } as any)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao criar registro em ${tableName}`;
      console.error(errorMessage, err);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, tableName]);

  // Função genérica para atualizar registro
  const updateRecord = useCallback(async (
    id: string,
    updates: Partial<T>,
    idColumn = 'id',
    successMessage?: string
  ) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update(updates as any)
        .eq(idColumn, id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao atualizar registro em ${tableName}`;
      console.error(errorMessage, err);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, tableName]);

  // Função genérica para excluir registro
  const deleteRecord = useCallback(async (
    id: string,
    idColumn = 'id',
    successMessage?: string
  ) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from(tableName as any)
        .delete()
        .eq(idColumn, id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao excluir registro de ${tableName}`;
      console.error(errorMessage, err);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, tableName]);

  // Setup de real-time subscription genérico
  const setupRealtimeSubscription = useCallback((
    callback: () => void,
    additionalTables?: string[]
  ) => {
    const channel = supabase.channel(`${tableName}-realtime`);
    
    // Subscribe à tabela principal
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: user ? `user_id=eq.${user.id}` : undefined
      },
      callback
    );

    // Subscribe a tabelas adicionais se fornecidas
    additionalTables?.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        callback
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, user]);

  return {
    data,
    setData,
    loading,
    setLoading,
    error,
    setError,
    loadData,
    createRecord,
    updateRecord,
    deleteRecord,
    setupRealtimeSubscription,
  };
}
