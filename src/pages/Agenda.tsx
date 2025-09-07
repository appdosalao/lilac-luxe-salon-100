import React, { useState } from 'react';
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
  
  // Verificar se os hooks estão funcionando corretamente
  const agendamentosHook = useAgendamentos();
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = agendamentosHook;

  const hoje = new Date();
  const agendamentosHoje = todosAgendamentos.filter(
    ag => new Date(ag.data).toDateString() === hoje.toDateString()
  );

  const proximosSete = todosAgendamentos.filter(ag => {
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

  const totalReceita = agendamentosHoje.reduce((total, ag) => 
    ag.status === 'concluido' ? total + ag.valor : total, 0
  );

  const metaMensal = proximosSete.length * 5; // Meta estimada

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-6 lg:p-8">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 backdrop-blur-sm">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Agenda Profissional</h1>
                  <p className="text-sm text-muted-foreground">Gerencie seus agendamentos com eficiência</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={visualizacao === 'dia' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('dia')}
                className="flex-1 sm:flex-none transition-all duration-200 hover:scale-105"
              >
                <Clock className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Dia</span>
              </Button>
              <Button
                variant={visualizacao === 'semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('semana')}
                className="flex-1 sm:flex-none transition-all duration-200 hover:scale-105"
              >
                <CalendarDays className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Semana</span>
              </Button>
              <Button
                variant={visualizacao === 'mes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVisualizacao('mes')}
                className="flex-1 sm:flex-none transition-all duration-200 hover:scale-105"
              >
                <CalendarRange className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Mês</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas Aprimoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Hoje</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{agendamentosHoje.length}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    {agendamentosHoje.filter(ag => ag.status === 'agendado').length} pendentes
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Próximos 7 Dias</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{proximosSete.length}</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">
                    {proximosSete.filter(ag => ag.status === 'agendado').length} agendados
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CalendarDays className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Receita Hoje</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">R$ {totalReceita.toFixed(2)}</p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70">concluídos</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Meta Mensal</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{Math.round((proximosSete.length / metaMensal) * 100)}%</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">{proximosSete.length}/{metaMensal}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <CalendarRange className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo da Agenda Aprimorado */}
        <Card className="relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
          <CardContent className="relative p-6 lg:p-8">
            <div className="animate-fade-in">
              {visualizacao === 'dia' && <AgendaDiaria />}
              {visualizacao === 'semana' && <AgendaSemanal />}
              {visualizacao === 'mes' && <AgendaMensal />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}