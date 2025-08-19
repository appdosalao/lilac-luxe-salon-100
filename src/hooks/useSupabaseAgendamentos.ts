import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Agendamento, AgendamentoFiltros } from '@/types/agendamento';
import { toast } from 'sonner';

export function useSupabaseAgendamentos() {
  const { user } = useSupabaseAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<AgendamentoFiltros>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  // Carregar agendamentos do Supabase
  const carregarAgendamentos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('data')
        .order('hora');

      if (error) {
        console.error('Erro ao carregar agendamentos:', error);
        toast.error('Erro ao carregar agendamentos');
        return;
      }

      // Para agora, usar dados básicos sem joins
      const agendamentosFormatados = (data || []).map(item => ({
        id: item.id,
        clienteId: item.cliente_id,
        clienteNome: 'Cliente', // Será carregado posteriormente
        servicoId: item.servico_id,
        servicoNome: 'Serviço', // Será carregado posteriormente
        data: item.data,
        hora: item.hora,
        duracao: item.duracao,
        valor: parseFloat(item.valor?.toString() || '0'),
        valorPago: parseFloat(item.valor_pago?.toString() || '0'),
        valorDevido: parseFloat(item.valor_devido?.toString() || '0'),
        formaPagamento: item.forma_pagamento,
        statusPagamento: item.status_pagamento,
        status: item.status,
        origem: item.origem,
        confirmado: item.confirmado,
        observacoes: item.observacoes || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setAgendamentos(agendamentosFormatados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, [user]);

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    let resultado = [...agendamentos];

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
  }, [agendamentos, filtros]);

  // Paginação
  const totalPaginas = Math.ceil(agendamentosFiltrados.length / itensPorPagina);
  const agendamentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return agendamentosFiltrados.slice(inicio, fim);
  }, [agendamentosFiltrados, paginaAtual, itensPorPagina]);

  const criarAgendamento = async (novoAgendamento: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
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

      // Recarregar lista
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

      // Recarregar lista
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

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir agendamento:', error);
        toast.error('Erro ao excluir agendamento');
        return false;
      }

      // Recarregar lista
      await carregarAgendamentos();
      toast.success('Agendamento excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      toast.error('Erro ao excluir agendamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelarAgendamento = async (id: string) => {
    return await atualizarAgendamento(id, { status: 'cancelado' });
  };

  return {
    loading,
    agendamentos: agendamentosPaginados,
    agendamentosFiltrados,
    todosAgendamentos: agendamentos,
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
  };
}