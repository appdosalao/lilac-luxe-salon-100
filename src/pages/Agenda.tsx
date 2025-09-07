import React, { useState } from 'react';
import { Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SimpleDiaView = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Agenda Diária</h2>
      <p>Visualização básica da agenda diária</p>
    </div>
  );
};

const SimpleSemanaView = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Agenda Semanal</h2>
      <p>Visualização básica da agenda semanal</p>
    </div>
  );
};

const SimpleMesView = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Agenda Mensal</h2>
      <p>Visualização básica da agenda mensal</p>
    </div>
  );
};

export default function Agenda() {
  console.log('Agenda component started');
  
  const [visualizacao, setVisualizacao] = useState<'dia' | 'semana' | 'mes'>('dia');
  
  console.log('useState worked, visualizacao:', visualizacao);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header simplificado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-6 lg:p-8">
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

        {/* Conteúdo simplificado */}
        <Card className="relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardContent className="relative p-6 lg:p-8">
            <div className="animate-fade-in">
              {visualizacao === 'dia' && <SimpleDiaView />}
              {visualizacao === 'semana' && <SimpleSemanaView />}
              {visualizacao === 'mes' && <SimpleMesView />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}