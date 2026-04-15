import { useState, useCallback } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { AgendamentoOnlineData, ServicoDisponivel, HorarioDisponivel } from '@/types/agendamento-online';
import { toast } from 'sonner';

const shouldDebug = () => {
  try {
    if (import.meta.env.DEV) return true;
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugSupabase');
  } catch {
    return false;
  }
};

const withTiming = async <T,>(op: string, fn: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now();
  try {
    const out = await fn();
    if (shouldDebug()) console.debug('[booking]', op, 'ok', `${Math.round(performance.now() - startedAt)}ms`);
    return out;
  } catch (err) {
    if (shouldDebug()) console.debug('[booking]', op, 'err', `${Math.round(performance.now() - startedAt)}ms`);
    throw err;
  }
};

const getPublicIdFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    // Prioridade para 's' (slug/public_id) ou 'uid' (user_id)
    return params.get('s') || params.get('public_id') || params.get('salao') || params.get('slug') || '';
  } catch {
    return '';
  }
};

const getOwnerUserIdFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('uid') || params.get('user_id') || params.get('owner') || params.get('id') || '';
  } catch {
    return '';
  }
};

export const useAgendamentoOnlineService = () => {
  const db = supabasePublic as any;
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<ServicoDisponivel[]>([]);
  const [servicosError, setServicosError] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<{ id: string; nome: string; valor?: number; categoria?: string; imagem_url?: string | null }[]>([]);
  const [horariosError, setHorariosError] = useState<string | null>(null);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  // Resolver identificadores da URL de forma única e estável
  const resolveIdentifiers = useCallback(async () => {
    if (ownerUserId && publicId) return { ownerUserId, publicId };

    try {
      const urlPublicId = getPublicIdFromUrl();
      const urlOwnerId = getOwnerUserIdFromUrl();

      // 1. Se temos o UID direto, ele é soberano
      if (urlOwnerId) {
        setOwnerUserId(urlOwnerId);
        return { ownerUserId: urlOwnerId, publicId: urlPublicId };
      }

      // 2. Se temos o publicId (slug), resolvemos o owner via RPC
      if (urlPublicId) {
        setPublicId(urlPublicId);
        const { data, error } = (await withTiming('rpc:get_booking_owner_id', () => 
          db.rpc('get_booking_owner_id', { p_public_id: urlPublicId })
        )) as any;
        
        if (error) {
          console.error('[booking] Erro ao resolver owner pelo slug:', error);
        } else if (data) {
          const resolvedId = String(data);
          setOwnerUserId(resolvedId);
          return { ownerUserId: resolvedId, publicId: urlPublicId };
        }
      }

      // 3. Fallback para modo demo em desenvolvimento
      if (import.meta.env.DEV && (urlPublicId === 'demo' || urlOwnerId === 'demo')) {
        return { ownerUserId: 'demo', publicId: 'demo' };
      }

      return { ownerUserId: null, publicId: urlPublicId };
    } catch (error) {
      console.error('[booking] Erro ao resolver identificadores:', error);
      return { ownerUserId: null, publicId: null };
    }
  }, [ownerUserId, publicId, db]);

  // Carregar serviços disponíveis
  const carregarServicos = useCallback(async () => {
    setLoading(true);
    setServicosError(null);
    try {
      const { ownerUserId: resolvedOwnerId, publicId: resolvedPublicId } = await resolveIdentifiers();
      
      if (!resolvedOwnerId) {
        setServicos([]);
        setServicosError('Link do agendamento incompleto ou salão não encontrado. Use o link oficial fornecido pelo estabelecimento.');
        return;
      }

      // Tentar primeiro via RPC de serviços públicos (mais seguro e segue regras do banco)
      if (resolvedPublicId) {
        const { data, error } = (await withTiming('rpc:get_public_services', () => 
          db.rpc('get_public_services', { p_public_id: resolvedPublicId })
        )) as any;
        
        if (!error && Array.isArray(data) && data.length > 0) {
          setServicos(data);
          setLoading(false);
          return;
        }
      }

      // Fallback para query direta (garantindo o filtro por user_id)
      const { data, error } = (await withTiming('select:servicos', () =>
        db
          .from('servicos')
          .select('id, nome, descricao, valor, duracao, user_id')
          .eq('user_id', resolvedOwnerId)
          .order('nome')
      )) as any;

      if (error) {
        throw error;
      }

      setServicos(data || []);
      if (!data || data.length === 0) {
        setServicosError('Nenhum serviço disponível para agendamento online neste salão.');
      }
    } catch (error) {
      console.error('[booking] Erro ao carregar serviços:', error);
      setServicosError('Erro ao carregar serviços. Por favor, tente novamente mais tarde.');
      setServicos([]);
    } finally {
      setLoading(false);
    }
  }, [resolveIdentifiers, db]);

  // Carregar produtos disponíveis (públicos ou fallback)
  const carregarProdutosPublicos = useCallback(async () => {
    try {
      const { ownerUserId: resolvedOwnerId, publicId: resolvedPublicId } = await resolveIdentifiers();

      if (resolvedPublicId) {
        const { data, error } = (await withTiming('rpc:get_public_products', () => 
          db.rpc('get_public_products', { p_public_id: resolvedPublicId })
        )) as any;
        if (!error && Array.isArray(data) && data.length > 0) {
          setProdutos(data.map((p: any) => ({ 
            id: p.id, 
            nome: p.nome, 
            valor: p.valor, 
            categoria: p.categoria,
            imagem_url: p.imagem_url
          })));
          return;
        }
      }

      if (!resolvedOwnerId) {
        setProdutos([]);
        return;
      }

      const { data, error } = (await withTiming('select:produtos', () =>
        db
          .from('produtos')
          .select('id, nome, preco_venda, ativo, categoria, imagem_url')
          .eq('ativo', true)
          .eq('categoria', 'revenda')
          .eq('user_id', resolvedOwnerId)
          .limit(200)
      )) as any;

      if (error) throw error;
      setProdutos((Array.isArray(data) ? data : []).map((p: any) => ({ 
        id: p.id, 
        nome: p.nome, 
        valor: p.preco_venda, 
        categoria: p.categoria,
        imagem_url: p.imagem_url
      })));
    } catch (error) {
      console.error('[booking] Erro ao carregar produtos:', error);
      setProdutos([]);
    }
  }, [resolveIdentifiers, db]);

  // A verificação de disponibilidade agora é feita pela função RPC do Supabase

  // Calcular horários disponíveis usando a função melhorada do Supabase
  const calcularHorariosDisponiveis = useCallback(async (
    servicoId: string, 
    data: string
  ): Promise<HorarioDisponivel[]> => {
    setHorariosError(null);
    const servico = servicos.find(s => s.id === servicoId);
    if (!servico) {
      console.log('[booking] Serviço não encontrado:', servicoId);
      return [];
    }

    try {
      const { ownerUserId: resolvedOwnerId, publicId: resolvedPublicId } = await resolveIdentifiers();

      const horariosResultCall = (resolvedPublicId
        ? await withTiming('rpc:get_public_time_slots', () =>
            db.rpc('get_public_time_slots', {
              p_public_id: resolvedPublicId,
              p_data: data,
              p_servico_id: servicoId,
            })
          )
        : await withTiming('rpc:buscar_horarios_com_multiplos_intervalos', async () =>
            db.rpc('buscar_horarios_com_multiplos_intervalos', {
              data_selecionada: data,
              user_id_param: servico.user_id || resolvedOwnerId,
              duracao_servico: typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60,
            })
          )) as any;

      const horariosResult = horariosResultCall?.data;
      const error = horariosResultCall?.error;

      if (error) {
        console.error('Erro ao buscar horários:', error);
        setHorariosError(`${error.code || ''} ${error.message || ''}`.trim() || 'Erro ao buscar horários');
        return [];
      }

      const duracaoLabel = typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60;
      console.log(`Horários para serviço ${servico.nome} (${duracaoLabel}min):`, horariosResult);

      // Filtrar apenas horários disponíveis e formatar corretamente
      const horariosFormatados = (horariosResult || [])
        .filter(item => item.horario && item.disponivel === true)
        .map(item => ({
          horario: String(item.horario).slice(0, 5),
          disponivel: true
        }));

      return horariosFormatados;
    } catch (error) {
      console.error('Erro ao calcular horários disponíveis:', error);
      setHorariosError(error instanceof Error ? error.message : 'Erro ao calcular horários disponíveis');
      return [];
    }
  }, [resolveIdentifiers, servicos]);

  // Criar cliente se não existir
  const criarClienteSeNaoExistir = useCallback(async (dados: AgendamentoOnlineData) => {
    try {
      // Usar função do Supabase para criar cliente
      const { data, error } = (await withTiming('rpc:criar_cliente_agendamento_online', () =>
        db.rpc('criar_cliente_agendamento_online', {
          p_nome: dados.nome_completo,
          p_telefone: dados.telefone,
          p_email: dados.email,
          p_observacoes: 'Cliente criado via agendamento online'
        })
      )) as any;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }, []);

  // Criar agendamento online com validação final
  const criarAgendamento = useCallback(async (dados: AgendamentoOnlineData): Promise<boolean> => {
    setLoading(true);
    try {
      const { ownerUserId: resolvedOwnerId } = await resolveIdentifiers();
      
      const servico = servicos.find(s => s.id === dados.servico_id);
      if (!servico) {
        throw new Error('Serviço não encontrado');
      }

      const duracaoEfetiva = typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60;
      // Se o valor já vier calculado no objeto dados (ex: soma de produtos), usamos ele
      const valorEfetivo = typeof (dados as any).valor === 'number' ? (dados as any).valor : (typeof servico.valor === 'number' && servico.valor >= 0 ? servico.valor : 0);

      // Validação final de disponibilidade antes de criar
      // Se não for possível calcular horários (ex: erro de rede), tentamos prosseguir
      // A trigger no banco de dados fará a validação final se necessário
      try {
        const horariosDisponiveis = await calcularHorariosDisponiveis(dados.servico_id, dados.data);
        
        // Se a lista de horários não estiver vazia, verificamos se o horário escolhido ainda está lá
        if (horariosDisponiveis.length > 0) {
          const alvo = String(dados.horario).slice(0, 5);
          const horarioDisponivel = horariosDisponiveis.find(h => String(h.horario).slice(0, 5) === alvo);
          
          if (!horarioDisponivel || !horarioDisponivel.disponivel) {
            toast.error("Este horário acabou de ser reservado por outro cliente. Por favor, selecione outro horário.");
            return false;
          }
        }
      } catch (error) {
        console.warn('Erro ao validar disponibilidade final (prosseguindo mesmo assim):', error);
      }

      // Criar ou encontrar cliente
      try {
        await criarClienteSeNaoExistir(dados);
      } catch (error) {
        console.warn('Não foi possível criar/associar cliente (prosseguindo):', error);
      }

      // Criar agendamento online
      // Se houver campos de compra anexados no observações, manter
      const baseInsert: Record<string, any> = {
          user_id: resolvedOwnerId, // Explicitamente associando ao dono do salão
          nome_completo: dados.nome_completo,
          email: dados.email,
          telefone: dados.telefone,
          servico_id: dados.servico_id,
          data: dados.data,
          horario: dados.horario,
          observacoes: dados.observacoes,
          valor: valorEfetivo,
          duracao: duracaoEfetiva,
          status: 'confirmado',
          origem: 'formulario_online',
          user_agent: navigator.userAgent
      };

      let insertError: any = null;
      const firstTry = (await withTiming('insert:agendamentos_online', () => db.from('agendamentos_online').insert(baseInsert as any))) as any;
      insertError = firstTry.error;

      if (insertError) throw insertError;

      toast.success(`Agendamento confirmado! ✨\nSeu agendamento para ${servico.nome} foi confirmado para ${new Date(dados.data).toLocaleDateString('pt-BR')} às ${dados.horario}. Você foi cadastrado como cliente.`);

      return true;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      const msg = (error as any)?.message ? String((error as any).message) : '';
      const code = (error as any)?.code ? String((error as any).code) : '';
      if (code || msg) {
        toast.error(`Não foi possível confirmar seu agendamento.\n${code ? `(${code}) ` : ''}${msg}`.trim());
      } else {
        toast.error("Não foi possível confirmar seu agendamento. Tente novamente.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [servicos, criarClienteSeNaoExistir, calcularHorariosDisponiveis, resolveIdentifiers]);

  return {
    loading,
    servicos,
    servicosError,
    produtos,
    horariosError,
    ownerUserId,
    publicId,
    carregarServicos,
    carregarProdutosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  };
};
