import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cronograma, Retorno } from '@/types/cronograma';

export const useSupabaseCronogramas = () => {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [retornos, setRetornos] = useState<Retorno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar cronogramas com dados relacionados
  const loadCronogramas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cronogramas_completos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCronogramas: any[] = data || [];
      setCronogramas(formattedCronogramas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cronogramas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar retornos com dados relacionados
  const loadRetornos = async () => {
    try {
      const { data, error } = await supabase
        .from('retornos_completos')
        .select('*')
        .order('data_retorno', { ascending: true });

      if (error) throw error;

      const formattedRetornos: any[] = data || [];
      setRetornos(formattedRetornos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar retornos');
    }
  };

  // Criar cronograma
  const createCronograma = async (cronograma: Omit<Cronograma, 'id_cronograma' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cronogramas_novos')
        .insert({
          user_id: user.user.id,
          cliente_id: cronograma.cliente_id,
          cliente_nome: cronograma.cliente_nome,
          servico_id: cronograma.servico_id,
          tipo_servico: cronograma.tipo_servico,
          data_inicio: cronograma.data_inicio,
          hora_inicio: cronograma.hora_inicio,
          duracao_minutos: cronograma.duracao_minutos,
          recorrencia: cronograma.recorrencia,
          intervalo_dias: cronograma.intervalo_dias,
          observacoes: cronograma.observacoes,
          status: cronograma.status,
        })
        .select()
        .single();

      if (error) throw error;
      await loadCronogramas();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cronograma');
      throw err;
    }
  };

  // Atualizar cronograma
  const updateCronograma = async (id: string, updates: Partial<Cronograma>) => {
    try {
      const { error } = await supabase
        .from('cronogramas_novos')
        .update(updates)
        .eq('id_cronograma', id);

      if (error) throw error;
      await loadCronogramas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cronograma');
      throw err;
    }
  };

  // Deletar cronograma
  const deleteCronograma = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cronogramas_novos')
        .delete()
        .eq('id_cronograma', id);

      if (error) throw error;
      await loadCronogramas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar cronograma');
      throw err;
    }
  };

  // Criar retorno
  const createRetorno = async (retorno: Omit<Retorno, 'id_retorno' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('retornos_novos')
        .insert({
          user_id: user.user.id,
          id_cliente: retorno.id_cliente,
          id_cronograma: retorno.id_cronograma,
          data_retorno: retorno.data_retorno,
          status: retorno.status,
          id_agendamento_retorno: retorno.id_agendamento_retorno,
        })
        .select()
        .single();

      if (error) throw error;
      await loadRetornos();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar retorno');
      throw err;
    }
  };

  // Atualizar retorno
  const updateRetorno = async (id: string, updates: Partial<Retorno>) => {
    try {
      const { error } = await supabase
        .from('retornos_novos')
        .update(updates)
        .eq('id_retorno', id);

      if (error) throw error;
      await loadRetornos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar retorno');
      throw err;
    }
  };

  React.useEffect(() => {
    loadCronogramas();
    loadRetornos();

    // Configurar real-time updates para cronogramas
    const cronogramasChannel = supabase
      .channel('cronogramas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cronogramas_novos'
        },
        () => {
          loadCronogramas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clientes'
        },
        () => {
          loadCronogramas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servicos'
        },
        () => {
          loadCronogramas();
        }
      )
      .subscribe();

    // Configurar real-time updates para retornos
    const retornosChannel = supabase
      .channel('retornos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'retornos_novos'
        },
        () => {
          loadRetornos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos'
        },
        () => {
          loadRetornos();
        }
      )
      .subscribe();

    // Cleanup nas subscriptions
    return () => {
      supabase.removeChannel(cronogramasChannel);
      supabase.removeChannel(retornosChannel);
    };
  }, []);

  return {
    cronogramas,
    retornos,
    loading,
    error,
    createCronograma,
    updateCronograma,
    deleteCronograma,
    createRetorno,
    updateRetorno,
    loadCronogramas,
    loadRetornos,
  };
};