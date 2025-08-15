import { Usuario } from '@/types/usuario';
import { Cliente } from '@/types/cliente';
import { Servico } from '@/types/servico';
import { Agendamento } from '@/types/agendamento';
import { Cronograma, Retorno } from '@/types/cronograma';
import { Lancamento } from '@/types/lancamento';
import { ContaFixa, CategoriaFinanceira } from '@/types/contaFixa';

// Sistema de banco local estruturado para facilitar migração para Supabase
export class LocalDatabase {
  private static instance: LocalDatabase;
  
  static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  // Métodos para obter dados por usuário
  private getKey(table: string, userId: string): string {
    return `${table}_${userId}`;
  }

  private getData<T>(table: string, userId: string): T[] {
    const key = this.getKey(table, userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(table: string, userId: string, data: T[]): void {
    const key = this.getKey(table, userId);
    localStorage.setItem(key, JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // CLIENTES
  getClientes(userId: string): Cliente[] {
    return this.getData<Cliente>('clientes', userId);
  }

  createCliente(userId: string, cliente: Omit<Cliente, 'id'>): Cliente {
    const clientes = this.getClientes(userId);
    const novoCliente: Cliente = {
      ...cliente,
      id: this.generateId(),
    };
    clientes.push(novoCliente);
    this.setData('clientes', userId, clientes);
    return novoCliente;
  }

  updateCliente(userId: string, id: string, updates: Partial<Cliente>): Cliente | null {
    const clientes = this.getClientes(userId);
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    clientes[index] = { ...clientes[index], ...updates };
    this.setData('clientes', userId, clientes);
    return clientes[index];
  }

  deleteCliente(userId: string, id: string): boolean {
    const clientes = this.getClientes(userId);
    const filtered = clientes.filter(c => c.id !== id);
    this.setData('clientes', userId, filtered);
    return filtered.length < clientes.length;
  }

  // SERVIÇOS
  getServicos(userId: string): Servico[] {
    return this.getData<Servico>('servicos', userId);
  }

  createServico(userId: string, servico: Omit<Servico, 'id' | 'createdAt' | 'updatedAt'>): Servico {
    const servicos = this.getServicos(userId);
    const novoServico: Servico = {
      ...servico,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    servicos.push(novoServico);
    this.setData('servicos', userId, servicos);
    return novoServico;
  }

  updateServico(userId: string, id: string, updates: Partial<Servico>): Servico | null {
    const servicos = this.getServicos(userId);
    const index = servicos.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    servicos[index] = { 
      ...servicos[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.setData('servicos', userId, servicos);
    return servicos[index];
  }

  deleteServico(userId: string, id: string): boolean {
    const servicos = this.getServicos(userId);
    const filtered = servicos.filter(s => s.id !== id);
    this.setData('servicos', userId, filtered);
    return filtered.length < servicos.length;
  }

  // AGENDAMENTOS
  getAgendamentos(userId: string): Agendamento[] {
    return this.getData<Agendamento>('agendamentos', userId);
  }

  createAgendamento(userId: string, agendamento: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt' | 'clienteNome' | 'servicoNome'>): Agendamento {
    const agendamentos = this.getAgendamentos(userId);
    const clientes = this.getClientes(userId);
    const servicos = this.getServicos(userId);
    
    const cliente = clientes.find(c => c.id === agendamento.clienteId);
    const servico = servicos.find(s => s.id === agendamento.servicoId);
    
    if (!cliente || !servico) {
      throw new Error('Cliente ou serviço não encontrado');
    }

    const novoAgendamento: Agendamento = {
      ...agendamento,
      id: this.generateId(),
      clienteNome: cliente.nomeCompleto,
      servicoNome: servico.nome,
      duracao: servico.duracao,
      valor: agendamento.valor || servico.valor,
      origem_cronograma: agendamento.origem_cronograma || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    agendamentos.push(novoAgendamento);
    this.setData('agendamentos', userId, agendamentos);
    return novoAgendamento;
  }

  updateAgendamento(userId: string, id: string, updates: Partial<Agendamento>): Agendamento | null {
    const agendamentos = this.getAgendamentos(userId);
    const index = agendamentos.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    const agendamento = agendamentos[index];
    agendamentos[index] = { 
      ...agendamento, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    // Se status mudou para concluído, criar lançamento financeiro
    if (updates.status === 'concluido' && agendamento.status !== 'concluido') {
      this.createLancamentoFromAgendamento(userId, agendamentos[index]);
    }

    this.setData('agendamentos', userId, agendamentos);
    return agendamentos[index];
  }

  deleteAgendamento(userId: string, id: string): boolean {
    const agendamentos = this.getAgendamentos(userId);
    const filtered = agendamentos.filter(a => a.id !== id);
    this.setData('agendamentos', userId, filtered);
    return filtered.length < agendamentos.length;
  }

  // CRONOGRAMAS
  getCronogramas(userId: string): Cronograma[] {
    return this.getData<Cronograma>('cronogramas', userId);
  }

  createCronograma(userId: string, cronograma: Omit<Cronograma, 'id_cronograma' | 'created_at' | 'updated_at'>): Cronograma {
    const cronogramas = this.getCronogramas(userId);
    const novoCronograma: Cronograma = {
      ...cronograma,
      id_cronograma: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cronogramas.push(novoCronograma);
    this.setData('cronogramas', userId, cronogramas);
    return novoCronograma;
  }

  updateCronograma(userId: string, id: string, updates: Partial<Cronograma>): Cronograma | null {
    const cronogramas = this.getCronogramas(userId);
    const index = cronogramas.findIndex(c => c.id_cronograma === id);
    if (index === -1) return null;
    
    cronogramas[index] = { 
      ...cronogramas[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    this.setData('cronogramas', userId, cronogramas);
    return cronogramas[index];
  }

  deleteCronograma(userId: string, id: string): boolean {
    const cronogramas = this.getCronogramas(userId);
    const filtered = cronogramas.filter(c => c.id_cronograma !== id);
    this.setData('cronogramas', userId, filtered);
    return filtered.length < cronogramas.length;
  }

  // RETORNOS
  getRetornos(userId: string): Retorno[] {
    return this.getData<Retorno>('retornos', userId);
  }

  createRetorno(userId: string, retorno: Omit<Retorno, 'id_retorno' | 'created_at' | 'updated_at'>): Retorno {
    const retornos = this.getRetornos(userId);
    const novoRetorno: Retorno = {
      ...retorno,
      id_retorno: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    retornos.push(novoRetorno);
    this.setData('retornos', userId, retornos);
    return novoRetorno;
  }

  updateRetorno(userId: string, id: string, updates: Partial<Retorno>): Retorno | null {
    const retornos = this.getRetornos(userId);
    const index = retornos.findIndex(r => r.id_retorno === id);
    if (index === -1) return null;
    
    retornos[index] = { 
      ...retornos[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    this.setData('retornos', userId, retornos);
    return retornos[index];
  }

  // LANÇAMENTOS
  getLancamentos(userId: string): Lancamento[] {
    const data = this.getData<{
      id: string;
      tipo: 'entrada' | 'saida';
      valor: number;
      data: string;
      descricao: string;
      categoria?: string;
      origemId?: string;
      origemTipo?: 'agendamento' | 'conta_fixa' | 'manual';
      clienteId?: string;
      created_at: string;
      updated_at: string;
    }>('lancamentos', userId);
    return data.map(l => ({
      ...l,
      data: new Date(l.data),
      created_at: new Date(l.created_at),
      updated_at: new Date(l.updated_at),
    }));
  }

  createLancamento(userId: string, lancamento: Omit<Lancamento, 'id' | 'created_at' | 'updated_at'>): Lancamento {
    const lancamentos = this.getLancamentos(userId);
    const novoLancamento: Lancamento = {
      ...lancamento,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    lancamentos.push(novoLancamento);
    this.setData('lancamentos', userId, lancamentos.map(l => ({
      ...l,
      data: l.data.toISOString(),
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    })));
    return novoLancamento;
  }

  // Criar lançamento automaticamente a partir de agendamento
  createLancamentoFromAgendamento(userId: string, agendamento: Agendamento): void {
    if (agendamento.statusPagamento === 'pago' && agendamento.valorPago > 0) {
      this.createLancamento(userId, {
        tipo: 'entrada',
        valor: agendamento.valorPago,
        data: new Date(agendamento.data + 'T12:00:00'),
        descricao: `${agendamento.servicoNome} - ${agendamento.clienteNome}`,
        categoria: 'Serviço',
        origemId: agendamento.id,
        origemTipo: 'agendamento',
        clienteId: agendamento.clienteId,
      });
    } else if (agendamento.statusPagamento === 'parcial' && agendamento.valorPago > 0) {
      this.createLancamento(userId, {
        tipo: 'entrada',
        valor: agendamento.valorPago,
        data: new Date(agendamento.data + 'T12:00:00'),
        descricao: `${agendamento.servicoNome} - ${agendamento.clienteNome} (Parcial)`,
        categoria: 'Serviço',
        origemId: agendamento.id,
        origemTipo: 'agendamento',
        clienteId: agendamento.clienteId,
      });
    }
  }

  // MÉTODOS AUXILIARES PARA RELATÓRIOS
  getAgendamentosPorCliente(userId: string, clienteId: string): Agendamento[] {
    return this.getAgendamentos(userId).filter(a => a.clienteId === clienteId);
  }

  getRetornosPorCronograma(userId: string, cronogramaId: string): Retorno[] {
    return this.getRetornos(userId).filter(r => r.id_cronograma === cronogramaId);
  }

  getHorariosOcupados(userId: string, data: string): { hora: string; duracao: number }[] {
    return this.getAgendamentos(userId)
      .filter(a => a.data === data && a.status !== 'cancelado')
      .map(a => ({ hora: a.hora, duracao: a.duracao }));
  }

  // Verificar disponibilidade de horário considerando cronogramas ativos
  isHorarioDisponivel(userId: string, data: string, hora: string, duracao: number, excludeId?: string): boolean {
    const agendamentos = this.getAgendamentos(userId)
      .filter(a => a.data === data && a.status !== 'cancelado' && a.id !== excludeId);

    // Verificar cronogramas ativos que podem gerar conflitos
    const cronogramasAtivos = this.getCronogramasAtivos(userId, data, hora, duracao);
    
    // Verificar retornos pendentes que podem gerar conflitos
    const retornosPendentes = this.getRetornosPendentes(userId, data, hora, duracao);
    
    const inicioNovo = new Date(`${data}T${hora}`);
    const fimNovo = new Date(inicioNovo.getTime() + duracao * 60000);

    // Verificar conflitos com agendamentos existentes
    const conflitosAgendamentos = agendamentos.some(ag => {
      const inicio = new Date(`${ag.data}T${ag.hora}`);
      const fim = new Date(inicio.getTime() + ag.duracao * 60000);
      return (inicioNovo < fim && fimNovo > inicio);
    });

    return !conflitosAgendamentos && cronogramasAtivos.length === 0 && retornosPendentes.length === 0;
  }

  // Verificar retornos pendentes que podem gerar conflitos
  getRetornosPendentes(userId: string, data: string, hora: string, duracao: number): Retorno[] {
    const retornos = this.getRetornos(userId)
      .filter(r => r.status === 'Pendente' && r.data_retorno === data);
    
    const cronogramas = this.getCronogramas(userId);
    const inicioNovo = new Date(`${data}T${hora}`);
    const fimNovo = new Date(inicioNovo.getTime() + duracao * 60000);

    return retornos.filter(retorno => {
      // Buscar o cronograma associado para obter a hora e duração
      const cronograma = cronogramas.find(c => c.id_cronograma === retorno.id_cronograma);
      if (!cronograma) return false;
      
      // Verificar sobreposição de horário
      const inicioRetorno = new Date(`${data}T${cronograma.hora_inicio}`);
      const fimRetorno = new Date(inicioRetorno.getTime() + cronograma.duracao_minutos * 60000);
      
      return (inicioNovo < fimRetorno && fimNovo > inicioRetorno);
    });
  }

  // Verificar cronogramas ativos que podem gerar conflitos
  getCronogramasAtivos(userId: string, data: string, hora: string, duracao: number): Cronograma[] {
    const cronogramas = this.getCronogramas(userId)
      .filter(c => c.status === 'ativo');

    const inicioNovo = new Date(`${data}T${hora}`);
    const fimNovo = new Date(inicioNovo.getTime() + duracao * 60000);

    return cronogramas.filter(cronograma => {
      // Verificar se o cronograma está ativo nesta data/hora
      const dataInicio = new Date(cronograma.data_inicio);
      const dataSolicitada = new Date(data);
      
      if (dataSolicitada < dataInicio) return false;

      // Calcular se esta data corresponde ao padrão do cronograma
      const diasDiferenca = Math.floor((dataSolicitada.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      
      let intervalo = 7; // padrão semanal
      if (cronograma.recorrencia === 'Quinzenal') intervalo = 14;
      else if (cronograma.recorrencia === 'Mensal') intervalo = 30;
      else if (cronograma.recorrencia === 'Personalizada' && cronograma.intervalo_dias) {
        intervalo = cronograma.intervalo_dias;
      }

      if (diasDiferenca % intervalo !== 0) return false;

      // Verificar sobreposição de horário
      const inicioCronograma = new Date(`${data}T${cronograma.hora_inicio}`);
      const fimCronograma = new Date(inicioCronograma.getTime() + cronograma.duracao_minutos * 60000);
      
      return (inicioNovo < fimCronograma && fimNovo > inicioCronograma);
    });
  }

  // Criar agendamentos em lote (para cronogramas)
  createMultipleAgendamentos(userId: string, agendamentos: Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt' | 'clienteNome' | 'servicoNome'>[]): Agendamento[] {
    const agendamentosExistentes = this.getAgendamentos(userId);
    const clientes = this.getClientes(userId);
    const servicos = this.getServicos(userId);
    const novosAgendamentos: Agendamento[] = [];

    agendamentos.forEach(agendamento => {
      const cliente = clientes.find(c => c.id === agendamento.clienteId);
      const servico = servicos.find(s => s.id === agendamento.servicoId);
      
      if (!cliente || !servico) return;

      const novoAgendamento: Agendamento = {
        ...agendamento,
        id: this.generateId(),
        clienteNome: cliente.nomeCompleto,
        servicoNome: servico.nome,
        duracao: servico.duracao,
        valor: agendamento.valor || servico.valor,
        origem_cronograma: agendamento.origem_cronograma || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      novosAgendamentos.push(novoAgendamento);
    });

    const todosAgendamentos = [...agendamentosExistentes, ...novosAgendamentos];
    this.setData('agendamentos', userId, todosAgendamentos);
    return novosAgendamentos;
  }

  // CONTAS FIXAS
  getContasFixas(userId: string): ContaFixa[] {
    const data = this.getData<{
      id: string;
      nome: string;
      valor: number;
      dataVencimento: number;
      categoria: string;
      status: 'pago' | 'em_aberto';
      observacoes?: string;
      repetir: boolean;
      frequencia: 'mensal' | 'trimestral' | 'semestral' | 'anual';
      proximoVencimento?: string;
      ativa: boolean;
      created_at: string;
      updated_at: string;
    }>('contas_fixas', userId);
    return data.map(c => ({
      ...c,
      created_at: new Date(c.created_at),
      updated_at: new Date(c.updated_at),
    }));
  }

  createContaFixa(userId: string, conta: Omit<ContaFixa, 'id' | 'created_at' | 'updated_at'>): ContaFixa {
    const contas = this.getContasFixas(userId);
    const novaConta: ContaFixa = {
      ...conta,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    contas.push(novaConta);
    this.setData('contas_fixas', userId, contas.map(c => ({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
    })));
    return novaConta;
  }

  updateContaFixa(userId: string, id: string, updates: Partial<ContaFixa>): ContaFixa | null {
    const contas = this.getContasFixas(userId);
    const index = contas.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    contas[index] = { 
      ...contas[index], 
      ...updates, 
      updated_at: new Date() 
    };
    this.setData('contas_fixas', userId, contas.map(c => ({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
    })));
    return contas[index];
  }

  deleteContaFixa(userId: string, id: string): boolean {
    const contas = this.getContasFixas(userId);
    const filtered = contas.filter(c => c.id !== id);
    this.setData('contas_fixas', userId, filtered.map(c => ({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
    })));
    return filtered.length < contas.length;
  }

  // CATEGORIAS FINANCEIRAS (com categorias padrão)
  getCategoriasFinanceiras(userId: string): CategoriaFinanceira[] {
    const data = this.getData<{
      id: string;
      nome: string;
      tipo: 'receita' | 'despesa' | 'investimento';
      cor?: string;
      created_at: string;
      updated_at: string;
    }>('categorias_financeiras', userId);
    
    if (data.length === 0) {
      // Criar categorias padrão na primeira vez
      const categoriasDefault: Omit<CategoriaFinanceira, 'id' | 'created_at' | 'updated_at'>[] = [
        { nome: 'Aluguel', tipo: 'despesa', cor: '#ef4444' },
        { nome: 'Energia', tipo: 'despesa', cor: '#f59e0b' },
        { nome: 'Água', tipo: 'despesa', cor: '#3b82f6' },
        { nome: 'Internet', tipo: 'despesa', cor: '#8b5cf6' },
        { nome: 'Telefone', tipo: 'despesa', cor: '#06b6d4' },
        { nome: 'Produtos', tipo: 'despesa', cor: '#10b981' },
        { nome: 'Materiais', tipo: 'despesa', cor: '#f97316' },
        { nome: 'Serviços', tipo: 'receita', cor: '#22c55e' },
        { nome: 'Vendas', tipo: 'receita', cor: '#84cc16' },
      ];
      
      return categoriasDefault.map(cat => this.createCategoriaFinanceira(userId, cat));
    }
    
    return data.map(c => ({
      ...c,
      created_at: new Date(c.created_at),
      updated_at: new Date(c.updated_at),
    }));
  }

  createCategoriaFinanceira(userId: string, categoria: Omit<CategoriaFinanceira, 'id' | 'created_at' | 'updated_at'>): CategoriaFinanceira {
    const categorias = this.getData<any>('categorias_financeiras', userId);
    const novaCategoria: CategoriaFinanceira = {
      ...categoria,
      id: this.generateId(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    categorias.push({
      ...novaCategoria,
      created_at: novaCategoria.created_at.toISOString(),
      updated_at: novaCategoria.updated_at.toISOString(),
    });
    this.setData('categorias_financeiras', userId, categorias);
    return novaCategoria;
  }

  // Obter contas a pagar do mês atual  
  getContasAPagar(userId: string, mes?: number, ano?: number): number {
    const agora = new Date();
    const mesAtual = mes ?? agora.getMonth() + 1;
    const anoAtual = ano ?? agora.getFullYear();
    
    const contas = this.getContasFixas(userId);
    return contas
      .filter(c => c.status === 'em_aberto')
      .reduce((total, c) => {
        // Verificar se a conta vence neste mês
        const dataVencimento = new Date(anoAtual, mesAtual - 1, c.dataVencimento);
        const mesVencimento = dataVencimento.getMonth() + 1;
        const anoVencimento = dataVencimento.getFullYear();
        
        if (mesVencimento === mesAtual && anoVencimento === anoAtual) {
          return total + c.valor;
        }
        return total;
      }, 0);
  }

  // Processar pagamento de contas fixas (criar lançamentos)
  pagarContaFixa(userId: string, contaId: string, valorPago?: number): boolean {
    const conta = this.getContasFixas(userId).find(c => c.id === contaId);
    if (!conta) return false;

    const valor = valorPago ?? conta.valor;
    
    // Criar lançamento
    this.createLancamento(userId, {
      tipo: 'saida',
      valor,
      data: new Date(),
      descricao: `Pagamento: ${conta.nome}`,
      categoria: conta.categoria,
      origemId: conta.id,
      origemTipo: 'conta_fixa',
    });

    // Atualizar status da conta
    this.updateContaFixa(userId, contaId, { status: 'pago' });
    
    return true;
  }

}

export const db = LocalDatabase.getInstance();