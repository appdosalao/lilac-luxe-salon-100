import * as React from 'react';

const { useState, useEffect } = React;
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracaoHorario {
  id: string;
  dia_semana: number;
  ativo: boolean;
  horario_abertura: string;
  horario_fechamento: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
}

export const useHorariosTrabalho = (userId?: string) => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoHorario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarConfiguracoes();
  }, [userId]);

  const carregarConfiguracoes = async () => {
    try {
      let query = supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('ativo', true)
        .order('dia_semana');

      // Se não foi passado userId específico, pegar o primeiro usuário disponível
      if (!userId) {
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id')
          .limit(1);
        
        if (usuarios && usuarios.length > 0) {
          query = query.eq('user_id', usuarios[0].id);
        }
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConfiguracoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações de horário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se um dia está ativo para atendimento
  const isDiaAtivo = (diaSemana: number): boolean => {
    // Para agendamento online, o dia está ativo se ao menos uma configuração estiver ativa
    const config = configuracoes.find(c => c.dia_semana === diaSemana && c.ativo);
    return !!config;
  };

  // Verificar se um horário está dentro do horário de funcionamento
  const isHorarioValido = (diaSemana: number, horario: string): boolean => {
    const config = configuracoes.find(c => c.dia_semana === diaSemana && c.ativo);
    if (!config) return false;

    const horarioMinutos = timeToMinutes(horario);
    const aberturaMinutos = timeToMinutes(config.horario_abertura);
    const fechamentoMinutos = timeToMinutes(config.horario_fechamento);

    // Verificar se está dentro do horário de funcionamento
    if (horarioMinutos < aberturaMinutos || horarioMinutos >= fechamentoMinutos) {
      return false;
    }

    // Verificar se não está no intervalo de almoço
    if (config.intervalo_inicio && config.intervalo_fim) {
      const inicioAlmocoMinutos = timeToMinutes(config.intervalo_inicio);
      const fimAlmocoMinutos = timeToMinutes(config.intervalo_fim);
      
      if (horarioMinutos >= inicioAlmocoMinutos && horarioMinutos < fimAlmocoMinutos) {
        return false;
      }
    }

    return true;
  };

  // Gerar horários disponíveis para um dia específico
  const getHorariosDisponiveis = (diaSemana: number, duracaoServico: number = 60): string[] => {
    const config = configuracoes.find(c => c.dia_semana === diaSemana && c.ativo);
    if (!config) return [];

    const horarios: string[] = [];
    const aberturaMinutos = timeToMinutes(config.horario_abertura);
    const fechamentoMinutos = timeToMinutes(config.horario_fechamento);
    const inicioAlmocoMinutos = config.intervalo_inicio ? timeToMinutes(config.intervalo_inicio) : null;
    const fimAlmocoMinutos = config.intervalo_fim ? timeToMinutes(config.intervalo_fim) : null;

    // Gerar horários de 30 em 30 minutos
    for (let minutos = aberturaMinutos; minutos < fechamentoMinutos; minutos += 30) {
      const fimServicoMinutos = minutos + duracaoServico;

      // Verificar se o serviço termina antes do fechamento
      if (fimServicoMinutos > fechamentoMinutos) continue;

      // Verificar conflito com intervalo de almoço
      if (inicioAlmocoMinutos && fimAlmocoMinutos) {
        // Se o serviço começa ou termina durante o almoço, pular
        if ((minutos >= inicioAlmocoMinutos && minutos < fimAlmocoMinutos) ||
            (fimServicoMinutos > inicioAlmocoMinutos && fimServicoMinutos <= fimAlmocoMinutos) ||
            (minutos < inicioAlmocoMinutos && fimServicoMinutos > fimAlmocoMinutos)) {
          continue;
        }
      }

      horarios.push(minutesToTime(minutos));
    }

    return horarios;
  };

  // Verificar se um agendamento completo é válido
  const isAgendamentoValido = (data: string, horario: string, duracao: number = 60): boolean => {
    const dataSelecionada = new Date(data + 'T00:00:00');
    const diaSemana = dataSelecionada.getDay();

    if (!isDiaAtivo(diaSemana)) return false;
    if (!isHorarioValido(diaSemana, horario)) return false;

    // Verificar se o serviço termina dentro do horário de funcionamento
    const config = configuracoes.find(c => c.dia_semana === diaSemana && c.ativo);
    if (!config) return false;

    const horarioMinutos = timeToMinutes(horario);
    const fimServicoMinutos = horarioMinutos + duracao;
    const fechamentoMinutos = timeToMinutes(config.horario_fechamento);

    if (fimServicoMinutos > fechamentoMinutos) return false;

    // Verificar conflito com intervalo de almoço
    if (config.intervalo_inicio && config.intervalo_fim) {
      const inicioAlmocoMinutos = timeToMinutes(config.intervalo_inicio);
      const fimAlmocoMinutos = timeToMinutes(config.intervalo_fim);
      
      if ((horarioMinutos < fimAlmocoMinutos && fimServicoMinutos > inicioAlmocoMinutos)) {
        return false;
      }
    }

    return true;
  };

  return {
    configuracoes,
    loading,
    isDiaAtivo,
    isHorarioValido,
    isAgendamentoValido,
    getHorariosDisponiveis,
    refetch: carregarConfiguracoes
  };
};

// Funções utilitárias
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};