import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type { 
  CampanhaMarketing, 
  AutomacaoMarketing, 
  LogAutomacao, 
  DestinatarioCampanha 
} from '@/types/marketing';

export const useSupabaseMarketing = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [campanhas, setCampanhas] = useState<CampanhaMarketing[]>([]);
  const [automacoes, setAutomacoes] = useState<AutomacaoMarketing[]>([]);

  // --- Campanhas ---
  const carregarCampanhas = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampanhas(data as CampanhaMarketing[]);
    } catch (error: unknown) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas de marketing');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const criarCampanha = async (dados: Partial<CampanhaMarketing>) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .insert({
          ...dados,
          user_id: user.id,
          status: 'rascunho',
          metricas: { aberturas: 0, cliques: 0, conversoes: 0 }
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Campanha criada com sucesso!');
      await carregarCampanhas();
      return data as CampanhaMarketing;
    } catch (error: unknown) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const atualizarCampanha = async (id: string, dados: Partial<CampanhaMarketing>) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .update(dados)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Campanha atualizada com sucesso!');
      await carregarCampanhas();
      return data as CampanhaMarketing;
    } catch (error: unknown) {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const excluirCampanha = async (id: string) => {
    if (!user) return false;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('campanhas_marketing')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Campanha excluída com sucesso!');
      await carregarCampanhas();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Automações ---
  const carregarAutomacoes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automacoes_marketing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomacoes(data as AutomacaoMarketing[]);
    } catch (error: unknown) {
      console.error('Erro ao carregar automações:', error);
      toast.error('Erro ao carregar automações de marketing');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const criarAutomacao = async (dados: Partial<AutomacaoMarketing>) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automacoes_marketing')
        .insert({
          ...dados,
          user_id: user.id,
          ativo: true,
          total_execucoes: 0
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Automação criada com sucesso!');
      await carregarAutomacoes();
      return data as AutomacaoMarketing;
    } catch (error: unknown) {
      console.error('Erro ao criar automação:', error);
      toast.error('Erro ao criar automação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const atualizarAutomacao = async (id: string, dados: Partial<AutomacaoMarketing>) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('automacoes_marketing')
        .update(dados)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Automação atualizada!');
      await carregarAutomacoes();
      return data as AutomacaoMarketing;
    } catch (error: unknown) {
      console.error('Erro ao atualizar automação:', error);
      toast.error('Erro ao atualizar automação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const excluirAutomacao = async (id: string) => {
    if (!user) return false;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('automacoes_marketing')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Automação excluída com sucesso!');
      await carregarAutomacoes();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao excluir automação:', error);
      toast.error('Erro ao excluir automação');
      return false;
    } finally {
      setLoading(false);
    }
  };


  const toggleAutomacao = async (id: string, ativo: boolean) => {
    return atualizarAutomacao(id, { ativo });
  };

  return {
    loading,
    campanhas,
    automacoes,
    carregarCampanhas,
    criarCampanha,
    atualizarCampanha,
    excluirCampanha,
    carregarAutomacoes,
    criarAutomacao,
    atualizarAutomacao,
    excluirAutomacao,
    toggleAutomacao
  };
};
