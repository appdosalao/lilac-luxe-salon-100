export interface Cliente {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  servicoFrequente: string;
  ultimaVisita: Date;
  observacoes?: string;
  historicoServicos: HistoricoServico[];
}

export interface HistoricoServico {
  id: string;
  data: Date;
  servico: string;
  valor: number;
}

export interface ClienteFormData {
  nomeCompleto: string;
  email: string;
  telefone: string;
  servicoFrequente: string;
  ultimaVisita: Date;
  observacoes?: string;
}