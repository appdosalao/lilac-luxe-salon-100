export interface Fornecedor {
  id: string;
  user_id: string;
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovoFornecedor {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo?: boolean;
}
