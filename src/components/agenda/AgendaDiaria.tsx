import { useState, useMemo } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User, Tag, DollarSign, Edit, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useHorariosTrabalho } from '@/hooks/useHorariosTrabalho';
import { cn, toISODate, timeToMinutes, overlaps } from '@/lib/utils';
import { getOrigemBadge, getStatusBadgeClass } from '@/components/agenda/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type AgendaDiariaProps = {
  buscaTexto?: string;
  onSlotClick?: (dataISO: string, hora: string) => void;
};

export function AgendaDiaria({ buscaTexto = '', onSlotClick }: AgendaDiariaProps) {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const { 
    todosAgendamentos, 
    agendamentosFiltrados, 
    loading, 
    converterAgendamentoOnlineParaRegular,
    cancelarAgendamento,
    excluirAgendamento
  } = useAgendamentos() as any;
  const { getHorariosDisponiveis, isAgendamentoValido } = useHorariosTrabalho();
  const [detalheAberto, setDetalheAberto] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any | null>(null);

  // Usar todos os agendamentos (incluindo online) para a agenda
  const termo = buscaTexto.trim().toLowerCase();
  const dataSelecionadaStr = toISODate(dataSelecionada);
  const agendamentosDoDia = useMemo(() => {
    return todosAgendamentos
      .filter(ag => toISODate(ag.data as any) === dataSelecionadaStr)
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
  }, [todosAgendamentos, dataSelecionadaStr, termo]);

  // Encontrar próximo agendamento
  const agora = new Date();
  const hojeStr = toISODate(agora);
  const agoraString = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
  const agoraMinutos = timeToMinutes(agoraString);
  const proximoAgendamento = useMemo(() => {
    return agendamentosDoDia.find(ag => 
      toISODate(ag.data as any) === hojeStr && 
      timeToMinutes(ag.hora) >= agoraMinutos && 
      ag.status === 'agendado'
    );
  }, [agendamentosDoDia, hojeStr, agoraMinutos]);

  // Estatísticas do dia
  const estatisticasDia = useMemo(() => ({
    agendados: agendamentosDoDia.filter(ag => ag.status === 'agendado').length,
    concluidos: agendamentosDoDia.filter(ag => ag.status === 'concluido').length,
    cancelados: agendamentosDoDia.filter(ag => ag.status === 'cancelado').length,
    valorTotal: agendamentosDoDia.reduce((total, ag) => total + Number(ag.valor ?? 0), 0),
    valorRecebido: agendamentosDoDia
      .filter(ag => ag.status === 'concluido')
      .reduce((total, ag) => total + Number((ag as any).valorPago ?? ag.valor ?? 0), 0),
    tempoTotalAtendimento: agendamentosDoDia.reduce((total, ag) => total + (ag.duracao || 0), 0)
  }), [agendamentosDoDia]);

  // Horários disponíveis do dia (com base nas regras de trabalho)
  const horariosDisponiveis = useMemo(() => {
    const diaSemana = new Date(dataSelecionadaStr + 'T00:00:00').getDay();
    const slots = getHorariosDisponiveis?.(diaSemana, 60) || [];

    // Remover horários que conflitam com algum agendamento existente
    return slots.filter((slot: string) => {
      const start = timeToMinutes(slot);
      const end = start + 60; // duração padrão exibida
      const conflita = agendamentosDoDia.some(ag => {
        const aStart = timeToMinutes(ag.hora);
        const aEnd = aStart + (ag.duracao || 60);
        return overlaps(start, end, aStart, aEnd);
      });
      return !conflita;
    });
  }, [getHorariosDisponiveis, dataSelecionadaStr, agendamentosDoDia]);

  // getStatusColor não é mais necessário; padronizado via util

  const anteriorDia = () => setDataSelecionada(prev => subDays(prev, 1));
  const proximoDia = () => setDataSelecionada(prev => addDays(prev, 1));
  const hoje = () => setDataSelecionada(new Date());

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
      {/* Navegação de Data Aprimorada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={anteriorDia} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px] lg:min-w-[250px]">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {format(dataSelecionada, 'yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={proximoDia} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={hoje} 
          className="w-full sm:w-auto transition-all hover:scale-105 shadow-md"
        >
          Hoje
        </Button>
      </div>

      {/* Próximo Cliente Destaque */}
      {proximoAgendamento && new Date(dataSelecionada).toDateString() === new Date().toDateString() && (
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Próximo Cliente</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold">{proximoAgendamento.clienteNome}</p>
                  <p className="text-muted-foreground">{proximoAgendamento.servicoNome}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {proximoAgendamento.hora} ({proximoAgendamento.duracao}min)
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      R$ {Number(proximoAgendamento.valor ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <div className="text-2xl font-bold text-primary">{proximoAgendamento.hora}</div>
                <p className="text-sm text-muted-foreground">Horário previsto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Dia Aprimorado */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="group border-0 bg-gradient-to-br from-info/10 to-info/5 dark:from-info/10 dark:to-info/5 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/20">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div className="text-xl lg:text-2xl font-bold text-info">
                {estatisticasDia.agendados}
              </div>
              <p className="text-xs lg:text-sm text-info/70 font-medium">Agendados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-success/10 to-success/5 dark:from-success/10 dark:to-success/5 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <User className="h-5 w-5 text-success" />
              </div>
              <div className="text-xl lg:text-2xl font-bold text-success">
                {estatisticasDia.concluidos}
              </div>
              <p className="text-xs lg:text-sm text-success/70 font-medium">Concluídos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-lg lg:text-xl font-bold text-purple-700 dark:text-purple-300">
                R$ {estatisticasDia.valorTotal.toFixed(2)}
              </div>
              <p className="text-xs lg:text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Valor Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-lg lg:text-xl font-bold text-emerald-700 dark:text-emerald-300">
                R$ {estatisticasDia.valorRecebido.toFixed(2)}
              </div>
              <p className="text-xs lg:text-sm text-emerald-600/70 dark:text-emerald-400/70 font-medium">Recebido</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-lg lg:text-xl font-bold text-orange-700 dark:text-orange-300">
                {Math.floor(estatisticasDia.tempoTotalAtendimento / 60)}h{estatisticasDia.tempoTotalAtendimento % 60}m
              </div>
              <p className="text-xs lg:text-sm text-orange-600/70 dark:text-orange-400/70 font-medium">Tempo Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline dos Agendamentos Aprimorada */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar" role="region" aria-label="Timeline de agendamentos do dia">
        {/* Horários Disponíveis */}
        {horariosDisponiveis.length > 0 && (
          <Card className="border-0 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {horariosDisponiveis.map((h) => {
                  const baseCls = "px-3 py-1 rounded-full text-xs font-medium border";
                  const cls = onSlotClick 
                    ? `${baseCls} cursor-pointer bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors`
                    : `${baseCls} bg-muted text-muted-foreground border-border/50`;
                  return onSlotClick ? (
                    <button
                      key={h}
                      type="button"
                      className={cls}
                      onClick={() => onSlotClick(dataSelecionadaStr, h)}
                    >
                      {h}
                    </button>
                  ) : (
                    <span key={h} className={cls}>{h}</span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {agendamentosDoDia.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-dashed border-muted-foreground/20">
            <div className="flex h-16 w-16 items-center justify-center mx-auto mb-4 rounded-full bg-muted/50">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Dia livre</h3>
            <p className="text-sm text-muted-foreground/70">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-live="polite" aria-busy={false}>
            {agendamentosDoDia.map((agendamento, index) => (
              <Card 
                key={agendamento.id} 
                className={cn(
                  "group relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer",
                  agendamento.origem === 'cronograma' && "bg-gradient-to-r from-purple-50/80 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20",
                  agendamento.status === 'concluido' && "bg-gradient-to-r from-green-50/80 to-green-100/30 dark:from-green-950/30 dark:to-green-900/20",
                  agendamento.status === 'cancelado' && "bg-gradient-to-r from-red-50/80 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20"
                )}
                role="listitem"
                onClick={() => {
                  setAgendamentoSelecionado(agendamento);
                  setDetalheAberto(true);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />
                <CardContent className="relative p-5">
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm font-semibold text-primary">{agendamento.hora}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{agendamento.clienteNome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{agendamento.servicoNome}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {(() => {
                          const origem = getOrigemBadge(agendamento.origem);
                          if (!origem) return null;
                          return (
                            <Badge variant="secondary" className={origem.className}>
                              {origem.emoji} {origem.label}
                            </Badge>
                          );
                        })()}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "border-0 font-medium",
                            getStatusBadgeClass(agendamento.status)
                          )}
                        >
                          {agendamento.status}
                        </Badge>
                        {!isAgendamentoValido(toISODate(agendamento.data as any), agendamento.hora, agendamento.duracao) && (
                          <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-0">
                            Fora do horário
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                          <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          R$ {Number(agendamento.valor ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações adicionais do cliente */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {(agendamento as any).clienteTelefone && (
                        <span className="flex items-center gap-1">
                          📞 {(agendamento as any).clienteTelefone}
                        </span>
                      )}
                      {(agendamento as any).clienteEmail && (
                        <span className="flex items-center gap-1">
                          ✉️ {(agendamento as any).clienteEmail}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        ⏱️ Duração: {agendamento.duracao}min
                      </span>
                      {agendamento.valorPago > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          💰 Pago: R$ {agendamento.valorPago.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  {String(agendamento.id).startsWith('online_') && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => { 
                          const ok = await converterAgendamentoOnlineParaRegular?.(String(agendamento.id).replace('online_', ''));
                          if (ok) {
                            toast.success('Agendamento online convertido com sucesso');
                          } else {
                            toast.error('Falha ao converter agendamento online');
                          }
                        }}
                      >
                        Converter para regular
                      </Button>
                    </div>
                  )}
                  {agendamento.observacoes && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      {agendamento.observacoes.includes('Compra de produto:') ? (
                        <div className="space-y-2">
                          {/* Mostrar observações normais antes se existirem */}
                          {agendamento.observacoes.split('Compra de produto:')[0].trim() && (
                            <p className="text-sm text-muted-foreground italic mb-1">
                              "{agendamento.observacoes.split('Compra de produto:')[0].trim()}"
                            </p>
                          )}
                          
                          {/* Bloco de produto simplificado para a lista da agenda */}
                          <div className="flex items-center gap-2 bg-primary/5 p-2.5 rounded-xl border border-primary/10 animate-in fade-in zoom-in duration-300">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {(() => {
                                try {
                                  const jsonStr = agendamento.observacoes.split('Compra de produto:')[1].trim();
                                  const compra = JSON.parse(jsonStr);
                                  return (
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-bold text-foreground truncate">
                                        {compra.produto_nome} <span className="text-muted-foreground font-medium ml-1">x{compra.quantidade}</span>
                                      </p>
                                      {compra.valor_total && (
                                        <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                          + R$ {compra.valor_total.toFixed(2).replace('.', ',')}
                                        </span>
                                      )}
                                    </div>
                                  );
                                } catch (e) {
                                  return <p className="text-[10px] text-red-500">Erro nos dados do produto</p>;
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          "{agendamento.observacoes}"
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
                  {format(new Date(agendamentoSelecionado.data + 'T12:00:00'), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                  <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border/50">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Observações e Pedidos</div>
                    {agendamentoSelecionado.observacoes.includes('Compra de produto:') ? (
                      <div className="space-y-3">
                        {/* Observação de texto normal */}
                        {agendamentoSelecionado.observacoes.split('Compra de produto:')[0].trim() && (
                          <div className="text-sm italic text-foreground/80 mb-2">
                            "{agendamentoSelecionado.observacoes.split('Compra de produto:')[0].trim()}"
                          </div>
                        )}
                        
                        {/* Bloco de produto no detalhe */}
                        <div className="bg-primary/5 p-3 rounded-xl border-2 border-primary/10 flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            {(() => {
                              try {
                                const jsonStr = agendamentoSelecionado.observacoes.split('Compra de produto:')[1].trim();
                                const compra = JSON.parse(jsonStr);
                                return (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">{compra.produto_nome}</span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">x{compra.quantidade} unidades</span>
                                      {compra.valor_total && (
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total: R$ {compra.valor_total.toFixed(2).replace('.', ',')}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return <p className="text-xs text-red-500">Erro nos dados do produto</p>;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="italic text-sm">"{agendamentoSelecionado.observacoes}"</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetalheAberto(false);
                    onSlotClick?.(agendamentoSelecionado.data, agendamentoSelecionado.hora);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {agendamentoSelecionado && agendamentoSelecionado.status === 'agendado' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      const ok = await cancelarAgendamento?.(agendamentoSelecionado.id);
                      if (ok) {
                        toast.success('Agendamento cancelado com sucesso');
                        setDetalheAberto(false);
                      }
                    }}
                  >
                    Cancelar Agendamento
                  </Button>
                )}
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
    </div>
  );
}
