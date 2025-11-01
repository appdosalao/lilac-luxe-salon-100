export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          cliente_id: string
          confirmado: boolean | null
          created_at: string
          data: string
          duracao: number
          forma_pagamento: string | null
          hora: string
          id: string
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          servico_id: string
          status: string | null
          status_pagamento: string | null
          updated_at: string
          user_id: string
          valor: number
          valor_devido: number
          valor_pago: number | null
        }
        Insert: {
          cliente_id: string
          confirmado?: boolean | null
          created_at?: string
          data: string
          duracao: number
          forma_pagamento?: string | null
          hora: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          servico_id: string
          status?: string | null
          status_pagamento?: string | null
          updated_at?: string
          user_id: string
          valor: number
          valor_devido: number
          valor_pago?: number | null
        }
        Update: {
          cliente_id?: string
          confirmado?: boolean | null
          created_at?: string
          data?: string
          duracao?: number
          forma_pagamento?: string | null
          hora?: string
          id?: string
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          servico_id?: string
          status?: string | null
          status_pagamento?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
          valor_devido?: number
          valor_pago?: number | null
        }
        Relationships: []
      }
      agendamentos_online: {
        Row: {
          agendamento_id: string | null
          created_at: string
          data: string
          duracao: number
          email: string
          horario: string
          id: string
          ip_address: unknown
          nome_completo: string
          observacoes: string | null
          origem: string | null
          servico_id: string
          status: string
          telefone: string
          updated_at: string
          user_agent: string | null
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string
          data: string
          duracao?: number
          email: string
          horario: string
          id?: string
          ip_address?: unknown
          nome_completo: string
          observacoes?: string | null
          origem?: string | null
          servico_id: string
          status?: string
          telefone: string
          updated_at?: string
          user_agent?: string | null
          valor?: number
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string
          data?: string
          duracao?: number
          email?: string
          horario?: string
          id?: string
          ip_address?: unknown
          nome_completo?: string
          observacoes?: string | null
          origem?: string | null
          servico_id?: string
          status?: string
          telefone?: string
          updated_at?: string
          user_agent?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_online_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_online_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_servico"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      classes_fidelidade: {
        Row: {
          ativo: boolean | null
          beneficios: string | null
          cor: string | null
          created_at: string | null
          id: string
          nome: string
          ordem: number
          pontos_minimos: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          beneficios?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number
          pontos_minimos?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          beneficios?: string | null
          cor?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number
          pontos_minimos?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          historico_servicos: Json | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          historico_servicos?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          historico_servicos?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          blue: number | null
          green: number | null
          hex: string
          hue: number | null
          id: number
          light_hsl: number | null
          name: string | null
          red: number | null
          sat_hsl: number | null
          sat_hsv: number | null
          source: Database["public"]["Enums"]["color_source"] | null
          val_hsv: number | null
        }
        Insert: {
          blue?: number | null
          green?: number | null
          hex: string
          hue?: number | null
          id?: number
          light_hsl?: number | null
          name?: string | null
          red?: number | null
          sat_hsl?: number | null
          sat_hsv?: number | null
          source?: Database["public"]["Enums"]["color_source"] | null
          val_hsv?: number | null
        }
        Update: {
          blue?: number | null
          green?: number | null
          hex?: string
          hue?: number | null
          id?: number
          light_hsl?: number | null
          name?: string | null
          red?: number | null
          sat_hsl?: number | null
          sat_hsv?: number | null
          source?: Database["public"]["Enums"]["color_source"] | null
          val_hsv?: number | null
        }
        Relationships: []
      }
      configuracoes_backup: {
        Row: {
          backup_automatico: boolean
          created_at: string
          dia_backup: number | null
          email_backup: string | null
          frequencia_backup: string
          hora_backup: string
          id: string
          incluir_agendamentos: boolean
          incluir_clientes: boolean
          incluir_cronogramas: boolean
          incluir_financeiro: boolean
          incluir_servicos: boolean
          proximo_backup: string | null
          ultimo_backup: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_automatico?: boolean
          created_at?: string
          dia_backup?: number | null
          email_backup?: string | null
          frequencia_backup?: string
          hora_backup?: string
          id?: string
          incluir_agendamentos?: boolean
          incluir_clientes?: boolean
          incluir_cronogramas?: boolean
          incluir_financeiro?: boolean
          incluir_servicos?: boolean
          proximo_backup?: string | null
          ultimo_backup?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_automatico?: boolean
          created_at?: string
          dia_backup?: number | null
          email_backup?: string | null
          frequencia_backup?: string
          hora_backup?: string
          id?: string
          incluir_agendamentos?: boolean
          incluir_clientes?: boolean
          incluir_cronogramas?: boolean
          incluir_financeiro?: boolean
          incluir_servicos?: boolean
          proximo_backup?: string | null
          ultimo_backup?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes_horarios: {
        Row: {
          ativo: boolean
          created_at: string
          dia_semana: number
          horario_abertura: string
          horario_fechamento: string
          id: string
          intervalo_fim: string | null
          intervalo_inicio: string | null
          permite_agendamento_fora_horario: boolean | null
          tempo_maximo_antecedencia: number | null
          tempo_minimo_antecedencia: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dia_semana: number
          horario_abertura: string
          horario_fechamento: string
          id?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          permite_agendamento_fora_horario?: boolean | null
          tempo_maximo_antecedencia?: number | null
          tempo_minimo_antecedencia?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dia_semana?: number
          horario_abertura?: string
          horario_fechamento?: string
          id?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          permite_agendamento_fora_horario?: boolean | null
          tempo_maximo_antecedencia?: number | null
          tempo_minimo_antecedencia?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes_notificacoes: {
        Row: {
          created_at: string
          horario_fim_notificacoes: string
          horario_inicio_notificacoes: string
          id: string
          lembrete_agendamento_minutos: number
          lembrete_contas_fixas_dias: number
          lembrete_vencimento_dias: number
          notificacoes_email: boolean
          notificacoes_push: boolean
          notificacoes_som: boolean
          notificar_cancelamentos: boolean
          notificar_novos_agendamentos: boolean
          notificar_pagamentos: boolean
          notificar_reagendamentos: boolean
          som_personalizado: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          horario_fim_notificacoes?: string
          horario_inicio_notificacoes?: string
          id?: string
          lembrete_agendamento_minutos?: number
          lembrete_contas_fixas_dias?: number
          lembrete_vencimento_dias?: number
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          notificacoes_som?: boolean
          notificar_cancelamentos?: boolean
          notificar_novos_agendamentos?: boolean
          notificar_pagamentos?: boolean
          notificar_reagendamentos?: boolean
          som_personalizado?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          horario_fim_notificacoes?: string
          horario_inicio_notificacoes?: string
          id?: string
          lembrete_agendamento_minutos?: number
          lembrete_contas_fixas_dias?: number
          lembrete_vencimento_dias?: number
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          notificacoes_som?: boolean
          notificar_cancelamentos?: boolean
          notificar_novos_agendamentos?: boolean
          notificar_pagamentos?: boolean
          notificar_reagendamentos?: boolean
          som_personalizado?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contas_fixas: {
        Row: {
          ativa: boolean
          categoria: string
          created_at: string
          data_vencimento: number
          frequencia: string
          id: string
          nome: string
          observacoes: string | null
          proximo_vencimento: string | null
          repetir: boolean
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ativa?: boolean
          categoria: string
          created_at?: string
          data_vencimento: number
          frequencia?: string
          id?: string
          nome: string
          observacoes?: string | null
          proximo_vencimento?: string | null
          repetir?: boolean
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          ativa?: boolean
          categoria?: string
          created_at?: string
          data_vencimento?: number
          frequencia?: string
          id?: string
          nome?: string
          observacoes?: string | null
          proximo_vencimento?: string | null
          repetir?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      cronogramas_novos: {
        Row: {
          cliente_id: string
          cliente_nome: string
          created_at: string
          data_inicio: string
          duracao_minutos: number
          hora_inicio: string
          id_cronograma: string
          intervalo_dias: number | null
          observacoes: string | null
          recorrencia: string
          servico_id: string
          status: string
          tipo_servico: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          cliente_nome: string
          created_at?: string
          data_inicio: string
          duracao_minutos: number
          hora_inicio: string
          id_cronograma?: string
          intervalo_dias?: number | null
          observacoes?: string | null
          recorrencia: string
          servico_id: string
          status?: string
          tipo_servico: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          cliente_nome?: string
          created_at?: string
          data_inicio?: string
          duracao_minutos?: number
          hora_inicio?: string
          id_cronograma?: string
          intervalo_dias?: number | null
          observacoes?: string | null
          recorrencia?: string
          servico_id?: string
          status?: string
          tipo_servico?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cronogramas_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cronogramas_servico"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_resgates: {
        Row: {
          agendamento_id: string | null
          cliente_id: string
          data_expiracao: string | null
          data_resgate: string | null
          data_utilizacao: string | null
          id: string
          pontos_gastos: number
          recompensa_id: string
          user_id: string
          utilizado: boolean | null
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id: string
          data_expiracao?: string | null
          data_resgate?: string | null
          data_utilizacao?: string | null
          id?: string
          pontos_gastos: number
          recompensa_id: string
          user_id: string
          utilizado?: boolean | null
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string
          data_expiracao?: string | null
          data_resgate?: string | null
          data_utilizacao?: string | null
          id?: string
          pontos_gastos?: number
          recompensa_id?: string
          user_id?: string
          utilizado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_resgates_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_resgates_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_resgates_recompensa_id_fkey"
            columns: ["recompensa_id"]
            isOneToOne: false
            referencedRelation: "recompensas"
            referencedColumns: ["id"]
          },
        ]
      }
      intervalos_trabalho: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          categoria: string | null
          cliente_id: string | null
          created_at: string
          data: string
          descricao: string
          id: string
          origem_id: string | null
          origem_tipo: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data: string
          descricao: string
          id?: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          cliente_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_lancamentos_agendamento"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_lancamentos_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_sistema: {
        Row: {
          acao: string
          categoria: string
          created_at: string
          descricao: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          ip_address: unknown
          metadados: Json | null
          nivel: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          categoria: string
          created_at?: string
          descricao: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip_address?: unknown
          metadados?: Json | null
          nivel: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          categoria?: string
          created_at?: string
          descricao?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ip_address?: unknown
          metadados?: Json | null
          nivel?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      niveis_fidelidade: {
        Row: {
          cliente_id: string
          data_atualizacao: string | null
          id: string
          nivel: string | null
          pontos_disponiveis: number | null
          pontos_totais: number | null
          total_resgates: number | null
          user_id: string
        }
        Insert: {
          cliente_id: string
          data_atualizacao?: string | null
          id?: string
          nivel?: string | null
          pontos_disponiveis?: number | null
          pontos_totais?: number | null
          total_resgates?: number | null
          user_id: string
        }
        Update: {
          cliente_id?: string
          data_atualizacao?: string | null
          id?: string
          nivel?: string | null
          pontos_disponiveis?: number | null
          pontos_totais?: number | null
          total_resgates?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "niveis_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_preferencias: {
        Row: {
          alerta_financeiro: boolean | null
          cancelamento_agendamento: boolean | null
          confirmacao_cliente: boolean | null
          created_at: string | null
          id: string
          lembrete_agendamento: boolean | null
          lembrete_cliente: boolean | null
          novo_agendamento: boolean | null
          ofertas_fidelidade: boolean | null
          retorno_cronograma: boolean | null
          som_notificacao: string | null
          updated_at: string | null
          user_id: string
          vibracao: boolean | null
        }
        Insert: {
          alerta_financeiro?: boolean | null
          cancelamento_agendamento?: boolean | null
          confirmacao_cliente?: boolean | null
          created_at?: string | null
          id?: string
          lembrete_agendamento?: boolean | null
          lembrete_cliente?: boolean | null
          novo_agendamento?: boolean | null
          ofertas_fidelidade?: boolean | null
          retorno_cronograma?: boolean | null
          som_notificacao?: string | null
          updated_at?: string | null
          user_id: string
          vibracao?: boolean | null
        }
        Update: {
          alerta_financeiro?: boolean | null
          cancelamento_agendamento?: boolean | null
          confirmacao_cliente?: boolean | null
          created_at?: string | null
          id?: string
          lembrete_agendamento?: boolean | null
          lembrete_cliente?: boolean | null
          novo_agendamento?: boolean | null
          ofertas_fidelidade?: boolean | null
          retorno_cronograma?: boolean | null
          som_notificacao?: string | null
          updated_at?: string | null
          user_id?: string
          vibracao?: boolean | null
        }
        Relationships: []
      }
      pontos_fidelidade: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_expiracao: string | null
          data_ganho: string | null
          descricao: string | null
          expirado: boolean | null
          id: string
          origem: string
          origem_id: string | null
          pontos: number
          user_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_expiracao?: string | null
          data_ganho?: string | null
          descricao?: string | null
          expirado?: boolean | null
          id?: string
          origem: string
          origem_id?: string | null
          pontos: number
          user_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_expiracao?: string | null
          data_ganho?: string | null
          descricao?: string | null
          expirado?: boolean | null
          id?: string
          origem?: string
          origem_id?: string | null
          pontos?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      problemas_auditoria: {
        Row: {
          campo: string | null
          categoria: string
          created_at: string
          data_resolucao: string | null
          descricao: string
          entidade: string
          entidade_id: string
          id: string
          relatorio_id: string
          resolvido: boolean
          sugestao: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor_atual: string | null
          valor_esperado: string | null
        }
        Insert: {
          campo?: string | null
          categoria: string
          created_at?: string
          data_resolucao?: string | null
          descricao: string
          entidade: string
          entidade_id: string
          id?: string
          relatorio_id: string
          resolvido?: boolean
          sugestao?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_atual?: string | null
          valor_esperado?: string | null
        }
        Update: {
          campo?: string | null
          categoria?: string
          created_at?: string
          data_resolucao?: string | null
          descricao?: string
          entidade?: string
          entidade_id?: string
          id?: string
          relatorio_id?: string
          resolvido?: boolean
          sugestao?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_atual?: string | null
          valor_esperado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "problemas_auditoria_relatorio_id_fkey"
            columns: ["relatorio_id"]
            isOneToOne: false
            referencedRelation: "relatorios_auditoria"
            referencedColumns: ["id"]
          },
        ]
      }
      programas_fidelidade: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          data_inicio: string | null
          expiracao_pontos_dias: number | null
          id: string
          nome: string
          pontos_por_real: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          expiracao_pontos_dias?: number | null
          id?: string
          nome?: string
          pontos_por_real?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          data_inicio?: string | null
          expiracao_pontos_dias?: number | null
          id?: string
          nome?: string
          pontos_por_real?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          ativo: boolean | null
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recompensas: {
        Row: {
          ativo: boolean | null
          classe_id: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          pontos_necessarios: number
          servico_id: string | null
          tipo: string
          updated_at: string | null
          user_id: string
          validade_dias: number | null
          valor_desconto: number | null
        }
        Insert: {
          ativo?: boolean | null
          classe_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          pontos_necessarios: number
          servico_id?: string | null
          tipo: string
          updated_at?: string | null
          user_id: string
          validade_dias?: number | null
          valor_desconto?: number | null
        }
        Update: {
          ativo?: boolean | null
          classe_id?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          pontos_necessarios?: number
          servico_id?: string | null
          tipo?: string
          updated_at?: string | null
          user_id?: string
          validade_dias?: number | null
          valor_desconto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recompensas_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classes_fidelidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recompensas_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      referencias_clientes: {
        Row: {
          agendamento_id: string | null
          cliente_referenciado_id: string | null
          cliente_referenciador_id: string
          codigo_referencia: string
          created_at: string | null
          id: string
          pontos_ganhos: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          agendamento_id?: string | null
          cliente_referenciado_id?: string | null
          cliente_referenciador_id: string
          codigo_referencia: string
          created_at?: string | null
          id?: string
          pontos_ganhos?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          agendamento_id?: string | null
          cliente_referenciado_id?: string | null
          cliente_referenciador_id?: string
          codigo_referencia?: string
          created_at?: string | null
          id?: string
          pontos_ganhos?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referencias_clientes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referencias_clientes_cliente_referenciado_id_fkey"
            columns: ["cliente_referenciado_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referencias_clientes_cliente_referenciador_id_fkey"
            columns: ["cliente_referenciador_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referencias_clientes_referenciado_fkey"
            columns: ["cliente_referenciado_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referencias_clientes_referenciador_fkey"
            columns: ["cliente_referenciador_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_auditoria: {
        Row: {
          created_at: string
          data_execucao: string
          estatisticas: Json
          id: string
          problemas_altos: number
          problemas_baixos: number
          problemas_criticos: number
          problemas_medios: number
          sugestoes_melhorias: string[] | null
          total_problemas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_execucao?: string
          estatisticas?: Json
          id?: string
          problemas_altos?: number
          problemas_baixos?: number
          problemas_criticos?: number
          problemas_medios?: number
          sugestoes_melhorias?: string[] | null
          total_problemas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_execucao?: string
          estatisticas?: Json
          id?: string
          problemas_altos?: number
          problemas_baixos?: number
          problemas_criticos?: number
          problemas_medios?: number
          sugestoes_melhorias?: string[] | null
          total_problemas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      retornos_novos: {
        Row: {
          created_at: string
          data_retorno: string
          id_agendamento_retorno: string | null
          id_cliente: string
          id_cronograma: string
          id_retorno: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_retorno: string
          id_agendamento_retorno?: string | null
          id_cliente: string
          id_cronograma: string
          id_retorno?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_retorno?: string
          id_agendamento_retorno?: string | null
          id_cliente?: string
          id_cronograma?: string
          id_retorno?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_retornos_agendamento"
            columns: ["id_agendamento_retorno"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_retornos_cliente"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_retornos_cronograma"
            columns: ["id_cronograma"]
            isOneToOne: false
            referencedRelation: "cronogramas_completos"
            referencedColumns: ["id_cronograma"]
          },
          {
            foreignKeyName: "fk_retornos_cronograma"
            columns: ["id_cronograma"]
            isOneToOne: false
            referencedRelation: "cronogramas_novos"
            referencedColumns: ["id_cronograma"]
          },
        ]
      }
      servicos: {
        Row: {
          created_at: string
          descricao: string | null
          duracao: number
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          duracao: number
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          duracao?: number
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          nome_completo: string
          nome_personalizado_app: string
          telefone: string
          tema_preferencia: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome_completo: string
          nome_personalizado_app?: string
          telefone?: string
          tema_preferencia?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          nome_personalizado_app?: string
          telefone?: string
          tema_preferencia?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      cronogramas_completos: {
        Row: {
          cliente_email: string | null
          cliente_id: string | null
          cliente_nome: string | null
          cliente_nome_real: string | null
          cliente_telefone: string | null
          created_at: string | null
          data_inicio: string | null
          duracao_minutos: number | null
          hora_inicio: string | null
          id_cronograma: string | null
          intervalo_dias: number | null
          observacoes: string | null
          proximo_retorno: string | null
          recorrencia: string | null
          retornos_pendentes: number | null
          retornos_realizados: number | null
          servico_duracao: number | null
          servico_id: string | null
          servico_nome_real: string | null
          servico_valor: number | null
          status: string | null
          tipo_servico: string | null
          total_retornos: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cronogramas_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cronogramas_servico"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      disponibilidade_agendamentos: {
        Row: {
          dia_semana: number | null
          horario_abertura: string | null
          horario_fechamento: string | null
          horarios_agendados: string | null
          intervalo_fim: string | null
          intervalo_inicio: string | null
          total_agendamentos: number | null
          user_id: string | null
        }
        Relationships: []
      }
      estatisticas_fidelidade: {
        Row: {
          clientes_ativos_30d: number | null
          total_clientes_programa: number | null
          total_pontos_distribuidos: number | null
          total_pontos_resgatados: number | null
          user_id: string | null
        }
        Relationships: []
      }
      horarios_disponiveis_publicos: {
        Row: {
          data: string | null
          duracao: number | null
          horario: string | null
          servico_id: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          data?: string | null
          duracao?: number | null
          horario?: string | null
          servico_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          data?: string | null
          duracao?: number | null
          horario?: string | null
          servico_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_online_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_servico"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_fidelidade: {
        Row: {
          classe_cor: string | null
          classe_nome: string | null
          cliente_id: string | null
          cliente_nome: string | null
          nivel: string | null
          pontos_disponiveis: number | null
          pontos_totais: number | null
          ranking: number | null
          telefone: string | null
          total_resgates: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "niveis_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      retornos_completos: {
        Row: {
          agendamento_data: string | null
          agendamento_hora: string | null
          agendamento_status: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          created_at: string | null
          data_retorno: string | null
          hora_inicio: string | null
          id_agendamento_retorno: string | null
          id_cliente: string | null
          id_cronograma: string | null
          id_retorno: string | null
          recorrencia: string | null
          status: string | null
          tipo_servico: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_retornos_agendamento"
            columns: ["id_agendamento_retorno"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_retornos_cliente"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_retornos_cronograma"
            columns: ["id_cronograma"]
            isOneToOne: false
            referencedRelation: "cronogramas_completos"
            referencedColumns: ["id_cronograma"]
          },
          {
            foreignKeyName: "fk_retornos_cronograma"
            columns: ["id_cronograma"]
            isOneToOne: false
            referencedRelation: "cronogramas_novos"
            referencedColumns: ["id_cronograma"]
          },
        ]
      }
      saldo_pontos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          pontos_disponiveis: number | null
          pontos_ganhos: number | null
          pontos_gastos: number | null
          total_transacoes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_fidelidade_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aplicar_expiracao_pontos: { Args: never; Returns: undefined }
      associar_clientes_agendamento_online: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      buscar_horarios_com_multiplos_intervalos: {
        Args: {
          data_selecionada: string
          duracao_servico?: number
          user_id_param: string
        }
        Returns: {
          bloqueio_motivo: string
          disponivel: boolean
          horario: string
        }[]
      }
      buscar_horarios_disponiveis: {
        Args: { data_selecionada: string; user_id_param: string }
        Returns: {
          disponivel: boolean
          horario: string
        }[]
      }
      buscar_horarios_disponiveis_seguro: {
        Args: { data_teste?: string; user_id_param?: string }
        Returns: {
          disponivel: boolean
          horario: string
          motivo: string
        }[]
      }
      cadastrar_clientes_programa_fidelidade: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      calcular_disponibilidade: {
        Args: { p_data: string; p_user_id: string }
        Returns: {
          horario: string
          status: string
        }[]
      }
      calcular_nivel_cliente:
        | {
            Args: { p_user_id: string; pontos_totais: number }
            Returns: string
          }
        | { Args: { pontos_totais: number }; Returns: string }
      converter_agendamento_online: {
        Args: { agendamento_online_id: string; user_id: string }
        Returns: string
      }
      criar_cliente_agendamento_online: {
        Args: {
          p_email: string
          p_nome: string
          p_observacoes?: string
          p_telefone: string
        }
        Returns: string
      }
      diagnosticar_usuarios_validos: {
        Args: never
        Returns: {
          email: string
          nome_completo: string
          user_id: string
        }[]
      }
      diagnostico_sistema_agendamento: {
        Args: never
        Returns: {
          tabela: string
          total_registros: number
          total_registros_ativos: number
        }[]
      }
      get_current_user_email: { Args: never; Returns: string }
      inserir_configuracao_horario: {
        Args: {
          p_ativo?: boolean
          p_dia_semana: number
          p_duracao_padrao?: number
          p_horario_abertura: string
          p_horario_fechamento: string
          p_intervalo_fim?: string
          p_intervalo_inicio?: string
          p_max_agendamentos?: number
        }
        Returns: string
      }
      obter_configuracoes_horario: {
        Args: never
        Returns: {
          ativo: boolean
          dia_semana: number
          duracao_padrao_atendimento: number
          horario_abertura: string
          horario_fechamento: string
          intervalo_fim: string
          intervalo_inicio: string
          max_agendamentos_simultaneos: number
        }[]
      }
      proximo_horario_disponivel: {
        Args: { p_data: string; p_duracao: number; p_user_id: string }
        Returns: string
      }
      test_delete_permissions: {
        Args: { record_id: string; table_name: string }
        Returns: Json
      }
      testar_horarios_disponiveis: {
        Args: { data_teste?: string }
        Returns: {
          dia_semana_config: number
          horario_abertura: string
          horario_fechamento: string
          horarios_disponiveis: Json
          user_email: string
        }[]
      }
      validar_agendamento: {
        Args: { p_data: string; p_horario: string; p_user_id: string }
        Returns: boolean
      }
      validar_agendamento_simultaneo: {
        Args: {
          p_data: string
          p_duracao: number
          p_horario: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      color_source:
        | "99COLORS_NET"
        | "ART_PAINTS_YG07S"
        | "BYRNE"
        | "CRAYOLA"
        | "CMYK_COLOR_MODEL"
        | "COLORCODE_IS"
        | "COLORHEXA"
        | "COLORXS"
        | "CORNELL_UNIVERSITY"
        | "COLUMBIA_UNIVERSITY"
        | "DUKE_UNIVERSITY"
        | "ENCYCOLORPEDIA_COM"
        | "ETON_COLLEGE"
        | "FANTETTI_AND_PETRACCHI"
        | "FINDTHEDATA_COM"
        | "FERRARIO_1919"
        | "FEDERAL_STANDARD_595"
        | "FLAG_OF_INDIA"
        | "FLAG_OF_SOUTH_AFRICA"
        | "GLAZEBROOK_AND_BALDRY"
        | "GOOGLE"
        | "HEXCOLOR_CO"
        | "ISCC_NBS"
        | "KELLY_MOORE"
        | "MATTEL"
        | "MAERZ_AND_PAUL"
        | "MILK_PAINT"
        | "MUNSELL_COLOR_WHEEL"
        | "NATURAL_COLOR_SYSTEM"
        | "PANTONE"
        | "PLOCHERE"
        | "POURPRE_COM"
        | "RAL"
        | "RESENE"
        | "RGB_COLOR_MODEL"
        | "THOM_POOLE"
        | "UNIVERSITY_OF_ALABAMA"
        | "UNIVERSITY_OF_CALIFORNIA_DAVIS"
        | "UNIVERSITY_OF_CAMBRIDGE"
        | "UNIVERSITY_OF_NORTH_CAROLINA"
        | "UNIVERSITY_OF_TEXAS_AT_AUSTIN"
        | "X11_WEB"
        | "XONA_COM"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      color_source: [
        "99COLORS_NET",
        "ART_PAINTS_YG07S",
        "BYRNE",
        "CRAYOLA",
        "CMYK_COLOR_MODEL",
        "COLORCODE_IS",
        "COLORHEXA",
        "COLORXS",
        "CORNELL_UNIVERSITY",
        "COLUMBIA_UNIVERSITY",
        "DUKE_UNIVERSITY",
        "ENCYCOLORPEDIA_COM",
        "ETON_COLLEGE",
        "FANTETTI_AND_PETRACCHI",
        "FINDTHEDATA_COM",
        "FERRARIO_1919",
        "FEDERAL_STANDARD_595",
        "FLAG_OF_INDIA",
        "FLAG_OF_SOUTH_AFRICA",
        "GLAZEBROOK_AND_BALDRY",
        "GOOGLE",
        "HEXCOLOR_CO",
        "ISCC_NBS",
        "KELLY_MOORE",
        "MATTEL",
        "MAERZ_AND_PAUL",
        "MILK_PAINT",
        "MUNSELL_COLOR_WHEEL",
        "NATURAL_COLOR_SYSTEM",
        "PANTONE",
        "PLOCHERE",
        "POURPRE_COM",
        "RAL",
        "RESENE",
        "RGB_COLOR_MODEL",
        "THOM_POOLE",
        "UNIVERSITY_OF_ALABAMA",
        "UNIVERSITY_OF_CALIFORNIA_DAVIS",
        "UNIVERSITY_OF_CAMBRIDGE",
        "UNIVERSITY_OF_NORTH_CAROLINA",
        "UNIVERSITY_OF_TEXAS_AT_AUSTIN",
        "X11_WEB",
        "XONA_COM",
      ],
    },
  },
} as const
