import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConfiguracoesRealTime = () => {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    // Subscription para mudanças nas configurações de horários
    const channel = supabase
      .channel('configuracoes_real_time')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'configuracoes_horarios'
      }, (payload) => {
        console.log('Configuração de horário atualizada:', payload);
        setLastUpdate(Date.now());
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'intervalos_trabalho'
      }, (payload) => {
        console.log('Intervalo de trabalho atualizado:', payload);
        setLastUpdate(Date.now());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { lastUpdate };
};