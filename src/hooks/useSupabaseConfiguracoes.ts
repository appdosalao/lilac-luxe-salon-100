import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface ConfiguracaoHorario {
  id: string;
  user_id: string;
  dia_semana: number;
  ativo: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
  permite_agendamento_fora_horario?: boolean;
  tempo_minimo_antecedencia?: number;
  tempo_maximo_antecedencia?: number;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoNotificacoes {
  id: string;
  user_id: string;
  notificacoes_push: boolean;
  notificacoes_email: boolean;
  notificacoes_som: boolean;
  som_personalizado?: string;
  lembrete_agendamento_minutos: number;
  lembrete_vencimento_dias: number;
  lembrete_contas_fixas_dias: number;
  notificar_cancelamentos: boolean;
  notificar_reagendamentos: boolean;
  notificar_pagamentos: boolean;
  notificar_novos_agendamentos: boolean;
  horario_inicio_notificacoes: string;
  horario_fim_notificacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoBackup {
  id: string;
  user_id: string;
  backup_automatico: boolean;
  frequencia_backup: 'diario' | 'semanal' | 'mensal';
  dia_backup?: number;
  hora_backup: string;
  email_backup?: string;
  incluir_clientes: boolean;
  incluir_agendamentos: boolean;
  incluir_servicos: boolean;
  incluir_financeiro: boolean;
  incluir_cronogramas: boolean;
  ultimo_backup?: string;
  proximo_backup?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseConfiguracoes = () => {
  const { user } = useSupabaseAuth();
  const [configuracaoHorarios, setConfiguracaoHorarios] = useState<ConfiguracaoHorario[]>([]);
  const [configuracaoNotificacoes, setConfiguracaoNotificacoes] = useState<ConfiguracaoNotificacoes | null>(null);
  const [configuracaoBackup, setConfiguracaoBackup] = useState<ConfiguracaoBackup | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar configurações de horários
  const fetchHorarios = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('user_id', user.id)
        .order('dia_semana');

      if (error) throw error;
      setConfiguracaoHorarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações de horários:', error);
      toast.error('Erro ao carregar configurações de horários');
    }
  };

  // Buscar configurações de notificações
  const fetchNotificacoes = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes_notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setConfiguracaoNotificacoes(data);
    } catch (error) {
      console.error('Erro ao buscar configurações de notificações:', error);
      toast.error('Erro ao carregar configurações de notificações');
    }
  };

  // Buscar configurações de backup
  const fetchBackup = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes_backup')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setConfiguracaoBackup(data as ConfiguracaoBackup);
    } catch (error) {
      console.error('Erro ao buscar configurações de backup:', error);
      toast.error('Erro ao carregar configurações de backup');
    }
  };

  // Salvar configuração de horário
  const salvarHorario = async (horario: Partial<ConfiguracaoHorario>) => {
    if (!user?.id) return;

    try {
      const horarioData = {
        ...horario,
        user_id: user.id,
        dia_semana: horario.dia_semana!,
        horario_abertura: horario.horario_abertura!,
        horario_fechamento: horario.horario_fechamento!,
      };

      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .upsert(horarioData)
        .select();

      if (error) throw error;
      
      await fetchHorarios();
      toast.success('Configuração de horário salva com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao salvar configuração de horário:', error);
      toast.error('Erro ao salvar configuração de horário');
      throw error;
    }
  };

  // Salvar configuração de notificações
  const salvarNotificacoes = async (notificacoes: Partial<ConfiguracaoNotificacoes>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes_notificacoes')
        .upsert({
          ...notificacoes,
          user_id: user.id,
        })
        .select();

      if (error) throw error;
      
      await fetchNotificacoes();
      toast.success('Configurações de notificações salvas com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
      toast.error('Erro ao salvar configurações de notificações');
      throw error;
    }
  };

  // Salvar configuração de backup
  const salvarBackup = async (backup: Partial<ConfiguracaoBackup>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('configuracoes_backup')
        .upsert({
          ...backup,
          user_id: user.id,
        })
        .select();

      if (error) throw error;
      
      await fetchBackup();
      toast.success('Configurações de backup salvas com sucesso!');
      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações de backup:', error);
      toast.error('Erro ao salvar configurações de backup');
      throw error;
    }
  };

  // Deletar configuração de horário
  const deletarHorario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('configuracoes_horarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchHorarios();
      toast.success('Configuração de horário removida com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar configuração de horário:', error);
      toast.error('Erro ao remover configuração de horário');
      throw error;
    }
  };

  // Buscar horários por dia da semana
  const buscarHorariosPorDia = (diaSemana: number) => {
    return configuracaoHorarios.find(h => h.dia_semana === diaSemana);
  };

  // Verificar se um horário está disponível
  const verificarDisponibilidade = (diaSemana: number, horario: string) => {
    const config = buscarHorariosPorDia(diaSemana);
    if (!config || !config.ativo) return false;

    // Converter horários para minutos para comparação correta
    const [horaAtual, minAtual] = horario.split(':').map(Number);
    const [horaAbertura, minAbertura] = config.horario_abertura.split(':').map(Number);
    const [horaFechamento, minFechamento] = config.horario_fechamento.split(':').map(Number);

    const minutosAtual = horaAtual * 60 + minAtual;
    const minutosAbertura = horaAbertura * 60 + minAbertura;
    const minutosFechamento = horaFechamento * 60 + minFechamento;

    // Verificar se está dentro do horário de funcionamento
    if (minutosAtual < minutosAbertura || minutosAtual >= minutosFechamento) return false;

    // Verificar se não está no intervalo (se configurado)
    if (config.intervalo_inicio && config.intervalo_fim) {
      const [horaInicioInt, minInicioInt] = config.intervalo_inicio.split(':').map(Number);
      const [horaFimInt, minFimInt] = config.intervalo_fim.split(':').map(Number);
      
      const minutosInicioInt = horaInicioInt * 60 + minInicioInt;
      const minutosFimInt = horaFimInt * 60 + minFimInt;
      
      if (minutosAtual >= minutosInicioInt && minutosAtual < minutosFimInt) return false;
    }

    return true;
  };

  // Obter horários disponíveis para um dia específico
  const getHorariosDisponiveisDia = (diaSemana: number, duracaoServico = 60) => {
    const config = buscarHorariosPorDia(diaSemana);
    if (!config || !config.ativo) return [];

    const horarios: string[] = [];
    const [horaInicio, minInicio] = config.horario_abertura.split(':').map(Number);
    const [horaFim, minFim] = config.horario_fechamento.split(':').map(Number);
    
    // Converter para minutos desde meia-noite
    const inicioMinutos = horaInicio * 60 + minInicio;
    const fimMinutos = horaFim * 60 + minFim;
    const incrementoMinutos = 30; // Intervalos de 30 minutos

    for (let minutoAtual = inicioMinutos; minutoAtual + duracaoServico <= fimMinutos; minutoAtual += incrementoMinutos) {
      const horas = Math.floor(minutoAtual / 60);
      const minutos = minutoAtual % 60;
      const horarioStr = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
      
      if (verificarDisponibilidade(diaSemana, horarioStr)) {
        horarios.push(horarioStr);
      }
    }

    return horarios;
  };

  useEffect(() => {
    if (user?.id) {
      const loadConfiguracoes = async () => {
        setLoading(true);
        await Promise.all([
          fetchHorarios(),
          fetchNotificacoes(),
          fetchBackup()
        ]);
        setLoading(false);
      };

      loadConfiguracoes();

      // Configurar real-time updates
      const horariosChannel = supabase
        .channel('configuracoes_horarios_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'configuracoes_horarios',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchHorarios();
        })
        .subscribe();

      const notificacoesChannel = supabase
        .channel('configuracoes_notificacoes_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'configuracoes_notificacoes',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotificacoes();
        })
        .subscribe();

      const backupChannel = supabase
        .channel('configuracoes_backup_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'configuracoes_backup',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchBackup();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(horariosChannel);
        supabase.removeChannel(notificacoesChannel);
        supabase.removeChannel(backupChannel);
      };
    }
  }, [user?.id]);

  return {
    configuracaoHorarios,
    configuracaoNotificacoes,
    configuracaoBackup,
    loading,
    salvarHorario,
    salvarNotificacoes,
    salvarBackup,
    deletarHorario,
    buscarHorariosPorDia,
    verificarDisponibilidade,
    getHorariosDisponiveisDia,
    refetch: () => {
      fetchHorarios();
      fetchNotificacoes();
      fetchBackup();
    }
  };
};