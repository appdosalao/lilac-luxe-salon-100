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
          cliente_id: string | null
          clienteNome: string | null
          confirmado: boolean | null
          createdAt: string | null
          criado_em: string | null
          cronogramaId: string | null
          data: string | null
          data_hora: string
          dataPrevistaPagamento: string | null
          duracao: number | null
          forma_pagamento: string | null
          formaPagamento: string | null
          hora: string | null
          id: string
          observacoes: string | null
          origem: string | null
          origem_cronograma: boolean | null
          servico_id: string | null
          servicoNome: string | null
          status: string | null
          status_pagamento: string | null
          statusPagamento: string | null
          updatedAt: string | null
          usuario_id: string | null
          valor: number | null
          valor_devido: number | null
          valor_pago: number | null
          valorDevido: number | null
          valorPago: number | null
        }
        Insert: {
          cliente_id?: string | null
          clienteNome?: string | null
          confirmado?: boolean | null
          createdAt?: string | null
          criado_em?: string | null
          cronogramaId?: string | null
          data?: string | null
          data_hora: string
          dataPrevistaPagamento?: string | null
          duracao?: number | null
          forma_pagamento?: string | null
          formaPagamento?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          origem_cronograma?: boolean | null
          servico_id?: string | null
          servicoNome?: string | null
          status?: string | null
          status_pagamento?: string | null
          statusPagamento?: string | null
          updatedAt?: string | null
          usuario_id?: string | null
          valor?: number | null
          valor_devido?: number | null
          valor_pago?: number | null
          valorDevido?: number | null
          valorPago?: number | null
        }
        Update: {
          cliente_id?: string | null
          clienteNome?: string | null
          confirmado?: boolean | null
          createdAt?: string | null
          criado_em?: string | null
          cronogramaId?: string | null
          data?: string | null
          data_hora?: string
          dataPrevistaPagamento?: string | null
          duracao?: number | null
          forma_pagamento?: string | null
          formaPagamento?: string | null
          hora?: string | null
          id?: string
          observacoes?: string | null
          origem?: string | null
          origem_cronograma?: boolean | null
          servico_id?: string | null
          servicoNome?: string | null
          status?: string | null
          status_pagamento?: string | null
          statusPagamento?: string | null
          updatedAt?: string | null
          usuario_id?: string | null
          valor?: number | null
          valor_devido?: number | null
          valor_pago?: number | null
          valorDevido?: number | null
          valorPago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          data: string | null
          detalhes: string | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          data?: string | null
          detalhes?: string | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          data?: string | null
          detalhes?: string | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          criado_em: string | null
          email: string | null
          historicoServicos: Json | null
          id: string
          nome: string
          nome_completo: string | null
          nomeCompleto: string | null
          observacoes: string | null
          servico_frequente: string | null
          servicoFrequente: string | null
          telefone: string | null
          ultima_visita: string | null
          ultimaVisita: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          email?: string | null
          historicoServicos?: Json | null
          id?: string
          nome: string
          nome_completo?: string | null
          nomeCompleto?: string | null
          observacoes?: string | null
          servico_frequente?: string | null
          servicoFrequente?: string | null
          telefone?: string | null
          ultima_visita?: string | null
          ultimaVisita?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          email?: string | null
          historicoServicos?: Json | null
          id?: string
          nome?: string
          nome_completo?: string | null
          nomeCompleto?: string | null
          observacoes?: string | null
          servico_frequente?: string | null
          servicoFrequente?: string | null
          telefone?: string | null
          ultima_visita?: string | null
          ultimaVisita?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizada_em: string | null
          chave: string
          id: string
          usuario_id: string | null
          valor: string | null
        }
        Insert: {
          atualizada_em?: string | null
          chave: string
          id?: string
          usuario_id?: string | null
          valor?: string | null
        }
        Update: {
          atualizada_em?: string | null
          chave?: string
          id?: string
          usuario_id?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      contas_fixas: {
        Row: {
          ativa: boolean | null
          descricao: string
          id: string
          tipo: string | null
          usuario_id: string | null
          valor: number | null
          vencimento_dia: number | null
        }
        Insert: {
          ativa?: boolean | null
          descricao: string
          id?: string
          tipo?: string | null
          usuario_id?: string | null
          valor?: number | null
          vencimento_dia?: number | null
        }
        Update: {
          ativa?: boolean | null
          descricao?: string
          id?: string
          tipo?: string | null
          usuario_id?: string | null
          valor?: number | null
          vencimento_dia?: number | null
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          criado_em: string | null
          data: string
          descricao: string | null
          id: string
          tipo: string
          usuario_id: string | null
          valor: number | null
        }
        Insert: {
          criado_em?: string | null
          data: string
          descricao?: string | null
          id?: string
          tipo: string
          usuario_id?: string | null
          valor?: number | null
        }
        Update: {
          criado_em?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          usuario_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          criada_em: string | null
          id: string
          lida: boolean | null
          mensagem: string
          usuario_id: string | null
        }
        Insert: {
          criada_em?: string | null
          id?: string
          lida?: boolean | null
          mensagem: string
          usuario_id?: string | null
        }
        Update: {
          criada_em?: string | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          criado_em: string | null
          especialidade: string | null
          id: string
          nome: string
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          createdAt: string | null
          criado_em: string | null
          descricao: string | null
          duracao: number | null
          id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
          updatedAt: string | null
          usuario_id: string | null
          valor: number | null
        }
        Insert: {
          createdAt?: string | null
          criado_em?: string | null
          descricao?: string | null
          duracao?: number | null
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
          updatedAt?: string | null
          usuario_id?: string | null
          valor?: number | null
        }
        Update: {
          createdAt?: string | null
          criado_em?: string | null
          descricao?: string | null
          duracao?: number | null
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
          updatedAt?: string | null
          usuario_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome_completo: string
          nome_personalizado_app: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nome_completo: string
          nome_personalizado_app?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome_completo?: string
          nome_personalizado_app?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
