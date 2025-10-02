import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProblemaAuditoria {
  id: string;
  categoria: 'critico' | 'alto' | 'medio' | 'baixo';
  tipo: string;
  descricao: string;
  entidade: string;
  entidadeId: string;
  campo?: string;
  valorAtual?: any;
  valorEsperado?: any;
  sugestao?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar autenticação do usuário
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Starting audit for user:', user.id);

    const problemas: ProblemaAuditoria[] = [];
    let proximoId = 1;

    const adicionarProblema = (problema: Omit<ProblemaAuditoria, 'id'>) => {
      problemas.push({ ...problema, id: (proximoId++).toString() });
    };

    // ===== 1. VALIDAÇÃO DE CLIENTES =====
    console.log('Validating clients...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, telefone, email')
      .eq('user_id', user.id);

    if (clientesError) {
      console.error('Error fetching clients:', clientesError);
      throw clientesError;
    }

    clientes?.forEach(cliente => {
      if (!cliente.nome || cliente.nome.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Cliente sem nome',
          entidade: 'cliente',
          entidadeId: cliente.id,
          campo: 'nome',
          valorAtual: cliente.nome,
          valorEsperado: 'Nome válido',
          sugestao: 'Adicionar nome ao cliente'
        });
      }

      if (!cliente.telefone || cliente.telefone.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Cliente sem telefone',
          entidade: 'cliente',
          entidadeId: cliente.id,
          campo: 'telefone',
          valorAtual: cliente.telefone,
          valorEsperado: 'Telefone válido',
          sugestao: 'Adicionar telefone ao cliente'
        });
      }
    });

    // ===== 2. VALIDAÇÃO DE SERVIÇOS =====
    console.log('Validating services...');
    const { data: servicos, error: servicosError } = await supabase
      .from('servicos')
      .select('id, nome, valor, duracao')
      .eq('user_id', user.id);

    if (servicosError) {
      console.error('Error fetching services:', servicosError);
      throw servicosError;
    }

    servicos?.forEach(servico => {
      if (!servico.nome || servico.nome.trim() === '') {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Serviço sem nome',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'nome',
          valorAtual: servico.nome,
          valorEsperado: 'Nome válido',
          sugestao: 'Adicionar nome ao serviço'
        });
      }

      if (servico.valor <= 0) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_inconsistentes',
          descricao: 'Serviço com valor inválido',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'valor',
          valorAtual: servico.valor,
          valorEsperado: 'Valor > 0',
          sugestao: 'Definir valor válido para o serviço'
        });
      }

      if (servico.duracao <= 0) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_inconsistentes',
          descricao: 'Serviço com duração inválida',
          entidade: 'servico',
          entidadeId: servico.id,
          campo: 'duracao',
          valorAtual: servico.duracao,
          valorEsperado: 'Duração > 0',
          sugestao: 'Definir duração válida para o serviço'
        });
      }
    });

    // ===== 3. VALIDAÇÃO DE AGENDAMENTOS E REFERÊNCIAS =====
    console.log('Validating appointments...');
    const { data: agendamentos, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('id, cliente_id, servico_id, data, hora, duracao, valor, valor_pago, valor_devido, status, status_pagamento')
      .eq('user_id', user.id);

    if (agendamentosError) {
      console.error('Error fetching appointments:', agendamentosError);
      throw agendamentosError;
    }

    // Criar sets de IDs válidos
    const clienteIds = new Set(clientes?.map(c => c.id) || []);
    const servicoIds = new Set(servicos?.map(s => s.id) || []);

    agendamentos?.forEach(agendamento => {
      // Validar referências
      if (agendamento.cliente_id && !clienteIds.has(agendamento.cliente_id)) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'referencia_invalida',
          descricao: 'Agendamento com cliente inexistente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'clienteId',
          valorAtual: agendamento.cliente_id,
          valorEsperado: 'Cliente existente',
          sugestao: 'Verificar se cliente foi deletado ou corrigir referência'
        });
      }

      if (agendamento.servico_id && !servicoIds.has(agendamento.servico_id)) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'referencia_invalida',
          descricao: 'Agendamento com serviço inexistente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'servicoId',
          valorAtual: agendamento.servico_id,
          valorEsperado: 'Serviço existente',
          sugestao: 'Verificar se serviço foi deletado ou corrigir referência'
        });
      }

      // Validar campos obrigatórios
      if (!agendamento.cliente_id) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem cliente',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'clienteId',
          sugestao: 'Associar cliente ao agendamento'
        });
      }

      if (!agendamento.servico_id) {
        adicionarProblema({
          categoria: 'critico',
          tipo: 'dados_incompletos',
          descricao: 'Agendamento sem serviço',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'servicoId',
          sugestao: 'Associar serviço ao agendamento'
        });
      }

      // Validar valores
      if (agendamento.valor_pago > agendamento.valor) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'dados_inconsistentes',
          descricao: 'Valor pago maior que valor total',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'valorPago',
          valorAtual: agendamento.valor_pago,
          valorEsperado: `<= ${agendamento.valor}`,
          sugestao: 'Corrigir valores de pagamento'
        });
      }

      // Validar valor devido
      const valorDevidoEsperado = agendamento.valor - agendamento.valor_pago;
      if (Math.abs(agendamento.valor_devido - valorDevidoEsperado) > 0.01) {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Valor devido não confere com cálculo',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'valorDevido',
          valorAtual: agendamento.valor_devido,
          valorEsperado: valorDevidoEsperado,
          sugestao: 'Recalcular valor devido'
        });
      }

      // Validar status de pagamento
      if (agendamento.valor_pago === 0 && agendamento.status_pagamento !== 'em_aberto') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (valor zerado)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.status_pagamento,
          valorEsperado: 'em_aberto',
          sugestao: 'Corrigir status de pagamento'
        });
      }

      if (agendamento.valor_pago >= agendamento.valor && agendamento.status_pagamento !== 'pago') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (valor total pago)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.status_pagamento,
          valorEsperado: 'pago',
          sugestao: 'Corrigir status de pagamento'
        });
      }

      if (agendamento.valor_pago > 0 && agendamento.valor_pago < agendamento.valor && agendamento.status_pagamento !== 'parcial') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_inconsistentes',
          descricao: 'Status de pagamento inconsistente (pagamento parcial)',
          entidade: 'agendamento',
          entidadeId: agendamento.id,
          campo: 'statusPagamento',
          valorAtual: agendamento.status_pagamento,
          valorEsperado: 'parcial',
          sugestao: 'Corrigir status de pagamento'
        });
      }
    });

    // ===== 4. DETECTAR CONFLITOS DE HORÁRIO =====
    console.log('Checking schedule conflicts...');
    const agendamentosAtivos = agendamentos?.filter(ag => ag.status !== 'cancelado') || [];
    
    for (let i = 0; i < agendamentosAtivos.length; i++) {
      for (let j = i + 1; j < agendamentosAtivos.length; j++) {
        const ag1 = agendamentosAtivos[i];
        const ag2 = agendamentosAtivos[j];

        if (ag1.data === ag2.data && ag1.hora && ag2.hora && ag1.duracao && ag2.duracao) {
          const inicio1 = new Date(`${ag1.data}T${ag1.hora}`);
          const fim1 = new Date(inicio1.getTime() + ag1.duracao * 60000);
          const inicio2 = new Date(`${ag2.data}T${ag2.hora}`);
          const fim2 = new Date(inicio2.getTime() + ag2.duracao * 60000);

          if (inicio1 < fim2 && fim1 > inicio2) {
            adicionarProblema({
              categoria: 'critico',
              tipo: 'conflito_agendamento',
              descricao: 'Conflito de horário entre agendamentos',
              entidade: 'agendamento',
              entidadeId: ag1.id,
              campo: 'horario',
              valorAtual: `${ag1.data} ${ag1.hora}`,
              valorEsperado: 'Horário livre',
              sugestao: `Conflito com agendamento ${ag2.id}`
            });
          }
        }
      }
    }

    // ===== 5. VALIDAÇÃO DE LANÇAMENTOS =====
    console.log('Validating financial records...');
    const { data: lancamentos, error: lancamentosError } = await supabase
      .from('lancamentos')
      .select('id, descricao, categoria, valor, tipo')
      .eq('user_id', user.id);

    if (lancamentosError) {
      console.error('Error fetching lancamentos:', lancamentosError);
      throw lancamentosError;
    }

    lancamentos?.forEach(lancamento => {
      if (!lancamento.descricao || lancamento.descricao.trim() === '') {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'dados_incompletos',
          descricao: 'Lançamento sem descrição',
          entidade: 'lancamento',
          entidadeId: lancamento.id,
          campo: 'descricao',
          sugestao: 'Adicionar descrição ao lançamento'
        });
      }

      if (lancamento.valor <= 0) {
        adicionarProblema({
          categoria: 'alto',
          tipo: 'dados_inconsistentes',
          descricao: 'Lançamento com valor inválido',
          entidade: 'lancamento',
          entidadeId: lancamento.id,
          campo: 'valor',
          valorAtual: lancamento.valor,
          valorEsperado: 'Valor > 0',
          sugestao: 'Corrigir valor do lançamento'
        });
      }
    });

    // ===== 6. VALIDAÇÃO DE RETORNOS =====
    console.log('Validating retornos...');
    const { data: retornos, error: retornosError } = await supabase
      .from('retornos_novos')
      .select('id_retorno, status, data_retorno')
      .eq('user_id', user.id)
      .eq('status', 'Pendente');

    if (retornosError) {
      console.error('Error fetching retornos:', retornosError);
      throw retornosError;
    }

    const hoje = new Date();
    retornos?.forEach(retorno => {
      const dataRetorno = new Date(retorno.data_retorno);
      const diasAtraso = Math.floor((hoje.getTime() - dataRetorno.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasAtraso > 7) {
        adicionarProblema({
          categoria: 'medio',
          tipo: 'retorno_atrasado',
          descricao: `Retorno pendente há ${diasAtraso} dias`,
          entidade: 'retorno',
          entidadeId: retorno.id_retorno,
          campo: 'data_retorno',
          valorAtual: retorno.data_retorno,
          valorEsperado: 'Data atual ou futura',
          sugestao: 'Remarcar retorno ou marcar como realizado/cancelado'
        });
      }
    });

    // ===== 7. CALCULAR ESTATÍSTICAS =====
    console.log('Calculating statistics...');
    const estatisticas = {
      totalClientes: clientes?.length || 0,
      totalServicos: servicos?.length || 0,
      totalAgendamentos: agendamentos?.length || 0,
      totalLancamentos: lancamentos?.length || 0,
      totalCronogramas: 0,
      totalRetornos: retornos?.length || 0,
      agendamentosAtivos: agendamentos?.filter(ag => ag.status === 'agendado').length || 0,
      agendamentosConcluidos: agendamentos?.filter(ag => ag.status === 'concluido').length || 0,
      agendamentosCancelados: agendamentos?.filter(ag => ag.status === 'cancelado').length || 0,
      valorTotalReceitas: lancamentos?.filter(l => l.tipo === 'entrada').reduce((sum, l) => sum + l.valor, 0) || 0,
      valorTotalDespesas: lancamentos?.filter(l => l.tipo === 'saida').reduce((sum, l) => sum + l.valor, 0) || 0,
      servicosNuncaUsados: 0,
      clientesInativos: 0,
    };

    // Calcular serviços nunca usados
    const servicosUsados = new Set(agendamentos?.map(ag => ag.servico_id) || []);
    estatisticas.servicosNuncaUsados = servicos?.filter(s => !servicosUsados.has(s.id)).length || 0;

    // Calcular clientes inativos (sem agendamento há mais de 30 dias)
    const clientesAtivos = new Set();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    
    agendamentos?.forEach(ag => {
      const dataAgendamento = new Date(ag.data);
      if (dataAgendamento >= dataLimite) {
        clientesAtivos.add(ag.cliente_id);
      }
    });
    
    estatisticas.clientesInativos = (clientes?.length || 0) - clientesAtivos.size;

    // ===== 8. GERAR SUGESTÕES =====
    const sugestoesMelhorias: string[] = [];

    if (estatisticas.servicosNuncaUsados > 0) {
      sugestoesMelhorias.push(`${estatisticas.servicosNuncaUsados} serviços nunca foram agendados. Considere promovê-los ou removê-los.`);
    }

    if (estatisticas.clientesInativos > 0) {
      sugestoesMelhorias.push(`${estatisticas.clientesInativos} clientes não têm agendamentos recentes. Considere uma campanha de reativação.`);
    }

    const agendamentosEmAberto = agendamentos?.filter(ag => ag.status_pagamento === 'em_aberto').length || 0;
    if (agendamentosEmAberto > 0) {
      sugestoesMelhorias.push(`${agendamentosEmAberto} agendamentos com pagamento em aberto. Revisar política de cobrança.`);
    }

    const retornosAtrasados = retornos?.filter(r => {
      const dataRetorno = new Date(r.data_retorno);
      return dataRetorno < hoje;
    }).length || 0;
    
    if (retornosAtrasados > 0) {
      sugestoesMelhorias.push(`${retornosAtrasados} retornos em atraso. Entrar em contato com clientes.`);
    }

    // ===== 9. MONTAR RELATÓRIO FINAL =====
    const relatorio = {
      dataExecucao: new Date().toISOString(),
      totalProblemas: problemas.length,
      problemasCriticos: problemas.filter(p => p.categoria === 'critico').length,
      problemasAltos: problemas.filter(p => p.categoria === 'alto').length,
      problemasMedios: problemas.filter(p => p.categoria === 'medio').length,
      problemasBaixos: problemas.filter(p => p.categoria === 'baixo').length,
      problemas,
      estatisticas,
      sugestoesMelhorias
    };

    console.log('Audit completed:', {
      totalProblemas: relatorio.totalProblemas,
      criticos: relatorio.problemasCriticos,
      altos: relatorio.problemasAltos
    });

    return new Response(
      JSON.stringify(relatorio),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in audit function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
