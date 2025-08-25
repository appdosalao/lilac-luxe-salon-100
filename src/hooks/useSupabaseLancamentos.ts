import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lancamento, NovoLancamento, LancamentoFiltros, ResumoFinanceiro } from '@/types/lancamento';

export const useSupabaseLancamentos = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lançamentos
  const loadLancamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      const formattedLancamentos: Lancamento[] = (data || []).map(item => ({
        id: item.id,
        tipo: item.tipo as 'entrada' | 'saida',
        valor: Number(item.valor),
        data: new Date(item.data),
        descricao: item.descricao,
        categoria: item.categoria,
        origemId: item.origem_id,
        origemTipo: item.origem_tipo as 'agendamento' | 'conta_fixa' | 'manual',
        clienteId: item.cliente_id,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      }));

      setLancamentos(formattedLancamentos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos');
    } finally {
      setLoading(false);
    }
  };

  // Criar lançamento
  const createLancamento = async (lancamento: NovoLancamento) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('lancamentos')
        .insert({
          user_id: user.user.id,
          tipo: lancamento.tipo,
          valor: lancamento.valor,
          data: lancamento.data.toISOString().split('T')[0],
          descricao: lancamento.descricao,
          categoria: lancamento.categoria,
          origem_id: lancamento.origemId,
          origem_tipo: lancamento.origemTipo,
          cliente_id: lancamento.clienteId,
        })
        .select()
        .single();

      if (error) throw error;
      await loadLancamentos();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar lançamento');
      throw err;
    }
  };

  // Atualizar lançamento
  const updateLancamento = async (id: string, updates: Partial<Lancamento>) => {
    try {
      const updateData: any = {};
      
      if (updates.tipo) updateData.tipo = updates.tipo;
      if (updates.valor !== undefined) updateData.valor = updates.valor;
      if (updates.data) updateData.data = updates.data.toISOString().split('T')[0];
      if (updates.descricao) updateData.descricao = updates.descricao;
      if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
      if (updates.origemId !== undefined) updateData.origem_id = updates.origemId;
      if (updates.origemTipo !== undefined) updateData.origem_tipo = updates.origemTipo;
      if (updates.clienteId !== undefined) updateData.cliente_id = updates.clienteId;

      const { error } = await supabase
        .from('lancamentos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await loadLancamentos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lançamento');
      throw err;
    }
  };

  // Deletar lançamento
  const deleteLancamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadLancamentos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar lançamento');
      throw err;
    }
  };

  // Filtrar lançamentos
  const filterLancamentos = (filtros: LancamentoFiltros) => {
    return lancamentos.filter(lancamento => {
      if (filtros.tipo && filtros.tipo !== 'todos' && lancamento.tipo !== filtros.tipo) {
        return false;
      }
      
      if (filtros.categoria && lancamento.categoria !== filtros.categoria) {
        return false;
      }
      
      if (filtros.dataInicio && lancamento.data < filtros.dataInicio) {
        return false;
      }
      
      if (filtros.dataFim && lancamento.data > filtros.dataFim) {
        return false;
      }
      
      if (filtros.mes !== undefined && filtros.ano !== undefined) {
        const lancamentoMes = lancamento.data.getMonth();
        const lancamentoAno = lancamento.data.getFullYear();
        if (lancamentoMes !== filtros.mes || lancamentoAno !== filtros.ano) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Calcular resumo financeiro
  const calculateResumoFinanceiro = (): ResumoFinanceiro => {
    const totalEntradas = lancamentos
      .filter(l => l.tipo === 'entrada')
      .reduce((sum, l) => sum + l.valor, 0);
    
    const totalSaidas = lancamentos
      .filter(l => l.tipo === 'saida')
      .reduce((sum, l) => sum + l.valor, 0);
    
    return {
      totalEntradas,
      totalSaidas,
      lucro: totalEntradas - totalSaidas,
      valorEmAberto: 0, // Seria calculado com base em agendamentos não pagos
      contasAPagar: 0, // Seria calculado com base em contas fixas em aberto
    };
  };

  // Criar lançamento automático de agendamento
  const createLancamentoFromAgendamento = async (agendamentoId: string, valor: number, clienteId: string, descricao: string) => {
    return createLancamento({
      tipo: 'entrada',
      valor,
      data: new Date(),
      descricao,
      categoria: 'Serviços',
      origemId: agendamentoId,
      origemTipo: 'agendamento',
      clienteId,
    });
  };

  // Criar lançamento automático de conta fixa
  const createLancamentoFromContaFixa = async (contaFixaId: string, valor: number, descricao: string, categoria?: string) => {
    return createLancamento({
      tipo: 'saida',
      valor,
      data: new Date(),
      descricao,
      categoria: categoria || 'Contas Fixas',
      origemId: contaFixaId,
      origemTipo: 'conta_fixa',
    });
  };

  useEffect(() => {
    loadLancamentos();

    // Setup real-time subscriptions
    const channel = supabase
      .channel('lancamentos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lancamentos'
        },
        () => {
          loadLancamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    lancamentos,
    loading,
    error,
    createLancamento,
    updateLancamento,
    deleteLancamento,
    filterLancamentos,
    calculateResumoFinanceiro,
    createLancamentoFromAgendamento,
    createLancamentoFromContaFixa,
    loadLancamentos,
  };
};