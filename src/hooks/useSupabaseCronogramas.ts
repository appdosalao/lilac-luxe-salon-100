import * as React from 'react';

const { useState, useEffect } = React;
import { supabase } from '@/integrations/supabase/client';
import { Cronograma, Retorno } from '@/types/cronograma';

// Interface estendida para cronogramas com dados relacionados
interface CronogramaCompleto extends Cronograma {
  cliente_nome_real?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  servico_nome_real?: string;
  servico_valor?: number;
  servico_duracao?: number;
  total_retornos: number;
  retornos_pendentes: number;
  retornos_realizados: number;
  proximo_retorno?: string;
}

// Interface estendida para retornos com dados relacionados
interface RetornoCompleto extends Retorno {
  cliente_nome?: string;
  cliente_telefone?: string;
  tipo_servico?: string;
  hora_inicio?: string;
  recorrencia?: string;
  agendamento_data?: string;
  agendamento_hora?: string;
  agendamento_status?: string;
}

export const useSupabaseCronogramas = () => {
  const [cronogramas, setCronogramas] = useState<CronogramaCompleto[]>([]);
  const [retornos, setRetornos] = useState<RetornoCompleto[]>([]);
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

      const formattedCronogramas: CronogramaCompleto[] = (data || []).map(item => ({
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
        // Dados relacionados
        cliente_nome_real: item.cliente_nome_real,
        cliente_telefone: item.cliente_telefone,
        cliente_email: item.cliente_email,
        servico_nome_real: item.servico_nome_real,
        servico_valor: item.servico_valor,
        servico_duracao: item.servico_duracao,
        total_retornos: item.total_retornos || 0,
        retornos_pendentes: item.retornos_pendentes || 0,
        retornos_realizados: item.retornos_realizados || 0,
        proximo_retorno: item.proximo_retorno,
      }));

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

      const formattedRetornos: RetornoCompleto[] = (data || []).map(item => ({
        id_retorno: item.id_retorno,
        id_cliente: item.id_cliente,
        id_cronograma: item.id_cronograma,
        data_retorno: item.data_retorno,
        status: item.status as 'Pendente' | 'Realizado' | 'Cancelado',
        id_agendamento_retorno: item.id_agendamento_retorno,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Dados relacionados
        cliente_nome: item.cliente_nome,
        cliente_telefone: item.cliente_telefone,
        tipo_servico: item.tipo_servico,
        hora_inicio: item.hora_inicio,
        recorrencia: item.recorrencia,
        agendamento_data: item.agendamento_data,
        agendamento_hora: item.agendamento_hora,
        agendamento_status: item.agendamento_status,
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

  // Função para criar agendamento a partir de retorno
  const criarAgendamentoDeRetorno = async (retornoId: string, dataAgendamento: string, horaAgendamento: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const retorno = retornos.find(r => r.id_retorno === retornoId);
      if (!retorno) throw new Error('Retorno não encontrado');

      // Buscar dados do cronograma para criar o agendamento
      const { data: cronogramaData, error: cronogramaError } = await supabase
        .from('cronogramas_novos')
        .select('*, servicos(*)')
        .eq('id_cronograma', retorno.id_cronograma)
        .single();

      if (cronogramaError) throw cronogramaError;

      // Criar agendamento
      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert({
          user_id: user.user.id,
          cliente_id: retorno.id_cliente,
          servico_id: cronogramaData.servico_id,
          data: dataAgendamento,
          hora: horaAgendamento,
          duracao: cronogramaData.duracao_minutos,
          valor: cronogramaData.servicos?.valor || 0,
          valor_devido: cronogramaData.servicos?.valor || 0,
          status: 'agendado',
          observacoes: `Retorno do cronograma: ${cronogramaData.tipo_servico}`,
        })
        .select()
        .single();

      if (agendamentoError) throw agendamentoError;

      // Atualizar retorno para marcar como realizado
      await updateRetorno(retornoId, {
        status: 'Realizado',
        id_agendamento_retorno: agendamento.id,
      });

      return agendamento;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento de retorno');
      throw err;
    }
  };

  useEffect(() => {
    loadCronogramas();
    loadRetornos();

    // Setup real-time subscriptions para atualizações em tempo real
    const channel = supabase
      .channel('cronogramas-realtime')
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
          table: 'retornos_novos'
        },
        () => {
          loadRetornos();
          loadCronogramas(); // Recarregar cronogramas para atualizar contadores
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
          loadCronogramas(); // Recarregar para atualizar dados de clientes
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
          loadCronogramas(); // Recarregar para atualizar dados de serviços
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
          loadRetornos(); // Recarregar para atualizar dados de agendamentos
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    criarAgendamentoDeRetorno,
    loadCronogramas,
    loadRetornos,
  };
};