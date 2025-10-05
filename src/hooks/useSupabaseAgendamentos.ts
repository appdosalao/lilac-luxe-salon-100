import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Agendamento, AgendamentoFiltros } from '@/types/agendamento';
import { toast } from 'sonner';
import { useSupabaseConfiguracoes } from './useSupabaseConfiguracoes';

interface AgendamentoOnlineData {
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
  created_at: string;
  updated_at: string;
}

export function useSupabaseAgendamentos() {
  const { user } = useSupabaseAuth();
  const supabaseConfig = useSupabaseConfiguracoes();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [agendamentosOnline, setAgendamentosOnline] = useState<AgendamentoOnlineData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<AgendamentoFiltros>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  // Verificar se horário está disponível usando a função do Supabase
  const verificarHorarioDisponivel = async (data: string, hora: string) => {
    if (!user) return false;
    
    try {
      // Garantir que o horário esteja no formato correto (HH:MM:SS ou HH:MM)
      const horaFormatada = hora.includes(':') ? hora : `${hora}:00`;
      
      const { data: horariosDisponiveis, error } = await supabase.rpc(
        'buscar_horarios_com_multiplos_intervalos', 
        {
          data_selecionada: data,
          user_id_param: user.id,
          duracao_servico: 30 // Duração mínima para verificação
        }
      );

      if (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return false;
      }

      // Verificar se o horário específico está disponível
      // Comparar tanto HH:MM:SS quanto HH:MM
      return horariosDisponiveis?.some((h: any) => {
        const horarioBanco = h.horario; // Formato HH:MM:SS do banco
        const horarioBancoSemSegundos = horarioBanco ? horarioBanco.substring(0, 5) : ''; // HH:MM
        return (horarioBanco === horaFormatada || horarioBancoSemSegundos === hora) && h.disponivel === true;
      }) || false;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  };

  // Carregar agendamentos regulares do Supabase
  const carregarAgendamentosRegulares = async (): Promise<Agendamento[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('data')
        .order('hora');

      if (error) {
        console.error('Erro ao carregar agendamentos regulares:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        clienteId: item.cliente_id,
        clienteNome: 'Cliente', // Será resolvido depois
        servicoId: item.servico_id,
        servicoNome: 'Serviço', // Será resolvido depois
        data: item.data,
        hora: item.hora,
        duracao: item.duracao,
        valor: parseFloat(item.valor?.toString() || '0'),
        valorPago: parseFloat(item.valor_pago?.toString() || '0'),
        valorDevido: parseFloat(item.valor_devido?.toString() || '0'),
        formaPagamento: (item.forma_pagamento as 'dinheiro' | 'cartao' | 'pix' | 'fiado') || 'fiado',
        statusPagamento: (item.status_pagamento as 'pago' | 'parcial' | 'em_aberto') || 'em_aberto',
        status: (item.status as 'agendado' | 'concluido' | 'cancelado') || 'agendado',
        origem: (item.origem as 'manual' | 'cronograma' | 'online') || 'manual',
        origem_cronograma: false,
        confirmado: item.confirmado,
        observacoes: item.observacoes || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Erro ao carregar agendamentos regulares:', error);
      return [];
    }
  };

  // Carregar agendamentos online
  const carregarAgendamentosOnline = async (): Promise<AgendamentoOnlineData[]> => {
    try {
      const { data, error } = await supabase
        .from('agendamentos_online')
        .select('*')
        .in('status', ['pendente', 'confirmado'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar agendamentos online:', error);
        return [];
      }

      return (data || []).map(item => ({
        id: item.id,
        nome_completo: item.nome_completo,
        email: item.email,
        telefone: item.telefone,
        servico_id: item.servico_id,
        data: item.data,
        horario: item.horario,
        observacoes: item.observacoes,
        status: item.status as 'pendente' | 'confirmado' | 'cancelado' | 'convertido',
        valor: parseFloat(item.valor?.toString() || '0'),
        duracao: item.duracao,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Erro ao carregar agendamentos online:', error);
      return [];
    }
  };

  // Converter agendamento online para o formato de agendamento regular
  const converterAgendamentoOnline = (agendamentoOnline: AgendamentoOnlineData): Agendamento => {
    return {
      id: `online_${agendamentoOnline.id}`,
      clienteId: '', // Não há cliente cadastrado
      clienteNome: agendamentoOnline.nome_completo,
      servicoId: agendamentoOnline.servico_id,
      servicoNome: 'Serviço Online', // Será resolvido depois
      data: agendamentoOnline.data,
      hora: agendamentoOnline.horario,
      duracao: agendamentoOnline.duracao,
      valor: agendamentoOnline.valor,
      valorPago: 0,
      valorDevido: agendamentoOnline.valor,
      formaPagamento: 'fiado' as const,
      statusPagamento: 'em_aberto' as const,
      status: agendamentoOnline.status === 'confirmado' ? 'agendado' as const : 'agendado' as const,
      origem: 'online' as const,
      origem_cronograma: false,
      confirmado: agendamentoOnline.status === 'confirmado',
      observacoes: agendamentoOnline.observacoes,
      createdAt: agendamentoOnline.created_at,
      updatedAt: agendamentoOnline.updated_at
    };
  };

  // Carregar todos os agendamentos
  const carregarAgendamentos = async () => {
    setLoading(true);
    try {
      const [agendamentosReg, agendamentosOnl] = await Promise.all([
        carregarAgendamentosRegulares(),
        carregarAgendamentosOnline()
      ]);

      setAgendamentos(agendamentosReg);
      setAgendamentosOnline(agendamentosOnl);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  // Combinar agendamentos regulares e online
  const agendamentosCombinados = useMemo(() => {
    const agendamentosOnlineConvertidos = agendamentosOnline.map(converterAgendamentoOnline);
    return [...agendamentos, ...agendamentosOnlineConvertidos];
  }, [agendamentos, agendamentosOnline]);

  useEffect(() => {
    carregarAgendamentos();

    // Setup real-time subscriptions para agendamentos online
    const channelOnline = supabase
      .channel('agendamentos-online-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos_online'
        },
        () => {
          carregarAgendamentos();
        }
      )
      .subscribe();

    // Setup real-time subscriptions para agendamentos regulares
    const channelRegular = supabase
      .channel('agendamentos-regular-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        () => {
          carregarAgendamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelOnline);
      supabase.removeChannel(channelRegular);
    };
  }, [user]);

  // Filtrar agendamentos combinados
  const agendamentosFiltrados = useMemo(() => {
    let resultado = [...agendamentosCombinados];

    if (filtros.data) {
      resultado = resultado.filter(ag => ag.data === filtros.data);
    }

    if (filtros.status) {
      resultado = resultado.filter(ag => ag.status === filtros.status);
    }

    if (filtros.statusPagamento) {
      resultado = resultado.filter(ag => ag.statusPagamento === filtros.statusPagamento);
    }

    if (filtros.clienteId) {
      resultado = resultado.filter(ag => ag.clienteId === filtros.clienteId);
    }

    if (filtros.origem) {
      resultado = resultado.filter(ag => ag.origem === filtros.origem);
    }

    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      resultado = resultado.filter(ag => 
        ag.clienteNome.toLowerCase().includes(busca) ||
        ag.servicoNome.toLowerCase().includes(busca)
      );
    }

    // Ordenar por data e hora
    resultado.sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.hora}`);
      const dataHoraB = new Date(`${b.data}T${b.hora}`);
      return dataHoraA.getTime() - dataHoraB.getTime();
    });

    return resultado;
  }, [agendamentosCombinados, filtros]);

  // Paginação
  const totalPaginas = Math.ceil(agendamentosFiltrados.length / itensPorPagina);
  const agendamentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return agendamentosFiltrados.slice(inicio, fim);
  }, [agendamentosFiltrados, paginaAtual, itensPorPagina]);

  // Converter agendamento online para agendamento regular
  const converterAgendamentoOnlineParaRegular = async (agendamentoOnlineId: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('converter_agendamento_online', {
        agendamento_online_id: agendamentoOnlineId,
        user_id: user.id
      });

      if (error) {
        console.error('Erro ao converter agendamento:', error);
        toast.error('Erro ao converter agendamento');
        return false;
      }

      await carregarAgendamentos();
      toast.success('Agendamento convertido com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao converter agendamento:', error);
      toast.error('Erro ao converter agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Confirmar agendamento online
  const confirmarAgendamentoOnline = async (agendamentoOnlineId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendamentos_online')
        .update({ status: 'confirmado' })
        .eq('id', agendamentoOnlineId);

      if (error) {
        console.error('Erro ao confirmar agendamento:', error);
        toast.error('Erro ao confirmar agendamento');
        return false;
      }

      await carregarAgendamentos();
      toast.success('Agendamento confirmado!');
      return true;
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error('Erro ao confirmar agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const criarAgendamento = async (novoAgendamento: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Verificar se horário está dentro das configurações de funcionamento
    const horarioDisponivel = await verificarHorarioDisponivel(novoAgendamento.data, novoAgendamento.hora);
    if (!horarioDisponivel) {
      toast.error('Horário não disponível para agendamento');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert({
          user_id: user.id,
          cliente_id: novoAgendamento.clienteId,
          servico_id: novoAgendamento.servicoId,
          data: novoAgendamento.data,
          hora: novoAgendamento.hora,
          duracao: novoAgendamento.duracao,
          valor: novoAgendamento.valor,
          valor_pago: novoAgendamento.valorPago || 0,
          valor_devido: novoAgendamento.valorDevido || novoAgendamento.valor,
          forma_pagamento: novoAgendamento.formaPagamento || 'fiado',
          status_pagamento: novoAgendamento.statusPagamento || 'em_aberto',
          status: novoAgendamento.status || 'agendado',
          origem: novoAgendamento.origem || 'manual',
          confirmado: novoAgendamento.confirmado ?? false,
          observacoes: novoAgendamento.observacoes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        toast.error('Erro ao criar agendamento');
        return false;
      }

      await carregarAgendamentos();
      toast.success('Agendamento criado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const atualizarAgendamento = async (id: string, dadosAtualizados: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Verificar se é um agendamento online
    if (id.startsWith('online_')) {
      const agendamentoOnlineId = id.replace('online_', '');
      return await confirmarAgendamentoOnline(agendamentoOnlineId);
    }

    setLoading(true);
    try {
      const updates: any = {};
      if (dadosAtualizados.clienteId !== undefined) updates.cliente_id = dadosAtualizados.clienteId;
      if (dadosAtualizados.servicoId !== undefined) updates.servico_id = dadosAtualizados.servicoId;
      if (dadosAtualizados.data !== undefined) updates.data = dadosAtualizados.data;
      if (dadosAtualizados.hora !== undefined) updates.hora = dadosAtualizados.hora;
      if (dadosAtualizados.duracao !== undefined) updates.duracao = dadosAtualizados.duracao;
      if (dadosAtualizados.valor !== undefined) updates.valor = dadosAtualizados.valor;
      if (dadosAtualizados.valorPago !== undefined) updates.valor_pago = dadosAtualizados.valorPago;
      if (dadosAtualizados.valorDevido !== undefined) updates.valor_devido = dadosAtualizados.valorDevido;
      if (dadosAtualizados.formaPagamento !== undefined) updates.forma_pagamento = dadosAtualizados.formaPagamento;
      if (dadosAtualizados.statusPagamento !== undefined) updates.status_pagamento = dadosAtualizados.statusPagamento;
      if (dadosAtualizados.status !== undefined) updates.status = dadosAtualizados.status;
      if (dadosAtualizados.origem !== undefined) updates.origem = dadosAtualizados.origem;
      if (dadosAtualizados.confirmado !== undefined) updates.confirmado = dadosAtualizados.confirmado;
      if (dadosAtualizados.observacoes !== undefined) updates.observacoes = dadosAtualizados.observacoes || null;

      const { error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao atualizar agendamento:', error);
        toast.error('Erro ao atualizar agendamento');
        return false;
      }

      await carregarAgendamentos();
      toast.success('Agendamento atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const excluirAgendamento = async (id: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Verificar se é um agendamento online
    if (id.startsWith('online_')) {
      const agendamentoOnlineId = id.replace('online_', '');
      setLoading(true);
      try {
        console.log('🗑️ Executando delete de agendamento online no Supabase...', agendamentoOnlineId);
        const { error } = await supabase
          .from('agendamentos_online')
          .delete()
          .eq('id', agendamentoOnlineId);

        if (error) {
          console.error('❌ Erro do Supabase ao excluir agendamento online:', error);
          toast.error('Erro ao excluir agendamento online: ' + error.message);
          return false;
        }

        console.log('✅ Agendamento online excluído com sucesso no banco');
        await carregarAgendamentos();
        toast.success('Agendamento online excluído com sucesso!');
        return true;
      } catch (error) {
        console.error('❌ Erro ao excluir agendamento online:', error);
        toast.error('Erro ao excluir agendamento online');
        return false;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    try {
      console.log('🗑️ Executando delete de agendamento no Supabase...', id);
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro do Supabase ao excluir agendamento:', error);
        toast.error('Erro ao excluir agendamento: ' + error.message);
        return false;
      }

      console.log('✅ Agendamento excluído com sucesso no banco');
      await carregarAgendamentos();
      toast.success('Agendamento excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (id: string) => {
    if (id.startsWith('online_')) {
      return await excluirAgendamento(id);
    }
    return await atualizarAgendamento(id, { status: 'cancelado' });
  };

  return {
    loading,
    agendamentos: agendamentosPaginados,
    agendamentosFiltrados,
    todosAgendamentos: agendamentosCombinados,
    filtros,
    setFiltros,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    criarAgendamento,
    atualizarAgendamento,
    excluirAgendamento,
    cancelarAgendamento,
    recarregar: carregarAgendamentos,
    converterAgendamentoOnlineParaRegular,
    confirmarAgendamentoOnline,
    verificarHorarioDisponivel
  };
}