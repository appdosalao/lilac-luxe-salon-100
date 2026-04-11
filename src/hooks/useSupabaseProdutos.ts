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

      // Sanitizar IDs vazios para null
      const produtoSanitizado = {
        ...produto,
        user_id: user.id,
        estoque_atual: 0,
        categoria_id: produto.categoria_id === '' || produto.categoria_id === 'none' ? null : produto.categoria_id,
        fornecedor_id: produto.fornecedor_id === '' ? null : produto.fornecedor_id,
      };

      const { error } = await supabase
        .from('produtos')
        .insert([produtoSanitizado]);

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
      // Sanitizar IDs vazios para null
      const updates: any = { ...produto };
      if (updates.categoria_id === '' || updates.categoria_id === 'none') updates.categoria_id = null;
      if (updates.fornecedor_id === '') updates.fornecedor_id = null;

      const { error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Produto atualizado com sucesso!');
      await loadProdutos();
    } catch (error: any) {
      toast.error('Erro ao atualizar produto: ' + error.message);
      throw error;
    }
  };

  const uploadImagem = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('produtos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error('Erro ao fazer upload da imagem: ' + error.message);
      return null;
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
    uploadImagem,
    movimentarEstoque,
    recarregar: loadProdutos,
  };
}
