// Placeholder para funcionalidades que ainda precisam ser implementadas
export class LocalDatabase {
  static getInstance() {
    return new LocalDatabase();
  }

  getClientes(...args: any[]) {
    return [];
  }

  getServicos(...args: any[]) {
    return [];
  }

  getAgendamentos(...args: any[]) {
    return [];
  }

  getCronogramas(...args: any[]) {
    return [];
  }

  getLancamentos(...args: any[]) {
    return [];
  }
}

export const db = {
  getContasFixas: (...args: any[]) => [],
  getCategoriasFinanceiras: (...args: any[]) => [],
  createContaFixa: async (...args: any[]) => { return { id: 'temp', success: true }; },
  updateContaFixa: async (...args: any[]) => { return { id: 'temp', success: true }; },
  deleteContaFixa: async (...args: any[]) => false,
  pagarContaFixa: async (...args: any[]) => false,
  createCategoriaFinanceira: async (...args: any[]) => { return { id: 'temp', success: true }; },
  getContasAPagar: (...args: any[]) => ({ totalValue: 0, items: [] }),
};