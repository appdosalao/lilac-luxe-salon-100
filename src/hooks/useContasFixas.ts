import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { ContaFixa, NovaContaFixa, CategoriaFinanceira, NovaCategoriaFinanceira } from '@/types/contaFixa';

export function useContasFixas() {
  const { usuario } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);

  // Placeholder functions - funcionalidade será implementada futuramente
  const loadContasFixas = useCallback(async () => {
    // TODO: Implementar carregamento das contas fixas via Supabase
    console.log('loadContasFixas - placeholder');
  }, [usuario]);

  const loadCategorias = useCallback(async () => {
    // TODO: Implementar carregamento das categorias via Supabase  
    console.log('loadCategorias - placeholder');
  }, [usuario]);

  const createContaFixa = useCallback(async (novaContaData: NovaContaFixa) => {
    // TODO: Implementar criação de conta fixa via Supabase
    console.log('createContaFixa - placeholder', novaContaData);
    return false;
  }, [usuario]);

  const updateContaFixa = useCallback(async (contaId: string, updates: Partial<NovaContaFixa>) => {
    // TODO: Implementar atualização de conta fixa via Supabase
    console.log('updateContaFixa - placeholder', contaId, updates);
    return false;
  }, [usuario]);

  const deleteContaFixa = useCallback(async (contaId: string) => {
    // TODO: Implementar exclusão de conta fixa via Supabase
    console.log('deleteContaFixa - placeholder', contaId);
    return false;
  }, []);

  const pagarContaFixa = useCallback(async (contaId: string, valorPago: number, observacoes?: string) => {
    // TODO: Implementar pagamento de conta fixa via Supabase
    console.log('pagarContaFixa - placeholder', contaId, valorPago, observacoes);
    return false;
  }, []);

  const createCategoriaFinanceira = useCallback(async (categoriaData: NovaCategoriaFinanceira) => {
    // TODO: Implementar criação de categoria via Supabase
    console.log('createCategoriaFinanceira - placeholder', categoriaData);
    return false;
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      loadContasFixas();
      loadCategorias();
    }
  }, [usuario, loadContasFixas, loadCategorias]);

  // Adicionar propriedades em falta para compatibilidade
  const criarContaFixa = createContaFixa;
  const atualizarContaFixa = updateContaFixa;
  const removerContaFixa = deleteContaFixa;
  const toggleAtiva = useCallback(async (contaId: string) => {
    console.log('toggleAtiva - placeholder', contaId);
    return false;
  }, []);
  const estatisticas = { totalAtivas: 0, totalPagas: 0, totalPendente: 0 };

  return {
    loading,
    contasFixas,
    categorias,
    createContaFixa,
    updateContaFixa,
    deleteContaFixa,
    pagarContaFixa,
    createCategoriaFinanceira,
    loadContasFixas,
    loadCategorias,
    criarContaFixa,
    atualizarContaFixa,
    removerContaFixa,
    toggleAtiva,
    estatisticas,
  };
}
