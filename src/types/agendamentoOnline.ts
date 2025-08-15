export interface AgendamentoOnlineForm {
  nomeCompleto: string;
  email: string;
  telefone: string;
  servicoId: string;
  data: string;
  horario: string;
  observacoes?: string;
}

export interface HorarioDisponivel {
  horario: string;
  disponivel: boolean;
}

export interface ServicoPublico {
  id: string;
  nome: string;
  duracao: number;
  valor: number;
  descricao?: string;
}

export interface ClientePublico {
  nomeCompleto: string;
  telefone: string;
}