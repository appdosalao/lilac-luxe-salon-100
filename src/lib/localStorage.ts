// Sistema centralizado de armazenamento local
export interface LocalStorageKeys {
  USUARIO: 'usuario';
  SERVICOS: 'servicos';
  CLIENTES: 'clientes';
  AGENDAMENTOS: 'agendamentos';
  CRONOGRAMAS: 'cronogramas';
  LANCAMENTOS: 'lancamentos';
  NOTIFICATION_SETTINGS: 'notification-settings';
  CONFIGURACOES: 'configuracoes';
}

export const LOCAL_STORAGE_KEYS: LocalStorageKeys = {
  USUARIO: 'usuario',
  SERVICOS: 'servicos',
  CLIENTES: 'clientes',
  AGENDAMENTOS: 'agendamentos',
  CRONOGRAMAS: 'cronogramas',
  LANCAMENTOS: 'lancamentos',
  NOTIFICATION_SETTINGS: 'notification-settings',
  CONFIGURACOES: 'configuracoes',
};

// Eventos customizados para sincronização entre abas/contextos
export const STORAGE_EVENTS = {
  SERVICO_ADDED: 'servico-added',
  CLIENTE_ADDED: 'cliente-added',
  AGENDAMENTO_ADDED: 'agendamento-added',
  DATA_UPDATED: 'data-updated',
} as const;

// Utilitários para localStorage
export class LocalStorageManager {
  static get<T>(key: keyof LocalStorageKeys): T[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS[key]);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Erro ao ler ${key} do localStorage:`, error);
      return [];
    }
  }

  static set<T>(key: keyof LocalStorageKeys, data: T[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS[key], JSON.stringify(data));
      // Disparar evento customizado para sincronização
      window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.DATA_UPDATED, { 
        detail: { key, data } 
      }));
    } catch (error) {
      console.error(`Erro ao salvar ${key} no localStorage:`, error);
    }
  }

  static add<T>(key: keyof LocalStorageKeys, item: T): void {
    const items = this.get<T>(key);
    const newItems = [...items, item];
    this.set(key, newItems);
    
    // Disparar evento específico
    const eventType = this.getEventTypeForKey(key);
    if (eventType) {
      window.dispatchEvent(new CustomEvent(eventType, { detail: item }));
    }
  }

  static update<T>(key: keyof LocalStorageKeys, id: string, updates: Partial<T>): void {
    const items = this.get<T>(key);
    const updatedItems = items.map((item: any) => {
      const itemId = this.getItemId(item, key);
      return itemId === id ? { ...item, ...updates } : item;
    });
    this.set(key, updatedItems);
  }

  static remove<T>(key: keyof LocalStorageKeys, id: string): void {
    const items = this.get<T>(key);
    const filteredItems = items.filter((item: any) => {
      const itemId = this.getItemId(item, key);
      return itemId !== id;
    });
    this.set(key, filteredItems);
  }

  // Método para obter ID do item baseado na chave
  private static getItemId(item: any, key: keyof LocalStorageKeys): string {
    switch (key) {
      case 'CRONOGRAMAS':
        return item.id_cronograma;
      default:
        return item.id;
    }
  }

  static clear(key: keyof LocalStorageKeys): void {
    localStorage.removeItem(LOCAL_STORAGE_KEYS[key]);
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.DATA_UPDATED, { 
      detail: { key, data: [] } 
    }));
  }

  private static getEventTypeForKey(key: keyof LocalStorageKeys): string | null {
    switch (key) {
      case 'SERVICOS':
        return STORAGE_EVENTS.SERVICO_ADDED;
      case 'CLIENTES':
        return STORAGE_EVENTS.CLIENTE_ADDED;
      case 'AGENDAMENTOS':
        return STORAGE_EVENTS.AGENDAMENTO_ADDED;
      default:
        return null;
    }
  }

  // Método para sincronizar dados entre abas
  static setupCrossTabSync(): void {
    window.addEventListener('storage', (e) => {
      if (Object.values(LOCAL_STORAGE_KEYS).includes(e.key as any)) {
        window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.DATA_UPDATED, {
          detail: { key: e.key, data: e.newValue ? JSON.parse(e.newValue) : [] }
        }));
      }
    });
  }
}