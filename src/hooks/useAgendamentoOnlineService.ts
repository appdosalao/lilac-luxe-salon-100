import { useState, useCallback } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { AgendamentoOnlineData, ServicoDisponivel, HorarioDisponivel } from '@/types/agendamento-online';
import { toast } from 'sonner';

export const useAgendamentoOnlineService = () => {
  const db = supabasePublic as any;
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<ServicoDisponivel[]>([]);
  const [servicosError, setServicosError] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<{ id: string; nome: string; valor?: number; categoria?: string }[]>([]);
  const [horariosError, setHorariosError] = useState<string | null>(null);
  const [ownerUserIdCache, setOwnerUserIdCache] = useState<string | null>(null);
  const [publicIdCache, setPublicIdCache] = useState<string | null>(null);

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
      return params.get('s') || params.get('public_id') || params.get('salao') || '';
    } catch {
      return '';
    }
  };

  const getOwnerUserIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('uid') || params.get('user_id') || params.get('owner') || '';
    } catch {
      return '';
    }
  };

  const resolvePublicId = useCallback(async (): Promise<string> => {
    const fromUrl = getPublicIdFromUrl();
    if (fromUrl) {
      setPublicIdCache(fromUrl);
      return fromUrl;
    }
    if (publicIdCache) return publicIdCache;
    return '';
  }, [publicIdCache]);

  const resolveOwnerUserId = useCallback(async (): Promise<string | null> => {
    if (ownerUserIdCache) return ownerUserIdCache;

    try {
      // 1. Tentar pelo UID direto na URL
      const ownerFromUrl = getOwnerUserIdFromUrl();
      if (ownerFromUrl) {
        setOwnerUserIdCache(ownerFromUrl);
        return ownerFromUrl;
      }

      // 2. Tentar pelo publicId (slug) na URL
      const publicId = await resolvePublicId();

      if (publicId) {
        const { data, error } = await withTiming('rpc:get_booking_owner_id', () => db.rpc('get_booking_owner_id', { p_public_id: publicId }));
        if (error) {
          console.error('Erro ao resolver owner user_id pelo public_id:', error);
        } else if (data) {
          const next = String(data);
          setOwnerUserIdCache(next);
          return next;
        }
      }

      // 3. FALLBACK: Se não houver nada na URL, tentar o primeiro salão ativo da base
      // Isso permite que o link puro /agendamento-online funcione para o salão principal
      const { data: fallbackData, error: fallbackError } = await withTiming('select:fallback_owner', () =>
        db
          .from('configuracoes_agendamento_online')
          .select('user_id')
          .eq('ativo', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (!fallbackError && fallbackData?.user_id) {
        setOwnerUserIdCache(fallbackData.user_id);
        return fallbackData.user_id;
      }

      return null;
    } catch (error) {
      console.error('Erro ao resolver owner user_id:', error);
      return null;
    }
  }, [ownerUserIdCache, resolvePublicId]);

  // Carregar serviços disponíveis
  const carregarServicos = useCallback(async () => {
    setLoading(true);
    setServicosError(null);
    try {
      const publicId = await resolvePublicId();
      if (publicId) {
        const { data, error } = await withTiming('rpc:get_public_services', () => db.rpc('get_public_services', { p_public_id: publicId }));
        if (error) {
          const msg = `Erro RPC (serviços): ${error.code || ''} ${error.message || ''}`.trim();
          setServicosError(msg);
          setServicos([]);
          return;
        }
        if (data && Array.isArray(data) && data.length > 0) {
          setServicos(data);
          return;
        }
        // Se o RPC retornou vazio, tenta o método tradicional como fallback
      }

      const ownerId = await resolveOwnerUserId();
      if (!ownerId) {
        setServicos([]);
        setServicosError('Link do agendamento inválido ou salão não encontrado. Use ?uid= ou ?s= na URL.');
        return;
      }

      const result = await withTiming('select:servicos', () =>
        db
          .from('servicos')
          .select('id, nome, descricao, valor, duracao, user_id')
          .eq('user_id', ownerId)
      );

      if (result.error) {
        const msg = `Erro DB (serviços): ${result.error.code || ''} ${result.error.message || ''}`.trim();
        setServicosError(msg);
        setServicos([]);
        return;
      }

      const data = Array.isArray(result.data) ? result.data : [];
      if (data.length === 0) {
        setServicosError('Nenhum serviço ativo encontrado para este salão.');
      }
      setServicos(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao carregar serviços';
      setServicosError(msg);
      toast.error("Não foi possível carregar a lista de serviços disponíveis.");
      setServicos([]);
    } finally {
      setLoading(false);
    }
  }, [resolveOwnerUserId, resolvePublicId]);

  // Carregar produtos disponíveis (públicos ou fallback)
  const carregarProdutosPublicos = useCallback(async () => {
    try {
      const publicId = await resolvePublicId();
      if (publicId) {
        const { data, error } = await withTiming('rpc:get_public_products', () => db.rpc('get_public_products', { p_public_id: publicId }));
        if (error) {
          console.error('Erro ao carregar produtos públicos (rpc):', error);
          setProdutos([]);
          return;
        }
        setProdutos((Array.isArray(data) ? data : []).map((p: any) => ({ id: p.id, nome: p.nome, valor: p.valor, categoria: p.categoria })));
        return;
      }

      const ownerId = await resolveOwnerUserId();
      if (!ownerId) {
        setProdutos([]);
        return;
      }

      const { data, error } = await withTiming('select:produtos', () =>
        db
          .from('produtos')
          .select('id, nome, preco_venda, ativo, categoria')
          .eq('ativo', true)
          .eq('categoria', 'revenda')
          .eq('user_id', ownerId)
          .limit(200)
      );

      if (error) throw error;
      setProdutos((Array.isArray(data) ? data : []).map((p: any) => ({ id: p.id, nome: p.nome, valor: p.preco_venda, categoria: p.categoria })));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    }
  }, [resolveOwnerUserId, resolvePublicId]);

  // A verificação de disponibilidade agora é feita pela função RPC do Supabase

  // Calcular horários disponíveis usando a função melhorada do Supabase
  const calcularHorariosDisponiveis = useCallback(async (
    servicoId: string, 
    data: string
  ): Promise<HorarioDisponivel[]> => {
    setHorariosError(null);
    const servico = servicos.find(s => s.id === servicoId);
    if (!servico) {
      console.log('Serviço não encontrado:', servicoId);
      return [];
    }

    try {
      const publicId = await resolvePublicId();

      const horariosResultCall = publicId
        ? await withTiming('rpc:get_public_time_slots', () =>
            db.rpc('get_public_time_slots', {
              p_public_id: publicId,
              p_data: data,
              p_servico_id: servicoId,
            })
          )
        : await withTiming('rpc:buscar_horarios_com_multiplos_intervalos', async () =>
            db.rpc('buscar_horarios_com_multiplos_intervalos', {
              data_selecionada: data,
              user_id_param: servico.user_id || (await resolveOwnerUserId()),
              duracao_servico: typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60,
            })
          );

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
  }, [resolvePublicId, servicos]);

  // Criar cliente se não existir
  const criarClienteSeNaoExistir = useCallback(async (dados: AgendamentoOnlineData) => {
    try {
      // Usar função do Supabase para criar cliente
      const { data, error } = await withTiming('rpc:criar_cliente_agendamento_online', () =>
        db.rpc('criar_cliente_agendamento_online', {
          p_nome: dados.nome_completo,
          p_telefone: dados.telefone,
          p_email: dados.email,
          p_observacoes: 'Cliente criado via agendamento online'
        })
      );

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
      const servico = servicos.find(s => s.id === dados.servico_id);
      if (!servico) {
        throw new Error('Serviço não encontrado');
      }

      const duracaoEfetiva = typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60;
      const valorEfetivo = typeof servico.valor === 'number' && servico.valor >= 0 ? servico.valor : 0;
      await resolveOwnerUserId();

      // Validação final de disponibilidade antes de criar
      // Se não for possível calcular horários (ex: erro de rede), tentamos prosseguir
      // A trigger no banco de dados fará a validação final se necessário
      try {
        const horariosDisponiveis = await calcularHorariosDisponiveis(dados.servico_id, dados.data);
        // Se a lista de horários não estiver vazia, verificamos se o horário escolhido ainda está lá
        if (horariosDisponiveis.length > 0) {
          const alvo = String(dados.horario).slice(0, 5);
          const horarioDisponivel = horariosDisponiveis.find(h => h.disponivel && String(h.horario).slice(0, 5) === alvo);
          if (!horarioDisponivel) {
            toast.error("Este horário acabou de ser reservado. Por favor, selecione outro.");
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
      const firstTry = await withTiming('insert:agendamentos_online', () => db.from('agendamentos_online').insert(baseInsert as any));
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
  }, [servicos, criarClienteSeNaoExistir, calcularHorariosDisponiveis, resolveOwnerUserId]);

  return {
    loading,
    servicos,
    servicosError,
    produtos,
    horariosError,
    ownerUserId: ownerUserIdCache,
    publicId: publicIdCache,
    carregarServicos,
    carregarProdutosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  };
};
