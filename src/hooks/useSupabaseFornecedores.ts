import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Fornecedor, NovoFornecedor } from '@/types/fornecedor';
import { toast } from 'sonner';

export function useSupabaseFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFornecedores = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar fornecedores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createFornecedor = async (fornecedor: NovoFornecedor) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('fornecedores')
        .insert([{ ...fornecedor, user_id: user.id }]);

      if (error) throw error;
      toast.success('Fornecedor cadastrado com sucesso!');
      await loadFornecedores();
    } catch (error: any) {
      toast.error('Erro ao cadastrar fornecedor: ' + error.message);
      throw error;
    }
  };

  const updateFornecedor = async (id: string, fornecedor: Partial<NovoFornecedor>) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', id);

      if (error) throw error;
      toast.success('Fornecedor atualizado com sucesso!');
      await loadFornecedores();
    } catch (error: any) {
      toast.error('Erro ao atualizar fornecedor: ' + error.message);
      throw error;
    }
  };

  const deleteFornecedor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fornecedor excluído com sucesso!');
      await loadFornecedores();
    } catch (error: any) {
      toast.error('Erro ao excluir fornecedor: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  return {
    fornecedores,
    loading,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    recarregar: loadFornecedores,
  };
}
