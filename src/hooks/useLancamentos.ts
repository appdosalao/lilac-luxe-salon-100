import { useState, useMemo } from 'react';
import { useSupabaseLancamentos } from './useSupabaseLancamentos';
import { useSupabaseContasFixas } from './useSupabaseContasFixas';
import { LancamentoFiltros } from '@/types/lancamento';

export function useLancamentos() {
  const [filtros, setFiltros] = useState<LancamentoFiltros>({});
  const supabaseHook = useSupabaseLancamentos();
  const { categorias } = useSupabaseContasFixas();
  
  // Aplicar filtros aos lançamentos
  const lancamentosFiltrados = supabaseHook.filterLancamentos(filtros);
  
  // Calcular resumo financeiro
  const resumoFinanceiro = useMemo(() => {
    return supabaseHook.calculateResumoFinanceiro();
  }, [supabaseHook]);
  
  return {
    ...supabaseHook,
    lancamentos: lancamentosFiltrados,
    filtros,
    setFiltros,
    resumoFinanceiro,
    categorias,
    // Funções com nomes compatíveis
    criarLancamento: supabaseHook.createLancamento,
    atualizarLancamento: supabaseHook.updateLancamento,
    removerLancamento: supabaseHook.deleteLancamento,
    adicionarLancamento: supabaseHook.createLancamento, // Alias para compatibilidade
    calcularResumo: supabaseHook.calculateResumoFinanceiro,
    criarLancamentoDeAgendamento: supabaseHook.createLancamentoFromAgendamento,
    criarLancamentoDeContaFixa: supabaseHook.createLancamentoFromContaFixa,
    recarregar: supabaseHook.loadLancamentos,
  };
}