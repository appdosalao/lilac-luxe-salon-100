export interface Servico {
  id: string;
  nome: string;
  valor: number;
  duracao: number; // em minutos
  descricao?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServicoFiltros {
  busca?: string;
  ordenacao?: 'nome' | 'valor' | 'duracao';
  direcao?: 'asc' | 'desc';
}

export type NovoServico = Omit<Servico, 'id' | 'createdAt' | 'updatedAt'>;