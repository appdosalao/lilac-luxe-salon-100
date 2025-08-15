import { useMemo } from 'react';
import { useAgendamentos } from './useAgendamentos';
import { useServicos } from './useServicos';
import { useLancamentos } from './useLancamentos';
import { useCronogramas, useRetornos } from './useCronogramas';

export interface ProblemaAuditoria {
  id: string;
  categoria: 'critico' | 'alto' | 'medio' | 'baixo';
  tipo: string;
  descricao: string;
  entidade: string;
  entidadeId: string;
  campo?: string;
  valorAtual?: any;
  valorEsperado?: any;
  sugestao?: string;
}

export interface RelatorioAuditoria {
  dataExecucao: string;
  totalProblemas: number;
  problemasCriticos: number;
  problemasAltos: number;
  problemasMedios: number;
  problemasBaixos: number;
  problemas: ProblemaAuditoria[];
  estatisticas: {
    totalClientes: number;
    totalServicos: number;
    totalAgendamentos: number;
    totalLancamentos: number;
    totalCronogramas: number;
    totalRetornos: number;
    agendamentosAtivos: number;
    agendamentosConcluidos: number;
    agendamentosCancelados: number;
    valorTotalReceitas: number;
    valorTotalDespesas: number;
    servicosNuncaUsados: number;
    clientesInativos: number;
  };
  sugestoesMelhorias: string[];
}

