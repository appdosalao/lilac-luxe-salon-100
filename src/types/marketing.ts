export type TipoCampanha = 'email' | 'sms' | 'whatsapp' | 'notificacao';
export type StatusCampanha = 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'cancelada';
export type SegmentoClientes = 'todos' | 'ativos' | 'inativos' | 'aniversariantes' | 'fidelidade' | 'personalizado';

export interface CampanhaMarketing {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  tipo: TipoCampanha;
  status: StatusCampanha;
  segmento_clientes: SegmentoClientes;
  filtros: Record<string, unknown>;
  mensagem: string;
  data_agendamento?: string;
  data_envio?: string;
  total_destinatarios: number;
  total_enviados: number;
  total_erros: number;
  metricas: {
    aberturas: number;
    cliques: number;
    conversoes: number;
  };
  created_at: string;
  updated_at: string;
}

export type GatilhoAutomacao = 
  | 'novo_agendamento' 
  | 'agendamento_confirmado' 
  | 'agendamento_cancelado' 
  | 'aniversario' 
  | 'ausencia_dias' 
  | 'primeira_visita' 
  | 'fidelidade_nivel';

export interface AutomacaoMarketing {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  gatilho: GatilhoAutomacao;
  condicoes: Record<string, unknown>;
  acoes: Record<string, unknown>;
  ativo: boolean;
  total_execucoes: number;
  ultima_execucao?: string;
  created_at: string;
  updated_at: string;
}

export interface LogAutomacao {
  id: string;
  automacao_id: string;
  cliente_id?: string;
  status: 'sucesso' | 'erro' | 'ignorado';
  mensagem?: string;
  dados: Record<string, unknown>;
  created_at: string;
}


export interface DestinatarioCampanha {
  id: string;
  campanha_id: string;
  cliente_id: string;
  status: 'pendente' | 'enviado' | 'erro' | 'aberto' | 'clicado';
  data_envio?: string;
  data_abertura?: string;
  data_clique?: string;
  erro_mensagem?: string;
  created_at: string;
}
