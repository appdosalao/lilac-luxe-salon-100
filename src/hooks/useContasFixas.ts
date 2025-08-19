import { useSupabaseContasFixas } from './useSupabaseContasFixas';
import { useMemo } from 'react';

export function useContasFixas() {
  const supabaseHook = useSupabaseContasFixas();
  
  // Estatísticas calculadas
  const estatisticas = useMemo(() => {
    const total = supabaseHook.contasFixas.length;
    const pagas = supabaseHook.contasFixas.filter(c => c.status === 'pago').length;
    const emAberto = supabaseHook.contasFixas.filter(c => c.status === 'em_aberto').length;
    const valorTotal = supabaseHook.contasFixas.reduce((sum, c) => sum + c.valor, 0);
    
    return {
      total,
      pagas,
      emAberto,
      valorTotal,
    };
  }, [supabaseHook.contasFixas]);
  
  return {
    ...supabaseHook,
    // Funções de CRUD renomeadas para compatibilidade com código existente
    criarContaFixa: supabaseHook.createContaFixa,
    atualizarContaFixa: supabaseHook.updateContaFixa,
    removerContaFixa: supabaseHook.deleteContaFixa,
    criarCategoria: supabaseHook.createCategoria,
    recarregar: supabaseHook.loadContasFixas,
    estatisticas,
    
    // Funcionalidades específicas que precisam ser implementadas
    marcarComoPaga: async (id: string) => {
      return supabaseHook.updateContaFixa(id, { status: 'pago' });
    },
    
    pagarContaFixa: async (id: string) => {
      return supabaseHook.updateContaFixa(id, { status: 'pago' });
    },
    
    marcarComoEmAberto: async (id: string) => {
      return supabaseHook.updateContaFixa(id, { status: 'em_aberto' });
    },
    
    toggleAtiva: async (id: string) => {
      const conta = supabaseHook.contasFixas.find(c => c.id === id);
      if (conta) {
        return supabaseHook.updateContaFixa(id, { ativa: !conta.ativa });
      }
    },
    
    getContasVencidas: () => {
      const hoje = new Date();
      return supabaseHook.contasFixas.filter(conta => {
        if (!conta.ativa || conta.status === 'pago') return false;
        
        const proximoVencimento = conta.proximoVencimento ? new Date(conta.proximoVencimento) : null;
        return proximoVencimento && proximoVencimento < hoje;
      });
    },
    
    getContasAVencer: () => {
      const hoje = new Date();
      const proximasSemana = new Date();
      proximasSemana.setDate(hoje.getDate() + 7);
      
      return supabaseHook.contasFixas.filter(conta => {
        if (!conta.ativa || conta.status === 'pago') return false;
        
        const proximoVencimento = conta.proximoVencimento ? new Date(conta.proximoVencimento) : null;
        return proximoVencimento && proximoVencimento >= hoje && proximoVencimento <= proximasSemana;
      });
    },
  };
}