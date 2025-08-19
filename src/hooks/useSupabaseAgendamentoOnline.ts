import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgendamentoOnline {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  servico_id: string;
  data: string;
  horario: string;
  observacoes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'convertido';
  valor: number;
  duracao: number;
  ip_address?: string;
  user_agent?: string;
  origem: string;
  agendamento_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NovoAgendamentoOnline {
  nome_completo: string;
  email: string;
  telefone: string;
  servico_id: string;
  data: string;
  horario: string;
  observacoes?: string;
  valor: number;
  duracao: number;
}

export interface AgendamentoOnlineComServico extends AgendamentoOnline {
  servico_nome: string;
  servico_valor: number;
  servico_duracao: number;
}

export const useSupabaseAgendamentoOnline = () => {
  const [agendamentosOnline, setAgendamentosOnline] = useState<AgendamentoOnline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar agendamentos online
  const loadAgendamentosOnline = async (filtros?: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    limite?: number;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('agendamentos_online')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.data_inicio) {
        query = query.gte('data', filtros.data_inicio);
      }

      if (filtros?.data_fim) {
        query = query.lte('data', filtros.data_fim);
      }

      if (filtros?.limite) {
        query = query.limit(filtros.limite);
      } else {
        query = query.limit(100); // Limite padrão
      }

      const { data, error } = await query;

      if (error) throw error;
      const formattedData: AgendamentoOnline[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'pendente' | 'confirmado' | 'cancelado' | 'convertido',
        ip_address: item.ip_address as string
      }));
      setAgendamentosOnline(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos online');
    } finally {
      setLoading(false);
    }
  };

  // Carregar agendamentos online com dados do serviço
  const loadAgendamentosOnlineComServico = async (filtros?: {
    status?: string;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<AgendamentoOnlineComServico[]> => {
    try {
      setLoading(true);
      let query = supabase
        .from('agendamentos_online')
        .select(`
          *,
          servicos:servico_id (
            nome,
            valor,
            duracao
          )
        `)
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.data_inicio) {
        query = query.gte('data', filtros.data_inicio);
      }

      if (filtros?.data_fim) {
        query = query.lte('data', filtros.data_fim);
      }

      const { data, error } = await query;

      if (error) throw error;

      const agendamentosComServico: AgendamentoOnlineComServico[] = (data || []).map(item => ({
        ...item,
        status: item.status as 'pendente' | 'confirmado' | 'cancelado' | 'convertido',
        ip_address: item.ip_address as string,
        servico_nome: item.servicos?.nome || 'Serviço não encontrado',
        servico_valor: item.servicos?.valor || 0,
        servico_duracao: item.servicos?.duracao || 60
      }));

      return agendamentosComServico;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos online');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Criar agendamento online (público - sem autenticação)
  const createAgendamentoOnline = async (agendamento: NovoAgendamentoOnline): Promise<AgendamentoOnline | null> => {
    try {
      console.log('=== INICIANDO CRIAÇÃO DE AGENDAMENTO ONLINE ===');
      console.log('Dados recebidos:', agendamento);
      
      // Capturar informações do browser
      const userAgent = navigator.userAgent;
      console.log('User Agent:', userAgent);
      
      const dataParaInserir = {
        ...agendamento,
        user_agent: userAgent,
        status: 'pendente'
      };
      
      console.log('Dados para inserir:', dataParaInserir);
      
      const { data, error } = await supabase
        .from('agendamentos_online')
        .insert(dataParaInserir)
        .select()
        .single();

      console.log('Resposta do Supabase - data:', data);
      console.log('Resposta do Supabase - error:', error);

      if (error) {
        console.error('Erro detalhado do Supabase:', error);
        throw error;
      }
      
      const formattedResult: AgendamentoOnline = {
        ...data,
        status: data.status as 'pendente' | 'confirmado' | 'cancelado' | 'convertido',
        ip_address: data.ip_address as string
      };
      
      console.log('Resultado formatado:', formattedResult);
      
      // Recarregar lista
      await loadAgendamentosOnline();
      
      console.log('=== AGENDAMENTO CRIADO COM SUCESSO ===');
      return formattedResult;
    } catch (err) {
      console.error('=== ERRO AO CRIAR AGENDAMENTO ===');
      console.error('Erro completo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar agendamento online';
      console.error('Mensagem de erro:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Atualizar status do agendamento online
  const updateStatusAgendamentoOnline = async (id: string, status: AgendamentoOnline['status']) => {
    try {
      const { error } = await supabase
        .from('agendamentos_online')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadAgendamentosOnline();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
      throw err;
    }
  };

  // Confirmar agendamento online
  const confirmarAgendamentoOnline = async (id: string) => {
    return updateStatusAgendamentoOnline(id, 'confirmado');
  };

  // Cancelar agendamento online
  const cancelarAgendamentoOnline = async (id: string) => {
    return updateStatusAgendamentoOnline(id, 'cancelado');
  };

  // Converter agendamento online em agendamento regular
  const converterParaAgendamento = async (agendamentoOnlineId: string): Promise<string | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('converter_agendamento_online', {
        agendamento_online_id: agendamentoOnlineId,
        user_id: user.user.id
      });

      if (error) throw error;
      
      // Recarregar lista
      await loadAgendamentosOnline();
      
      return data; // ID do novo agendamento
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao converter agendamento');
      throw err;
    }
  };

  // Verificar disponibilidade de horário
  const verificarDisponibilidade = async (data: string, horario: string, duracao: number, servicoId: string): Promise<boolean> => {
    try {
      // Verificar se horário está dentro das configurações de funcionamento
      const dataObj = new Date(data);
      const diaSemana = dataObj.getDay();
      
      // Se não houver configuração de horário para o dia, considerar indisponível
      const { data: configuracaoHorario } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('dia_semana', diaSemana)
        .eq('ativo', true)
        .single();

      if (!configuracaoHorario) {
        return false;
      }

      // Verificar se horário está dentro do funcionamento
      const hora = horario.replace(':', '');
      const abertura = configuracaoHorario.horario_abertura.replace(':', '');
      const fechamento = configuracaoHorario.horario_fechamento.replace(':', '');

      if (hora < abertura || hora > fechamento) {
        return false;
      }

      // Verificar se não está no intervalo
      if (configuracaoHorario.intervalo_inicio && configuracaoHorario.intervalo_fim) {
        const inicioIntervalo = configuracaoHorario.intervalo_inicio.replace(':', '');
        const fimIntervalo = configuracaoHorario.intervalo_fim.replace(':', '');
        
        if (hora >= inicioIntervalo && hora <= fimIntervalo) {
          return false;
        }
      }
      
      // Verificar conflitos com agendamentos existentes
      // Calcular horário de fim
      const [horas, minutos] = horario.split(':').map(Number);
      const inicioMinutos = horas * 60 + minutos;
      const fimMinutos = inicioMinutos + duracao;
      const horarioFim = `${String(Math.floor(fimMinutos / 60)).padStart(2, '0')}:${String(fimMinutos % 60).padStart(2, '0')}`;

      // Verificar conflitos em agendamentos online
      const { data: conflitosOnline, error: errorOnline } = await supabase
        .from('agendamentos_online')
        .select('horario, duracao')
        .eq('data', data)
        .in('status', ['pendente', 'confirmado'])
        .neq('servico_id', servicoId);

      if (errorOnline) throw errorOnline;

      // Verificar conflitos em agendamentos regulares
      const { data: conflitosRegulares, error: errorRegulares } = await supabase
        .from('agendamentos')
        .select('hora, duracao')
        .eq('data', data)
        .neq('status', 'cancelado');

      if (errorRegulares) throw errorRegulares;

      // Verificar conflitos
      const todosConflitos = [
        ...(conflitosOnline || []).map(c => ({ hora: c.horario, duracao: c.duracao })),
        ...(conflitosRegulares || [])
      ];

      for (const conflito of todosConflitos) {
        const [confHoras, confMinutos] = conflito.hora.split(':').map(Number);
        const confInicioMinutos = confHoras * 60 + confMinutos;
        const confFimMinutos = confInicioMinutos + conflito.duracao;

        // Verificar sobreposição
        if (inicioMinutos < confFimMinutos && fimMinutos > confInicioMinutos) {
          return false;
        }
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar disponibilidade');
      return false;
    }
  };

  // Obter serviços públicos (sem user_id)
  const getServicosPublicos = async () => {
    try {
      console.log('=== CARREGANDO SERVIÇOS PÚBLICOS ===');
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, valor, duracao, descricao')
        .order('nome');

      console.log('Resposta serviços - data:', data);
      console.log('Resposta serviços - error:', error);

      if (error) {
        console.error('Erro ao carregar serviços:', error);
        throw error;
      }
      console.log('Serviços carregados com sucesso:', data?.length, 'serviços');
      return data || [];
    } catch (err) {
      console.error('Erro completo ao carregar serviços:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar serviços');
      return [];
    }
  };

  // Estatísticas dos agendamentos online
  const getEstatisticasAgendamentosOnline = async () => {
    try {
      const [totalResult, pendenteResult, confirmadoResult, convertidoResult] = await Promise.all([
        supabase.from('agendamentos_online').select('id', { count: 'exact' }),
        supabase.from('agendamentos_online').select('id', { count: 'exact' }).eq('status', 'pendente'),
        supabase.from('agendamentos_online').select('id', { count: 'exact' }).eq('status', 'confirmado'),
        supabase.from('agendamentos_online').select('id', { count: 'exact' }).eq('status', 'convertido')
      ]);

      return {
        total: totalResult.count || 0,
        pendentes: pendenteResult.count || 0,
        confirmados: confirmadoResult.count || 0,
        convertidos: convertidoResult.count || 0,
        cancelados: (totalResult.count || 0) - (pendenteResult.count || 0) - (confirmadoResult.count || 0) - (convertidoResult.count || 0)
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      return {
        total: 0,
        pendentes: 0,
        confirmados: 0,
        convertidos: 0,
        cancelados: 0
      };
    }
  };

  useEffect(() => {
    loadAgendamentosOnline();

    // Setup real-time subscriptions
    const channel = supabase
      .channel('agendamentos-online-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos_online'
        },
        () => {
          loadAgendamentosOnline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    agendamentosOnline,
    loading,
    error,
    loadAgendamentosOnline,
    loadAgendamentosOnlineComServico,
    createAgendamentoOnline,
    updateStatusAgendamentoOnline,
    confirmarAgendamentoOnline,
    cancelarAgendamentoOnline,
    converterParaAgendamento,
    verificarDisponibilidade,
    getServicosPublicos,
    getEstatisticasAgendamentosOnline
  };
};