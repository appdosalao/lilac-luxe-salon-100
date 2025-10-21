import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import type {
  ProgramaFidelidade,
  Recompensa,
  SaldoPontos,
  EstatisticasFidelidade,
  RankingFidelidade,
  NivelFidelidade,
  PontoFidelidade,
  ClasseFidelidade,
  RecompensaFormData,
  ProgramaFidelidadeFormData,
  ClasseFidelidadeFormData
} from '@/types/fidelidade';

export const useSupabaseFidelidade = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [programa, setPrograma] = useState<ProgramaFidelidade | null>(null);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFidelidade | null>(null);
  const [ranking, setRanking] = useState<RankingFidelidade[]>([]);
  const [classes, setClasses] = useState<ClasseFidelidade[]>([]);

  // Carregar programa de fidelidade
  const carregarPrograma = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('programas_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPrograma(data);
    } catch (error: any) {
      console.error('Erro ao carregar programa:', error);
    }
  };

  // Carregar recompensas
  const carregarRecompensas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recompensas')
        .select('*')
        .eq('user_id', user.id)
        .order('pontos_necessarios', { ascending: true });

      if (error) throw error;
      setRecompensas((data || []) as Recompensa[]);
    } catch (error: any) {
      console.error('Erro ao carregar recompensas:', error);
    }
  };

  // Carregar estatísticas
  const carregarEstatisticas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('estatisticas_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEstatisticas(data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar ranking
  const carregarRanking = async (limite: number = 10) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ranking_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .lte('ranking', limite)
        .order('ranking', { ascending: true });

      if (error) throw error;
      setRanking((data || []) as RankingFidelidade[]);
    } catch (error: any) {
      console.error('Erro ao carregar ranking:', error);
    }
  };

  // Carregar classes
  const carregarClasses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('classes_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setClasses((data || []) as ClasseFidelidade[]);
    } catch (error: any) {
      console.error('Erro ao carregar classes:', error);
    }
  };

  // Criar ou atualizar programa
  const salvarPrograma = async (dados: ProgramaFidelidadeFormData) => {
    if (!user) return null;

    try {
      setLoading(true);

      if (programa) {
        const { data, error } = await supabase
          .from('programas_fidelidade')
          .update({
            ...dados,
            updated_at: new Date().toISOString()
          })
          .eq('id', programa.id)
          .select()
          .single();

        if (error) throw error;
        setPrograma(data);
        toast.success('Programa atualizado com sucesso!');
        return data;
      } else {
        const { data, error } = await supabase
          .from('programas_fidelidade')
          .insert({
            ...dados,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;
        setPrograma(data);
        toast.success('Programa criado com sucesso!');
        return data;
      }
    } catch (error: any) {
      console.error('Erro ao salvar programa:', error);
      toast.error('Erro ao salvar programa de fidelidade');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Ativar/desativar programa
  const togglePrograma = async () => {
    if (!programa || !user) return;

    try {
      const { data, error } = await supabase
        .from('programas_fidelidade')
        .update({ ativo: !programa.ativo })
        .eq('id', programa.id)
        .select()
        .single();

      if (error) throw error;
      setPrograma(data);
      toast.success(data.ativo ? 'Programa ativado!' : 'Programa desativado!');
    } catch (error: any) {
      console.error('Erro ao alterar status do programa:', error);
      toast.error('Erro ao alterar status do programa');
    }
  };

  // Criar recompensa
  const criarRecompensa = async (dados: RecompensaFormData) => {
    if (!user) return null;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('recompensas')
        .insert({
          ...dados,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await carregarRecompensas();
      toast.success('Recompensa criada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao criar recompensa:', error);
      toast.error('Erro ao criar recompensa');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar recompensa
  const atualizarRecompensa = async (id: string, dados: Partial<RecompensaFormData>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('recompensas')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await carregarRecompensas();
      toast.success('Recompensa atualizada!');
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar recompensa:', error);
      toast.error('Erro ao atualizar recompensa');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Excluir recompensa
  const excluirRecompensa = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('recompensas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await carregarRecompensas();
      toast.success('Recompensa excluída!');
    } catch (error: any) {
      console.error('Erro ao excluir recompensa:', error);
      toast.error('Erro ao excluir recompensa');
    } finally {
      setLoading(false);
    }
  };

  // Criar classe
  const criarClasse = async (dados: ClasseFidelidadeFormData) => {
    if (!user) return null;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('classes_fidelidade')
        .insert({
          ...dados,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await carregarClasses();
      toast.success('Classe criada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Erro ao criar classe:', error);
      toast.error('Erro ao criar classe');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar classe
  const atualizarClasse = async (id: string, dados: Partial<ClasseFidelidadeFormData>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('classes_fidelidade')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await carregarClasses();
      toast.success('Classe atualizada!');
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar classe:', error);
      toast.error('Erro ao atualizar classe');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Excluir classe
  const excluirClasse = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('classes_fidelidade')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await carregarClasses();
      toast.success('Classe excluída!');
    } catch (error: any) {
      console.error('Erro ao excluir classe:', error);
      toast.error('Erro ao excluir classe');
    } finally {
      setLoading(false);
    }
  };

  // Buscar saldo de pontos de um cliente
  const buscarSaldoCliente = async (clienteId: string): Promise<SaldoPontos | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('saldo_pontos')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Erro ao buscar saldo:', error);
      return null;
    }
  };

  // Buscar nível do cliente
  const buscarNivelCliente = async (clienteId: string): Promise<NivelFidelidade | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('niveis_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NivelFidelidade | null;
    } catch (error: any) {
      console.error('Erro ao buscar nível:', error);
      return null;
    }
  };

  // Buscar histórico de pontos
  const buscarHistoricoPontos = async (clienteId: string): Promise<PontoFidelidade[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('pontos_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .eq('cliente_id', clienteId)
        .order('data_ganho', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as PontoFidelidade[];
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  };

  // Adicionar pontos manualmente
  const adicionarPontosManual = async (
    clienteId: string,
    pontos: number,
    descricao: string
  ) => {
    if (!user || !programa) return null;

    try {
      setLoading(true);

      const dataExpiracao = programa.expiracao_pontos_dias > 0
        ? new Date(Date.now() + programa.expiracao_pontos_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;

      const { data, error } = await supabase
        .from('pontos_fidelidade')
        .insert({
          user_id: user.id,
          cliente_id: clienteId,
          pontos,
          origem: 'bonus',
          descricao,
          data_expiracao: dataExpiracao
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(`${pontos} pontos adicionados!`);
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar pontos:', error);
      toast.error('Erro ao adicionar pontos');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('fidelidade-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'programas_fidelidade',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarPrograma();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recompensas',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarRecompensas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classes_fidelidade',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      carregarPrograma();
      carregarRecompensas();
      carregarEstatisticas();
      carregarRanking();
      carregarClasses();
    }
  }, [user]);

  return {
    loading,
    programa,
    recompensas,
    estatisticas,
    ranking,
    classes,
    salvarPrograma,
    togglePrograma,
    criarRecompensa,
    atualizarRecompensa,
    excluirRecompensa,
    criarClasse,
    atualizarClasse,
    excluirClasse,
    buscarSaldoCliente,
    buscarNivelCliente,
    buscarHistoricoPontos,
    adicionarPontosManual,
    carregarRanking,
    recarregar: () => {
      carregarPrograma();
      carregarRecompensas();
      carregarEstatisticas();
      carregarRanking();
      carregarClasses();
    }
  };
};
