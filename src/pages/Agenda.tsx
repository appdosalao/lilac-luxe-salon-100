import React from 'react';
import { Calendar, CalendarDays, CalendarRange, Clock, Plus, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AgendaDiaria } from '@/components/agenda/AgendaDiaria';
import { AgendaSemanal } from '@/components/agenda/AgendaSemanal';
import { AgendaMensal } from '@/components/agenda/AgendaMensal';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export default function Agenda() {
  const [visualizacao, setVisualizacao] = React.useState<'dia' | 'semana' | 'mes'>('dia');
  const [buscaTexto, setBuscaTexto] = React.useState('');
  const { agendamentos, loading, todosAgendamentos } = useAgendamentos();

  // Estatísticas rápidas para o header
  const hoje = new Date();
  const agendamentosHoje = todosAgendamentos.filter(ag => 
    new Date(ag.data).toDateString() === hoje.toDateString()
  );
  const agendamentosTotal = todosAgendamentos.length;
  const agendamentosPendentes = todosAgendamentos.filter(ag => ag.status === 'agendado').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header Profissional Aprimorado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm shadow-lg">
                    <Calendar className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Agenda Profissional
                    </h1>
                    <p className="text-muted-foreground font-medium">
                      Organize e gerencie seus agendamentos com eficiência
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Controles de Visualização e Ações */}
              <div className="flex flex-col gap-4 w-full lg:w-auto">
                {/* Barra de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar agendamentos..."
                    value={buscaTexto}
                    onChange={(e) => setBuscaTexto(e.target.value)}
                    className="pl-10 w-full lg:w-64 bg-background/80 backdrop-blur-sm border-border/50"
                  />
                </div>
                
                {/* Botões de Visualização */}
                <div className="flex gap-2 w-full lg:w-auto">
                  <Button
                    variant={visualizacao === 'dia' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacao('dia')}
                    className="flex-1 lg:flex-none transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <Clock className="h-4 w-4 lg:mr-2" />
                    <span className="hidden sm:inline">Dia</span>
                  </Button>
                  <Button
                    variant={visualizacao === 'semana' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacao('semana')}
                    className="flex-1 lg:flex-none transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <CalendarDays className="h-4 w-4 lg:mr-2" />
                    <span className="hidden sm:inline">Semana</span>
                  </Button>
                  <Button
                    variant={visualizacao === 'mes' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setVisualizacao('mes')}
                    className="flex-1 lg:flex-none transition-all duration-200 hover:scale-105 shadow-md"
                  >
                    <CalendarRange className="h-4 w-4 lg:mr-2" />
                    <span className="hidden sm:inline">Mês</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo da Agenda */}
        <div className="relative">
          {loading ? (
            <div className="space-y-6">
              <div className="h-32 bg-muted/50 animate-pulse rounded-2xl" />
              <div className="h-96 bg-muted/50 animate-pulse rounded-2xl" />
            </div>
          ) : (
            <div className="animate-fade-in">
              {visualizacao === 'dia' && <AgendaDiaria />}
              {visualizacao === 'semana' && <AgendaSemanal />}
              {visualizacao === 'mes' && <AgendaMensal />}
            </div>
          )}
        </div>

        {/* Rodapé com Informações Úteis */}
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span>Cronograma</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span>Concluído</span>
                </div>
              </div>
              <div className="text-xs">
                Última atualização: {new Date().toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}