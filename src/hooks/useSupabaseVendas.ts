import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendaProduto, NovaVenda } from '@/types/venda';
import { toast } from 'sonner';

export function useSupabaseVendas() {
  const [vendas, setVendas] = useState<VendaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVendas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendas_produtos')
        .select('*, itens_venda(*)')
        .eq('user_id', user.id)
        .order('data_venda', { ascending: false });

      if (error) throw error;
      setVendas(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar vendas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createVenda = async (venda: NovaVenda) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const valorTotal = venda.itens.reduce((sum, item) => sum + item.valor_total, 0);

      // Criar venda
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas_produtos')
        .insert([{
          user_id: user.id,
          cliente_id: venda.cliente_id,
          agendamento_id: venda.agendamento_id,
          data_venda: venda.data_venda,
          valor_total: valorTotal,
          status_pagamento: 'pago',
          forma_pagamento: venda.forma_pagamento,
          observacoes: venda.observacoes,
        }])
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Inserir itens
      const itensComVendaId = venda.itens.map(item => ({
        ...item,
        venda_id: vendaData.id,
      }));

      const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensComVendaId);

      if (itensError) throw itensError;

      // Criar movimentações de estoque
      const movimentacoes = venda.itens.map(item => ({
        user_id: user.id,
        produto_id: item.produto_id,
        tipo: 'saida' as const,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        motivo: `Venda ${vendaData.id}`,
        origem_id: vendaData.id,
        origem_tipo: 'venda',
      }));

      const { error: movError } = await supabase
        .from('movimentacoes_estoque')
        .insert(movimentacoes);

      if (movError) throw movError;

      // Criar lançamento financeiro (receita)
      const { error: lancError } = await supabase
        .from('lancamentos')
        .insert([{
          user_id: user.id,
          tipo: 'entrada',
          valor: valorTotal,
          data: venda.data_venda,
          descricao: 'Venda de produtos',
          categoria: 'Venda de Produtos',
          origem_id: vendaData.id,
          origem_tipo: 'venda_produto',
          cliente_id: venda.cliente_id,
        }]);

      if (lancError) throw lancError;

      toast.success('Venda registrada com sucesso!');
      await loadVendas();
    } catch (error: any) {
      toast.error('Erro ao registrar venda: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadVendas();
  }, []);

  return {
    vendas,
    loading,
    createVenda,
    recarregar: loadVendas,
  };
}
