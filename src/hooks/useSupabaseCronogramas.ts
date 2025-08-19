import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cronograma, Retorno } from '@/types/cronograma';

export const useSupabaseCronogramas = () => {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [retornos, setRetornos] = useState<Retorno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar cronogramas
  const loadCronogramas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cronogramas_novos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCronogramas: Cronograma[] = (data || []).map(item => ({
        id_cronograma: item.id_cronograma,
        cliente_id: item.cliente_id,
        cliente_nome: item.cliente_nome,
        servico_id: item.servico_id,
        tipo_servico: item.tipo_servico,
        data_inicio: item.data_inicio,
        hora_inicio: item.hora_inicio,
        duracao_minutos: item.duracao_minutos,
        recorrencia: item.recorrencia as 'Semanal' | 'Quinzenal' | 'Mensal' | 'Personalizada',
        intervalo_dias: item.intervalo_dias,
        observacoes: item.observacoes,
        status: item.status as 'ativo' | 'cancelado' | 'concluido',
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setCronogramas(formattedCronogramas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cronogramas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar retornos
  const loadRetornos = async () => {
    try {
      const { data, error } = await supabase
        .from('retornos_novos')
        .select('*')
        .order('data_retorno', { ascending: true });

      if (error) throw error;

      const formattedRetornos: Retorno[] = (data || []).map(item => ({
        id_retorno: item.id_retorno,
        id_cliente: item.id_cliente,
        id_cronograma: item.id_cronograma,
        data_retorno: item.data_retorno,
        status: item.status as 'Pendente' | 'Realizado' | 'Cancelado',
        id_agendamento_retorno: item.id_agendamento_retorno,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

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

  useEffect(() => {
    loadCronogramas();
    loadRetornos();
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