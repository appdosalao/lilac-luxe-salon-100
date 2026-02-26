import { Lancamento } from './lancamento';
import { ContaFixa } from './contaFixa';
import { Agendamento } from './agendamento';

export type PeriodoRelatorio = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'personalizado';

export interface FiltrosRelatorio {
  periodo: PeriodoRelatorio;
  dataInicio?: Date;
  dataFim?: Date;
  categoria?: string;
  servico?: string;
  incluirContasFixas: boolean;
  incluirAgendamentos: boolean;
  incluirLancamentos: boolean;
}

export interface DadosRelatorio {
  totalEntradas: number;
  totalSaidas: number;
  lucroLiquido: number;
  contasAPagar: number;
  contasRecebidas: number;
  agendamentosPagos: number;
  agendamentosAbertos: number;
  contasFixasPagas: number;
  contasFixasAbertas: number;
  servicosMaisVendidos: ServicoVendido[];
  categoriasMaisLucrativas: CategoriaLucro[];
  evolucaoMensal: EvolucaoFinanceira[];
}

export interface ServicoVendido {
  nome: string;
  quantidade: number;
  valorTotal: number;
  percentual: number;
}

export interface CategoriaLucro {
  categoria: string;
  entradas: number;
  saidas: number;
  lucro: number;
  percentual: number;
}

export interface EvolucaoFinanceira {
  periodo: string;
  entradas: number;
  saidas: number;
  lucro: number;
}

export interface RelatorioExportacao {
  titulo: string;
  periodo: string;
  dadosResumo: DadosRelatorio;
  dadosDetalhados: {
    lancamentos: Lancamento[];
    contasFixas: ContaFixa[];
    agendamentos: Agendamento[];
  };
  geradoEm: Date;
}