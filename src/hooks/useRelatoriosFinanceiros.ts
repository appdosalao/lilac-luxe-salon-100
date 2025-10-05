import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiltrosRelatorio, DadosRelatorio, PeriodoRelatorio, ServicoVendido, CategoriaLucro, EvolucaoFinanceira } from '@/types/relatorio';
import { Lancamento } from '@/types/lancamento';
import { ContaFixa } from '@/types/contaFixa';
import { Agendamento } from '@/types/agendamento';

export function useRelatoriosFinanceiros(
  lancamentos: Lancamento[],
  contasFixas: ContaFixa[],
  agendamentos: Agendamento[]
) {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodo: 'mensal',
    incluirContasFixas: true,
    incluirAgendamentos: true,
    incluirLancamentos: true,
  });

  // Calcular intervalo de datas baseado no período
  const intervaloData = useMemo(() => {
    const hoje = new Date();
    
    switch (filtros.periodo) {
      case 'semanal':
        return {
          inicio: startOfWeek(hoje, { locale: ptBR }),
          fim: endOfWeek(hoje, { locale: ptBR })
        };
      case 'mensal':
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje)
        };
      case 'trimestral':
        return {
          inicio: startOfQuarter(hoje),
          fim: endOfQuarter(hoje)
        };
      case 'semestral':
        const inicioSemestre = hoje.getMonth() < 6 
          ? new Date(hoje.getFullYear(), 0, 1)
          : new Date(hoje.getFullYear(), 6, 1);
        const fimSemestre = hoje.getMonth() < 6
          ? new Date(hoje.getFullYear(), 5, 30)
          : new Date(hoje.getFullYear(), 11, 31);
        return {
          inicio: inicioSemestre,
          fim: fimSemestre
        };
      case 'anual':
        return {
          inicio: startOfYear(hoje),
          fim: endOfYear(hoje)
        };
      case 'personalizado':
        return {
          inicio: filtros.dataInicio || startOfMonth(hoje),
          fim: filtros.dataFim || endOfMonth(hoje)
        };
      default:
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje)
        };
    }
  }, [filtros.periodo, filtros.dataInicio, filtros.dataFim]);

  // Filtrar dados por período
  const dadosFiltrados = useMemo(() => {
    const lancamentosFiltrados = filtros.incluirLancamentos 
      ? lancamentos.filter(l => {
          const dataLancamento = new Date(l.data);
          return isWithinInterval(dataLancamento, { start: intervaloData.inicio, end: intervaloData.fim });
        })
      : [];

    const contasFixasFiltradas = filtros.incluirContasFixas
      ? contasFixas.filter(c => {
          if (!c.proximoVencimento) return false;
          const dataVencimento = new Date(c.proximoVencimento);
          return isWithinInterval(dataVencimento, { start: intervaloData.inicio, end: intervaloData.fim });
        })
      : [];

    const agendamentosFiltrados = filtros.incluirAgendamentos
      ? agendamentos.filter(a => {
          const dataAgendamento = new Date(a.data);
          return isWithinInterval(dataAgendamento, { start: intervaloData.inicio, end: intervaloData.fim });
        })
      : [];

    return {
      lancamentos: lancamentosFiltrados,
      contasFixas: contasFixasFiltradas,
      agendamentos: agendamentosFiltrados
    };
  }, [lancamentos, contasFixas, agendamentos, intervaloData, filtros]);

  // Calcular dados do relatório
  const dadosRelatorio = useMemo((): DadosRelatorio => {
    const { lancamentos: lancFiltrados, contasFixas: contasFiltradas, agendamentos: agendFiltrados } = dadosFiltrados;

    // Entradas e saídas dos lançamentos
    const totalEntradas = lancFiltrados
      .filter(l => l.tipo === 'entrada')
      .reduce((sum, l) => sum + l.valor, 0);

    const totalSaidas = lancFiltrados
      .filter(l => l.tipo === 'saida')
      .reduce((sum, l) => sum + l.valor, 0);

    // Dados dos agendamentos
    const agendamentosPagos = agendFiltrados
      .filter(a => a.statusPagamento === 'pago')
      .reduce((sum, a) => sum + (a.valorPago || 0), 0);

    const agendamentosAbertos = agendFiltrados
      .filter(a => a.statusPagamento !== 'pago')
      .reduce((sum, a) => sum + a.valorDevido, 0);

    // Dados das contas fixas
    const contasFixasPagas = contasFiltradas
      .filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + c.valor, 0);

    const contasFixasAbertas = contasFiltradas
      .filter(c => c.status !== 'pago')
      .reduce((sum, c) => sum + c.valor, 0);

    // Serviços mais vendidos (baseado nos agendamentos)
    const servicosMap = new Map<string, { quantidade: number; valor: number }>();
    agendFiltrados.forEach(agendamento => {
      // Assumindo que temos o nome do serviço no agendamento ou podemos buscar
      const servicoNome = 'Serviço'; // Aqui você pegaria o nome real do serviço
      const atual = servicosMap.get(servicoNome) || { quantidade: 0, valor: 0 };
      servicosMap.set(servicoNome, {
        quantidade: atual.quantidade + 1,
        valor: atual.valor + agendamento.valor
      });
    });

    const servicosMaisVendidos: ServicoVendido[] = Array.from(servicosMap.entries())
      .map(([nome, dados]) => ({
        nome,
        quantidade: dados.quantidade,
        valorTotal: dados.valor,
        percentual: dados.valor / (totalEntradas + agendamentosPagos) * 100
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);

    // Categorias mais lucrativas
    const categoriasMap = new Map<string, { entradas: number; saidas: number }>();
    lancFiltrados.forEach(lancamento => {
      const categoria = lancamento.categoria || 'Sem categoria';
      const atual = categoriasMap.get(categoria) || { entradas: 0, saidas: 0 };
      
      if (lancamento.tipo === 'entrada') {
        atual.entradas += lancamento.valor;
      } else {
        atual.saidas += lancamento.valor;
      }
      
      categoriasMap.set(categoria, atual);
    });

    const categoriasMaisLucrativas: CategoriaLucro[] = Array.from(categoriasMap.entries())
      .map(([categoria, dados]) => ({
        categoria,
        entradas: dados.entradas,
        saidas: dados.saidas,
        lucro: dados.entradas - dados.saidas,
        percentual: (dados.entradas - dados.saidas) / (totalEntradas - totalSaidas) * 100
      }))
      .sort((a, b) => b.lucro - a.lucro);

    // Evolução mensal (últimos 6 meses)
    const evolucaoMensal: EvolucaoFinanceira[] = [];
    for (let i = 5; i >= 0; i--) {
      const mesAtual = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);
      
      const lancamentosMes = lancamentos.filter(l => {
        const dataLancamento = new Date(l.data);
        return isWithinInterval(dataLancamento, { start: inicioMes, end: fimMes });
      });
      
      const entradasMes = lancamentosMes
        .filter(l => l.tipo === 'entrada')
        .reduce((sum, l) => sum + l.valor, 0);
      
      const saidasMes = lancamentosMes
        .filter(l => l.tipo === 'saida')
        .reduce((sum, l) => sum + l.valor, 0);
      
      evolucaoMensal.push({
        periodo: format(mesAtual, 'MMM/yyyy', { locale: ptBR }),
        entradas: entradasMes,
        saidas: saidasMes,
        lucro: entradasMes - saidasMes
      });
    }

    return {
      totalEntradas: totalEntradas + agendamentosPagos,
      totalSaidas: totalSaidas + contasFixasPagas,
      lucroLiquido: (totalEntradas + agendamentosPagos) - (totalSaidas + contasFixasPagas),
      contasAPagar: contasFixasAbertas,
      contasRecebidas: agendamentosPagos,
      agendamentosPagos,
      agendamentosAbertos,
      contasFixasPagas,
      contasFixasAbertas,
      servicosMaisVendidos,
      categoriasMaisLucrativas,
      evolucaoMensal
    };
  }, [dadosFiltrados, lancamentos]);

  return {
    filtros,
    setFiltros,
    dadosRelatorio,
    intervaloData,
    dadosFiltrados
  };
}