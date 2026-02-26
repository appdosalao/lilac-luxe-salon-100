/**
 * Funções utilitárias para formatação de dados do Supabase
 * Centraliza a lógica de conversão entre formato banco <-> app
 */

import { Cliente } from '@/types/cliente';
import { Servico } from '@/types/servico';
import { Agendamento } from '@/types/agendamento';

/**
 * Formata dados de cliente do Supabase para o formato da aplicação
 */
export function formatClienteFromSupabase(item: any): Cliente {
  return {
    id: item.id,
    nome: item.nome,
    nomeCompleto: item.nome,
    telefone: item.telefone,
    email: item.email || undefined,
    endereco: item.endereco || undefined,
    dataNascimento: item.data_nascimento || undefined,
    observacoes: item.observacoes || undefined,
    historicoServicos: Array.isArray(item.historico_servicos) ? item.historico_servicos : [],
    servicoFrequente: undefined,
    ultimaVisita: undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

/**
 * Formata dados de serviço do Supabase para o formato da aplicação
 */
export function formatServicoFromSupabase(item: any): Servico {
  return {
    id: item.id,
    nome: item.nome,
    valor: parseFloat(item.valor.toString()),
    duracao: item.duracao,
    descricao: item.descricao || undefined,
    observacoes: item.observacoes || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

/**
 * Formata dados de agendamento do Supabase para o formato da aplicação
 */
export function formatAgendamentoFromSupabase(item: any): Agendamento {
  return {
    id: item.id,
    clienteId: item.cliente_id,
    clienteNome: 'Cliente',
    servicoId: item.servico_id,
    servicoNome: 'Serviço',
    data: item.data,
    hora: item.hora,
    duracao: item.duracao,
    valor: parseFloat(item.valor?.toString() || '0'),
    valorPago: parseFloat(item.valor_pago?.toString() || '0'),
    valorDevido: parseFloat(item.valor_devido?.toString() || '0'),
    formaPagamento: (item.forma_pagamento as 'dinheiro' | 'cartao' | 'pix' | 'fiado') || 'fiado',
    statusPagamento: (item.status_pagamento as 'pago' | 'parcial' | 'em_aberto') || 'em_aberto',
    status: (item.status as 'agendado' | 'concluido' | 'cancelado') || 'agendado',
    origem: (item.origem as 'manual' | 'cronograma' | 'online') || 'manual',
    origem_cronograma: false,
    confirmado: item.confirmado,
    observacoes: item.observacoes || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

/**
 * Prepara dados de cliente para inserção no Supabase
 */
export function prepareClienteForSupabase(clienteData: any, userId: string) {
  const nome = clienteData.nome || clienteData.nomeCompleto;
  return {
    user_id: userId,
    nome: nome,
    telefone: clienteData.telefone,
    email: clienteData.email || null,
    endereco: clienteData.endereco || null,
    data_nascimento: clienteData.dataNascimento || null,
    observacoes: clienteData.observacoes || null,
    historico_servicos: []
  };
}

/**
 * Prepara dados de serviço para inserção no Supabase
 */
export function prepareServicoForSupabase(servicoData: any, userId: string) {
  return {
    user_id: userId,
    nome: servicoData.nome,
    valor: servicoData.valor,
    duracao: servicoData.duracao,
    descricao: servicoData.descricao || null,
    observacoes: servicoData.observacoes || null
  };
}

/**
 * Prepara atualizações de dados para o Supabase (converte campos do app para banco)
 */
export function prepareClienteUpdatesForSupabase(updates: any) {
  const updateData: any = {};
  
  if (updates.nome !== undefined) updateData.nome = updates.nome;
  if (updates.nomeCompleto !== undefined) updateData.nome = updates.nomeCompleto;
  if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
  if (updates.email !== undefined) updateData.email = updates.email || null;
  if (updates.endereco !== undefined) updateData.endereco = updates.endereco || null;
  if (updates.dataNascimento !== undefined) updateData.data_nascimento = updates.dataNascimento || null;
  if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes || null;
  if (updates.historicoServicos !== undefined) updateData.historico_servicos = updates.historicoServicos;
  
  return updateData;
}

/**
 * Prepara atualizações de serviço para o Supabase
 */
export function prepareServicoUpdatesForSupabase(updates: any) {
  const updateData: any = {};
  
  if (updates.nome !== undefined) updateData.nome = updates.nome;
  if (updates.valor !== undefined) updateData.valor = updates.valor;
  if (updates.duracao !== undefined) updateData.duracao = updates.duracao;
  if (updates.descricao !== undefined) updateData.descricao = updates.descricao || null;
  if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes || null;
  
  return updateData;
}
