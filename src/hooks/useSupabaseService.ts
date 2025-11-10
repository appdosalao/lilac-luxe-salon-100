import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';

export const useSupabaseService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getServicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('servicos_public')
        .select('*');
      
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

  const getActiveDays = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .rpc('get_active_booking_days');
      
      if (error) throw error;
      
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar dias ativos:', err);
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
    getActiveDays,
    createAgendamentoOnline
  };
};