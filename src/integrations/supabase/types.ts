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
      [_ in never]: never
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
