import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MovimentacaoEstoque, NovaMovimentacao } from '@/types/estoque';
import { toast } from 'sonner';

export function useSupabaseEstoque() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovimentacoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar movimentações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createMovimentacao = async (movimentacao: NovaMovimentacao) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorTotal = (movimentacao.valor_unitario || 0) * movimentacao.quantidade;

      const { error } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          user_id: user.id,
          produto_id: movimentacao.produto_id,
          tipo: movimentacao.tipo,
          quantidade: movimentacao.quantidade,
          valor_unitario: movimentacao.valor_unitario || 0,
          valor_total: valorTotal,
          motivo: movimentacao.motivo,
          origem_id: movimentacao.origem_id,
          origem_tipo: movimentacao.origem_tipo,
        }]);

      if (error) throw error;
      toast.success('Movimentação registrada com sucesso!');
      await loadMovimentacoes();
    } catch (error: any) {
      toast.error('Erro ao registrar movimentação: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadMovimentacoes();
  }, []);

  return {
    movimentacoes,
    loading,
    createMovimentacao,
    recarregar: loadMovimentacoes,
  };
}
