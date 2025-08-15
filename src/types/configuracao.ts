export interface HorarioTrabalho {
  inicio: string; // formato HH:mm
  termino: string; // formato HH:mm
}

export interface IntervaloTrabalho {
  inicio: string; // formato HH:mm
  termino: string; // formato HH:mm
  descricao?: string;
}

export interface DiasSemana {
  domingo: boolean;
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
}

export interface ConfiguracaoHorarios {
  diasAtivos: DiasSemana;
  horarioExpediente: HorarioTrabalho;
  intervaloAlmoco: IntervaloTrabalho;
  intervalosPersonalizados: IntervaloTrabalho[];
}

export interface ConfiguracaoNotificacoes {
  push: {
    ativo: boolean;
    subscription?: string; // Push subscription JSON
  };
  novosAgendamentos: {
    visual: boolean;
    sonoro: boolean;
    push: boolean;
    som: 'notification1' | 'notification2' | 'notification3';
  };
  lembretesAgendamento: {
    ativo: boolean;
    antecedencia: number; // em minutos
    push: boolean;
    sonoro: boolean;
  };
  retornoCronograma: {
    ativo: boolean;
    push: boolean;
    sonoro: boolean;
  };
  despesasFixas: {
    ativo: boolean;
    antecedencia: number; // em dias
    push: boolean;
    sonoro: boolean;
  };
  servicoFinalizado: {
    ativo: boolean;
    push: boolean;
    sonoro: boolean;
  };
  tempoAntecedencia: number; // em minutos (compatibilidade)
}

export interface ConfiguracaoBackup {
  backupAutomatico: boolean;
  emailBackup: string;
  diasSemanaBackup: number[]; // 0-6 (domingo a sábado)
  ultimoBackup?: string; // ISO date string
}

export interface Configuracoes {
  id: string;
  userId: string;
  horarios: ConfiguracaoHorarios;
  notificacoes: ConfiguracaoNotificacoes;
  backup: ConfiguracaoBackup;
  createdAt: string;
  updatedAt: string;
}

// Configurações padrão
export const CONFIG_DEFAULT: Omit<Configuracoes, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  horarios: {
    diasAtivos: {
      domingo: false,
      segunda: true,
      terca: true,
      quarta: true,
      quinta: true,
      sexta: true,
      sabado: false,
    },
    horarioExpediente: {
      inicio: '08:00',
      termino: '18:00',
    },
    intervaloAlmoco: {
      inicio: '12:00',
      termino: '13:00',
      descricao: 'Intervalo para almoço',
    },
    intervalosPersonalizados: [],
  },
  notificacoes: {
    push: {
      ativo: false,
    },
    novosAgendamentos: {
      visual: true,
      sonoro: true,
      push: true,
      som: 'notification1',
    },
    lembretesAgendamento: {
      ativo: true,
      antecedencia: 60, // 1 hora
      push: true,
      sonoro: true,
    },
    retornoCronograma: {
      ativo: true,
      push: true,
      sonoro: true,
    },
    despesasFixas: {
      ativo: true,
      antecedencia: 7, // 7 dias
      push: true,
      sonoro: true,
    },
    servicoFinalizado: {
      ativo: true,
      push: true,
      sonoro: true,
    },
    tempoAntecedencia: 60, // 1 hora (compatibilidade)
  },
  backup: {
    backupAutomatico: false,
    emailBackup: '',
    diasSemanaBackup: [0], // Domingo
  },
};