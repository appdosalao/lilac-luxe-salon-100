import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { toast } from 'sonner';

export function useSupabaseClientes() {
  const { user } = useSupabaseAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar clientes do Supabase
  const carregarClientes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Primeiro, associar clientes de agendamentos online ao usuário
      await supabase.rpc('associar_clientes_agendamento_online', {
        p_user_id: user.id
      });

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes');
        return;
      }

      // Mapear dados do Supabase para o formato da aplicação
      const clientesFormatados: any[] = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        nomeCompleto: item.nome, // Usar nome como nomeCompleto para compatibilidade
        telefone: item.telefone,
        email: item.email || undefined,
        endereco: item.endereco || undefined,
        dataNascimento: item.data_nascimento || undefined,
        observacoes: item.observacoes || undefined,
        historicoServicos: Array.isArray(item.historico_servicos) ? item.historico_servicos : [],
        servicoFrequente: undefined, // Campo será calculado baseado no histórico
        ultimaVisita: undefined, // Campo será calculado baseado no histórico
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setClientes(clientesFormatados);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, [user]);

  const criarCliente = async (clienteData: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    // Validações básicas
    const nome = clienteData.nome || clienteData.nomeCompleto;
    if (!nome?.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return false;
    }

    if (!clienteData.telefone?.trim()) {
      toast.error('Telefone do cliente é obrigatório');
      return false;
    }

    // Verificar se já existe cliente com o mesmo nome
    const clienteExistente = clientes.find((c: any) => 
      c.nome?.toLowerCase() === nome.toLowerCase()
    );

    if (clienteExistente) {
      toast.error('Já existe um cliente com este nome');
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          nome: nome,
          telefone: clienteData.telefone,
          email: clienteData.email || null,
          endereco: clienteData.endereco || null,
          data_nascimento: clienteData.dataNascimento || null,
          observacoes: clienteData.observacoes || null,
          historico_servicos: []
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        toast.error('Erro ao criar cliente');
        return false;
      }

      // Atualizar lista local
      const novoCliente: any = {
        id: data.id,
        nome: data.nome,
        nomeCompleto: data.nome,
        telefone: data.telefone,
        email: data.email || undefined,
        endereco: data.endereco || undefined,
        dataNascimento: data.data_nascimento || undefined,
        observacoes: data.observacoes || undefined,
        historicoServicos: data.historico_servicos || [],
        servicoFrequente: undefined,
        ultimaVisita: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setClientes(prev => [...prev, novoCliente]);
      toast.success('Cliente criado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const atualizarCliente = async (id: string, updates: any) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const updateData: any = {};
      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.nomeCompleto !== undefined) updateData.nome = updates.nomeCompleto;
      if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.endereco !== undefined) updateData.endereco = updates.endereco || null;
      if (updates.dataNascimento !== undefined) updateData.data_nascimento = updates.dataNascimento || null;
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes || null;
      if (updates.historicoServicos !== undefined) updateData.historico_servicos = updates.historicoServicos;

      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        toast.error('Erro ao atualizar cliente');
        return false;
      }

      // Atualizar lista local
      const clienteAtualizado: any = {
        id: data.id,
        nome: data.nome,
        nomeCompleto: data.nome,
        telefone: data.telefone,
        email: data.email || undefined,
        endereco: data.endereco || undefined,
        dataNascimento: data.data_nascimento || undefined,
        observacoes: data.observacoes || undefined,
        historicoServicos: data.historico_servicos || [],
        servicoFrequente: undefined,
        ultimaVisita: undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setClientes(prev => prev.map((c: any) => c.id === id ? clienteAtualizado : c));
      toast.success('Cliente atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const excluirCliente = async (id: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao excluir cliente:', error);
        toast.error('Erro ao excluir cliente');
        return false;
      }

      // Atualizar lista local
      setClientes(prev => prev.filter((c: any) => c.id !== id));
      toast.success('Cliente excluído com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const obterClienteComEstatisticas = (id: string) => {
    return clientes.find((c: any) => c.id === id);
  };

  return {
    loading,
    clientes,
    criarCliente,
    atualizarCliente,
    excluirCliente,
    obterClienteComEstatisticas,
    recarregar: carregarClientes,
  };
}