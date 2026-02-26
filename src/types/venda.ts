export type StatusPagamentoVenda = 'pendente' | 'pago';

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface VendaProduto {
  id: string;
  user_id: string;
  cliente_id?: string | null;
  agendamento_id?: string | null;
  data_venda: string;
  valor_total: number;
  status_pagamento: string;
  forma_pagamento?: string | null;
  observacoes?: string | null;
  lancamento_id?: string | null;
  created_at: string;
  updated_at: string;
  itens_venda?: ItemVenda[];
}

export interface NovoItemVenda {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface NovaVenda {
  cliente_id?: string;
  agendamento_id?: string;
  data_venda: string;
  forma_pagamento?: string;
  observacoes?: string;
  itens: NovoItemVenda[];
}
