import { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { toISODate } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReagendamentoDialog from '@/components/agendamentos/ReagendamentoDialog';
import { toast } from 'sonner';

type AgendaMensalProps = {
  buscaTexto?: string;
};

export function AgendaMensal({ buscaTexto = '' }: AgendaMensalProps) {
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const { todosAgendamentos, loading, verificarConflito, atualizarAgendamento, cancelarAgendamento, converterAgendamentoOnlineParaRegular } = useAgendamentos() as any;
  const { user } = useSupabaseAuth();
  const [diaSelecionado, setDiaSelecionado] = React.useState<Date | null>(null);
  const [detalheAberto, setDetalheAberto] = React.useState(false);
  const [reagendarAberto, setReagendarAberto] = React.useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = React.useState<any | null>(null);
  const [detalhesAgendamentoAberto, setDetalhesAgendamentoAberto] = React.useState(false);

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  

  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1));
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1));
  const mesAtualBtn = () => setMesAtual(new Date());

  const termo = buscaTexto.trim().toLowerCase();
  const agendamentosDoMes = React.useMemo(() => {
    const mesChave = toISODate(mesAtual).slice(0, 7); // yyyy-MM
    return todosAgendamentos
      .filter(ag => toISODate(ag.data as any).slice(0, 7) === mesChave)
      .filter(ag => {
        if (!termo) return true;
        const campos = [
          ag.clienteNome,
          ag.servicoNome,
          ag.status,
          ag.origem,
          ag.hora,
          ag.observacoes || ''
        ].map(v => String(v || '').toLowerCase());
        return campos.some(c => c.includes(termo));
      });
  }, [todosAgendamentos, mesAtual, termo]);

  const agendadosMes = React.useMemo(() => agendamentosDoMes.filter(ag => ag.status === 'agendado'), [agendamentosDoMes]);
  const concluidosMes = React.useMemo(() => agendamentosDoMes.filter(ag => ag.status === 'concluido'), [agendamentosDoMes]);
  const valorTotalAReceber = React.useMemo(() => agendadosMes.reduce((total, ag) => total + Number(ag.valor ?? 0), 0), [agendadosMes]);

  // Grade do calendário
  const diasVisiveis = React.useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const [contagemPorDia, setContagemPorDia] = React.useState<Map<string, number>>(new Map());

  React.useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      try {
        // fallback local enquanto a RPC não estiver disponível
        if (!user) return;
        // Chamada RPC para contagem por dia
        const { data, error } = await (supabase as any).rpc('contagem_agendamentos_por_dia', {
          p_user_id: user.id,
          p_mes: toISODate(mesAtual)
        });
        if (error || !Array.isArray(data)) {
          // Fallback: calcular localmente
          const mapa = new Map<string, number>();
          for (const ag of agendamentosDoMes) {
            const chave = toISODate(ag.data as any);
            mapa.set(chave, (mapa.get(chave) || 0) + 1);
          }
          if (!cancelado) setContagemPorDia(mapa);
          return;
        }
        const mapa = new Map<string, number>();
        for (const row of data as any[]) {
          const chave = toISODate(row.dia);
          mapa.set(chave, Number(row.total || 0));
        }
        if (!cancelado) setContagemPorDia(mapa);
      } catch {
        const mapa = new Map<string, number>();
        for (const ag of agendamentosDoMes) {
          const chave = toISODate(ag.data as any);
          mapa.set(chave, (mapa.get(chave) || 0) + 1);
        }
        if (!cancelado) setContagemPorDia(mapa);
      }
    };
    carregar();
    return () => { cancelado = true };
  }, [user, mesAtual, agendamentosDoMes]);

  const getAgendamentosDoDia = React.useCallback((dia: Date) => {
    const chaveDia = toISODate(dia);
    return agendamentosDoMes
      .filter(ag => toISODate(ag.data as any) === chaveDia)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [agendamentosDoMes]);

  const formatarDataLocal = (value: any) => {
    const iso = toISODate(value);
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Navegação do Mês Aprimorada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={mesAnterior} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[220px] lg:min-w-[280px]">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={proximoMes} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={mesAtualBtn} 
          className="w-full sm:w-auto transition-all hover:scale-105 shadow-md"
        >
          Mês Atual
        </Button>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400">
              {agendadosMes.length}
            </div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Agendados</p>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400">
                R$ {valorTotalAReceber.toFixed(2)}
              </div>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">A Receber</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400">
              {concluidosMes.length}
            </div>
            <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário Mensal com contagem por dia */}
      <Card className="border-0 bg-card/60">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
            <div className="text-center font-medium">Dom</div>
            <div className="text-center font-medium">Seg</div>
            <div className="text-center font-medium">Ter</div>
            <div className="text-center font-medium">Qua</div>
            <div className="text-center font-medium">Qui</div>
            <div className="text-center font-medium">Sex</div>
            <div className="text-center font-medium">Sáb</div>
          </div>
          <div className="grid grid-cols-7 gap-2" role="grid" aria-label="Calendário mensal">
            {diasVisiveis.map((dia) => {
              const dentroDoMes = isSameMonth(dia, mesAtual);
              const chave = toISODate(dia);
              const count = contagemPorDia.get(chave) || 0;
              return (
                <button
                  key={chave}
                  type="button"
                  onClick={() => { setDiaSelecionado(dia); setDetalheAberto(true); }}
                  className={`relative p-2 rounded-lg text-left border transition-colors ${
                    dentroDoMes ? 'bg-background hover:bg-muted border-border/60' : 'bg-muted/40 text-muted-foreground/70 border-transparent'
                  }`}
                  aria-label={`${format(dia, "dd 'de' MMMM", { locale: ptBR })} - ${count} agendamentos`}
                  role="gridcell"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${dentroDoMes ? 'text-foreground' : 'text-muted-foreground/70'}`}>{format(dia, 'd', { locale: ptBR })}</span>
                    {count > 0 && (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0" aria-label={`${count} agendamentos`}>
                        {count}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de detalhes do dia selecionado */}
      <Dialog open={detalheAberto} onOpenChange={setDetalheAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {diaSelecionado && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>
                  {format(diaSelecionado, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogTitle>
                <DialogDescription>
                  Agendamentos do dia
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const ags = getAgendamentosDoDia(diaSelecionado);
                return (
                  <div className="space-y-2">
                    {ags.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Nenhum agendamento</div>
                    ) : (
                      <div className="space-y-2" role="list" aria-label="Agendamentos do dia">
                        {ags.map(a => (
                          <div key={a.id} className="p-3 rounded-md bg-muted" role="listitem">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-semibold">{a.hora}</span>
                                <div>
                                  <div className="text-sm font-medium">{a.clienteNome}</div>
                                  <div className="text-xs text-muted-foreground">{a.servicoNome}</div>
                                </div>
                              </div>
                              <div className="text-sm font-semibold whitespace-nowrap">R$ {Number(a.valor ?? 0).toFixed(2)}</div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setAgendamentoSelecionado(a); setDetalhesAgendamentoAberto(true); }}
                              >
                                Detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setAgendamentoSelecionado(a); setReagendarAberto(true); }}
                              >
                                Reagendar
                              </Button>
                              {a.status !== 'concluido' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => { await atualizarAgendamento?.(a.id, { status: 'concluido' }); }}
                                >
                                  Marcar concluído
                                </Button>
                              )}
                              {a.status !== 'cancelado' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => { await cancelarAgendamento?.(a.id); }}
                                >
                                  Cancelar
                                </Button>
                              )}
                              {String(a.id).startsWith('online_') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => { 
                                    const ok = await converterAgendamentoOnlineParaRegular?.(String(a.id).replace('online_', ''));
                                    if (ok) {
                                      toast.success('Agendamento online convertido com sucesso');
                                    } else {
                                      toast.error('Falha ao converter agendamento online');
                                    }
                                  }}
                                >
                                  Converter para regular
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetalheAberto(false)} autoFocus>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Reagendamento */}
      <ReagendamentoDialog
        open={reagendarAberto}
        onOpenChange={setReagendarAberto}
        agendamento={agendamentoSelecionado}
        onReagendar={async (id, novaData, novaHora) => {
          const ok = await atualizarAgendamento?.(id, { data: novaData, hora: novaHora });
          return !!ok;
        }}
        verificarConflito={verificarConflito}
      />

      {/* Diálogo de Detalhes simples */}
      <Dialog open={detalhesAgendamentoAberto} onOpenChange={setDetalhesAgendamentoAberto}>
        <DialogContent className="max-w-lg">
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{agendamentoSelecionado.clienteNome}</span>
                  <Badge className="border-0 capitalize bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {agendamentoSelecionado.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {format(formatarDataLocal(agendamentoSelecionado.data as any), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Horário</div>
                  <div className="font-medium">{agendamentoSelecionado.hora} ({agendamentoSelecionado.duracao}min)</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Serviço</div>
                  <div className="font-medium">{agendamentoSelecionado.servicoNome}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Valor</div>
                  <div className="font-medium">R$ {Number(agendamentoSelecionado.valor ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Origem</div>
                  <div className="font-medium capitalize">{agendamentoSelecionado.origem || 'manual'}</div>
                </div>
              </div>
              {agendamentoSelecionado.observacoes && (
                <div className="mt-2 p-3 rounded-md bg-muted/60 text-sm">
                  <div className="text-muted-foreground mb-1">Observações</div>
                  <div className="italic">"{agendamentoSelecionado.observacoes}"</div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDetalhesAgendamentoAberto(false)} autoFocus>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
