import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export function AgendaSemanal() {
  const [semanaAtual, setSemanaAtual] = React.useState(new Date());
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = useAgendamentos();

  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

  const getAgendamentosDoDia = (dia: Date) => {
    return todosAgendamentos.filter(ag => 
      isSameDay(new Date(ag.data), dia)
    ).sort((a, b) => a.hora.localeCompare(b.hora));
  };


  const semanaAnterior = () => setSemanaAtual(prev => subWeeks(prev, 1));
  const proximaSemana = () => setSemanaAtual(prev => addWeeks(prev, 1));
  const semanaAtualBtn = () => setSemanaAtual(new Date());

  const agendamentosSemana = diasDaSemana.reduce((agendamentos, dia) => 
    [...agendamentos, ...getAgendamentosDoDia(dia)], []
  );

  const agendadosSemana = agendamentosSemana.filter(ag => ag.status === 'agendado');
  const concluidosSemana = agendamentosSemana.filter(ag => ag.status === 'concluido');
  const valorTotalAReceber = agendadosSemana.reduce((total, ag) => total + Number(ag.valor || 0), 0);

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
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {agendadosSemana.length}
                </div>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Agendados</p>
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

    </div>
  );
}