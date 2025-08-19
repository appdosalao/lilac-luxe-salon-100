import { useMemo } from 'react';
import { useSupabaseAuditoria } from './useSupabaseAuditoria';
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

export function useAuditoriaSupabase() {
  const { 
    createRelatorio, 
    createProblemasLote, 
    getUltimoRelatorio,
    createLog 
  } = useSupabaseAuditoria();
  
  const { agendamentosFiltrados: agendamentos, clientes, servicos } = useAgendamentos();
  const { todosServicos } = useServicos();
  const { lancamentos } = useLancamentos();
  const { cronogramas } = useCronogramas();
  const { retornos } = useRetornos();

  const executarAuditoria = async (): Promise<RelatorioAuditoria> => {
    const problemas: ProblemaAuditoria[] = [];
    let proximoId = 1;

    const adicionarProblema = (problema: Omit<ProblemaAuditoria, 'id'>) => {
      problemas.push({ ...problema, id: (proximoId++).toString() });
    };

    // Log de início da auditoria
    await createLog({
      nivel: 'info',
      categoria: 'auditoria',
      acao: 'inicio_auditoria',
      descricao: 'Iniciando auditoria do sistema',
      metadados: {
        totalAgendamentos: agendamentos.length,
        totalClientes: clientes.length,
        totalServicos: todosServicos.length,
        totalLancamentos: lancamentos.length
      }
    });

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

    // 3. CALCULAR ESTATÍSTICAS
    const agendamentosAgendados = agendamentos.filter(ag => ag.status === 'agendado');
    const agendamentosConcluidos = agendamentos.filter(ag => ag.status === 'concluido');
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

    // 4. SUGESTÕES DE MELHORIAS
    const sugestoesMelhorias: string[] = [];

    if (servicosNuncaUsados.length > 0) {
      sugestoesMelhorias.push(`${servicosNuncaUsados.length} serviços nunca foram agendados. Considere promovê-los ou removê-los.`);
    }

    if (clientesInativos > 0) {
      sugestoesMelhorias.push(`${clientesInativos} clientes não têm agendamentos recentes. Considere uma campanha de reativação.`);
    }

    // Contar problemas por categoria
    const problemasCriticos = problemas.filter(p => p.categoria === 'critico').length;
    const problemasAltos = problemas.filter(p => p.categoria === 'alto').length;
    const problemasMedios = problemas.filter(p => p.categoria === 'medio').length;
    const problemasBaixos = problemas.filter(p => p.categoria === 'baixo').length;

    const estatisticas = {
      totalClientes: clientes.length,
      totalServicos: todosServicos.length,
      totalAgendamentos: agendamentos.length,
      totalLancamentos: lancamentos.length,
      totalCronogramas: cronogramas.length,
      totalRetornos: retornos.length,
      agendamentosAtivos: agendamentosAgendados.length,
      agendamentosConcluidos: agendamentosConcluidos.length,
      agendamentosCancelados: agendamentosCancelados.length,
      valorTotalReceitas,
      valorTotalDespesas,
      servicosNuncaUsados: servicosNuncaUsados.length,
      clientesInativos
    };

    // Salvar relatório no Supabase
    try {
      const relatorioId = await createRelatorio({
        total_problemas: problemas.length,
        problemas_criticos: problemasCriticos,
        problemas_altos: problemasAltos,
        problemas_medios: problemasMedios,
        problemas_baixos: problemasBaixos,
        estatisticas,
        sugestoes_melhorias: sugestoesMelhorias
      });

      // Salvar problemas em lote
      if (problemas.length > 0) {
        await createProblemasLote(
          relatorioId,
          problemas.map(p => ({
            categoria: p.categoria,
            tipo: p.tipo,
            descricao: p.descricao,
            entidade: p.entidade,
            entidade_id: p.entidadeId,
            campo: p.campo,
            valor_atual: p.valorAtual ? String(p.valorAtual) : undefined,
            valor_esperado: p.valorEsperado ? String(p.valorEsperado) : undefined,
            sugestao: p.sugestao
          }))
        );
      }

      // Log de conclusão da auditoria
      await createLog({
        nivel: 'info',
        categoria: 'auditoria',
        acao: 'fim_auditoria',
        descricao: `Auditoria concluída: ${problemas.length} problemas encontrados`,
        metadados: {
          totalProblemas: problemas.length,
          problemasCriticos,
          problemasAltos,
          problemasMedios,
          problemasBaixos
        }
      });

    } catch (error) {
      await createLog({
        nivel: 'error',
        categoria: 'auditoria',
        acao: 'erro_salvar_relatorio',
        descricao: 'Erro ao salvar relatório de auditoria',
        metadados: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      });
    }

    const relatorio: RelatorioAuditoria = {
      dataExecucao: new Date().toISOString(),
      totalProblemas: problemas.length,
      problemasCriticos,
      problemasAltos,
      problemasMedios,
      problemasBaixos,
      problemas,
      estatisticas,
      sugestoesMelhorias
    };

    return relatorio;
  };

  const exportarRelatorio = async (formato: 'csv' | 'json') => {
    const relatorio = await executarAuditoria();
    
    if (formato === 'json') {
      const dataStr = JSON.stringify(relatorio, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-auditoria-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } else if (formato === 'csv') {
      const csvHeader = 'Categoria,Tipo,Descrição,Entidade,ID,Campo,Valor Atual,Valor Esperado,Sugestão\n';
      const csvContent = relatorio.problemas.map(p => 
        `"${p.categoria}","${p.tipo}","${p.descricao}","${p.entidade}","${p.entidadeId}","${p.campo || ''}","${p.valorAtual || ''}","${p.valorEsperado || ''}","${p.sugestao || ''}"`
      ).join('\n');
      
      const dataBlob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }

    await createLog({
      nivel: 'info',
      categoria: 'auditoria',
      acao: 'exportar_relatorio',
      descricao: `Relatório exportado em formato ${formato}`,
      metadados: { formato, totalProblemas: relatorio.totalProblemas }
    });
  };

  return {
    executarAuditoria,
    exportarRelatorio
  };
}