export interface Usuario {
  id: string;
  nome_completo: string;
  nome_personalizado_app: string;
  email: string;
  telefone: string;
  created_at: string;
  updated_at: string;
}

export interface UsuarioCadastro {
  nome_personalizado_app: string;
  nome_completo: string;
  email: string;
  telefone: string;
  senha: string;
  confirmar_senha: string;
}

export interface UsuarioLogin {
  email: string;
  senha: string;
}

export interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}