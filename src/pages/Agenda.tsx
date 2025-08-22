import { useState } from 'react';
import { Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgendaDiaria } from '@/components/agenda/AgendaDiaria';
import { AgendaSemanal } from '@/components/agenda/AgendaSemanal';
import { AgendaMensal } from '@/components/agenda/AgendaMensal';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export default function Agenda() {
  const [visualizacao, setVisualizacao] = useState<'dia' | 'semana' | 'mes'>('dia');
  const { agendamentosFiltrados, loading } = useAgendamentos();

  const hoje = new Date();
  const agendamentosHoje = agendamentosFiltrados.filter(
    ag => new Date(ag.data).toDateString() === hoje.toDateString()
  );

  const proximosSete = agendamentosFiltrados.filter(ag => {
    const dataAgendamento = new Date(ag.data);
    const diffTime = dataAgendamento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>
        <div className="grid gap-4">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={visualizacao === 'dia' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacao('dia')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Dia
          </Button>
          <Button
            variant={visualizacao === 'semana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacao('semana')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Semana
          </Button>
          <Button
            variant={visualizacao === 'mes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setVisualizacao('mes')}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Mês
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{agendamentosHoje.length}</div>
            <p className="text-xs text-muted-foreground">
              {agendamentosHoje.filter(ag => ag.status === 'agendado').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{proximosSete.length}</div>
            <p className="text-xs text-muted-foreground">
              {proximosSete.filter(ag => ag.status === 'agendado').length} agendados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo da Agenda */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          {visualizacao === 'dia' && <AgendaDiaria />}
          {visualizacao === 'semana' && <AgendaSemanal />}
          {visualizacao === 'mes' && <AgendaMensal />}
        </CardContent>
      </Card>
    </div>
  );
}