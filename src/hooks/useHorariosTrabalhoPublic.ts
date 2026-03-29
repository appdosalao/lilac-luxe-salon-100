import { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';

interface ConfiguracaoHorarioPublica {
  id: string;
  dia_semana: number;
  ativo: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
}

export const useHorariosTrabalhoPublic = (userId?: string) => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoHorarioPublica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarConfiguracoes();
  }, [userId]);

  const carregarConfiguracoes = async () => {
    try {
      if (!userId) {
        setConfiguracoes([]);
        return;
      }

      const { data, error } = await supabasePublic
        .from('configuracoes_horarios' as any)
        .select('*')
        .eq('ativo', true)
        .eq('user_id', userId)
        .order('dia_semana');

      if (error) throw error;
      setConfiguracoes((data as any[]) || []);
    } catch {
      setConfiguracoes([]);
    } finally {
      setLoading(false);
    }
  };

  const isDiaAtivo = (diaSemana: number): boolean => {
    const config = configuracoes.find(c => c.dia_semana === diaSemana && c.ativo);
    return !!config;
  };

  return {
    configuracoes,
    loading,
    isDiaAtivo,
    refetch: carregarConfiguracoes,
  };
};

