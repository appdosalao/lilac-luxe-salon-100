export type CategoriaProduto = 'uso_profissional' | 'revenda' | 'consumo';

export interface Produto {
  id: string;
  user_id: string;
  fornecedor_id?: string | null;
  nome: string;
  descricao?: string | null;
  codigo_barras?: string | null;
  categoria: string;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  preco_custo: number;
  preco_venda: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovoProduto {
  fornecedor_id?: string;
  nome: string;
  descricao?: string;
  codigo_barras?: string;
  categoria: CategoriaProduto;
  categoria_id?: string;
  estoque_minimo?: number;
  unidade_medida?: string;
  preco_custo: number;
  preco_venda: number;
  ativo?: boolean;
}
