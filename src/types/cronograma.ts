export interface Cronograma {
  id: string;
  clienteId: string;
  servicoId: string;
  titulo: string;
  descricao: string;
  diaSemana: number; // 0=domingo, 1=segunda, etc
  horaInicio: string;
  horaFim: string;
  recorrencia: string; // semanal, quinzenal, mensal
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronogramaFormData {
  clienteId: string;
  servicoId: string;
  titulo: string;
  descricao?: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  recorrencia: string;
  dataInicio: string;
  dataFim?: string;
  ativo?: boolean;
  observacoes?: string;
}

export interface Retorno {
  id: string;
  cronogramaId: string;
  clienteId: string;
  servicoId: string;
  dataRetorno: string;
  horaRetorno: string;
  status: 'pendente' | 'agendado' | 'concluido' | 'cancelado';
  observacoes?: string;
  agendamentoId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronogramaWithRetornos extends Cronograma {
  retornos_pendentes: number;
  proximo_retorno?: string;
}