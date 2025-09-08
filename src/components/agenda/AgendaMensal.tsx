import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaMensal() {
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = useAgendamentos();

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  
  // Pegar o calendário completo (incluindo dias do mês anterior/próximo para completar as semanas)
  const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const fimCalendario = endOfWeek(fimMes, { weekStartsOn: 0 });
  const diasDoCalendario = eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });

  const getAgendamentosDoDia = (dia: Date) => {
    return todosAgendamentos.filter(ag => 
      isSameDay(new Date(ag.data), dia)
    );
  };

  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1));
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1));
  const mesAtualBtn = () => setMesAtual(new Date());

  const agendamentosDoMes = todosAgendamentos.filter(ag => 
    isSameMonth(new Date(ag.data), mesAtual)
  );

  const valorTotalMes = agendamentosDoMes.reduce((total, ag) => total + Number(ag.valor || 0), 0);

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

      {/* Resumo do Mês Aprimorado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group border-0 bg-gradient-to-br from-primary/10 to-primary/5 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="text-xl lg:text-2xl font-bold text-primary">{agendamentosDoMes.length}</div>
            <p className="text-sm text-muted-foreground font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="group border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
              {agendamentosDoMes.filter(ag => ag.status === 'agendado').length}
            </div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Agendados</p>
          </CardContent>
        </Card>
        <Card className="group border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
              {agendamentosDoMes.filter(ag => ag.status === 'concluido').length}
            </div>
            <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">Concluídos</p>
          </CardContent>
        </Card>
        <Card className="group border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
                R$ {valorTotalMes.toFixed(2)}
              </div>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendário Aprimorado */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Calendário de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {diasDaSemana.map(dia => (
              <div key={dia} className="text-center text-sm font-semibold text-muted-foreground p-3 rounded-lg bg-muted/30">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-2">
            {diasDoCalendario.map((dia) => {
              const agendamentosDoDia = getAgendamentosDoDia(dia);
              const ehHoje = isSameDay(dia, new Date());
              const ehDoMesAtual = isSameMonth(dia, mesAtual);
              
              return (
                <div
                  key={dia.toString()}
                  className={cn(
                    "group min-h-[80px] lg:min-h-[100px] p-2 lg:p-3 border rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer",
                    ehHoje && "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 shadow-lg",
                    !ehDoMesAtual && "bg-muted/30 text-muted-foreground",
                    ehDoMesAtual && !ehHoje && "bg-card hover:bg-accent/30",
                    agendamentosDoDia.length > 0 && ehDoMesAtual && "ring-1 ring-primary/20"
                  )}
                >
                  <div className={cn(
                    "text-sm font-semibold mb-2",
                    ehHoje && "text-primary font-bold",
                    !ehDoMesAtual && "text-muted-foreground/70"
                  )}>
                    {format(dia, "dd")}
                  </div>
                  
                  <div className="space-y-1">
                    {agendamentosDoDia.slice(0, 2).map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className={cn(
                          "text-xs p-1.5 rounded-md truncate font-medium transition-all hover:scale-105",
                          agendamento.status === 'agendado' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                          agendamento.status === 'concluido' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                          agendamento.status === 'cancelado' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                          agendamento.origem === 'cronograma' && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                          agendamento.origem === 'online' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{agendamento.hora}</span>
                          {agendamento.origem === 'cronograma' && <span>💜</span>}
                          {agendamento.origem === 'online' && <span>🌐</span>}
                        </div>
                        <div className="font-medium">
                          <span className="hidden lg:inline">{agendamento.clienteNome}</span>
                          <span className="lg:hidden">{agendamento.clienteNome.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                    
                    {agendamentosDoDia.length > 2 && (
                      <div className="text-xs text-center px-2 py-1 rounded-md bg-accent/20 text-accent-foreground font-medium">
                        +{agendamentosDoDia.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}