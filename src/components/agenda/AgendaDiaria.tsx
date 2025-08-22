import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaDiaria() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const { agendamentosFiltrados } = useAgendamentos();

  const agendamentosDoDia = agendamentosFiltrados.filter(
    ag => new Date(ag.data).toDateString() === dataSelecionada.toDateString()
  ).sort((a, b) => a.hora.localeCompare(b.hora));

  const horarios = Array.from({ length: 24 }, (_, i) => {
    const hora = i.toString().padStart(2, '0') + ':00';
    return hora;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const anteriorDia = () => setDataSelecionada(prev => subDays(prev, 1));
  const proximoDia = () => setDataSelecionada(prev => addDays(prev, 1));
  const hoje = () => setDataSelecionada(new Date());

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Navegação de Data */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={anteriorDia} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[180px] lg:min-w-[200px]">
            <h2 className="text-sm lg:text-lg font-semibold">
              {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-xs lg:text-sm text-muted-foreground">
              {format(dataSelecionada, 'yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={proximoDia} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={hoje} className="w-full sm:w-auto">
          Hoje
        </Button>
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-xl font-bold text-blue-600">
              {agendamentosDoDia.filter(ag => ag.status === 'agendado').length}
            </div>
            <p className="text-xs lg:text-sm text-muted-foreground">Agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-xl font-bold text-green-600">
              {agendamentosDoDia.filter(ag => ag.status === 'concluido').length}
            </div>
            <p className="text-xs lg:text-sm text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 lg:p-4 text-center">
            <div className="text-lg lg:text-xl font-bold text-orange-600">
              {agendamentosDoDia.length}
            </div>
            <p className="text-xs lg:text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline dos Agendamentos */}
      <div className="space-y-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto">
        {agendamentosDoDia.length === 0 ? (
          <div className="text-center py-8 lg:py-12 text-muted-foreground">
            <Clock className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm lg:text-base">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          agendamentosDoDia.map((agendamento) => (
            <Card key={agendamento.id} className={cn(
              "transition-all hover:shadow-md",
              agendamento.origem === 'cronograma' && "border-purple-200 bg-purple-50/30"
            )}>
              <CardContent className="p-3 lg:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-0">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                      <span className="font-mono text-xs lg:text-sm">{agendamento.hora}</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2">
                      <User className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                      <span className="font-medium text-xs lg:text-sm">{agendamento.clienteNome}</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Tag className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                      <span className="text-xs lg:text-sm">{agendamento.servicoNome}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
                    {agendamento.origem === 'cronograma' && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        💜 Cronograma
                      </Badge>
                    )}
                    <Badge variant="outline" className={getStatusColor(agendamento.status)}>
                      {agendamento.status}
                    </Badge>
                    <span className="text-xs lg:text-sm font-medium text-green-600">
                      R$ {agendamento.valor.toFixed(2)}
                    </span>
                  </div>
                </div>
                {agendamento.observacoes && (
                  <p className="text-xs lg:text-sm text-muted-foreground mt-2 pl-0 lg:pl-6">
                    {agendamento.observacoes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}