export interface ProgramaFidelidade {
  id: string;
  user_id: string;
  nome: string;
  ativo: boolean;
  pontos_por_real: number;
  expiracao_pontos_dias: number;
  data_inicio: string;
  created_at: string;
  updated_at: string;
}

export interface ClasseFidelidade {
  id: string;
  user_id: string;
  nome: string;
  pontos_minimos: number;
  cor: string;
  beneficios?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PontoFidelidade {
  id: string;
  user_id: string;
  cliente_id: string;
  pontos: number;
  origem: 'agendamento' | 'referencia' | 'bonus' | 'resgate' | 'expiracao';
  origem_id?: string;
  descricao?: string;
  data_ganho: string;
  data_expiracao?: string;
  expirado: boolean;
  created_at: string;
}

export interface Recompensa {
  id: string;
  user_id: string;
  nome: string;
  descricao?: string;
  pontos_necessarios: number;
  tipo: 'desconto_percentual' | 'desconto_valor' | 'servico_gratis';
  valor_desconto: number;
  servico_id?: string;
  classe_id?: string;
  ativo: boolean;
  validade_dias: number;
  created_at: string;
  updated_at: string;
}

export interface HistoricoResgate {
  id: string;
  user_id: string;
  cliente_id: string;
  recompensa_id: string;
  pontos_gastos: number;
  agendamento_id?: string;
  data_resgate: string;
  data_expiracao?: string;
  utilizado: boolean;
  data_utilizacao?: string;
}

export interface NivelFidelidade {
  id: string;
  user_id: string;
  cliente_id: string;
  nivel: string;
  pontos_totais: number;
  pontos_disponiveis: number;
  total_resgates: number;
  data_atualizacao: string;
}

export interface ReferenciaCliente {
  id: string;
  user_id: string;
  cliente_referenciador_id: string;
  codigo_referencia: string;
  cliente_referenciado_id?: string;
  agendamento_id?: string;
  pontos_ganhos: number;
  status: 'pendente' | 'confirmado' | 'expirado';
  created_at: string;
}

export interface SaldoPontos {
  user_id: string;
  cliente_id: string;
  cliente_nome: string;
  pontos_ganhos: number;
  pontos_gastos: number;
  pontos_disponiveis: number;
  total_transacoes: number;
}

export interface EstatisticasFidelidade {
  user_id: string;
  total_clientes_programa: number;
  total_pontos_distribuidos: number;
  total_pontos_resgatados: number;
  clientes_ativos_30d: number;
}

export interface RankingFidelidade {
  user_id: string;
  cliente_id: string;
  cliente_nome: string;
  telefone: string;
  nivel: string;
  pontos_totais: number;
  pontos_disponiveis: number;
  total_resgates: number;
  ranking: number;
}

export interface RecompensaFormData {
  nome: string;
  descricao?: string;
  pontos_necessarios: number;
  tipo: 'desconto_percentual' | 'desconto_valor' | 'servico_gratis';
  valor_desconto: number;
  servico_id?: string;
  classe_id?: string;
  validade_dias: number;
}

export interface ProgramaFidelidadeFormData {
  nome: string;
  pontos_por_real: number;
  expiracao_pontos_dias: number;
  data_inicio: string;
}

export interface ClasseFidelidadeFormData {
  nome: string;
  pontos_minimos: number;
  cor: string;
  beneficios?: string;
  ordem: number;
}
