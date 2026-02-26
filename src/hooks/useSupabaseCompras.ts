import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Compra, NovaCompra } from '@/types/compra';
import { toast } from 'sonner';

export function useSupabaseCompras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompras = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('compras')
        .select('*, itens_compra(*)')
        .eq('user_id', user.id)
        .order('data_compra', { ascending: false });

      if (error) throw error;
      setCompras(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar compras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createCompra = async (compra: NovaCompra) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Criar compra
      const { data: compraData, error: compraError } = await supabase
        .from('compras')
        .insert([{
          user_id: user.id,
          fornecedor_id: compra.fornecedor_id,
          numero_nota: compra.numero_nota,
          data_compra: compra.data_compra,
          data_vencimento: compra.data_vencimento,
          valor_total: compra.valor_total,
          forma_pagamento: compra.forma_pagamento,
          observacoes: compra.observacoes,
        }])
        .select()
        .single();

      if (compraError) throw compraError;

      // Inserir itens
      const itensComCompraId = compra.itens.map(item => ({
        ...item,
        compra_id: compraData.id,
      }));

      const { error: itensError } = await supabase
        .from('itens_compra')
        .insert(itensComCompraId);

      if (itensError) throw itensError;

      // Criar movimentações de estoque
      const movimentacoes = compra.itens.map(item => ({
        user_id: user.id,
        produto_id: item.produto_id,
        tipo: 'entrada' as const,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        motivo: `Compra ${compraData.numero_nota || compraData.id}`,
        origem_id: compraData.id,
        origem_tipo: 'compra_produto',
      }));

      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert(movimentacoes);

      if (movError) throw movError;

      // Criar lançamento financeiro (despesa)
      const { error: lancError } = await supabase
        .from('lancamentos')
        .insert([{
          user_id: user.id,
          tipo: 'saida',
          valor: compra.valor_total,
          data: compra.data_compra,
          descricao: `Compra de produtos${compra.numero_nota ? ` - Nota ${compra.numero_nota}` : ''}`,
          categoria: 'Compra de Produtos',
          origem_id: compraData.id,
          origem_tipo: 'compra_produto',
        }]);

      if (lancError) throw lancError;

      toast.success('Compra registrada com sucesso!');
      await loadCompras();
    } catch (error: any) {
      toast.error('Erro ao registrar compra: ' + error.message);
      throw error;
    }
  };

  const registrarPagamento = async (compraId: string, valorPago: number) => {
    try {
      const compra = compras.find(c => c.id === compraId);
      if (!compra) throw new Error('Compra não encontrada');

      const novoValorPago = compra.valor_pago + valorPago;

      const { error } = await supabase
        .from('compras')
        .update({ valor_pago: novoValorPago })
        .eq('id', compraId);

      if (error) throw error;
      toast.success('Pagamento registrado com sucesso!');
      await loadCompras();
    } catch (error: any) {
      toast.error('Erro ao registrar pagamento: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadCompras();
  }, []);

  return {
    compras,
    loading,
    createCompra,
    registrarPagamento,
    recarregar: loadCompras,
  };
}
