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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          metadados?: Json | null
          nivel?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome_completo: string
          nome_personalizado_app?: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          nome_personalizado_app?: string
          telefone?: string
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
    }
    Functions: {
      associar_clientes_agendamento_online: {
        Args: { p_user_id: string }
        Returns: undefined
      }
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
      test_delete_permissions: {
        Args: { record_id: string; table_name: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
