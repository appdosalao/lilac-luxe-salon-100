import { useState, useMemo, useEffect } from 'react';
import { useSupabaseLancamentos } from './useSupabaseLancamentos';
import { useSupabaseContasFixas } from './useSupabaseContasFixas';
import { LancamentoFiltros } from '@/types/lancamento';

export function useLancamentos() {
  const [filtros, setFiltros] = useState<LancamentoFiltros>({});
  const supabaseHook = useSupabaseLancamentos();
  const { categorias } = useSupabaseContasFixas();
  
  // Recarregar dados quando os filtros de data mudarem
  useEffect(() => {
    if (filtros.dataInicio || filtros.dataFim) {
      const dataInicioStr = filtros.dataInicio?.toISOString().split('T')[0];
      const dataFimStr = filtros.dataFim?.toISOString().split('T')[0];
      supabaseHook.loadLancamentos(dataInicioStr, dataFimStr);
    } else if (filtros.mes !== undefined && filtros.ano !== undefined) {
      const dataInicio = new Date(filtros.ano, filtros.mes, 1).toISOString().split('T')[0];
      const dataFim = new Date(filtros.ano, filtros.mes + 1, 0).toISOString().split('T')[0];
      supabaseHook.loadLancamentos(dataInicio, dataFim);
    }
  }, [filtros.dataInicio, filtros.dataFim, filtros.mes, filtros.ano]);

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
    recarregar: supabaseHook.loadLancamentos,
  };
}