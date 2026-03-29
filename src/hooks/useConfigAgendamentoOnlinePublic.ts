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

    const load = async () => {
      try {
        setLoading(true);

        const query = supabasePublic
          .from('configuracoes_agendamento_online' as any)
          .select('*')
          .eq('ativo', true);

        const { data, error } = ownerUserId
          ? await query.eq('user_id', ownerUserId).maybeSingle()
          : await query.order('updated_at', { ascending: false }).limit(1).maybeSingle();

        if (!active) return;
        if (error) {
          setConfig(defaultConfig);
          return;
        }

        setConfig((data as unknown as ConfigAgendamentoOnline) || defaultConfig);
      } catch {
        if (active) setConfig(defaultConfig);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [cacheKey, ownerUserId]);

  return { config, loading };
}

