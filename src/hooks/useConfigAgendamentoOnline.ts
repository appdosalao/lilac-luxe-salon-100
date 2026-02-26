import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConfigAgendamentoOnline {
  id?: string;
  user_id?: string;
  ativo: boolean;
  nome_salao: string;
  descricao: string;
  telefone: string;
  email: string;
  endereco: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  logo_url?: string;
  taxa_sinal_percentual: number;
  tempo_minimo_antecedencia: number;
  tempo_maximo_antecedencia: number;
  mensagem_boas_vindas: string;
  termos_condicoes: string;
  mensagem_confirmacao: string;
}

const defaultConfig: ConfigAgendamentoOnline = {
  ativo: true,
  nome_salao: 'Meu Salão',
  descricao: 'Bem-vindo ao nosso salão! Agende seu horário de forma rápida e fácil.',
  telefone: '',
  email: '',
  endereco: '',
  instagram: '',
  facebook: '',
  whatsapp: '',
  logo_url: '',
  taxa_sinal_percentual: 30,
  tempo_minimo_antecedencia: 60,
  tempo_maximo_antecedencia: 4320,
  mensagem_boas_vindas: 'Olá! Estamos felizes em atendê-lo(a). Preencha os dados abaixo para agendar seu horário.',
  termos_condicoes: 'Ao agendar, você concorda em chegar no horário marcado. Em caso de atraso superior a 15 minutos, o agendamento poderá ser cancelado.',
  mensagem_confirmacao: 'Agendamento confirmado! Em breve você receberá uma confirmação no WhatsApp.'
};

export function useConfigAgendamentoOnline() {
  const [config, setConfig] = useState<ConfigAgendamentoOnline>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('configuracoes_agendamento_online' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar config:', error);
      }

      if (data) {
        setConfig(data as unknown as ConfigAgendamentoOnline);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfig = async (newConfig: ConfigAgendamentoOnline) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const configData = {
        ...newConfig,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('configuracoes_agendamento_online' as any)
        .upsert(configData, { onConflict: 'user_id' });

      if (error) throw error;

      setConfig(newConfig);
      toast.success('Configurações salvas com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const carregarConfigPublica = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_agendamento_online' as any)
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar config pública:', error);
        return defaultConfig;
      }

      return (data as unknown as ConfigAgendamentoOnline) || defaultConfig;
    } catch (error) {
      console.error('Erro ao carregar configuração pública:', error);
      return defaultConfig;
    }
  };

  return {
    config,
    loading,
    saving,
    setConfig,
    salvarConfig,
    carregarConfig,
    carregarConfigPublica
  };
}
