import { useSupabaseCronogramas } from '@/hooks/useSupabaseCronogramas';
import { Cronograma, Retorno } from '@/types/cronograma';

export const useCronogramas = () => {
  const { cronogramas, createCronograma, updateCronograma, deleteCronograma, loading } = useSupabaseCronogramas();

  const createCronogramaLocal = async (cronograma: Omit<Cronograma, 'id_cronograma' | 'created_at' | 'updated_at'>) => {
    return await createCronograma(cronograma);
  };

  const updateCronogramaLocal = async (id: string, updates: Partial<Cronograma>) => {
    return await updateCronograma(id, updates);
  };

  const deleteCronogramaLocal = async (id: string) => {
    return await deleteCronograma(id);
  };

  return {
    cronogramas,
    loading,
    error: null,
    createCronograma: createCronogramaLocal,
    updateCronograma: updateCronogramaLocal,
    deleteCronograma: deleteCronogramaLocal,
  };
};

export const useRetornos = () => {
  const { retornos, createRetorno, updateRetorno, loading } = useSupabaseCronogramas();

  const marcarRetornoRealizado = async (id: string, idAgendamento?: string) => {
    await updateRetorno(id, { 
      status: 'Realizado',
      id_agendamento_retorno: idAgendamento 
    });
  };

  const cancelarRetorno = async (id: string) => {
    await updateRetorno(id, { status: 'Cancelado' });
  };

  const getRetornosPendentes = () => {
    return retornos.filter(r => r.status === 'Pendente');
  };

  const getRetornosPorCliente = (idCliente: string) => {
    return retornos.filter(r => r.id_cliente === idCliente);
  };

  const getRetornosPorCronograma = (idCronograma: string) => {
    return retornos.filter(r => r.id_cronograma === idCronograma);
  };

  return {
    retornos,
    loading,
    error: null,
    createRetorno,
    updateRetorno,
    marcarRetornoRealizado,
    cancelarRetorno,
    getRetornosPendentes,
    getRetornosPorCliente,
    getRetornosPorCronograma,
  };
};
