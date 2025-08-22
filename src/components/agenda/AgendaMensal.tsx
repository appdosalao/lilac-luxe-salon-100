import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaMensal() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const { agendamentosFiltrados } = useAgendamentos();

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  
  // Pegar o calendário completo (incluindo dias do mês anterior/próximo para completar as semanas)
  const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 0 });
  const fimCalendario = endOfWeek(fimMes, { weekStartsOn: 0 });
  const diasDoCalendario = eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });

  const getAgendamentosDoDia = (dia: Date) => {
    return agendamentosFiltrados.filter(ag => 
      isSameDay(new Date(ag.data), dia)
    );
  };

  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1));
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1));
  const mesAtualBtn = () => setMesAtual(new Date());

  const agendamentosDoMes = agendamentosFiltrados.filter(ag => 
    isSameMonth(new Date(ag.data), mesAtual)
  );

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Navegação do Mês */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={mesAnterior} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[180px] lg:min-w-[200px]">
            <h2 className="text-sm lg:text-lg font-semibold">
              {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={proximoMes} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={mesAtualBtn} className="w-full sm:w-auto">
          Mês Atual
        </Button>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-sm lg:text-lg font-bold text-primary">{agendamentosDoMes.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-sm lg:text-lg font-bold text-blue-600">
              {agendamentosDoMes.filter(ag => ag.status === 'agendado').length}
            </div>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-sm lg:text-lg font-bold text-green-600">
              {agendamentosDoMes.filter(ag => ag.status === 'concluido').length}
            </div>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-sm lg:text-lg font-bold text-purple-600">
              {agendamentosDoMes.filter(ag => ag.origem === 'cronograma').length}
            </div>
            <p className="text-xs text-muted-foreground">Cronograma</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-sm lg:text-base">Calendário de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-2 lg:p-4">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-2 lg:mb-4">
            {diasDaSemana.map(dia => (
              <div key={dia} className="text-center text-xs lg:text-sm font-medium text-muted-foreground p-1 lg:p-2">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1 lg:gap-2">
            {diasDoCalendario.map((dia) => {
              const agendamentosDoDia = getAgendamentosDoDia(dia);
              const ehHoje = isSameDay(dia, new Date());
              const ehDoMesAtual = isSameMonth(dia, mesAtual);
              
              return (
                <div
                  key={dia.toString()}
                  className={cn(
                    "min-h-[60px] lg:min-h-[80px] p-1 lg:p-2 border rounded-lg",
                    ehHoje && "bg-primary/10 border-primary",
                    !ehDoMesAtual && "bg-muted/50 text-muted-foreground",
                    ehDoMesAtual && "hover:bg-accent/50"
                  )}
                >
                  <div className={cn(
                    "text-xs lg:text-sm font-medium mb-1",
                    ehHoje && "text-primary font-bold"
                  )}>
                    {format(dia, "dd")}
                  </div>
                  
                  <div className="space-y-1">
                    {agendamentosDoDia.slice(0, 2).map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className={cn(
                          "text-xs p-1 rounded truncate",
                          agendamento.status === 'agendado' && "bg-blue-100 text-blue-800",
                          agendamento.status === 'concluido' && "bg-green-100 text-green-800",
                          agendamento.status === 'cancelado' && "bg-red-100 text-red-800",
                          agendamento.origem === 'cronograma' && "bg-purple-100 text-purple-800"
                        )}
                      >
                        <span className="text-xs">{agendamento.hora}</span>{' '}
                        <span className="hidden lg:inline">{agendamento.clienteNome}</span>
                        <span className="lg:hidden">{agendamento.clienteNome.split(' ')[0]}</span>
                        {agendamento.origem === 'cronograma' && ' 💜'}
                      </div>
                    ))}
                    
                    {agendamentosDoDia.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{agendamentosDoDia.length - 2}
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