import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CategoriasProduto, NovaCategoria } from '@/types/categoria';
import { toast } from 'sonner';

export function useSupabaseCategorias() {
  const [categorias, setCategorias] = useState<CategoriasProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('*')
        .eq('user_id', user.id)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategorias((data || []) as CategoriasProduto[]);
    } catch (error: any) {
      toast.error('Erro ao carregar categorias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (categoria: NovaCategoria) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('categorias_produtos')
        .insert([{ 
          ...categoria,
          user_id: user.id,
        }]);

      if (error) throw error;
      toast.success('Categoria criada com sucesso!');
      await loadCategorias();
    } catch (error: any) {
      toast.error('Erro ao criar categoria: ' + error.message);
      throw error;
    }
  };

  const updateCategoria = async (id: string, categoria: Partial<NovaCategoria>) => {
    try {
      const { error } = await supabase
        .from('categorias_produtos')
        .update(categoria)
        .eq('id', id);

      if (error) throw error;
      toast.success('Categoria atualizada com sucesso!');
      await loadCategorias();
    } catch (error: any) {
      toast.error('Erro ao atualizar categoria: ' + error.message);
      throw error;
    }
  };

  const deleteCategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorias_produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Categoria excluída com sucesso!');
      await loadCategorias();
    } catch (error: any) {
      toast.error('Erro ao excluir categoria: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  return {
    categorias,
    loading,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    recarregar: loadCategorias,
  };
}
