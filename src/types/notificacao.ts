export type TipoNotificacao = 
  | 'novo_agendamento' 
  | 'lembrete_agendamento' 
  | 'retorno_cronograma' 
  | 'despesa_fixa' 
  | 'servico_finalizado';

export interface NotificacaoBase {
  id: string;
  userId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados?: Record<string, any>;
  lida: boolean;
  programadaPara?: string; // ISO date string
  enviadaEm?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface NotificacaoAgendamento extends NotificacaoBase {
  tipo: 'novo_agendamento' | 'lembrete_agendamento';
  dados: {
    agendamentoId: string;
    clienteNome: string;
    servicoNome: string;
    data: string;
    horario: string;
    origem?: 'manual' | 'cronograma' | 'online';
  };
}

export interface NotificacaoRetorno extends NotificacaoBase {
  tipo: 'retorno_cronograma';
  dados: {
    cronogramaId: string;
    clienteNome: string;
    servicoNome: string;
    dataRetorno: string;
  };
}

export interface NotificacaoDespesa extends NotificacaoBase {
  tipo: 'despesa_fixa';
  dados: {
    contaFixaId: string;
    descricao: string;
    valor: number;
    dataVencimento: string;
    diasRestantes: number;
  };
}

export interface NotificacaoServico extends NotificacaoBase {
  tipo: 'servico_finalizado';
  dados: {
    agendamentoId: string;
    clienteNome: string;
    servicoNome: string;
    valor?: number;
  };
}

export type Notificacao = 
  | NotificacaoAgendamento 
  | NotificacaoRetorno 
  | NotificacaoDespesa 
  | NotificacaoServico;

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  pushEnabled: boolean;
  autoHide: boolean;
  hideDelay: number;
  vibrationEnabled: boolean;
}