import { supabasePublic } from '../src/integrations/supabase/publicClient';

const log = (...args: unknown[]) => console.log(...args);

const timed = async <T,>(label: string, fn: () => Promise<T>) => {
  const start = performance.now();
  try {
    const out = await fn();
    log(label, 'ok', `${Math.round(performance.now() - start)}ms`);
    return out;
  } catch (e) {
    log(label, 'err', `${Math.round(performance.now() - start)}ms`);
    throw e;
  }
};

const isoDate = (d: Date) => d.toISOString().split('T')[0];

const main = async () => {
  const results: { ok: boolean; label: string; details?: string }[] = [];

  const mark = (label: string, ok: boolean, details?: string) => {
    results.push({ ok, label, details });
    log(ok ? 'PASS' : 'FAIL', label, details || '');
  };

  const configRes = await timed('select:configuracoes_agendamento_online', () =>
    supabasePublic
      .from('configuracoes_agendamento_online' as any)
      .select('id, user_id, ativo, nome_salao, updated_at')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  );

  mark('configuracoes_agendamento_online select', !configRes.error, configRes.error?.message);
  const ownerFromConfig = (configRes.data as any)?.user_id ? String((configRes.data as any).user_id) : null;

  const publicIdRes = await timed('rpc:get_default_public_id', () => supabasePublic.rpc('get_default_public_id' as any));
  const publicId = publicIdRes.data ? String(publicIdRes.data) : '';
  if (publicIdRes.error) {
    mark('rpc get_default_public_id', false, publicIdRes.error.message);
  } else if (!publicId) {
    mark('rpc get_default_public_id', false, 'função executou, mas retornou public_id vazio');
  } else {
    mark('rpc get_default_public_id', true, publicId);
  }

  let ownerId = ownerFromConfig;
  if (publicId) {
    const ownerRes = await timed('rpc:get_booking_owner_id', () =>
      supabasePublic.rpc('get_booking_owner_id' as any, { p_public_id: publicId })
    );
    mark('rpc get_booking_owner_id', !ownerRes.error, ownerRes.error?.message);
    if (!ownerRes.error && ownerRes.data) ownerId = String(ownerRes.data);
  }

  if (!ownerId) {
    mark('resolve owner user_id', false, 'não foi possível resolver user_id do salão');
    process.exitCode = 2;
    return;
  }

  mark('resolve owner user_id', true, ownerId);

  const servicosRes = await timed('select:servicos', () =>
    supabasePublic
      .from('servicos' as any)
      .select('id, nome, valor, duracao, user_id')
      .eq('user_id', ownerId)
      .limit(5)
  );
  mark('servicos select', !servicosRes.error, servicosRes.error?.message);
  const servicosList = (servicosRes.data as any[] | null) || [];
  if (!servicosRes.error && servicosList.length === 0) {
    mark('servicos não vazio', false, 'nenhum serviço retornado (ver RLS, dados ou filtros)');
    process.exitCode = 2;
    return;
  }
  const servico = servicosList[0] || null;

  const produtosRes = await timed('select:produtos', () =>
    supabasePublic
      .from('produtos' as any)
      .select('id, nome, preco_venda, ativo, categoria, user_id')
      .eq('user_id', ownerId)
      .eq('ativo', true)
      .limit(5)
  );
  mark('produtos select', !produtosRes.error, produtosRes.error?.message);

  if (servico?.id) {
    const data = isoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const duracao = typeof servico.duracao === 'number' && servico.duracao > 0 ? servico.duracao : 60;
    const horariosRes = await timed('rpc:buscar_horarios_com_multiplos_intervalos', () =>
      supabasePublic.rpc('buscar_horarios_com_multiplos_intervalos', {
        data_selecionada: data,
        user_id_param: ownerId,
        duracao_servico: duracao,
      })
    );
    mark('horarios rpc', !horariosRes.error, horariosRes.error?.message);
  }

  const failed = results.filter(r => !r.ok);
  if (failed.length > 0) process.exitCode = 1;
};

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
