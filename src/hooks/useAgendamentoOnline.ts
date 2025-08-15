import { useState, useMemo, useCallback } from 'react';
import { AgendamentoOnlineForm, HorarioDisponivel, ServicoPublico } from '@/types/agendamentoOnline';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';

export function useAgendamentoOnline() {
  const { 
    servicos, 
    agendamentos, 
    clientes,
    createCliente,
    createAgendamento,
  } = useDatabase();

  // Converter serviços para formato público
  const servicosPublicos: ServicoPublico[] = useMemo(() => {
    return servicos.map(servico => ({
      id: servico.id,
      nome: servico.nome,
      duracao: servico.duracao,
      valor: servico.valor,
      descricao: servico.descricao
    }));
  }, [servicos]);

  // Horários de funcionamento (8h às 18h)
  const horariosBase = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  // Verificar se horário está disponível
  const isHorarioDisponivel = useCallback((data: string, horario: string, duracao: number): boolean => {
    const inicioNovo = new Date(`${data}T${horario}`);
    const fimNovo = new Date(inicioNovo.getTime() + duracao * 60000);

    // Verificar conflitos com agendamentos existentes
    const temConflito = agendamentos.some(agendamento => {
      if (agendamento.data !== data || agendamento.status === 'cancelado') {
        return false;
      }

      const inicioExistente = new Date(`${agendamento.data}T${agendamento.hora}`);
      const fimExistente = new Date(inicioExistente.getTime() + agendamento.duracao * 60000);

      // Verificar sobreposição
      return (inicioNovo < fimExistente && fimNovo > inicioExistente);
    });

    console.log(`Verificando horário ${data} ${horario}: conflitos encontrados =`, temConflito);
    return !temConflito;
  }, [agendamentos]);

  // Calcular horários disponíveis para um serviço em uma data específica
  const calcularHorariosDisponiveis = useCallback((servicoId: string, data: string): HorarioDisponivel[] => {
    const servico = servicosPublicos.find(s => s.id === servicoId);
    if (!servico) return [];

    return horariosBase.map(horario => {
      const disponivel = isHorarioDisponivel(data, horario, servico.duracao);
      
      // Verificar se o horário + duração não ultrapassa 18h
      const inicioNovo = new Date(`${data}T${horario}`);
      const fimNovo = new Date(inicioNovo.getTime() + servico.duracao * 60000);
      const horaLimite = new Date(`${data}T18:00`);
      const ultrapassaLimite = fimNovo > horaLimite;

      return {
        horario,
        disponivel: disponivel && !ultrapassaLimite
      };
    });
  }, [servicosPublicos, isHorarioDisponivel]);

  // Validar email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar telefone (formato brasileiro)
  const validarTelefone = (telefone: string): boolean => {
    const digitos = telefone.replace(/[^\d]/g, '');
    return digitos.length >= 10;
  };

  // Formatar telefone
  const formatarTelefone = (value: string): string => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Criar agendamento
  const criarAgendamento = useCallback(async (dados: AgendamentoOnlineForm): Promise<boolean> => {
    try {
      // Validações
      if (!dados.nomeCompleto.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, preencha seu nome completo.",
          variant: "destructive",
        });
        return false;
      }

      if (!validarEmail(dados.email)) {
        toast({
          title: "E-mail inválido",
          description: "Por favor, insira um e-mail válido.",
          variant: "destructive",
        });
        return false;
      }

      if (!validarTelefone(dados.telefone)) {
        toast({
          title: "Telefone inválido",
          description: "Por favor, insira um telefone válido.",
          variant: "destructive",
        });
        return false;
      }

      const servico = servicosPublicos.find(s => s.id === dados.servicoId);
      if (!servico) {
        toast({
          title: "Serviço não encontrado",
          description: "Por favor, selecione um serviço válido.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se a data não é anterior a hoje
      const hoje = new Date();
      const dataAgendamento = new Date(dados.data);
      hoje.setHours(0, 0, 0, 0);
      dataAgendamento.setHours(0, 0, 0, 0);

      if (dataAgendamento < hoje) {
        toast({
          title: "Data inválida",
          description: "Não é possível agendar para datas passadas.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se o horário está disponível
      if (!isHorarioDisponivel(dados.data, dados.horario, servico.duracao)) {
        toast({
          title: "Horário indisponível",
          description: "Este horário não está mais disponível. Por favor, escolha outro.",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se cliente já existe (por email como chave única)
      let cliente = clientes.find(c => c.email === dados.email);
      
      if (!cliente) {
        // Criar novo cliente
        const novoCliente = {
          nomeCompleto: dados.nomeCompleto,
          email: dados.email,
          telefone: dados.telefone,
          servicoFrequente: servico.nome,
          ultimaVisita: new Date(dados.data),
          observacoes: `Cliente criado via agendamento online em ${new Date().toLocaleDateString('pt-BR')}`,
          historicoServicos: []
        };
        
        cliente = await createCliente(novoCliente);
        if (!cliente) {
          toast({
            title: "Erro ao criar cliente",
            description: "Erro ao registrar cliente. Tente novamente.",
            variant: "destructive",
          });
          return false;
        }
      }

      // Criar agendamento
      const agendamentoData = {
        clienteId: cliente.id,
        servicoId: dados.servicoId,
        data: dados.data,
        hora: dados.horario,
        valor: servico.valor,
        valorPago: 0,
        valorDevido: servico.valor,
        formaPagamento: 'fiado' as const,
        statusPagamento: 'em_aberto' as const,
        status: 'agendado' as const,
        observacoes: dados.observacoes ? `${dados.observacoes} (Agendamento online)` : 'Agendamento realizado via formulário online',
        origem: 'online' as const,
        origem_cronograma: false,
        confirmado: false,
        duracao: servico.duracao,
      };

      const agendamentoCriado = await createAgendamento(agendamentoData);
      
      if (!agendamentoCriado) {
        toast({
          title: "Erro ao agendar",
          description: "Erro ao criar agendamento. Tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Agendamento confirmado! ✨",
        description: `Seu agendamento para ${servico.nome} foi confirmado para ${new Date(dados.data).toLocaleDateString('pt-BR')} às ${dados.horario}.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast({
        title: "Erro ao agendar",
        description: "Ocorreu um erro ao processar seu agendamento. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  }, [servicosPublicos, isHorarioDisponivel, createCliente, createAgendamento, clientes]);

  return {
    servicosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento,
    validarEmail,
    validarTelefone,
    formatarTelefone
  };
}