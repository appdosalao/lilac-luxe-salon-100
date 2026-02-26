import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Produto, NovoProduto } from '@/types/produto';
import { toast } from 'sonner';

export function useSupabaseProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const loadProdutos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
      setErro(null);
    } catch (error: any) {
      setErro(error.message || 'Erro ao carregar produtos');
      toast.error('Erro ao carregar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProduto = async (produto: NovoProduto) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('produtos')
        .insert([{ 
          ...produto,
          user_id: user.id,
          estoque_atual: 0,
        }]);

      if (error) throw error;
      toast.success('Produto cadastrado com sucesso!');
      await loadProdutos();
    } catch (error: any) {
      toast.error('Erro ao cadastrar produto: ' + error.message);
      throw error;
    }
  };

  const updateProduto = async (id: string, produto: Partial<NovoProduto>) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      await loadProdutos();
    } catch (error: any) {
      toast.error('Erro ao atualizar produto: ' + error.message);
      throw error;
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      // Soft delete: marcar como inativo em vez de excluir
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto desativado com sucesso!');
      await loadProdutos();
    } catch (error: any) {
      toast.error('Erro ao desativar produto: ' + error.message);
      throw error;
    }
  };

  const movimentarEstoque = async (params: {
    produto_id: string;
    tipo: 'entrada' | 'saida' | 'ajuste' | 'perda';
    quantidade: number;
    motivo?: string;
    valor_unitario?: number;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      if (params.quantidade <= 0) throw new Error('Quantidade deve ser positiva');

      const { error } = await supabase
        .from('movimentacoes_estoque')
        .insert([{
          user_id: user.id,
          produto_id: params.produto_id,
          tipo: params.tipo,
          quantidade: params.quantidade,
          valor_unitario: params.valor_unitario ?? 0,
          valor_total: (params.valor_unitario ?? 0) * params.quantidade,
          motivo: params.motivo || (params.tipo === 'ajuste' ? 'Ajuste manual' : params.tipo === 'perda' ? 'Perda' : 'Movimentação manual'),
          origem_tipo: 'ajuste_manual'
        }]);

      if (error) throw error;
      toast.success('Movimentação registrada');
      await loadProdutos();
      return true;
    } catch (error: any) {
      toast.error('Erro ao movimentar estoque: ' + error.message);
      return false;
    }
  };

  useEffect(() => {
    loadProdutos();
  }, []);

  return {
    produtos,
    loading,
    erro,
    createProduto,
    updateProduto,
    deleteProduto,
    movimentarEstoque,
    recarregar: loadProdutos,
  };
}
