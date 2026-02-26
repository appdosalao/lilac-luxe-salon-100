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

  const parseValor = (v: any): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

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

  // Sincronizar pontos a partir do histórico de agendamentos concluídos/pagos
  const sincronizarDoHistorico = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }
    await carregarPrograma();
    if (!programa || !programa.ativo) {
      toast.error('Ative o programa de fidelidade antes de sincronizar');
      return false;
    }
    try {
      setLoading(true);
      // Buscar agendamentos pagos e concluídos
      const { data: ags, error: errAg } = await supabase
        .from('agendamentos')
        .select('id, cliente_id, valor, valor_pago, status, status_pagamento')
        .eq('user_id', user.id)
        .eq('status', 'concluido')
        .eq('status_pagamento', 'pago');
      if (errAg) throw errAg;

      const ppr = Number(programa.pontos_por_real || 1);
      const expDias = Number(programa.expiracao_pontos_dias || 0);
      let inseridos = 0;
      for (const a of ags || []) {
        const valorBase = parseValor(a.valor_pago) > 0 ? parseValor(a.valor_pago) : parseValor(a.valor);
        const pontos = Math.floor(valorBase * (isNaN(ppr) ? 1 : ppr));
        if (pontos <= 0) continue;
        // evitar duplicidade
        const { data: existe } = await supabase
          .from('pontos_fidelidade')
          .select('id')
          .eq('user_id', user.id)
          .eq('origem', 'agendamento')
          .eq('origem_id', a.id)
          .limit(1);
        if (existe && existe.length > 0) continue;
        const dataExp = expDias > 0
          ? new Date(Date.now() + expDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : null;
        await supabase.from('pontos_fidelidade').insert({
          user_id: user.id,
          cliente_id: a.cliente_id,
          pontos,
          origem: 'agendamento',
          origem_id: a.id,
          descricao: 'Pontos sincronizados do histórico',
          data_expiracao: dataExp,
          expirado: false
        });
        inseridos++;
      }

      // Atualizar níveis com base no saldo_pontos e classes
      const { data: saldos } = await supabase
        .from('saldo_pontos')
        .select('*')
        .eq('user_id', user.id);
      const { data: cls } = await supabase
        .from('classes_fidelidade')
        .select('*')
        .eq('user_id', user.id)
        .order('pontos_minimos', { ascending: true });

      for (const s of saldos || []) {
        const pontosTotais = Number(s.pontos_ganhos || 0);
        const disponiveis = Number(s.pontos_disponiveis || 0);
        let nivel = 'Bronze';
        if (cls && cls.length > 0) {
          for (const c of cls) {
            if (pontosTotais >= Number(c.pontos_minimos || 0)) {
              nivel = c.nome;
            }
          }
        }
        await supabase
          .from('niveis_fidelidade')
          .upsert({
            user_id: user.id,
            cliente_id: s.cliente_id,
            nivel,
            pontos_totais: pontosTotais,
            pontos_disponiveis: disponiveis,
            total_resgates: 0,
            data_atualizacao: new Date().toISOString()
          }, { onConflict: 'user_id,cliente_id' });
      }

      await carregarEstatisticas();
      await carregarRanking();
      toast.success(`Sincronização concluída${inseridos ? ` (${inseridos} créditos novos)` : ''}`);
      return true;
    } catch (error: any) {
      console.error('Erro ao sincronizar histórico:', error);
      toast.error('Erro ao sincronizar pontos do histórico');
      return false;
    } finally {
      setLoading(false);
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
      // Programa
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
      // Recompensas
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
      // Classes
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
      // Pontos e Resgates: atualizar estatísticas e ranking em tempo real
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pontos_fidelidade',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarEstatisticas();
          carregarRanking();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historico_resgates',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          carregarEstatisticas();
          carregarRanking();
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
    sincronizarDoHistorico,
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
