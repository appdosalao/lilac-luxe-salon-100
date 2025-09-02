import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContaFixa, NovaContaFixa, CategoriaFinanceira } from '@/types/contaFixa';

export const useSupabaseContasFixas = () => {
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar contas fixas
  const loadContasFixas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_fixas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedContas: ContaFixa[] = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        valor: Number(item.valor),
        dataVencimento: item.data_vencimento,
        categoria: item.categoria,
        status: item.status as 'pago' | 'em_aberto',
        observacoes: item.observacoes,
        repetir: item.repetir,
        frequencia: item.frequencia as 'mensal' | 'trimestral' | 'semestral' | 'anual',
        proximoVencimento: item.proximo_vencimento,
        ativa: item.ativa,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      }));

      setContasFixas(formattedContas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contas fixas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias
  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .order('nome');

      if (error) throw error;

      const formattedCategorias: CategoriaFinanceira[] = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        tipo: item.tipo as 'receita' | 'despesa' | 'investimento',
        cor: item.cor,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
      }));

      setCategorias(formattedCategorias);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    }
  };

  // Criar conta fixa
  const createContaFixa = async (conta: NovaContaFixa) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Calcular próximo vencimento
      const hoje = new Date();
      let proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), conta.dataVencimento);
      if (proximoVencimento <= hoje) {
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
      }

      const { data, error } = await supabase
        .from('contas_fixas')
        .insert({
          user_id: user.user.id,
          nome: conta.nome,
          valor: conta.valor,
          data_vencimento: conta.dataVencimento,
          categoria: conta.categoria,
          observacoes: conta.observacoes,
          repetir: conta.repetir,
          frequencia: conta.frequencia,
          proximo_vencimento: proximoVencimento.toISOString().split('T')[0],
          ativa: conta.ativa ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      await loadContasFixas();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta fixa');
      throw err;
    }
  };

  // Atualizar conta fixa
  const updateContaFixa = async (id: string, updates: Partial<ContaFixa>) => {
    try {
      const updateData: any = {};
      
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.valor !== undefined) updateData.valor = updates.valor;
      if (updates.dataVencimento !== undefined) updateData.data_vencimento = updates.dataVencimento;
      if (updates.categoria) updateData.categoria = updates.categoria;
      if (updates.status) updateData.status = updates.status;
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
      if (updates.repetir !== undefined) updateData.repetir = updates.repetir;
      if (updates.frequencia) updateData.frequencia = updates.frequencia;
      if (updates.proximoVencimento) updateData.proximo_vencimento = updates.proximoVencimento;
      if (updates.ativa !== undefined) updateData.ativa = updates.ativa;

      const { error } = await supabase
        .from('contas_fixas')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await loadContasFixas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta fixa');
      throw err;
    }
  };

  // Deletar conta fixa
  const deleteContaFixa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contas_fixas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadContasFixas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar conta fixa');
      throw err;
    }
  };

  // Criar categoria
  const createCategoria = async (categoria: { nome: string; tipo: 'receita' | 'despesa' | 'investimento'; cor?: string }) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('categorias_financeiras')
        .insert({
          user_id: user.user.id,
          nome: categoria.nome,
          tipo: categoria.tipo,
          cor: categoria.cor,
        })
        .select()
        .single();

      if (error) throw error;
      await loadCategorias();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria');
      throw err;
    }
  };

  useEffect(() => {
    loadContasFixas();
    loadCategorias();

    // Setup real-time subscriptions
    const channel = supabase
      .channel('contas-fixas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contas_fixas'
        },
        () => {
          loadContasFixas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categorias_financeiras'
        },
        () => {
          loadCategorias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    contasFixas,
    categorias,
    loading,
    error,
    createContaFixa,
    updateContaFixa,
    deleteContaFixa,
    createCategoria,
    loadContasFixas,
    loadCategorias,
  };
};