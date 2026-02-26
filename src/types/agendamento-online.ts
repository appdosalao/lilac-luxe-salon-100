export interface AgendamentoOnlineData {
  nome_completo: string;
  email: string;
  telefone: string;
  servico_id: string;
  data: string;
  horario: string;
  observacoes?: string;
}

export interface ServicoDisponivel {
  id: string;
  nome: string;
  valor: number;
  duracao: number;
  descricao?: string;
}

export interface HorarioDisponivel {
  horario: string;
  disponivel: boolean;
}

export interface FormErrors {
  nome_completo?: string;
  email?: string;
  telefone?: string;
  servico_id?: string;
  data?: string;
  horario?: string;
}