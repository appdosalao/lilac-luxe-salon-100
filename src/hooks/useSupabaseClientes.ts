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
      const parseValor = (v: any): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const s = v.replace(/\./g, '').replace(',', '.');
          const n = Number(s);
          return isNaN(n) ? 0 : n;
        }
        return 0;
      };

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

      const clientesBase: any[] = (data || []).map(item => ({
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

      const { data: ags } = await supabase
        .from('agendamentos')
        .select('id, cliente_id, servico_id, data, hora, valor, valor_pago, status, status_pagamento')
        .eq('user_id', user.id);

      const { data: servs } = await supabase
        .from('servicos')
        .select('id, nome')
        .eq('user_id', user.id);

      const servicoNomeMap = new Map((servs || []).map(s => [s.id, s.nome]));

      const hojeStr = new Date().toISOString().split('T')[0];
      const clientesEnriquecidos = clientesBase.map(c => {
        const doCliente = (ags || []).filter(a => a.cliente_id === c.id && a.status !== 'cancelado');
        const historico = doCliente
          .map(a => ({
            id: a.id,
            data: new Date(`${a.data}T${(a as any).hora || '00:00'}`),
            servico: servicoNomeMap.get(a.servico_id) || 'Serviço',
            valor: (() => {
              const vp = parseValor((a as any).valor_pago);
              const vt = parseValor((a as any).valor);
              return vp > 0 ? vp : vt;
            })()
          }))
          .sort((x, y) => y.data.getTime() - x.data.getTime());

        let servicoFrequente;
        if (doCliente.length > 0) {
          const freq = new Map<string, number>();
          doCliente
            .forEach(a => {
              const key = servicoNomeMap.get(a.servico_id) || 'Serviço';
              freq.set(key, (freq.get(key) || 0) + 1);
            });
          let max = 0;
          for (const [k, v] of freq.entries()) {
            if (v > max) {
              max = v;
              servicoFrequente = k;
            }
          }
        }

        const ultimaElegivel = doCliente
          .filter(a => a.data <= hojeStr)
          .map(a => new Date(`${a.data}T${(a as any).hora || '00:00'}`))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        const ultima = ultimaElegivel ? ultimaElegivel.toISOString() : (historico[0]?.data?.toISOString() || undefined);

        return {
          ...c,
          historicoServicos: historico,
          servicoFrequente: servicoFrequente,
          ultimaVisita: ultima
        };
      });

      setClientes(clientesEnriquecidos);
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
    console.log('🔄 Iniciando exclusão do cliente:', id);
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    console.log('✅ Usuário autenticado:', user.id);

    setLoading(true);
    try {
      console.log('🗑️ Executando delete no Supabase...');
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erro do Supabase ao excluir cliente:', error);
        toast.error('Erro ao excluir cliente: ' + error.message);
        return false;
      }

      console.log('✅ Cliente excluído com sucesso no banco');
      
      // Atualizar lista local
      setClientes(prev => {
        const novaLista = prev.filter((c: any) => c.id !== id);
        console.log('📝 Lista atualizada:', novaLista.length, 'clientes');
        return novaLista;
      });
      
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
