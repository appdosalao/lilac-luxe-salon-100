export interface Usuario {
  id: string;
  nome_completo: string;
  nome_personalizado_app: string;
  email: string;
  telefone: string;
  tema_preferencia: 'feminino' | 'masculino';
  created_at: string;
  updated_at: string;
  plan_type: 'mensal' | 'vitalicio' | null;
  is_active: boolean;
  payment_status: 'trial' | 'active' | 'overdue' | 'cancelled' | 'pending' | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  plan_expires_at: string | null;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
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
  refreshProfile: () => Promise<void>;
}
