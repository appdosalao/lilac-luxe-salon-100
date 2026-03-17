export interface Usuario {
  id: string;
  nome_completo: string;
  nome_personalizado_app: string;
  email: string;
  telefone: string;
  tema_preferencia: 'feminino' | 'masculino';
  created_at: string;
  updated_at: string;
  planType: 'mensal' | 'vitalicio' | null;
  isActive: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  planExpiresAt: string | null;
  asaasCustomerId: string | null;
  asaasSubscriptionId: string | null;
  paymentStatus: 'trial' | 'active' | 'overdue' | 'cancelled' | 'pending' | null;
}

export interface UsuarioCadastro {
  nome_personalizado_app: string;
  nome_completo: string;
  email: string;
  telefone: string;
  tema_preferencia: 'feminino' | 'masculino';
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
