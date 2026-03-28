import { useState, useCallback } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { supabase } from '@/integrations/supabase/client';
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

  const getPublicIdFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('s') || params.get('public_id') || params.get('salao') || '';
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

    try {
      const { data, error } = await db.rpc('get_default_public_id');
      if (error) return '';
      const next = data ? String(data) : '';
      if (next) setPublicIdCache(next);
      return next;
    } catch {
      return '';
    }
  }, [publicIdCache]);

  const resolveOwnerUserId = useCallback(async (): Promise<string | null> => {
    if (ownerUserIdCache) return ownerUserIdCache;

    try {
      const publicId = await resolvePublicId();

      if (publicId) {
        const { data, error } = await db.rpc('get_booking_owner_id', { p_public_id: publicId });
        if (error) {
          console.error('Erro ao resolver owner user_id pelo public_id:', error);
          return null;
        }
        const next = data ? String(data) : null;
        setOwnerUserIdCache(next);
        return next;
      }

      const { data, error } = await db
        .from('configuracoes_agendamento_online')
        .select('user_id')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar owner user_id da config pública:', error);
        return null;
      }

      const next = (data as any)?.user_id ? String((data as any).user_id) : null;
      setOwnerUserIdCache(next);
      return next;
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
        const { data, error } = await db.rpc('get_public_services', { p_public_id: publicId });
        if (error) {
          const msg = `${error.code || ''} ${error.message || ''}`.trim() || 'Erro ao carregar serviços';
          setServicosError(msg);
          setServicos([]);
          return;
        }
        setServicos(Array.isArray(data) ? data : []);
        return;
      }

      const ownerId = await resolveOwnerUserId();

      const primary = await db.from('servicos_public').select('*');
      if (!primary.error && Array.isArray(primary.data) && primary.data.length > 0) {
        setServicos(primary.data);
        return;
      }

      const fallback = ownerId
        ? await db
            .from('servicos')
            .select('id, nome, descricao, valor, duracao, user_id')
            .eq('user_id', ownerId)
        : await db
            .from('servicos')
            .select('id, nome, descricao, valor, duracao, user_id')
            .limit(200);

      if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
        setServicos(fallback.data);
        return;
      }

      const primaryErr = primary.error ? `${primary.error.code || ''} ${primary.error.message || ''}`.trim() : '';
      const fallbackErr = fallback.error ? `${fallback.error.code || ''} ${fallback.error.message || ''}`.trim() : '';

      if (primaryErr || fallbackErr) {
        throw new Error([primaryErr, fallbackErr].filter(Boolean).join(' | '));
      }

      setServicos([]);
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
        const { data, error } = await db.rpc('get_public_products', { p_public_id: publicId });
        if (error) {
          console.error('Erro ao carregar produtos públicos (rpc):', error);
          setProdutos([]);
          return;
        }
        setProdutos((Array.isArray(data) ? data : []).map((p: any) => ({ id: p.id, nome: p.nome, valor: p.valor, categoria: p.categoria })));
        return;
      }

      // Tenta view pública se existir
      let data: any[] | null = null;
      const { data: primaryData, error } = await db
        .from('produtos_public' as any)
        .select('id, nome, valor, ativo, categoria')
        .eq('ativo', true);

      data = primaryData;

      if (error) {
        // Fallback para tabela produtos (se RLS permitir)
        const alt = await db
          .from('produtos')
          .select('id, nome, preco_venda, ativo, categoria')
          .eq('ativo', true)
          .eq('categoria', 'revenda');
        data = alt.data;
      }

      setProdutos((data || []).map((p: any) => ({ id: p.id, nome: p.nome, valor: p.valor ?? p.preco_venda, categoria: p.categoria })));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    }
  }, [resolvePublicId]);

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
        ? await db.rpc('get_public_time_slots', {
            p_public_id: publicId,
            p_data: data,
            p_servico_id: servicoId,
          })
        : await db.rpc('buscar_horarios_com_multiplos_intervalos', {
            data_selecionada: data,
            user_id_param: servico.user_id || (await resolveOwnerUserId()),
            duracao_servico: typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60,
          });

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
      const { data, error } = await db.rpc('criar_cliente_agendamento_online', {
        p_nome: dados.nome_completo,
        p_telefone: dados.telefone,
        p_email: dados.email,
        p_observacoes: 'Cliente criado via agendamento online'
      });

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
      const ownerUserId = servico.user_id || (await resolveOwnerUserId());

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
          status: 'pendente',
          origem: 'formulario_online',
          user_agent: navigator.userAgent
      };

      if (ownerUserId) {
        baseInsert.owner_user_id = ownerUserId;
      }

      let insertError: any = null;
      const firstTry = await db.from('agendamentos_online').insert(baseInsert as any);
      insertError = firstTry.error;

      if (insertError?.code === 'PGRST204') {
        delete baseInsert.owner_user_id;
        const secondTry = await db.from('agendamentos_online').insert(baseInsert as any);
        insertError = secondTry.error;
      }

      if (insertError) {
        const msg = String(insertError?.message || '');
        const isRls = insertError?.code === '42501' || msg.toLowerCase().includes('row-level security');
        if (isRls) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              const authDb = supabase as any;
              const retry = await authDb.from('agendamentos_online').insert(baseInsert as any);
              insertError = retry.error;
            }
          } catch {
          }
        }
      }

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
    carregarServicos,
    carregarProdutosPublicos,
    calcularHorariosDisponiveis,
    criarAgendamento
  };
};
