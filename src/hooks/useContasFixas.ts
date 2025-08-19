import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { db } from '@/lib/database';
import { ContaFixa, NovaContaFixa, CategoriaFinanceira, NovaCategoriaFinanceira } from '@/types/contaFixa';
import { toast } from '@/hooks/use-toast';

export function useContasFixas() {
  const { usuario } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);

  const userId = usuario?.id;

  // Carregar dados
  const loadData = useCallback(() => {
    if (!userId) return;
    
    setContasFixas(db.getContasFixas(userId));
    setCategorias(db.getCategoriasFinanceiras(userId));
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // CRUD Contas Fixas
  const criarContaFixa = useCallback(async (dadosConta: NovaContaFixa) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const contaCompleta = {
        ...dadosConta,
        status: 'em_aberto' as const,
        ativa: dadosConta.ativa ?? true,
      };
      const novaConta = db.createContaFixa(userId, contaCompleta);
      setContasFixas(prev => [...prev, novaConta]);
      
      toast({
        title: "Conta fixa criada",
        description: "Conta fixa cadastrada com sucesso.",
      });
      
      return novaConta;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta fixa.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const atualizarContaFixa = useCallback(async (id: string, updates: Partial<ContaFixa>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const contaAtualizada = db.updateContaFixa(userId, id, updates);
      if (contaAtualizada) {
        setContasFixas(prev => prev.map(c => c.id === id ? contaAtualizada : c));
        toast({
          title: "Conta atualizada",
          description: "Conta fixa atualizada com sucesso.",
        });
      }
      return contaAtualizada;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta fixa.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removerContaFixa = useCallback(async (id: string) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      const success = db.deleteContaFixa(userId, id);
      if (success) {
        setContasFixas(prev => prev.filter(c => c.id !== id));
        toast({
          title: "Conta removida",
          description: "Conta fixa removida com sucesso.",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover conta fixa.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const pagarContaFixa = useCallback(async (contaId: string, valorPago?: number) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      const success = db.pagarContaFixa(userId, contaId, valorPago);
      if (success) {
        loadData(); // Recarregar dados para atualizar status
        toast({
          title: "Conta paga",
          description: "Pagamento registrado com sucesso.",
        });
      }
      return success;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, loadData]);

  const toggleAtiva = useCallback(async (contaId: string, ativa: boolean) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      const contaAtualizada = await atualizarContaFixa(contaId, { ativa });
      if (contaAtualizada) {
        toast({
          title: ativa ? "Conta ativada" : "Conta desativada",
          description: `A conta foi ${ativa ? 'ativada' : 'desativada'} com sucesso.`,
        });
      }
      return !!contaAtualizada;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status da conta.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, atualizarContaFixa]);

  // CRUD Categorias
  const criarCategoria = useCallback(async (dadosCategoria: NovaCategoriaFinanceira) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const novaCategoria = db.createCategoriaFinanceira(userId, dadosCategoria);
      setCategorias(prev => [...prev, novaCategoria]);
      
      toast({
        title: "Categoria criada",
        description: "Categoria financeira criada com sucesso.",
      });
      
      return novaCategoria;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Estatísticas e relatórios
  const estatisticas = useMemo(() => {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();

    const contasVencendoMes = contasFixas.filter(conta => {
      const dataVencimento = new Date(anoAtual, mesAtual - 1, conta.dataVencimento);
      return dataVencimento.getMonth() + 1 === mesAtual;
    });

    const contasEmAberto = contasVencendoMes.filter(c => c.status === 'em_aberto');
    const contasPagas = contasVencendoMes.filter(c => c.status === 'pago');

    const totalAPagar = contasEmAberto.reduce((total, c) => total + c.valor, 0);
    const totalPago = contasPagas.reduce((total, c) => total + c.valor, 0);

    // Próximas contas a vencer (próximos 7 dias)
    const hoje = new Date();
    const proximosSeteDias = new Date();
    proximosSeteDias.setDate(hoje.getDate() + 7);

    const contasVencendoProximamente = contasFixas.filter(conta => {
      if (conta.status === 'pago') return false;
      
      const dataVencimento = new Date(anoAtual, mesAtual - 1, conta.dataVencimento);
      return dataVencimento >= hoje && dataVencimento <= proximosSeteDias;
    });

    return {
      totalContas: contasFixas.length,
      contasEmAberto: contasEmAberto.length,
      contasPagas: contasPagas.length,
      totalAPagar,
      totalPago,
      contasVencendoProximamente,
    };
  }, [contasFixas]);

  const getContasPorCategoria = useCallback(() => {
    const contasPorCategoria = contasFixas.reduce((acc, conta) => {
      if (!acc[conta.categoria]) {
        acc[conta.categoria] = [];
      }
      acc[conta.categoria].push(conta);
      return acc;
    }, {} as Record<string, ContaFixa[]>);

    return Object.entries(contasPorCategoria).map(([categoria, contas]) => ({
      categoria,
      contas,
      total: contas.reduce((sum, c) => sum + c.valor, 0),
      emAberto: contas.filter(c => c.status === 'em_aberto').length,
    }));
  }, [contasFixas]);

  const resetarStatusContas = useCallback(async () => {
    if (!userId) return;
    
    const agora = new Date();
    const proximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
    
    // Resetar todas as contas pagas para em_aberto no início do próximo mês
    for (const conta of contasFixas) {
      if (conta.status === 'pago') {
        await atualizarContaFixa(conta.id, { status: 'em_aberto' });
      }
    }
    
    toast({
      title: "Status resetado",
      description: "Todas as contas foram marcadas como em aberto para o novo mês.",
    });
  }, [userId, contasFixas, atualizarContaFixa]);

  return {
    loading,
    contasFixas,
    categorias,
    estatisticas,
    // CRUD
    criarContaFixa,
    atualizarContaFixa,
    removerContaFixa,
    pagarContaFixa,
    toggleAtiva,
    criarCategoria,
    // Relatórios
    getContasPorCategoria,
    resetarStatusContas,
    loadData,
  };
}