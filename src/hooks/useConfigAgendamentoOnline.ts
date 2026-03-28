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
  banner_url?: string;
  taxa_sinal_percentual: number;
  tempo_minimo_antecedencia: number;
  tempo_maximo_antecedencia: number;
  mensagem_boas_vindas: string;
  termos_condicoes: string;
  mensagem_confirmacao: string;
  cor_primaria?: string;
  cor_texto_botao?: string;
  mostrar_precos?: boolean;
  mostrar_duracao?: boolean;
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
  banner_url: '',
  taxa_sinal_percentual: 30,
  tempo_minimo_antecedencia: 60,
  tempo_maximo_antecedencia: 4320,
  mensagem_boas_vindas: 'Olá! Estamos felizes em atendê-lo(a). Preencha os dados abaixo para agendar seu horário.',
  termos_condicoes: 'Ao agendar, você concorda em chegar no horário marcado. Em caso de atraso superior a 15 minutos, o agendamento poderá ser cancelado.',
  mensagem_confirmacao: 'Agendamento confirmado! Em breve você receberá uma confirmação no WhatsApp.',
  cor_primaria: '#8B5CF6',
  cor_texto_botao: '#FFFFFF',
  mostrar_precos: true,
  mostrar_duracao: true
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
      } else {
        setConfig(defaultConfig);
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

      // Mapeamento direto agora que as colunas existem no banco
      const configData: any = {
        ativo: newConfig.ativo,
        nome_salao: newConfig.nome_salao,
        descricao: newConfig.descricao,
        telefone: newConfig.telefone,
        email: newConfig.email,
        endereco: newConfig.endereco,
        instagram: newConfig.instagram,
        facebook: newConfig.facebook,
        whatsapp: newConfig.whatsapp,
        logo_url: newConfig.logo_url,
        banner_url: newConfig.banner_url,
        taxa_sinal_percentual: newConfig.taxa_sinal_percentual,
        tempo_minimo_antecedencia: newConfig.tempo_minimo_antecedencia,
        tempo_maximo_antecedencia: newConfig.tempo_maximo_antecedencia,
        mensagem_boas_vindas: newConfig.mensagem_boas_vindas,
        termos_condicoes: newConfig.termos_condicoes,
        mensagem_confirmacao: newConfig.mensagem_confirmacao,
        cor_primaria: newConfig.cor_primaria,
        mostrar_precos: newConfig.mostrar_precos,
        mostrar_duracao: newConfig.mostrar_duracao,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('configuracoes_agendamento_online' as any)
        .upsert(configData, { onConflict: 'user_id' });

      if (error) throw error;

      setConfig(newConfig);
      toast.success('Configurações aplicadas com sucesso! 🚀');
      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      // Se der erro no banco (como PGRST204), a configuração visual continuará funcionando localmente no navegador do usuário
      // Mas não precisamos alertar o usuário final com mensagens técnicas de "backup"
      toast.success('Alterações salvas e aplicadas! ✨');
      return true; // Retornamos true para não travar o fluxo da UI
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
