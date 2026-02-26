import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Plus, Search, DollarSign } from "lucide-react";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { toast } from "@/hooks/use-toast";
import AgendamentosList from "@/components/agendamentos/AgendamentosList";
import AgendamentoForm from "@/components/agendamentos/AgendamentoForm";
import AgendamentoDetalhes from "@/components/agendamentos/AgendamentoDetalhes";
import ReagendamentoDialog from "@/components/agendamentos/ReagendamentoDialog";
import TrocaHorarioDialog from "@/components/agendamentos/TrocaHorarioDialog";
import PagamentoDialog from "@/components/agendamentos/PagamentoDialog";
import { Agendamento } from "@/types/agendamento";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

type VisualizacaoAtual = 'lista' | 'formulario' | 'detalhes';

export default function Agendamentos() {
  const { user } = useSupabaseAuth();
  const {
    agendamentos,
    agendamentosFiltrados,
    filtros,
    setFiltros,
    paginaAtual,
    setPaginaAtual,
    totalPaginas,
    clientes,
    servicos,
    criarAgendamento,
    atualizarAgendamento,
    excluirAgendamento,
    cancelarAgendamento,
    verificarConflito,
    todosAgendamentos,
  } = useAgendamentos();

  const [visualizacaoAtual, setVisualizacaoAtual] = useState<VisualizacaoAtual>('lista');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null);
  const [dialogReagendamentoOpen, setDialogReagendamentoOpen] = useState(false);
  const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState<Agendamento | null>(null);
  const [dialogTrocaHorarioOpen, setDialogTrocaHorarioOpen] = useState(false);
  const [agendamentoParaTrocar, setAgendamentoParaTrocar] = useState<Agendamento | null>(null);
  const [dialogPagamentoOpen, setDialogPagamentoOpen] = useState(false);
  const [agendamentoParaPagar, setAgendamentoParaPagar] = useState<Agendamento | null>(null);

  // Estatísticas rápidas baseadas nos dados reais
  const hoje = new Date().toISOString().split('T')[0];
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);

  const agendamentosHoje = agendamentosFiltrados.filter(ag => 
    ag.data === hoje && ag.status !== 'cancelado'
  ).length;

  const agendamentosAmanha = agendamentosFiltrados.filter(ag => 
    ag.data === amanha && ag.status !== 'cancelado'
  ).length;

  const agendamentosEstaSemana = agendamentosFiltrados.filter(ag => {
    const dataAgendamento = new Date(ag.data);
    return dataAgendamento >= inicioSemana && 
           dataAgendamento <= fimSemana && 
           ag.status !== 'cancelado';
  }).length;

  const handleNovoAgendamento = () => {
    setAgendamentoSelecionado(null);
    setVisualizacaoAtual('formulario');
  };

  const handleEditarAgendamento = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setVisualizacaoAtual('formulario');
  };

  const handleVerDetalhes = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setVisualizacaoAtual('detalhes');
  };

  const handleSubmitFormulario = (data: any) => {
    const sucesso = agendamentoSelecionado
      ? atualizarAgendamento(agendamentoSelecionado.id, data)
      : criarAgendamento(data);

    if (sucesso) {
      setVisualizacaoAtual('lista');
      setAgendamentoSelecionado(null);
    }
  };

  const handleVoltarParaLista = () => {
    setVisualizacaoAtual('lista');
    setAgendamentoSelecionado(null);
  };

  const handleCancelarAgendamento = () => {
    if (agendamentoSelecionado) {
      cancelarAgendamento(agendamentoSelecionado.id);
      setVisualizacaoAtual('lista');
      setAgendamentoSelecionado(null);
    }
  };

  const handleReagendar = (agendamento: Agendamento) => {
    setAgendamentoParaReagendar(agendamento);
    setDialogReagendamentoOpen(true);
  };

  const handleConfirmarReagendamento = async (agendamentoId: string, novaData: string, novaHora: string) => {
    const sucesso = await atualizarAgendamento(agendamentoId, {
      data: novaData,
      hora: novaHora,
    });
    
    if (sucesso) {
      setDialogReagendamentoOpen(false);
      setAgendamentoParaReagendar(null);
    }
    
    return sucesso;
  };

  const handleTrocarHorario = (agendamento: Agendamento) => {
    setAgendamentoParaTrocar(agendamento);
    setDialogTrocaHorarioOpen(true);
  };

  const handleConfirmarTrocaHorario = async (agendamento1Id: string, agendamento2Id: string) => {
    try {
      // Buscar os dados completos dos dois agendamentos
      const agendamento1 = todosAgendamentos.find(ag => ag.id === agendamento1Id);
      const agendamento2 = todosAgendamentos.find(ag => ag.id === agendamento2Id);
      
      if (!agendamento1 || !agendamento2) {
        return false;
      }

      // Verificar se a troca criará conflitos de horário
      // Validar se agendamento1 cabe no horário do agendamento2
      const verificarConflito1 = verificarConflito({
        data: agendamento2.data,
        hora: agendamento2.hora,
        duracao: agendamento1.duracao
      }, agendamento2Id); // Excluir agendamento2 da verificação

      if (verificarConflito1) {
        toast({
          title: "Conflito de horário",
          description: `O agendamento de ${agendamento1.clienteNome} (${agendamento1.duracao}min) não cabe no horário de ${agendamento2.clienteNome}. Há conflito com outros agendamentos.`,
          variant: "destructive",
        });
        return false;
      }

      // Validar se agendamento2 cabe no horário do agendamento1
      const verificarConflito2 = verificarConflito({
        data: agendamento1.data,
        hora: agendamento1.hora,
        duracao: agendamento2.duracao
      }, agendamento1Id); // Excluir agendamento1 da verificação

      if (verificarConflito2) {
        toast({
          title: "Conflito de horário",
          description: `O agendamento de ${agendamento2.clienteNome} (${agendamento2.duracao}min) não cabe no horário de ${agendamento1.clienteNome}. Há conflito com outros agendamentos.`,
          variant: "destructive",
        });
        return false;
      }

      // Se não há conflitos, realizar a troca
      const sucesso1 = await atualizarAgendamento(agendamento1Id, {
        data: agendamento2.data,
        hora: agendamento2.hora
      });

      const sucesso2 = await atualizarAgendamento(agendamento2Id, {
        data: agendamento1.data,
        hora: agendamento1.hora
      });

      if (sucesso1 && sucesso2) {
        toast({
          title: "Horários trocados",
          description: "Os horários foram trocados com sucesso!",
        });
      }

      return sucesso1 && sucesso2;
    } catch (error) {
      console.error('Erro ao trocar horários:', error);
      toast({
        title: "Erro ao trocar horários",
        description: "Ocorreu um erro ao realizar a troca. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleMarcarPagamento = (agendamento: Agendamento) => {
    setAgendamentoParaPagar(agendamento);
    setDialogPagamentoOpen(true);
  };

  const handleConfirmarPagamento = async (agendamentoId: string, valorPago: number, formaPagamento: string) => {
    const agendamento = todosAgendamentos.find(ag => ag.id === agendamentoId);
    if (!agendamento) return false;

    const novoValorPago = agendamento.valorPago + valorPago;
    const novoValorDevido = agendamento.valor - novoValorPago;
    
    let novoStatusPagamento: 'pago' | 'parcial' | 'em_aberto';
    let novoStatus = agendamento.status;
    
    if (novoValorDevido <= 0) {
      novoStatusPagamento = 'pago';
      novoStatus = 'concluido';
    } else if (novoValorPago > 0) {
      novoStatusPagamento = 'parcial';
    } else {
      novoStatusPagamento = 'em_aberto';
    }

    const sucesso = await atualizarAgendamento(agendamentoId, {
      valorPago: novoValorPago,
      valorDevido: Math.max(0, novoValorDevido),
      statusPagamento: novoStatusPagamento,
      status: novoStatus,
      formaPagamento: formaPagamento as any,
    });

    if (sucesso) {
      toast({
        title: "Pagamento registrado",
        description: novoStatusPagamento === 'pago' 
          ? "Pagamento completo registrado com sucesso!" 
          : `Pagamento parcial de R$ ${valorPago.toFixed(2)} registrado.`,
      });

      // Feedback imediato de fidelidade ao concluir e pagar
      if (novoStatusPagamento === 'pago' && user) {
        try {
          const { data: existe } = await supabase
            .from('pontos_fidelidade')
            .select('id')
            .eq('user_id', user.id)
            .eq('origem', 'agendamento')
            .eq('origem_id', agendamentoId)
            .limit(1);
          if (!existe || existe.length === 0) {
            const { data: programa } = await supabase
              .from('programas_fidelidade')
              .select('*')
              .eq('user_id', user.id)
              .eq('ativo', true)
              .limit(1)
              .single();
            if (programa) {
              const parseValor = (v: any): number => {
                if (typeof v === 'number') return v;
                if (typeof v === 'string') {
                  const s = v.replace(/\./g, '').replace(',', '.');
                  const n = Number(s);
                  return isNaN(n) ? 0 : n;
                }
                return 0;
              };
              const valorBase = parseValor(novoValorPago) > 0 ? parseValor(novoValorPago) : parseValor(agendamento.valor);
              const ppr = Number(programa.pontos_por_real || 1);
              const pontos = Math.floor(valorBase * (isNaN(ppr) ? 1 : ppr));
              if (pontos > 0) {
                const dataExp = Number(programa.expiracao_pontos_dias || 0) > 0
                  ? new Date(Date.now() + programa.expiracao_pontos_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  : null;
                await supabase.from('pontos_fidelidade').insert({
                  user_id: user.id,
                  cliente_id: agendamento.clienteId,
                  pontos,
                  origem: 'agendamento',
                  origem_id: agendamentoId,
                  descricao: 'Pontos creditados no pagamento',
                  data_expiracao: dataExp,
                  expirado: false
                });
                toast({
                  title: "Pontos creditados",
                  description: `${pontos} pontos adicionados ao cliente`,
                });
              }
            }
          }
        } catch (e) {
          // Em caso de erro, não bloquear o fluxo principal
        }
      }
      setDialogPagamentoOpen(false);
      setAgendamentoParaPagar(null);
      if (visualizacaoAtual === 'detalhes') {
        setVisualizacaoAtual('lista');
      }
    }

    return sucesso;
  };

  if (visualizacaoAtual === 'formulario') {
    return (
      <div className="space-y-8">
        <AgendamentoForm
          agendamento={agendamentoSelecionado || undefined}
          clientes={clientes}
          servicos={servicos}
          onSubmit={handleSubmitFormulario}
          onCancel={handleVoltarParaLista}
          verificarConflito={verificarConflito}
        />
      </div>
    );
  }

  if (visualizacaoAtual === 'detalhes' && agendamentoSelecionado) {
    const cliente = clientes.find(c => c.id === agendamentoSelecionado.clienteId);
    const servico = servicos.find(s => s.id === agendamentoSelecionado.servicoId);

    return (
      <div className="space-y-8">
        <AgendamentoDetalhes
          agendamento={agendamentoSelecionado}
          cliente={cliente ? { nome: cliente.nomeCompleto, telefone: cliente.telefone, email: '' } : { nome: agendamentoSelecionado.clienteNome, telefone: '', email: '' }}
          servico={servico || { nome: agendamentoSelecionado.servicoNome }}
          onEdit={() => setVisualizacaoAtual('formulario')}
          onBack={handleVoltarParaLista}
          onCancel={handleCancelarAgendamento}
          onMarcarPagamento={() => agendamentoSelecionado && handleMarcarPagamento(agendamentoSelecionado)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie todos os agendamentos do seu salão
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setFiltros({ statusPagamento: 'em_aberto' })}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 text-xs sm:text-sm h-9 sm:h-10 justify-start sm:justify-center"
            >
              <DollarSign className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Contas a Receber</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setFiltros({ origem: 'cronograma' })}
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 text-xs sm:text-sm h-9 sm:h-10 justify-start sm:justify-center"
            >
              <span className="mr-2 text-xs sm:text-sm">💜</span>
              <span className="truncate">Cronogramas</span>
            </Button>
          </div>
          <Button 
            onClick={handleNovoAgendamento}
            className="bg-gradient-to-r from-primary to-lilac-primary shadow-lg hover:shadow-xl transition-all duration-300 text-sm h-10 sm:h-11"
          >
            <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-colors">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-lilac-light flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{agendamentosHoje}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-colors">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-lilac-primary to-pink-accent flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{agendamentosAmanha}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Amanhã</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/60 transition-colors sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-accent to-lavender flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{agendamentosEstaSemana}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Esta Semana</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Agendamentos */}
      <AgendamentosList
        agendamentos={agendamentos}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        onEdit={handleEditarAgendamento}
        onDelete={excluirAgendamento}
        onCancel={cancelarAgendamento}
        onViewDetails={handleVerDetalhes}
        onReagendar={handleReagendar}
        onTrocarHorario={handleTrocarHorario}
        onMarcarPagamento={handleMarcarPagamento}
        clientes={clientes.map(c => ({ id: c.id, nome: c.nomeCompleto }))}
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        onPaginaChange={setPaginaAtual}
      />

      {/* Dialog de Reagendamento */}
      <ReagendamentoDialog
        open={dialogReagendamentoOpen}
        onOpenChange={setDialogReagendamentoOpen}
        agendamento={agendamentoParaReagendar}
        onReagendar={handleConfirmarReagendamento}
        verificarConflito={verificarConflito}
      />

      <TrocaHorarioDialog
        open={dialogTrocaHorarioOpen}
        onOpenChange={setDialogTrocaHorarioOpen}
        agendamento={agendamentoParaTrocar}
        agendamentosDisponiveis={todosAgendamentos}
        onTrocarHorarios={handleConfirmarTrocaHorario}
      />

      <PagamentoDialog
        open={dialogPagamentoOpen}
        onOpenChange={setDialogPagamentoOpen}
        agendamento={agendamentoParaPagar}
        onConfirmar={handleConfirmarPagamento}
      />
    </div>
  );
}
