export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste' | 'perda';

export interface MovimentacaoEstoque {
  id: string;
  user_id: string;
  produto_id: string;
  tipo: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  motivo?: string | null;
  origem_id?: string | null;
  origem_tipo?: string | null;
  created_at: string;
}

export interface NovaMovimentacao {
  produto_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  valor_unitario?: number;
  motivo?: string;
  origem_id?: string;
  origem_tipo?: string;
}
