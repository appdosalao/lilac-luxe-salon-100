import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { toast } from 'sonner';
import { useHorariosTrabalho } from '@/hooks/useHorariosTrabalho';
import { safeToDate, timeToMinutes, overlaps } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type AgendaSemanalProps = {
  buscaTexto?: string;
  onSlotClick?: (dataISO: string, hora: string) => void;
};

export function AgendaSemanal({ buscaTexto = '', onSlotClick }: AgendaSemanalProps) {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const { todosAgendamentos, loading, converterAgendamentoOnlineParaRegular } = useAgendamentos() as any;
  const { getHorariosDisponiveis } = useHorariosTrabalho();
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any | null>(null);
  const [diaDialogAberto, setDiaDialogAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });
  const diasDaSemana = useMemo(
    () => eachDayOfInterval({ start: inicioSemana, end: fimSemana }),
    [inicioSemana, fimSemana]
  );

  const termo = buscaTexto.trim().toLowerCase();
  const getAgendamentosDoDia = (dia: Date) => {
    return todosAgendamentos
      .filter(ag => isSameDay(safeToDate(ag.data as any), dia))
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
      })
      .sort((a, b) => a.hora.localeCompare(b.hora));
  };


  const semanaAnterior = () => setSemanaAtual(prev => subWeeks(prev, 1));
  const proximaSemana = () => setSemanaAtual(prev => addWeeks(prev, 1));
  const semanaAtualBtn = () => setSemanaAtual(new Date());

  const agendamentosSemana = useMemo(() => (
    diasDaSemana.reduce((agendamentos, dia) => (
      [...agendamentos, ...getAgendamentosDoDia(dia)]
    ), [] as typeof todosAgendamentos)
  ), [diasDaSemana, todosAgendamentos, termo]);

  const agendadosSemana = useMemo(() => agendamentosSemana.filter(ag => ag.status === 'agendado'), [agendamentosSemana]);
  const concluidosSemana = useMemo(() => agendamentosSemana.filter(ag => ag.status === 'concluido'), [agendamentosSemana]);
  const valorTotalAReceber = useMemo(() => agendadosSemana.reduce((total, ag) => total + Number(ag.valor ?? 0), 0), [agendadosSemana]);

  const getHorariosDisponiveisDoDia = (dia: Date): string[] => {
    const diaSemana = dia.getDay();
    const slots = getHorariosDisponiveis?.(diaSemana, 60) || [];
    const ags = getAgendamentosDoDia(dia);
    return slots.filter((slot: string) => {
      const start = timeToMinutes(slot);
      const end = start + 60;
      const conflita = ags.some(ag => {
        const aStart = timeToMinutes(ag.hora);
        const aEnd = aStart + (ag.duracao || 60);
        return overlaps(start, end, aStart, aEnd);
      });
      return !conflita;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegação da Semana Aprimorada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={semanaAnterior} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[280px] lg:min-w-[350px]">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {format(inicioSemana, "dd 'de' MMM", { locale: ptBR })} - {format(fimSemana, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={proximaSemana} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={semanaAtualBtn} 
          className="w-full sm:w-auto transition-all hover:scale-105 shadow-md"
        >
          Semana Atual
        </Button>
      </div>

      {/* Resumo da Semana */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-info/10 to-info/5 dark:from-info/10 dark:to-info/5 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/20">
                <Calendar className="h-6 w-6 text-info" />
              </div>
              <div>
                <div className="text-3xl font-bold text-info">
                  {agendadosSemana.length}
                </div>
                <p className="text-sm text-info/70 font-medium">Agendados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  R$ {valorTotalAReceber.toFixed(2)}
                </div>
                <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">A Receber</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {concluidosSemana.length}
                </div>
                <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dias da Semana com contagem e horários disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" role="list" aria-label="Dias da semana">
        {diasDaSemana.map((dia) => {
          const ags = getAgendamentosDoDia(dia);
          const disponiveis = getHorariosDisponiveisDoDia(dia);
          return (
            <Card key={dia.toISOString()} className="border-0 bg-card/60" role="listitem">
              <CardContent className="p-3 space-y-2">
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => { setDiaSelecionado(dia); setDiaDialogAberto(true); }}
                  aria-label={`Ver todos os horários de ${format(dia, "EEEE, dd 'de' MMM", { locale: ptBR })}`}
                >
                  <div className="font-semibold text-sm sm:text-base capitalize">
                    {format(dia, "EEEE, dd 'de' MMM", { locale: ptBR })}
                  </div>
                  <Badge variant="outline" className="border-0 bg-info/20 text-info text-xs">
                    {ags.length} agend.
                  </Badge>
                </button>
                {ags.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground" role="list" aria-label="Horários do dia">
                    {ags.slice(0, 6).map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setAgendamentoSelecionado(a); setDetalheAberto(true); }}
                        className="px-2 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-center truncate"
                        aria-label={`Ver detalhes de ${a.clienteNome} às ${a.hora}`}
                        role="listitem"
                      >
                        {a.hora}
                      </button>
                    ))}
                    {ags.length > 6 && (
                      <span className="px-2 py-1.5 rounded-md bg-muted text-center flex items-center justify-center">+{ags.length - 6}</span>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-xs font-medium mb-2 text-muted-foreground">Horários disponíveis</div>
                  {disponiveis.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Sem horários disponíveis</div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {disponiveis.slice(0, 10).map(h => {
                        const baseCls = "px-1 py-1.5 rounded-md text-xs border text-center transition-colors";
                        const cls = onSlotClick
                          ? `${baseCls} cursor-pointer bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60 hover:bg-emerald-200`
                          : `${baseCls} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60`;
                        return onSlotClick ? (
                          <button
                            key={h}
                            type="button"
                            className={cls}
                            onClick={() => onSlotClick?.(String(dia.toISOString()).slice(0, 10), h)}
                          >
                            {h}
                          </button>
                        ) : (
                          <span key={h} className={cls}>{h}</span>
                        );
                      })}
                      {disponiveis.length > 10 && (
                        <span className="px-1 py-1.5 rounded-md text-xs bg-muted text-center flex items-center justify-center">+{disponiveis.length - 10}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Detalhes do Agendamento */}
      <Dialog open={detalheAberto} onOpenChange={setDetalheAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">Detalhes do agendamento</DialogTitle>
            <DialogDescription className="sr-only">Informações do agendamento</DialogDescription>
          </DialogHeader>
          {agendamentoSelecionado && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{agendamentoSelecionado.clienteNome}</span>
                  <Badge className="bg-info/20 text-info border-0 capitalize">
                    {agendamentoSelecionado.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {format(safeToDate(String(agendamentoSelecionado.data)), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Horário</div>
                  <div className="font-medium">{agendamentoSelecionado.hora} ({agendamentoSelecionado.duracao}min)</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Serviço</div>
                  <div className="font-medium">{agendamentoSelecionado.servicoNome}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Valor</div>
                  <div className="font-medium">R$ {Number(agendamentoSelecionado.valor ?? 0).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Origem</div>
                  <div className="font-medium capitalize">{agendamentoSelecionado.origem || 'manual'}</div>
                </div>
              </div>

              <div className="text-sm space-y-1">
                {(agendamentoSelecionado as any).clienteTelefone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{(agendamentoSelecionado as any).clienteTelefone}</span>
                  </div>
                )}
                {(agendamentoSelecionado as any).clienteEmail && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span>{(agendamentoSelecionado as any).clienteEmail}</span>
                  </div>
                )}
                {agendamentoSelecionado.observacoes && (
                  <div className="mt-2 p-3 rounded-md bg-muted/60">
                    <div className="text-muted-foreground mb-1">Observações</div>
                    <div className="italic">"{agendamentoSelecionado.observacoes}"</div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {agendamentoSelecionado && String(agendamentoSelecionado.id).startsWith('online_') && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const ok = await converterAgendamentoOnlineParaRegular?.(String(agendamentoSelecionado.id).replace('online_', ''));
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
                <Button variant="outline" onClick={() => setDetalheAberto(false)} autoFocus>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Horários do Dia */}
      <Dialog open={diaDialogAberto} onOpenChange={setDiaDialogAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {diaSelecionado && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>
                  {format(diaSelecionado, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogTitle>
                <DialogDescription>
                  Todos os horários agendados e disponíveis para o dia.
                </DialogDescription>
              </DialogHeader>

              {(() => {
                const ags = getAgendamentosDoDia(diaSelecionado);
                const disponiveis = getHorariosDisponiveisDoDia(diaSelecionado);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-0 bg-card/60">
                      <CardContent className="p-4 space-y-2">
                        <div className="text-sm font-medium">Agendados ({ags.length})</div>
                        {ags.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Nenhum agendamento</div>
                        ) : (
                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1" role="list" aria-label="Agendados do dia">
                            {ags.map(a => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => { setAgendamentoSelecionado(a); setDetalheAberto(true); }}
                                className="px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs transition-colors"
                          role="listitem"
                              >
                                {a.hora}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-card/60">
                      <CardContent className="p-4 space-y-2">
                        <div className="text-sm font-medium">Horários disponíveis ({disponiveis.length})</div>
                        {disponiveis.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Sem horários disponíveis</div>
                        ) : (
                          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1" role="list" aria-label="Horários disponíveis do dia">
                        {disponiveis.map(h => {
                          const baseCls = "px-2 py-1 rounded-full text-xs border";
                          const cls = onSlotClick
                            ? `${baseCls} cursor-pointer bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60 hover:bg-emerald-200`
                            : `${baseCls} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60`;
                          return onSlotClick ? (
                            <button
                              key={h}
                              type="button"
                              className={cls}
                              role="listitem"
                              onClick={() => onSlotClick?.(String(diaSelecionado?.toISOString() || '').slice(0, 10), h)}
                            >
                              {h}
                            </button>
                          ) : (
                            <span key={h} className={cls} role="listitem">{h}</span>
                          );
                        })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDiaDialogAberto(false)} autoFocus>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