export function useAuditoria() {
  const { agendamentosFiltrados: agendamentos, clientes, servicos } = useAgendamentos();
  const { todosServicos } = useServicos();
  const { lancamentos } = useLancamentos();
  const { cronogramas } = useCronogramas();
  const { retornos } = useRetornos();

  const relatorioAuditoria = useMemo((): RelatorioAuditoria => {
    const problemas: ProblemaAuditoria[] = [];
    let proximoId = 1;

    const adicionarProblema = (problema: Omit<ProblemaAuditoria, 'id'>) => {
      problemas.push({ ...problema, id: (proximoId++).toString() });
    };

    // 1. VALIDAÇÃO DE DADOS OBRIGATÓRIOS

    // Verificar clientes com dados incompletos
    clientes.forEach(cliente => {
      if (!cliente.nomeCompleto || cliente.nomeCompleto.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Cliente sem nome',
          entidade: 'cliente',
          entidadeId: cliente.id,
          campo: 'nome',
          valorAtual: cliente.nomeCompleto,
          valorEsperado: 'Nome válido',
          sugestao: 'Adicionar nome ao cliente'
        });
      }

      if (!cliente.telefone || cliente.telefone.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Cliente sem telefone',
          entidade: 'cliente',
          entidadeId: cliente.id,
          campo: 'telefone',
          valorAtual: cliente.telefone,
          valorEsperado: 'Telefone válido',
          sugestao: 'Adicionar telefone ao cliente'
        });
      }
    });

    // Verificar serviços com dados inválidos
    todosServicos.forEach(servico => {
      if (!servico.nome || servico.nome.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Serviço sem nome',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'nome',
          valorAtual: servico.nome,
          valorEsperado: 'Nome válido',
          sugestao: 'Adicionar nome ao serviço'
        });
      }

      if (servico.valor <= 0) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_inconsistentes',
          descricao: 'Serviço com valor inválido',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'valor',
          valorAtual: servico.valor,
          valorEsperado: 'Valor > 0',
          sugestao: 'Definir valor válido para o serviço'
        });
      }

      if (servico.duracao <= 0) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_inconsistentes',
          descricao: 'Serviço com duração inválida',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'duracao',
          valorAtual: servico.duracao,
          valorEsperado: 'Duração > 0',
          sugestao: 'Definir duração válida para o serviço'
        });
      }
    });

    // Verificar agendamentos com dados incompletos
    agendamentos.forEach(agendamento => {
      if (!agendamento.clienteId) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem cliente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'clienteId',
          valorAtual: agendamento.clienteId,
          valorEsperado: 'ID de cliente válido',
          sugestao: 'Associar cliente ao agendamento'
        });
      }

      if (!agendamento.servicoId) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem serviço',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'servicoId',
          valorAtual: agendamento.servicoId,
          valorEsperado: 'ID de serviço válido',
          sugestao: 'Associar serviço ao agendamento'
        });
      }

      if (!agendamento.data) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem data',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'data',
          valorAtual: agendamento.data,
          valorEsperado: 'Data válida',
          sugestao: 'Definir data para o agendamento'
        });
      }

      if (!agendamento.hora) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem horário',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'hora',
          valorAtual: agendamento.hora,
          valorEsperado: 'Horário válido',
          sugestao: 'Definir horário para o agendamento'
        });
      }

      // Verificar se cliente existe
      const clienteExiste = clientes.find(c => c.id === agendamento.clienteId);
      if (agendamento.clienteId && !clienteExiste) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'referencia_invalida',
          descricao: 'Agendamento com cliente inexistente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'clienteId',
          valorAtual: agendamento.clienteId,
          valorEsperado: 'Cliente existente',
          sugestao: 'Verificar se cliente foi deletado ou corrigir referência'
        });
      }

      // Verificar se serviço existe
      const servicoExiste = todosServicos.find(s => s.id === agendamento.servicoId);
      if (agendamento.servicoId && !servicoExiste) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'referencia_invalida',
          descricao: 'Agendamento com serviço inexistente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'servicoId',
          valorAtual: agendamento.servicoId,
          valorEsperado: 'Serviço existente',
          sugestao: 'Verificar se serviço foi deletado ou corrigir referência'
        });
      }

      // Verificar valores de pagamento
      if (agendamento.valorPago > agendamento.valor) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'dados_inconsistentes',
          descricao: 'Valor pago maior que valor total',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'valorPago',
          valorAtual: agendamento.valorPago,
          valorEsperado: `<= ${agendamento.valor}`,
          sugestao: 'Corrigir valores de pagamento'
        });
      }

      if (agendamento.valorDevido !== (agendamento.valor - agendamento.valorPago)) {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Valor devido não confere com cálculo',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'valorDevido',
          valorAtual: agendamento.valorDevido,
          valorEsperado: agendamento.valor - agendamento.valorPago,
          sugestao: 'Recalcular valor devido'
        });
      }

      // Verificar status de pagamento
      if (agendamento.valorPago === 0 && agendamento.statusPagamento !== 'em_aberto') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (valor zerado)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.statusPagamento,
          valorEsperado: 'em_aberto',
          sugestao: 'Corrigir status de pagamento'
        });
      }

      if (agendamento.valorPago === agendamento.valor && agendamento.statusPagamento !== 'pago') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (valor total pago)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.statusPagamento,
          valorEsperado: 'pago',
          sugestao: 'Corrigir status de pagamento'
        });
      }

      if (agendamento.valorPago > 0 && agendamento.valorPago < agendamento.valor && agendamento.statusPagamento !== 'parcial') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (pagamento parcial)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.statusPagamento,
          valorEsperado: 'parcial',
          sugestao: 'Corrigir status de pagamento'
        });
      }
    });

    // 2. VERIFICAR CONFLITOS DE AGENDAMENTO
    const agendamentosAtivos = agendamentos.filter(ag => ag.status !== 'cancelado');
    
    for (let i = 0; i < agendamentosAtivos.length; i++) {
      for (let j = i + 1; j < agendamentosAtivos.length; j++) {
        const ag1 = agendamentosAtivos[i];
        const ag2 = agendamentosAtivos[j];

        if (ag1.data === ag2.data) {
          const inicio1 = new Date(`${ag1.data}T${ag1.hora}`);
          const fim1 = new Date(inicio1.getTime() + ag1.duracao * 60000);
          const inicio2 = new Date(`${ag2.data}T${ag2.hora}`);
          const fim2 = new Date(inicio2.getTime() + ag2.duracao * 60000);

          if (inicio1 < fim2 && fim1 > inicio2) {
            adicionarProblema({
              categoria: 'critico',
              tipo: 'conflito_agendamento',
              descricao: `Conflito de horário entre agendamentos`,
              entidade: 'agendamento',
              entidadeId: ag1.id,
              campo: 'horario',
              valorAtual: `${ag1.data} ${ag1.hora}`,
              valorEsperado: 'Horário livre',
              sugestao: `Conflito com agendamento ${ag2.id} (${ag2.clienteNome} - ${ag2.data} ${ag2.hora})`
            });
          }
        }
      }
    }

    // Verificar lançamentos sem descrição ou categoria
    lancamentos.forEach(lancamento => {
      if (!lancamento.descricao || lancamento.descricao.trim() === '') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_incompletos',
          descricao: 'Lançamento sem descrição',
          entidade: 'lancamento',
          entidadeId: lancamento.id,
          campo: 'descricao',
          valorAtual: lancamento.descricao,
          valorEsperado: 'Descrição válida',
          sugestao: 'Adicionar descrição ao lançamento'
        });
      }

      if (!lancamento.categoria || lancamento.categoria.trim() === '') {
        adicionarProblema({
          categoria: 'baixo',
          tipo: 'dados_incompletos',
          descricao: 'Lançamento sem categoria',
          entidade: 'lancamento',
          entidadeId: lancamento.id,
          campo: 'categoria',
          valorAtual: lancamento.categoria,
          valorEsperado: 'Categoria válida',
          sugestao: 'Adicionar categoria ao lançamento'
        });
      }

      if (lancamento.valor <= 0) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'dados_inconsistentes',
          descricao: 'Lançamento com valor inválido',
          entidade: 'lancamento',
          entidadeId: lancamento.id,
          campo: 'valor',
          valorAtual: lancamento.valor,
          valorEsperado: 'Valor > 0',
          sugestao: 'Corrigir valor do lançamento'
        });
      }
    });

    // 3. VALIDAÇÕES DE REGRAS DE NEGÓCIO

    // Agendamentos concluídos sem lançamento financeiro correspondente
    const agendamentosConcluidos = agendamentos.filter(ag => ag.status === 'concluido');
    agendamentosConcluidos.forEach(agendamento => {
      const lancamentoCorrespondente = lancamentos.find(l => 
        l.tipo === 'entrada' && 
        l.valor === agendamento.valorPago &&
        l.descricao.includes(agendamento.clienteNome)
      );

      if (!lancamentoCorrespondente && agendamento.valorPago > 0) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'regra_negocio',
          descricao: 'Agendamento concluído sem lançamento financeiro',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'status',
          valorAtual: 'concluido',
          valorEsperado: 'Lançamento financeiro correspondente',
          sugestao: 'Criar lançamento financeiro para este agendamento'
        });
      }
    });

    // Retornos pendentes muito antigos
    const retornosPendentes = retornos.filter(r => r.status === 'Pendente');
    const hoje = new Date();
    retornosPendentes.forEach(retorno => {
      const dataRetorno = new Date(retorno.data_retorno);
      const diasAtraso = Math.floor((hoje.getTime() - dataRetorno.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAtraso > 7) {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'retorno_atrasado',
          descricao: `Retorno pendente há ${diasAtraso} dias`,
          entidade: 'retorno',
          entidadeId: retorno.id_retorno,
          campo: 'data_retorno',
          valorAtual: retorno.data_retorno,
          valorEsperado: 'Data atual ou futura',
          sugestao: 'Remarcar retorno ou marcar como realizado/cancelado'
        });
      }
    });

    // 4. CALCULAR ESTATÍSTICAS
    const agendamentosAgendados = agendamentos.filter(ag => ag.status === 'agendado');
    const agendamentosConcludos = agendamentos.filter(ag => ag.status === 'concluido');
    const agendamentosCancelados = agendamentos.filter(ag => ag.status === 'cancelado');
    
    const valorTotalReceitas = lancamentos
      .filter(l => l.tipo === 'entrada')
      .reduce((total, l) => total + l.valor, 0);
    
    const valorTotalDespesas = lancamentos
      .filter(l => l.tipo === 'saida')
      .reduce((total, l) => total + l.valor, 0);

    // Serviços nunca usados
    const servicosUsados = new Set(agendamentos.map(ag => ag.servicoId));
    const servicosNuncaUsados = todosServicos.filter(s => !servicosUsados.has(s.id));

    // Clientes inativos (sem agendamento há mais de 30 dias)
    const clientesAtivos = new Set();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    
    agendamentos.forEach(ag => {
      const dataAgendamento = new Date(ag.data);
      if (dataAgendamento >= dataLimite) {
        clientesAtivos.add(ag.clienteId);
      }
    });
    
    const clientesInativos = clientes.length - clientesAtivos.size;

    // 5. SUGESTÕES DE MELHORIAS
    const sugestoesMelhorias: string[] = [];

    if (servicosNuncaUsados.length > 0) {
      sugestoesMelhorias.push(`${servicosNuncaUsados.length} serviços nunca foram agendados. Considere promovê-los ou removê-los.`);
    }

    if (clientesInativos > 0) {
      sugestoesMelhorias.push(`${clientesInativos} clientes não têm agendamentos recentes. Considere uma campanha de reativação.`);
    }

    const agendamentosEmAberto = agendamentos.filter(ag => ag.statusPagamento === 'em_aberto').length;
    if (agendamentosEmAberto > 0) {
      sugestoesMelhorias.push(`${agendamentosEmAberto} agendamentos com pagamento em aberto. Revisar política de cobrança.`);
    }

    const retornosAtrasados = retornosPendentes.filter(r => {
      const dataRetorno = new Date(r.data_retorno);
      return dataRetorno < hoje;
    }).length;
    
    if (retornosAtrasados > 0) {
      sugestoesMelhorias.push(`${retornosAtrasados} retornos em atraso. Entrar em contato com clientes.`);
    }

    // Analisar duração média vs duração programada
    const servicosComVariacao = todosServicos.map(servico => {
      const agendamentosDoServico = agendamentos.filter(ag => ag.servicoId === servico.id);
      if (agendamentosDoServico.length > 0) {
        const duracaoMedia = agendamentosDoServico.reduce((sum, ag) => sum + ag.duracao, 0) / agendamentosDoServico.length;
        const diferenca = Math.abs(duracaoMedia - servico.duracao);
        if (diferenca > 15) { // Mais de 15 minutos de diferença
          return { servico: servico.nome, duracaoPrograma: servico.duracao, duracaoMedia, diferenca };
        }
      }
      return null;
    }).filter(Boolean);

    if (servicosComVariacao.length > 0) {
      sugestoesMelhorias.push(`${servicosComVariacao.length} serviços têm duração programada muito diferente da duração real. Revisar tempos.`);
    }

    const estatisticas = {
      totalClientes: clientes.length,
      totalServicos: todosServicos.length,
      totalAgendamentos: agendamentos.length,
      totalLancamentos: lancamentos.length,
      totalCronogramas: cronogramas.length,
      totalRetornos: retornos.length,
      agendamentosAtivos: agendamentosAgendados.length,
      agendamentosConcluidos: agendamentosConcludos.length,
      agendamentosCancelados: agendamentosCancelados.length,
      valorTotalReceitas,
      valorTotalDespesas,
      servicosNuncaUsados: servicosNuncaUsados.length,
      clientesInativos,
    };

    return {
      dataExecucao: new Date().toISOString(),
      totalProblemas: problemas.length,
      problemasCriticos: problemas.filter(p => p.categoria === 'critico').length,
      problemasAltos: problemas.filter(p => p.categoria === 'alto').length,
      problemasMedios: problemas.filter(p => p.categoria === 'medio').length,
      problemasBaixos: problemas.filter(p => p.categoria === 'baixo').length,
      problemas,
      estatisticas,
      sugestoesMelhorias,
    };
  }, [agendamentos, clientes, todosServicos, lancamentos, cronogramas, retornos]);

  const exportarRelatorio = (formato: 'json' | 'csv') => {
    if (formato === 'json') {
      const blob = new Blob([JSON.stringify(relatorioAuditoria, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (formato === 'csv') {
      const headers = ['ID', 'Categoria', 'Tipo', 'Descrição', 'Entidade', 'ID Entidade', 'Campo', 'Valor Atual', 'Valor Esperado', 'Sugestão'];
      const rows = relatorioAuditoria.problemas.map(p => [
        p.id,
        p.categoria,
        p.tipo,
        p.descricao,
        p.entidade,
        p.entidadeId,
        p.campo || '',
        p.valorAtual || '',
        p.valorEsperado || '',
        p.sugestao || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    relatorioAuditoria,
    exportarRelatorio,
  };
}