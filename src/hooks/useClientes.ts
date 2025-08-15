import { useDatabase } from '@/hooks/useDatabase';
import { Cliente, ClienteFormData } from '@/types/cliente';

export function useClientes() {
  const { 
    clientes, 
    createCliente, 
    updateCliente, 
    deleteCliente, 
    getClienteComEstatisticas,
    loading 
  } = useDatabase();

  const criarCliente = async (clienteData: ClienteFormData) => {
    const novoCliente = {
      ...clienteData,
      historicoServicos: []
    };
    return await createCliente(novoCliente);
  };

  const atualizarCliente = async (id: string, updates: Partial<Cliente>) => {
    return await updateCliente(id, updates);
  };

  const excluirCliente = async (id: string) => {
    return await deleteCliente(id);
  };

  const obterClienteComEstatisticas = (id: string) => {
    return getClienteComEstatisticas(id);
  };

  return {
    loading,
    clientes,
    criarCliente,
    atualizarCliente,
    excluirCliente,
    obterClienteComEstatisticas,
  };
}