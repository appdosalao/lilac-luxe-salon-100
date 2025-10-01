import React from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export function AgendaMensal() {
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = useAgendamentos();

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);
  

  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1));
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1));
  const mesAtualBtn = () => setMesAtual(new Date());

  const agendamentosDoMes = todosAgendamentos.filter(ag => 
    isSameMonth(new Date(ag.data), mesAtual)
  );

  const agendadosMes = agendamentosDoMes.filter(ag => ag.status === 'agendado');
  const concluidosMes = agendamentosDoMes.filter(ag => ag.status === 'concluido');
  const valorTotalAReceber = agendadosMes.reduce((total, ag) => total + Number(ag.valor || 0), 0);

  

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

    </div>
  );
}