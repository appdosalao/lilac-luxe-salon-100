import { useSupabaseCronogramas } from './useSupabaseCronogramas';

export const useCronogramas = () => {
  const { 
    cronogramas, 
    retornos, 
    loading, 
    createCronograma, 
    updateCronograma, 
    deleteCronograma, 
    createMultipleAgendamentos,
    refetch 
  } = useSupabaseCronogramas();

  // Atualizar status do retorno
  const updateRetornoStatus = async (retornoId: string, status: 'pendente' | 'agendado' | 'concluido' | 'cancelado') => {
    // Implementar conforme necessário
    console.log('Atualizar retorno:', retornoId, status);
    return true;
  };

  return {
    cronogramas,
    retornos,
    loading,
    createCronograma,
    updateCronograma,
    deleteCronograma,
    updateRetornoStatus,
    createMultipleAgendamentos,
    refetch,
  };
};

export const useRetornos = () => {
  const { retornos, loading } = useSupabaseCronogramas();

  const marcarRetornoRealizado = async (retornoId: string) => {
    console.log('Marcar retorno como realizado:', retornoId);
    return true;
  };

  const cancelarRetorno = async (retornoId: string) => {
    console.log('Cancelar retorno:', retornoId);
    return true;
  };

  const getRetornosPendentes = () => {
    return retornos.filter(r => r.status === 'pendente');
  };

  const getRetornosPorCliente = (clienteId: string) => {
    return retornos.filter(r => r.clienteId === clienteId);
  };

  const getRetornosPorCronograma = (cronogramaId: string) => {
    return retornos.filter(r => r.cronogramaId === cronogramaId);
  };

  return {
    retornos,
    loading,
    marcarRetornoRealizado,
    cancelarRetorno,
    getRetornosPendentes,
    getRetornosPorCliente,
    getRetornosPorCronograma,
  };
};
