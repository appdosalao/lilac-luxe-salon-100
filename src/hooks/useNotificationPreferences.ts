import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  novo_agendamento: boolean;
  cancelamento_agendamento: boolean;
  lembrete_agendamento: boolean;
  alerta_financeiro: boolean;
  retorno_cronograma: boolean;
  confirmacao_cliente: boolean;
  lembrete_cliente: boolean;
  ofertas_fidelidade: boolean;
  som_notificacao: string;
  vibracao: boolean;
}

export const useNotificationPreferences = () => {
  const { usuario } = useSupabaseAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (usuario) {
      loadPreferences();
    }
  }, [usuario]);

  const loadPreferences = async () => {
    if (!usuario) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notificacoes_preferencias')
        .select('*')
        .eq('user_id', usuario.id)
        .single();

      if (error) {
        // Se não existir, criar com valores padrão
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: insertError } = await supabase
            .from('notificacoes_preferencias')
            .insert({
              user_id: usuario.id,
              novo_agendamento: true,
              cancelamento_agendamento: true,
              lembrete_agendamento: true,
              alerta_financeiro: true,
              retorno_cronograma: true,
              confirmacao_cliente: false,
              lembrete_cliente: false,
              ofertas_fidelidade: false,
              som_notificacao: 'notification',
              vibracao: true
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setPreferences(newPrefs as NotificationPreferences);
        } else {
          throw error;
        }
      } else {
        setPreferences(data as NotificationPreferences);
      }
    } catch (error: any) {
      console.error('Erro ao carregar preferências:', error);
      toast.error('Erro ao carregar preferências de notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!usuario) return false;

    try {
      const { error } = await supabase
        .from('notificacoes_preferencias')
        .update(updates)
        .eq('user_id', usuario.id);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Preferências atualizadas com sucesso');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao atualizar preferências');
      return false;
    }
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
    reloadPreferences: loadPreferences
  };
};
