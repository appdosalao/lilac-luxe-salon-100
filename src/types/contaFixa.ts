export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  dataVencimento: number; // dia do mês (1-31)
  categoria: string;
  status: 'pago' | 'em_aberto';
  observacoes?: string;
  repetir: boolean;
  frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  proximoVencimento?: string; // ISO date string
  ativa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NovaContaFixa {
  nome: string;
  valor: number;
  dataVencimento: number;
  categoria: string;
  observacoes?: string;
  repetir: boolean;
  frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  ativa?: boolean;
}

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'receita' | 'despesa' | 'investimento';
  cor?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NovaCategoriaFinanceira {
  nome: string;
  tipo: 'receita' | 'despesa' | 'investimento';
  cor?: string;
}