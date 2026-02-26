export interface Agendamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  servicoId: string;
  servicoNome: string;
  data: string;
  hora: string;
  duracao: number; // em minutos
  valor: number;
  valorPago: number;
  valorDevido: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  statusPagamento: 'pago' | 'parcial' | 'em_aberto';
  status: 'agendado' | 'concluido' | 'cancelado';
  observacoes?: string;
  origem?: 'manual' | 'cronograma' | 'online';
  origem_cronograma: boolean;
  cronogramaId?: string;
  confirmado?: boolean;
  dataPrevistaPagamento?: string; // Data prevista para pagamento (fiado/parcial)
  createdAt: string;
  updatedAt: string;
}

// Removendo interfaces duplicadas - usar as do arquivo específico de tipos

export type AgendamentoStatus = 'agendado' | 'concluido' | 'cancelado';

export interface AgendamentoFiltros {
  data?: string;
  status?: AgendamentoStatus;
  statusPagamento?: 'pago' | 'parcial' | 'em_aberto';
  clienteId?: string;
  busca?: string;
  origem?: 'manual' | 'cronograma' | 'online';
  mes?: string;
}
