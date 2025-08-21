import * as React from 'react';

const { useState, useEffect } = React;
import { supabase } from '@/integrations/supabase/client';

export interface RelatorioAuditoria {
  id: string;
  user_id: string;
  data_execucao: string;
  total_problemas: number;
  problemas_criticos: number;
  problemas_altos: number;
  problemas_medios: number;
  problemas_baixos: number;
  estatisticas: any;
  sugestoes_melhorias: string[];
  created_at: string;
  updated_at: string;
}

export interface ProblemaAuditoria {
  id: string;
  relatorio_id: string;
  user_id: string;
  categoria: 'critico' | 'alto' | 'medio' | 'baixo';
  tipo: string;
  descricao: string;
  entidade: string;
  entidade_id: string;
  campo?: string;
  valor_atual?: string;
  valor_esperado?: string;
  sugestao?: string;
  resolvido: boolean;
  data_resolucao?: string;
  created_at: string;
  updated_at: string;
}

export interface LogSistema {
  id: string;
  user_id?: string;
  nivel: 'info' | 'warning' | 'error' | 'debug';
  categoria: string;
  acao: string;
  descricao: string;
  entidade_tipo?: string;
  entidade_id?: string;
  metadados?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface NovoRelatorioAuditoria {
  total_problemas: number;
  problemas_criticos: number;
  problemas_altos: number;
  problemas_medios: number;
  problemas_baixos: number;
  estatisticas: any;
  sugestoes_melhorias: string[];
}

export interface NovoProblemaAuditoria {
  relatorio_id: string;
  categoria: 'critico' | 'alto' | 'medio' | 'baixo';
  tipo: string;
  descricao: string;
  entidade: string;
  entidade_id: string;
  campo?: string;
  valor_atual?: string;
  valor_esperado?: string;
  sugestao?: string;
}

export interface NovoLogSistema {
  nivel: 'info' | 'warning' | 'error' | 'debug';
  categoria: string;
  acao: string;
  descricao: string;
  entidade_tipo?: string;
  entidade_id?: string;
  metadados?: any;
}

export const useSupabaseAuditoria = () => {
  const [relatorios, setRelatorios] = useState<RelatorioAuditoria[]>([]);
  const [problemas, setProblemas] = useState<ProblemaAuditoria[]>([]);
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar relatórios de auditoria
  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('relatorios_auditoria')
        .select('*')
        .order('data_execucao', { ascending: false });

      if (error) throw error;
      setRelatorios(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  // Carregar problemas de auditoria
  const loadProblemas = async (relatorioId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('problemas_auditoria')
        .select('*')
        .order('created_at', { ascending: false });

      if (relatorioId) {
        query = query.eq('relatorio_id', relatorioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const formattedProblemas: ProblemaAuditoria[] = (data || []).map(item => ({
        id: item.id,
        relatorio_id: item.relatorio_id,
        user_id: item.user_id,
        categoria: item.categoria as 'critico' | 'alto' | 'medio' | 'baixo',
        tipo: item.tipo,
        descricao: item.descricao,
        entidade: item.entidade,
        entidade_id: item.entidade_id,
        campo: item.campo,
        valor_atual: item.valor_atual,
        valor_esperado: item.valor_esperado,
        sugestao: item.sugestao,
        resolvido: item.resolvido,
        data_resolucao: item.data_resolucao,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setProblemas(formattedProblemas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar problemas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs do sistema
  const loadLogs = async (filtros?: { 
    nivel?: string; 
    categoria?: string; 
    limite?: number 
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('logs_sistema')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.nivel) {
        query = query.eq('nivel', filtros.nivel);
      }

      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros?.limite) {
        query = query.limit(filtros.limite);
      } else {
        query = query.limit(100); // Limite padrão
      }

      const { data, error } = await query;

      if (error) throw error;
      const formattedLogs: LogSistema[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        nivel: item.nivel as 'info' | 'warning' | 'error' | 'debug',
        categoria: item.categoria,
        acao: item.acao,
        descricao: item.descricao,
        entidade_tipo: item.entidade_tipo,
        entidade_id: item.entidade_id,
        metadados: item.metadados,
        ip_address: item.ip_address as string,
        user_agent: item.user_agent,
        created_at: item.created_at,
      }));
      setLogs(formattedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  // Criar relatório de auditoria
  const createRelatorio = async (relatorio: NovoRelatorioAuditoria): Promise<string> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('relatorios_auditoria')
        .insert({
          user_id: user.user.id,
          ...relatorio
        })
        .select()
        .single();

      if (error) throw error;
      await loadRelatorios();
      return data.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar relatório');
      throw err;
    }
  };

  // Criar problema de auditoria
  const createProblema = async (problema: NovoProblemaAuditoria) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('problemas_auditoria')
        .insert({
          user_id: user.user.id,
          ...problema
        })
        .select()
        .single();

      if (error) throw error;
      await loadProblemas();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar problema');
      throw err;
    }
  };

  // Criar múltiplos problemas em lote
  const createProblemasLote = async (relatorioId: string, problemas: Omit<NovoProblemaAuditoria, 'relatorio_id'>[]) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const problemasComRelatorio = problemas.map(problema => ({
        user_id: user.user.id,
        relatorio_id: relatorioId,
        ...problema
      }));

      const { error } = await supabase
        .from('problemas_auditoria')
        .insert(problemasComRelatorio);

      if (error) throw error;
      await loadProblemas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar problemas em lote');
      throw err;
    }
  };

  // Marcar problema como resolvido
  const resolverProblema = async (problemaId: string) => {
    try {
      const { error } = await supabase
        .from('problemas_auditoria')
        .update({
          resolvido: true,
          data_resolucao: new Date().toISOString()
        })
        .eq('id', problemaId);

      if (error) throw error;
      await loadProblemas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resolver problema');
      throw err;
    }
  };

  // Criar log do sistema
  const createLog = async (log: NovoLogSistema) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('logs_sistema')
        .insert({
          user_id: user.user?.id,
          ...log
        });

      if (error) throw error;
      // Não recarrega automaticamente para performance
    } catch (err) {
      // Logs não devem falhar silenciosamente
      console.error('Erro ao criar log:', err);
    }
  };

