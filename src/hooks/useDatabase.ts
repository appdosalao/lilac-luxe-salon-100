import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/database';
import { Cliente } from '@/types/cliente';
import { Servico } from '@/types/servico';
import { Agendamento } from '@/types/agendamento';
import { Cronograma, Retorno } from '@/types/cronograma';
import { Lancamento } from '@/types/lancamento';
import { ContaFixa, CategoriaFinanceira } from '@/types/contaFixa';
import { toast } from '@/hooks/use-toast';

export const useDatabase = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estados para cache dos dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [cronogramas, setCronogramas] = useState<Cronograma[]>([]);
  const [retornos, setRetornos] = useState<Retorno[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [categoriasFinanceiras, setCategoriasFinanceiras] = useState<CategoriaFinanceira[]>([]);

  const userId = usuario?.id;

  // Carregar todos os dados
  const loadAllData = useCallback(() => {
    if (!userId) return;

    setClientes(db.getClientes(userId));
    setServicos(db.getServicos(userId));
    setAgendamentos(db.getAgendamentos(userId));
    setCronogramas(db.getCronogramas(userId));
    setRetornos(db.getRetornos(userId));
    setLancamentos(db.getLancamentos(userId));
    setContasFixas(db.getContasFixas(userId));
    setCategoriasFinanceiras(db.getCategoriasFinanceiras(userId));
  }, [userId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // CLIENTES
  const createCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const novoCliente = db.createCliente(userId, clienteData);
      setClientes(prev => [...prev, novoCliente]);
      toast({
        title: "Cliente criado",
        description: "Cliente cadastrado com sucesso.",
      });
      return novoCliente;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cliente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateCliente = useCallback(async (id: string, updates: Partial<Cliente>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const clienteAtualizado = db.updateCliente(userId, id, updates);
      if (clienteAtualizado) {
        setClientes(prev => prev.map(c => c.id === id ? clienteAtualizado : c));
        toast({
          title: "Cliente atualizado",
          description: "Dados do cliente atualizados com sucesso.",
        });
      }
      return clienteAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteCliente = useCallback(async (id: string) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      const success = db.deleteCliente(userId, id);
      if (success) {
        setClientes(prev => prev.filter(c => c.id !== id));
        toast({
          title: "Cliente removido",
          description: "Cliente removido com sucesso.",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover cliente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // SERVIÇOS
  const createServico = useCallback(async (servicoData: Omit<Servico, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const novoServico = db.createServico(userId, servicoData);
      setServicos(prev => [...prev, novoServico]);
      toast({
        title: "Serviço criado",
        description: "Serviço cadastrado com sucesso.",
      });
      return novoServico;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar serviço.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateServico = useCallback(async (id: string, updates: Partial<Servico>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const servicoAtualizado = db.updateServico(userId, id, updates);
      if (servicoAtualizado) {
        setServicos(prev => prev.map(s => s.id === id ? servicoAtualizado : s));
        toast({
          title: "Serviço atualizado",
          description: "Dados do serviço atualizados com sucesso.",
        });
      }
      return servicoAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // AGENDAMENTOS
  const createAgendamento = useCallback(async (agendamentoData: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt' | 'clienteNome' | 'servicoNome'>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      // Verificar disponibilidade
      const isDisponivel = db.isHorarioDisponivel(
        userId, 
        agendamentoData.data, 
        agendamentoData.hora, 
        agendamentoData.duracao || 60
      );

      if (!isDisponivel) {
        toast({
          title: "Horário indisponível",
          description: "Este horário já está ocupado.",
          variant: "destructive",
        });
        return null;
      }

      const novoAgendamento = db.createAgendamento(userId, agendamentoData);
      setAgendamentos(prev => [...prev, novoAgendamento]);
      
      // Se for de cronograma, gerar próximos agendamentos
      if (agendamentoData.cronogramaId) {
        await gerarProximosAgendamentosCronograma(agendamentoData.cronogramaId, novoAgendamento);
      }

      toast({
        title: "Agendamento criado",
        description: "Agendamento cadastrado com sucesso.",
      });
      return novoAgendamento;
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar agendamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateAgendamento = useCallback(async (id: string, updates: Partial<Agendamento>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const agendamentoAtualizado = db.updateAgendamento(userId, id, updates);
      if (agendamentoAtualizado) {
        setAgendamentos(prev => prev.map(a => a.id === id ? agendamentoAtualizado : a));
        
        // Recarregar lançamentos se status mudou para concluído
        if (updates.status === 'concluido') {
          setLancamentos(db.getLancamentos(userId));
        }

        toast({
          title: "Agendamento atualizado",
          description: "Agendamento atualizado com sucesso.",
        });
      }
      return agendamentoAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar agendamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // CRONOGRAMAS
  const createCronograma = useCallback(async (cronogramaData: Omit<Cronograma, 'id_cronograma' | 'created_at' | 'updated_at'>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const novoCronograma = db.createCronograma(userId, cronogramaData);
      setCronogramas(prev => [...prev, novoCronograma]);
      toast({
        title: "Cronograma criado",
        description: "Cronograma cadastrado com sucesso.",
      });
      return novoCronograma;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cronograma.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateCronograma = useCallback(async (id: string, updates: Partial<Cronograma>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const cronogramaAtualizado = db.updateCronograma(userId, id, updates);
      if (cronogramaAtualizado) {
        setCronogramas(prev => prev.map(c => c.id_cronograma === id ? cronogramaAtualizado : c));
        toast({
          title: "Cronograma atualizado",
          description: "Cronograma atualizado com sucesso.",
        });
      }
      return cronogramaAtualizado;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cronograma.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteCronograma = useCallback(async (id: string) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      const success = db.deleteCronograma(userId, id);
      if (success) {
        setCronogramas(prev => prev.filter(c => c.id_cronograma !== id));
        toast({
          title: "Cronograma removido",
          description: "Cronograma removido com sucesso.",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover cronograma.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // LANÇAMENTOS
  const createLancamento = useCallback(async (lancamentoData: Omit<Lancamento, 'id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const novoLancamento = db.createLancamento(userId, lancamentoData);
      setLancamentos(prev => [...prev, novoLancamento]);
      toast({
        title: "Lançamento criado",
        description: "Lançamento registrado com sucesso.",
      });
      return novoLancamento;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar lançamento.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Função para gerar próximos agendamentos de cronograma
  const gerarProximosAgendamentosCronograma = useCallback(async (cronogramaId: string, agendamentoBase: Agendamento) => {
    if (!userId) return;

    const cronograma = cronogramas.find(c => c.id_cronograma === cronogramaId);
    if (!cronograma) return;

    // Criar próximos 3 agendamentos baseados no intervalo
    const proximosAgendamentos = [];
    for (let i = 1; i <= 3; i++) {
      const dataProxima = new Date(agendamentoBase.data);
      dataProxima.setDate(dataProxima.getDate() + (cronograma.intervalo_dias * i));
      
      const dataFormatada = dataProxima.toISOString().split('T')[0];
      
      // Verificar se o horário está disponível
      if (db.isHorarioDisponivel(userId, dataFormatada, agendamentoBase.hora, agendamentoBase.duracao)) {
        proximosAgendamentos.push({
          clienteId: agendamentoBase.clienteId,
          servicoId: agendamentoBase.servicoId,
          data: dataFormatada,
          hora: agendamentoBase.hora,
          valor: agendamentoBase.valor,
          valorPago: 0,
          valorDevido: agendamentoBase.valor,
          formaPagamento: 'fiado' as const,
          statusPagamento: 'em_aberto' as const,
          status: 'agendado' as const,
        observacoes: `Agendamento automático do cronograma: ${cronograma.tipo_servico}`,
        origem_cronograma: true,
          origem: 'cronograma' as const,
          cronogramaId: cronogramaId,
          confirmado: false,
        });

        // Criar retorno correspondente
        db.createRetorno(userId, {
          id_cliente: agendamentoBase.clienteId,
          id_cronograma: cronogramaId,
          data_retorno: dataFormatada,
          status: 'Pendente',
        });
      }
    }

    // Criar os agendamentos
    for (const agendamento of proximosAgendamentos) {
      const novo = db.createAgendamento(userId, agendamento);
      setAgendamentos(prev => [...prev, novo]);
    }

    // Recarregar retornos
    setRetornos(db.getRetornos(userId));

    if (proximosAgendamentos.length > 0) {
      toast({
        title: "Cronograma ativado",
        description: `${proximosAgendamentos.length} agendamentos futuros criados automaticamente.`,
      });
    }
  }, [userId, cronogramas]);

  // MÉTODOS AUXILIARES PARA RELATÓRIOS
  const getClienteComEstatisticas = useCallback((clienteId: string) => {
    if (!userId) return null;

    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return null;

    const agendamentosCliente = db.getAgendamentosPorCliente(userId, clienteId);
    const totalAgendamentos = agendamentosCliente.length;
    const valorPago = agendamentosCliente.reduce((sum, a) => sum + a.valorPago, 0);
    const valorFiado = agendamentosCliente.reduce((sum, a) => sum + a.valorDevido, 0);
    const cronogramasAtivos = retornos.filter(r => r.id_cliente === clienteId && r.status === 'Pendente').length;

    return {
      ...cliente,
      totalAgendamentos,
      valorPago,
      valorFiado,
      cronogramasAtivos,
    };
  }, [userId, clientes, retornos]);

  const isHorarioDisponivel = useCallback((data: string, hora: string, duracao: number, excludeId?: string) => {
    if (!userId) return false;
    return db.isHorarioDisponivel(userId, data, hora, duracao, excludeId);
  }, [userId]);

  return {
    loading,
    // Dados
    clientes,
    servicos,
    agendamentos,
    cronogramas,
    retornos,
    lancamentos,
    contasFixas,
    categoriasFinanceiras,
    // Métodos CRUD
    createCliente,
    updateCliente,
    deleteCliente,
    createServico,
    updateServico,
    createAgendamento,
    updateAgendamento,
    createCronograma,
    updateCronograma,
    deleteCronograma,
    createLancamento,
    createMultipleAgendamentos: async (agendamentos: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt' | 'clienteNome' | 'servicoNome'>[]) => {
      if (!userId) return [];
      return db.createMultipleAgendamentos(userId, agendamentos);
    },
    // Métodos auxiliares
    getClienteComEstatisticas,
    isHorarioDisponivel,
    gerarProximosAgendamentosCronograma,
    loadAllData,
  };
};