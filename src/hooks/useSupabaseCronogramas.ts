import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Cronograma, CronogramaFormData } from '@/types/cronograma';
import { toast } from 'sonner';

export const useSupabaseCronogramas = () => {
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [retornos, setRetornos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  // Buscar cronogramas
  const fetchCronogramas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cronogramas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar cronogramas:', error);
        return;
      }

      if (data) {
        const cronogramasFormatados = data.map(item => ({
          id: item.id,
          clienteId: item.cliente_id,
          servicoId: item.servico_id,
          titulo: item.titulo,
          descricao: item.descricao || '',
          diaSemana: item.dia_semana,
          horaInicio: item.hora_inicio,
          horaFim: item.hora_fim,
          recorrencia: item.recorrencia,
          dataInicio: item.data_inicio,
          dataFim: item.data_fim,
          ativo: item.ativo,
          observacoes: item.observacoes || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        setCronogramas(cronogramasFormatados);
      }
    } catch (error) {
      console.error('Erro ao buscar cronogramas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar retornos
  const fetchRetornos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('retornos')
        .select('*')
        .eq('user_id', user.id)
        .order('data_retorno', { ascending: true });

      if (error) {
        console.error('Erro ao buscar retornos:', error);
        return;
      }

      if (data) {
        setRetornos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar retornos:', error);
    }
  };

  // Criar cronograma
  const createCronograma = async (cronogramaData: CronogramaFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cronogramas')
        .insert({
          user_id: user.id,
          cliente_id: cronogramaData.clienteId,
          servico_id: cronogramaData.servicoId,
          titulo: cronogramaData.titulo,
          descricao: cronogramaData.descricao,
          dia_semana: cronogramaData.diaSemana,
          hora_inicio: cronogramaData.horaInicio,
          hora_fim: cronogramaData.horaFim,
          recorrencia: cronogramaData.recorrencia,
          data_inicio: cronogramaData.dataInicio,
          data_fim: cronogramaData.dataFim,
          ativo: cronogramaData.ativo,
          observacoes: cronogramaData.observacoes,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cronograma:', error);
        toast.error('Erro ao criar cronograma');
        return false;
      }

      if (data) {
        const cronogramaFormatado = {
          id: data.id,
          clienteId: data.cliente_id,
          servicoId: data.servico_id,
          titulo: data.titulo,
          descricao: data.descricao || '',
          diaSemana: data.dia_semana,
          horaInicio: data.hora_inicio,
          horaFim: data.hora_fim,
          recorrencia: data.recorrencia,
          dataInicio: data.data_inicio,
          dataFim: data.data_fim,
          ativo: data.ativo,
          observacoes: data.observacoes || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setCronogramas(prev => [cronogramaFormatado, ...prev]);
        toast.success('Cronograma criado com sucesso!');
        return true;
      }
    } catch (error) {
      console.error('Erro ao criar cronograma:', error);
      toast.error('Erro ao criar cronograma');
    }
    return false;
  };

  // Atualizar cronograma
  const updateCronograma = async (id: string, updates: Partial<CronogramaFormData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cronogramas')
        .update({
          cliente_id: updates.clienteId,
          servico_id: updates.servicoId,
          titulo: updates.titulo,
          descricao: updates.descricao,
          dia_semana: updates.diaSemana,
          hora_inicio: updates.horaInicio,
          hora_fim: updates.horaFim,
          recorrencia: updates.recorrencia,
          data_inicio: updates.dataInicio,
          data_fim: updates.dataFim,
          ativo: updates.ativo,
          observacoes: updates.observacoes,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cronograma:', error);
        toast.error('Erro ao atualizar cronograma');
        return false;
      }

      if (data) {
        const cronogramaFormatado = {
          id: data.id,
          clienteId: data.cliente_id,
          servicoId: data.servico_id,
          titulo: data.titulo,
          descricao: data.descricao || '',
          diaSemana: data.dia_semana,
          horaInicio: data.hora_inicio,
          horaFim: data.hora_fim,
          recorrencia: data.recorrencia,
          dataInicio: data.data_inicio,
          dataFim: data.data_fim,
          ativo: data.ativo,
          observacoes: data.observacoes || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setCronogramas(prev => prev.map(cronograma => 
          cronograma.id === id ? cronogramaFormatado : cronograma
        ));
        toast.success('Cronograma atualizado com sucesso!');
        return true;
      }
    } catch (error) {
      console.error('Erro ao atualizar cronograma:', error);
      toast.error('Erro ao atualizar cronograma');
    }
    return false;
  };

  // Deletar cronograma
  const deleteCronograma = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cronogramas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar cronograma:', error);
        toast.error('Erro ao deletar cronograma');
        return false;
      }

      setCronogramas(prev => prev.filter(cronograma => cronograma.id !== id));
      toast.success('Cronograma deletado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao deletar cronograma:', error);
      toast.error('Erro ao deletar cronograma');
    }
    return false;
  };

  // Criar múltiplos agendamentos baseados no cronograma
  const createMultipleAgendamentos = async (cronogramaId: string): Promise<boolean> => {
    // Esta função será implementada conforme necessário
    toast.info('Função de criação múltipla em desenvolvimento');
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchCronogramas();
      fetchRetornos();
    }
  }, [user]);

  return {
    cronogramas,
    retornos,
    loading,
    createCronograma,
    updateCronograma,
    deleteCronograma,
    createMultipleAgendamentos,
    refetch: fetchCronogramas,
  };
};