  // Obter último relatório
  const getUltimoRelatorio = async (): Promise<RelatorioAuditoria | null> => {
    try {
      const { data, error } = await supabase
        .from('relatorios_auditoria')
        .select('*')
        .order('data_execucao', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar último relatório');
      return null;
    }
  };

  // Obter problemas não resolvidos
  const getProblemasNaoResolvidos = async (): Promise<ProblemaAuditoria[]> => {
    try {
      const { data, error } = await supabase
        .from('problemas_auditoria')
        .select('*')
        .eq('resolvido', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formattedProblemas: ProblemaAuditoria[] = (data || []).map(item => ({
        id: item.id,
        relatorio_id: item.relatorio_id,
        user_id: item.user_id,
        categoria: item.categoria as 'critico' | 'alto' | 'medio' | 'baixo',
        tipo: item.tipo,
        descricao: item.descricao,
        entidade: item.entidade,
        entidade_id: item.entidade_id,
        campo: item.campo,
        valor_atual: item.valor_atual,
        valor_esperado: item.valor_esperado,
        sugestao: item.sugestao,
        resolvido: item.resolvido,
        data_resolucao: item.data_resolucao,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      return formattedProblemas;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar problemas não resolvidos');
      return [];
    }
  };

  // Estatísticas gerais
  const getEstatisticasGerais = async () => {
    try {
      const [relatoriosResult, problemasResult] = await Promise.all([
        supabase.from('relatorios_auditoria').select('id', { count: 'exact' }),
        supabase.from('problemas_auditoria').select('id, resolvido', { count: 'exact' })
      ]);

      const totalRelatorios = relatoriosResult.count || 0;
      const totalProblemas = problemasResult.count || 0;
      
      const { count: problemasNaoResolvidosCount } = await supabase
        .from('problemas_auditoria')
        .select('id', { count: 'exact' })
        .eq('resolvido', false);

      const problemasAbertos = problemasNaoResolvidosCount || 0;

      return {
        totalRelatorios,
        totalProblemas,
        problemasAbertos,
        problemasResolvidos: totalProblemas - problemasAbertos
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas gerais');
      return {
        totalRelatorios: 0,
        totalProblemas: 0,
        problemasAbertos: 0,
        problemasResolvidos: 0
      };
    }
  };

  useEffect(() => {
    loadRelatorios();
    loadLogs();

    // Setup real-time subscriptions
    const channel = supabase
      .channel('auditoria-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relatorios_auditoria'
        },
        () => {
          loadRelatorios();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problemas_auditoria'
        },
        () => {
          loadProblemas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs_sistema'
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    relatorios,
    problemas,
    logs,
    loading,
    error,
    loadRelatorios,
    loadProblemas,
    loadLogs,
    createRelatorio,
    createProblema,
    createProblemasLote,
    resolverProblema,
    createLog,
    getUltimoRelatorio,
    getProblemasNaoResolvidos,
    getEstatisticasGerais
  };
};