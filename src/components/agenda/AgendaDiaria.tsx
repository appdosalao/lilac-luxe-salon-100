import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User, Tag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { cn } from '@/lib/utils';

export function AgendaDiaria() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const { agendamentos: todosAgendamentos, agendamentosFiltrados, loading } = useAgendamentos();

  // Usar todos os agendamentos (incluindo online) para a agenda
  const agendamentosDoDia = todosAgendamentos.filter(
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
      {/* Navegação de Data Aprimorada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={anteriorDia} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[200px] lg:min-w-[250px]">
            <h2 className="text-lg lg:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {format(dataSelecionada, 'yyyy', { locale: ptBR })}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={proximoDia} 
            className="h-9 w-9 p-0 rounded-full transition-all hover:scale-110 hover:shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          onClick={hoje} 
          className="w-full sm:w-auto transition-all hover:scale-105 shadow-md"
        >
          Hoje
        </Button>
      </div>

      {/* Resumo do Dia Aprimorado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {agendamentosDoDia.filter(ag => ag.status === 'agendado').length}
              </div>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Agendados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {agendamentosDoDia.filter(ag => ag.status === 'concluido').length}
              </div>
              <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">Concluídos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                R$ {agendamentosDoDia.reduce((total, ag) => total + Number(ag.valor || 0), 0).toFixed(2)}
              </div>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Valor Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/20 transition-all hover:shadow-lg hover:scale-105">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <Tag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {agendamentosDoDia.length}
              </div>
              <p className="text-sm text-orange-600/70 dark:text-orange-400/70 font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline dos Agendamentos Aprimorada */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
        {agendamentosDoDia.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-dashed border-muted-foreground/20">
            <div className="flex h-16 w-16 items-center justify-center mx-auto mb-4 rounded-full bg-muted/50">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Dia livre</h3>
            <p className="text-sm text-muted-foreground/70">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentosDoDia.map((agendamento, index) => (
              <Card 
                key={agendamento.id} 
                className={cn(
                  "group relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-fade-in",
                  agendamento.origem === 'cronograma' && "bg-gradient-to-r from-purple-50/80 to-purple-100/30 dark:from-purple-950/30 dark:to-purple-900/20",
                  agendamento.status === 'concluido' && "bg-gradient-to-r from-green-50/80 to-green-100/30 dark:from-green-950/30 dark:to-green-900/20",
                  agendamento.status === 'cancelado' && "bg-gradient-to-r from-red-50/80 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5" />
                <CardContent className="relative p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-semibold text-primary">{agendamento.hora}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{agendamento.clienteNome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{agendamento.servicoNome}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {agendamento.origem === 'cronograma' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                          💜 Cronograma
                        </Badge>
                      )}
                      {agendamento.origem === 'online' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                          🌐 Online
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "border-0 font-medium",
                          agendamento.status === 'agendado' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                          agendamento.status === 'concluido' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                          agendamento.status === 'cancelado' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {agendamento.status}
                      </Badge>
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          R$ {Number(agendamento.valor || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {agendamento.observacoes && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-sm text-muted-foreground italic">
                        "{agendamento.observacoes}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}