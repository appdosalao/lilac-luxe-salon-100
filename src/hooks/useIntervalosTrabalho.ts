import * as React from 'react';

const { useState, useEffect } = React;
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface IntervaloTrabalho {
  id: string;
  user_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useIntervalosTrabalho = () => {
  const { user } = useSupabaseAuth();
  const [intervalos, setIntervalos] = useState<IntervaloTrabalho[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar intervalos de trabalho
  const fetchIntervalos = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('intervalos_trabalho')
        .select('*')
        .eq('user_id', user.id)
        .order('dia_semana', { ascending: true })
        .order('hora_inicio', { ascending: true });

      if (error) throw error;
      setIntervalos(data || []);
    } catch (error) {
      console.error('Erro ao buscar intervalos de trabalho:', error);
      toast.error('Erro ao carregar intervalos de trabalho');
    }
  };

  // Criar intervalo de trabalho
  const criarIntervalo = async (intervalo: Omit<IntervaloTrabalho, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;

    try {
      // Validações
      if (intervalo.hora_inicio >= intervalo.hora_fim) {
        toast.error('Horário de início deve ser menor que o de fim');
        return;
      }

      // Verificar sobreposição de intervalos no mesmo dia
      const intervalosExistentes = intervalos.filter(i => 
        i.dia_semana === intervalo.dia_semana && i.ativo
      );

      const temSobreposicao = intervalosExistentes.some(existente => {
        return (
          (intervalo.hora_inicio >= existente.hora_inicio && intervalo.hora_inicio < existente.hora_fim) ||
          (intervalo.hora_fim > existente.hora_inicio && intervalo.hora_fim <= existente.hora_fim) ||
          (intervalo.hora_inicio <= existente.hora_inicio && intervalo.hora_fim >= existente.hora_fim)
        );
      });

      if (temSobreposicao) {
        toast.error('Este intervalo se sobrepõe a um intervalo existente');
        return;
      }

      const { data, error } = await supabase
        .from('intervalos_trabalho')
        .insert({
          ...intervalo,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchIntervalos();
      toast.success('Intervalo criado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao criar intervalo:', error);
      toast.error('Erro ao criar intervalo');
      throw error;
    }
  };

  // Atualizar intervalo de trabalho
  const atualizarIntervalo = async (id: string, intervalo: Partial<IntervaloTrabalho>) => {
    try {
      const { data, error } = await supabase
        .from('intervalos_trabalho')
        .update(intervalo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchIntervalos();
      toast.success('Intervalo atualizado com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar intervalo:', error);
      toast.error('Erro ao atualizar intervalo');
      throw error;
    }
  };

  // Deletar intervalo de trabalho
  const deletarIntervalo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('intervalos_trabalho')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchIntervalos();
      toast.success('Intervalo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar intervalo:', error);
      toast.error('Erro ao remover intervalo');
      throw error;
    }
  };

  // Buscar intervalos por dia da semana
  const buscarIntervalosPorDia = (diaSemana: number) => {
    return intervalos.filter(i => i.dia_semana === diaSemana && i.ativo);
  };

  // Verificar se um horário está em algum intervalo
  const verificarSeEstaEmIntervalo = (diaSemana: number, horario: string) => {
    const intervalosoDia = buscarIntervalosPorDia(diaSemana);
    return intervalosoDia.some(intervalo => 
      horario >= intervalo.hora_inicio && horario < intervalo.hora_fim
    );
  };

  useEffect(() => {
    if (user?.id) {
      const loadIntervalos = async () => {
        setLoading(true);
        await fetchIntervalos();
        setLoading(false);
      };

      loadIntervalos();

      // Configurar real-time updates
      const channel = supabase
        .channel('intervalos_trabalho_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'intervalos_trabalho',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchIntervalos();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  return {
    intervalos,
    loading,
    criarIntervalo,
    atualizarIntervalo,
    deletarIntervalo,
    buscarIntervalosPorDia,
    verificarSeEstaEmIntervalo,
    refetch: fetchIntervalos
  };
};