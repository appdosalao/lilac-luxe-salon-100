import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaSemanal() {
  const [semanaAtual, setSemanaAtual] = useState(new Date());
  const { agendamentosFiltrados } = useAgendamentos();

  const inicioSemana = startOfWeek(semanaAtual, { weekStartsOn: 0 });
  const fimSemana = endOfWeek(semanaAtual, { weekStartsOn: 0 });
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

  const getAgendamentosDoDia = (dia: Date) => {
    return agendamentosFiltrados.filter(ag => 
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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Navegação da Semana */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={semanaAnterior} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[250px] lg:min-w-[300px]">
            <h2 className="text-sm lg:text-lg font-semibold">
              {format(inicioSemana, "dd 'de' MMM", { locale: ptBR })} - {format(fimSemana, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={proximaSemana} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={semanaAtualBtn} className="w-full sm:w-auto">
          Semana Atual
        </Button>
      </div>

      {/* Resumo da Semana */}
      <Card>
        <CardContent className="p-3 lg:p-4 text-center">
          <div className="text-lg lg:text-2xl font-bold text-primary">{totalAgendamentosSemana}</div>
          <p className="text-xs lg:text-sm text-muted-foreground">Agendamentos na semana</p>
        </CardContent>
      </Card>

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
                        agendamento.origem === 'cronograma' && "border-purple-200 bg-purple-50"
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