export type TipoCategoria = 'revenda' | 'uso_profissional' | 'consumo';

export interface CategoriasProduto {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoCategoria;
  cor?: string;
  icone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovaCategoria {
  nome: string;
  tipo: TipoCategoria;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}
