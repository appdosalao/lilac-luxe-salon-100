import { useState, useMemo } from 'react';
import { LancamentoFiltros, ResumoFinanceiro, NovoLancamento } from '@/types/lancamento';
import { useDatabase } from '@/hooks/useDatabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { db } from '@/lib/database';

export function useLancamentos() {
  const { lancamentos: todosLancamentos, createLancamento, loading, agendamentos } = useDatabase();
  const [filtros, setFiltros] = useState<LancamentoFiltros>({});
  
  const { usuario } = useSupabaseAuth();
  const userId = usuario?.id;

  const lancamentosFiltrados = useMemo(() => {
    let resultado = [...todosLancamentos];

    if (filtros.tipo && filtros.tipo !== 'todos') {
      resultado = resultado.filter(l => l.tipo === filtros.tipo);
    }

    if (filtros.categoria) {
      resultado = resultado.filter(l => 
        l.categoria?.toLowerCase().includes(filtros.categoria!.toLowerCase())
      );
    }

    if (filtros.mes && filtros.ano) {
      resultado = resultado.filter(l => {
        const dataLancamento = new Date(l.data);
        return dataLancamento.getMonth() === filtros.mes! - 1 && 
               dataLancamento.getFullYear() === filtros.ano;
      });
    }

    if (filtros.dataInicio) {
      resultado = resultado.filter(l => l.data >= filtros.dataInicio!);
    }

    if (filtros.dataFim) {
      resultado = resultado.filter(l => l.data <= filtros.dataFim!);
    }

    return resultado.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [todosLancamentos, filtros]);

  const resumoFinanceiro = useMemo((): ResumoFinanceiro => {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    const lancamentosDoMes = todosLancamentos.filter(l => {
      const dataLancamento = new Date(l.data);
      return dataLancamento.getMonth() === mesAtual && 
             dataLancamento.getFullYear() === anoAtual;
    });

    const totalEntradas = lancamentosDoMes
      .filter(l => l.tipo === 'entrada')
      .reduce((total, l) => total + l.valor, 0);

    const totalSaidas = lancamentosDoMes
      .filter(l => l.tipo === 'saida')
      .reduce((total, l) => total + l.valor, 0);

    // Calcular valor em aberto (agendamentos fiados/parciais)
    const valorEmAberto = agendamentos
      .filter(a => a.statusPagamento === 'em_aberto' || a.statusPagamento === 'parcial')
      .reduce((total, a) => total + (a.valorDevido || 0), 0);

    // Calcular contas a pagar (contas fixas em aberto)
    const contasAPagar = userId ? db.getContasAPagar(userId, mesAtual + 1, anoAtual) : 0;

    return {
      totalEntradas,
      totalSaidas,
      lucro: totalEntradas - totalSaidas,
      valorEmAberto,
      contasAPagar,
    };
  }, [todosLancamentos, agendamentos, userId]);

  const categorias = useMemo(() => {
    const categoriasUnicas = new Set(
      todosLancamentos
        .map(l => l.categoria)
        .filter(Boolean)
    );
    return Array.from(categoriasUnicas) as string[];
  }, [todosLancamentos]);

  const adicionarLancamento = async (novoLancamento: NovoLancamento) => {
    return await createLancamento(novoLancamento);
  };

  const atualizarLancamento = async (id: string, dadosAtualizados: Partial<NovoLancamento>) => {
    // TODO: Implementar updateLancamento no useDatabase quando necessário
    console.warn('Atualização de lançamentos não implementada');
    return false;
  };

  const removerLancamento = async (id: string) => {
    // TODO: Implementar deleteLancamento no useDatabase quando necessário  
    console.warn('Remoção de lançamentos não implementada');
    return false;
  };

  return {
    loading,
    lancamentos: lancamentosFiltrados,
    resumoFinanceiro,
    categorias,
    filtros,
    setFiltros,
    adicionarLancamento,
    atualizarLancamento,
    removerLancamento,
  };
}