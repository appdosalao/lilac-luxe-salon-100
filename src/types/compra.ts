export type StatusPagamentoCompra = 'pendente' | 'pago_parcial' | 'pago' | 'vencido';

export interface ItemCompra {
  id: string;
  compra_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  created_at: string;
}

export interface Compra {
  id: string;
  user_id: string;
  fornecedor_id?: string | null;
  numero_nota?: string | null;
  data_compra: string;
  data_vencimento?: string | null;
  valor_total: number;
  valor_pago: number;
  valor_devido: number;
  status_pagamento: string;
  forma_pagamento?: string | null;
  observacoes?: string | null;
  lancamento_id?: string | null;
  created_at: string;
  updated_at: string;
  itens_compra?: ItemCompra[];
}

export interface NovoItemCompra {
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface NovaCompra {
  fornecedor_id?: string;
  numero_nota?: string;
  data_compra: string;
  data_vencimento?: string;
  valor_total: number;
  forma_pagamento?: string;
  observacoes?: string;
  itens: NovoItemCompra[];
}
