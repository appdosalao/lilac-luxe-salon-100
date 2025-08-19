import { useState, useMemo, useEffect } from 'react';
import { ServicoFiltros, NovoServico, Servico } from '@/types/servico';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export function useServicos() {
  const { user } = useSupabaseAuth();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filtros, setFiltros] = useState<ServicoFiltros>({
    ordenacao: 'nome',
    direcao: 'asc'
  });

  // Carregar serviços do Supabase
  const carregarServicos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar serviços:', error);
        toast.error('Erro ao carregar serviços');
        return;
      }

      // Mapear dados do Supabase para o formato da aplicação
      const servicosFormatados = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        valor: parseFloat(item.valor.toString()),
        duracao: item.duracao,
        descricao: item.descricao || undefined,
        observacoes: item.observacoes || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setServicos(servicosFormatados);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
  }, [user]);

  // Filtrar e ordenar serviços
  const servicosFiltrados = useMemo(() => {
    let resultado = [...servicos];

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
  }, [servicos, filtros]);

  // CRUD operations usando Supabase
  const criarServico = async (novoServico: NovoServico) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Validações
    if (!novoServico.nome.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return false;
    }

    if (novoServico.valor <= 0 || novoServico.duracao <= 0) {
      toast.error('Valor e duração devem ser maiores que zero');
      return false;
    }

    // Verificar se já existe serviço com o mesmo nome
    const servicoExistente = servicos.find(s => 
      s.nome.toLowerCase() === novoServico.nome.toLowerCase()
    );

    if (servicoExistente) {
      toast.error('Já existe um serviço com este nome');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .insert({
          user_id: user.id,
          nome: novoServico.nome,
          valor: novoServico.valor,
          duracao: novoServico.duracao,
          descricao: novoServico.descricao || null,
          observacoes: novoServico.observacoes || null
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar serviço:', error);
        toast.error('Erro ao criar serviço');
        return false;
      }

      // Atualizar lista local
      const novoServicoFormatado = {
        id: data.id,
        nome: data.nome,
        valor: parseFloat(data.valor.toString()),
        duracao: data.duracao,
        descricao: data.descricao || undefined,
        observacoes: data.observacoes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setServicos(prev => [...prev, novoServicoFormatado]);
      toast.success('Serviço criado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      toast.error('Erro ao criar serviço');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const atualizarServico = async (id: string, dadosAtualizados: Partial<NovoServico>) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Validações básicas
    if (dadosAtualizados.nome !== undefined && !dadosAtualizados.nome.trim()) {
      toast.error('Nome do serviço é obrigatório');
      return false;
    }

    if (dadosAtualizados.valor !== undefined && dadosAtualizados.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return false;
    }

    if (dadosAtualizados.duracao !== undefined && dadosAtualizados.duracao <= 0) {
      toast.error('Duração deve ser maior que zero');
      return false;
    }

    setLoading(true);
    try {
      const updates: any = {};
      if (dadosAtualizados.nome !== undefined) updates.nome = dadosAtualizados.nome;
      if (dadosAtualizados.valor !== undefined) updates.valor = dadosAtualizados.valor;
      if (dadosAtualizados.duracao !== undefined) updates.duracao = dadosAtualizados.duracao;
      if (dadosAtualizados.descricao !== undefined) updates.descricao = dadosAtualizados.descricao || null;
      if (dadosAtualizados.observacoes !== undefined) updates.observacoes = dadosAtualizados.observacoes || null;

      const { data, error } = await supabase
        .from('servicos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar serviço:', error);
        toast.error('Erro ao atualizar serviço');
        return false;
      }

      // Atualizar lista local
      const servicoAtualizado = {
        id: data.id,
        nome: data.nome,
        valor: parseFloat(data.valor.toString()),
        duracao: data.duracao,
        descricao: data.descricao || undefined,
        observacoes: data.observacoes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setServicos(prev => prev.map(s => s.id === id ? servicoAtualizado : s));
      toast.success('Serviço atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar serviço');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const excluirServico = async (id: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir serviço:', error);
        toast.error('Erro ao excluir serviço');
        return false;
      }

      // Atualizar lista local
      setServicos(prev => prev.filter(s => s.id !== id));
      toast.success('Serviço excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir serviço');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const obterServicoPorId = (id: string) => {
    return servicos.find(s => s.id === id);
  };

  return {
    loading,
    servicos: servicosFiltrados,
    todosServicos: servicos,
    filtros,
    setFiltros,
    criarServico,
    atualizarServico,
    excluirServico,
    obterServicoPorId,
    recarregar: carregarServicos,
  };
}