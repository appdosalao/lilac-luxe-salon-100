import { supabase } from '@/integrations/supabase/client';
import * as React from 'react';

const { useState, useCallback } = React;

export const useSupabaseService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getServicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, valor, duracao, descricao')
        .order('nome');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar serviços:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getConfiguracoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('ativo', true)
        .order('dia_semana');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar configurações:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgendamentoOnline = useCallback(async (agendamentoData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('agendamentos_online')
        .insert(agendamentoData);
      
      if (error) throw error;
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao criar agendamento online:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getServicos,
    getConfiguracoes,
    createAgendamentoOnline
  };
};