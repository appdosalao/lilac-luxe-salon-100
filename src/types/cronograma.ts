export interface Cronograma {
  id_cronograma: string;
  cliente_id: string;
  cliente_nome: string;
  tipo_servico: string;
  servico_id: string;
  data_inicio: string;
  hora_inicio: string;
  duracao_minutos: number;
  recorrencia: 'Semanal' | 'Quinzenal' | 'Mensal' | 'Personalizada';
  intervalo_dias?: number; // Para recorrência personalizada
  observacoes?: string;
  status: 'ativo' | 'cancelado' | 'concluido';
  created_at: string;
  updated_at: string;
}

export interface Retorno {
  id_retorno: string;
  id_cliente: string;
  id_cronograma: string;
  data_retorno: string;
  status: 'Pendente' | 'Realizado' | 'Cancelado';
  id_agendamento_retorno?: string;
  created_at: string;
  updated_at: string;
}

export interface CronogramaWithRetornos extends Cronograma {
  retornos_pendentes: number;
  proximo_retorno?: string;
}