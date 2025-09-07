import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaSemanal() {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = useAgendamentos();

  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

  const getAgendamentosDoDia = (dia: Date) => {
    return todosAgendamentos.filter(ag => 
      isSameDay(new Date(ag.data), dia)
    ).sort((a, b) => a.hora.localeCompare(b.hora));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const semanaAnterior = () => setSemanaAtual(prev => subWeeks(prev, 1));
  const proximaSemana = () => setSemanaAtual(prev => addWeeks(prev, 1));
  const semanaAtualBtn = () => setSemanaAtual(new Date());

  const totalAgendamentosSemana = diasDaSemana.reduce((total, dia) => 
    total + getAgendamentosDoDia(dia).length, 0
  );

  const valorTotalSemana = diasDaSemana.reduce((total, dia) => 
    total + getAgendamentosDoDia(dia).reduce((valor, ag) => valor + Number(ag.valor || 0), 0), 0
  );

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

      {/* Resumo da Semana Aprimorado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {totalAgendamentosSemana}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Agendamentos na semana</p>
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
                  R$ {valorTotalSemana.toFixed(2)}
                </div>
                <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Valor total da semana</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid da Semana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-4">
        {diasDaSemana.map((dia, index) => {
          const agendamentosDoDia = getAgendamentosDoDia(dia);
          const ehHoje = isSameDay(dia, new Date());
          
          return (
            <Card key={index} className={cn(
              "min-h-[250px] lg:min-h-[300px]",
              ehHoje && "ring-2 ring-primary ring-opacity-20 bg-primary/5"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className={cn(
                  "text-xs lg:text-sm font-medium text-center",
                  ehHoje && "text-primary font-bold"
                )}>
                  {format(dia, "EEE", { locale: ptBR })}
                  <div className={cn(
                    "text-sm lg:text-lg",
                    ehHoje && "text-primary"
                  )}>
                    {format(dia, "dd", { locale: ptBR })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 lg:p-3 space-y-1 lg:space-y-2">
                {agendamentosDoDia.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2 lg:py-4">
                    Sem agendamentos
                  </p>
                ) : (
                  agendamentosDoDia.map((agendamento) => (
                    <div
                      key={agendamento.id}
                      className={cn(
                        "p-2 rounded-md border text-xs space-y-1",
                        agendamento.origem === 'cronograma' && "border-purple-200 bg-purple-50",
                        agendamento.origem === 'online' && "border-blue-200 bg-blue-50"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono text-xs">{agendamento.hora}</span>
                      </div>
                      <div className="font-medium truncate text-xs">
                        {agendamento.clienteNome}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {agendamento.servicoNome}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs px-1 py-0", getStatusColor(agendamento.status))}
                        >
                          {agendamento.status}
                        </Badge>
                        {agendamento.origem === 'cronograma' && (
                          <span className="text-purple-600 text-xs">💜</span>
                        )}
                        {agendamento.origem === 'online' && (
                          <span className="text-blue-600 text-xs">🌐</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}