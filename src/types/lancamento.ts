export interface Lancamento {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: Date;
  descricao: string;
  categoria?: string;
  origemId?: string;
  origemTipo?: 'agendamento' | 'conta_fixa' | 'manual' | 'compra_produto' | 'venda_produto';
  clienteId?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NovoLancamento {
  tipo: 'entrada' | 'saida';
  valor: number;
  data: Date;
  descricao: string;
  categoria?: string;
  origemId?: string;
  origemTipo?: 'agendamento' | 'conta_fixa' | 'manual' | 'compra_produto' | 'venda_produto';
  clienteId?: string;
}

export interface LancamentoFiltros {
  tipo?: 'entrada' | 'saida' | 'todos';
  categoria?: string;
  dataInicio?: Date;
  dataFim?: Date;
  mes?: number;
  ano?: number;
}

export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  lucro: number;
  valorEmAberto: number; // devedores
  contasAPagar: number; // contas fixas em aberto
}