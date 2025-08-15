import { useState, useMemo } from 'react';
import { ServicoFiltros, NovoServico } from '@/types/servico';
import { useDatabase } from '@/hooks/useDatabase';

export function useServicos() {
  const { 
    servicos: todosServicos, 
    createServico: addServico, 
    updateServico: updateServicoDb,
    loading 
  } = useDatabase();
  
  const [filtros, setFiltros] = useState<ServicoFiltros>({
    ordenacao: 'nome',
    direcao: 'asc'
  });

  // Filtrar e ordenar serviços
  const servicosFiltrados = useMemo(() => {
    let resultado = [...todosServicos];

    // Aplicar busca
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      resultado = resultado.filter(servico => 
        servico.nome.toLowerCase().includes(busca) ||
        servico.descricao?.toLowerCase().includes(busca)
      );
    }

    // Aplicar ordenação
    if (filtros.ordenacao) {
      resultado.sort((a, b) => {
        const campo = filtros.ordenacao!;
        let valorA: any = a[campo];
        let valorB: any = b[campo];

        if (typeof valorA === 'string') {
          valorA = valorA.toLowerCase();
          valorB = valorB.toLowerCase();
        }

        if (filtros.direcao === 'desc') {
          return valorB > valorA ? 1 : valorB < valorA ? -1 : 0;
        }
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      });
    }

    return resultado;
  }, [todosServicos, filtros]);

  // CRUD operations usando localStorage
  const criarServico = async (novoServico: NovoServico) => {
    // Validações
    if (!novoServico.nome.trim()) {
      return false;
    }

    if (novoServico.valor <= 0 || novoServico.duracao <= 0) {
      return false;
    }

    // Verificar se já existe serviço com o mesmo nome
    const servicoExistente = todosServicos.find(s => 
      s.nome.toLowerCase() === novoServico.nome.toLowerCase()
    );

    if (servicoExistente) {
      return false;
    }

    // Dados serão processados pelo useDatabase

    const resultado = await addServico(novoServico);
    return resultado !== null;
  };

  const atualizarServico = async (id: string, dadosAtualizados: Partial<NovoServico>) => {
    // Validações básicas
    if (dadosAtualizados.nome !== undefined && !dadosAtualizados.nome.trim()) {
      return false;
    }

    if (dadosAtualizados.valor !== undefined && dadosAtualizados.valor <= 0) {
      return false;
    }

    if (dadosAtualizados.duracao !== undefined && dadosAtualizados.duracao <= 0) {
      return false;
    }

    const updates = {
      ...dadosAtualizados,
      updatedAt: new Date().toISOString(),
    };

    const resultado = await updateServicoDb(id, updates);
    return resultado !== null;
  };

  const excluirServico = async (id: string) => {
    // TODO: Implementar exclusão de serviços após verificar dependências (agendamentos, cronogramas)
    console.warn('Exclusão de serviços não implementada - verificar dependências primeiro');
    return false;
  };

  const obterServicoPorId = (id: string) => {
    return todosServicos.find(s => s.id === id);
  };

  return {
    loading,
    servicos: servicosFiltrados,
    todosServicos,
    filtros,
    setFiltros,
    criarServico,
    atualizarServico,
    excluirServico,
    obterServicoPorId,
  };
}