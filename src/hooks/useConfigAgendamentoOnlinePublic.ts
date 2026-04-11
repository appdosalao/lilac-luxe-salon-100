import { useEffect, useMemo, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import type { ConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';

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
  mensagem_confirmacao: 'Agendamento recebido! Em breve você receberá uma confirmação.',
  cor_primaria: '#8B5CF6',
  cor_texto_botao: '#FFFFFF',
  mostrar_precos: true,
  mostrar_duracao: true,
};

export function useConfigAgendamentoOnlinePublic(ownerUserId?: string | null) {
  const [config, setConfig] = useState<ConfigAgendamentoOnline>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const cacheKey = useMemo(() => ownerUserId || 'default', [ownerUserId]);

  useEffect(() => {
    let active = true;

    async function fetchConfig() {
      try {
        setLoading(true);
        const query = supabasePublic
          .from('configuracoes_agendamento_online' as any)
          .select('*');

        if (!ownerUserId) {
          if (active) {
            setConfig(defaultConfig);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await query.eq('user_id', ownerUserId).maybeSingle();

        if (!active) return;

        if (error) {
          console.error('Erro ao carregar config pública:', error);
          setConfig(defaultConfig);
        } else {
          setConfig((data as unknown as ConfigAgendamentoOnline) || defaultConfig);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração pública:', error);
        setConfig(defaultConfig);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchConfig();

    return () => {
      active = false;
    };
  }, [cacheKey, ownerUserId]);

  return { config, loading };
}

