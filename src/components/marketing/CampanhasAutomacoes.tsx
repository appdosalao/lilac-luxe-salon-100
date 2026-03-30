import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone, 
  MessageSquare, 
  Plus, 
  Clock, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Play
} from 'lucide-react';
import { useSupabaseMarketing } from '@/hooks/useSupabaseMarketing';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CampanhasMarketing = () => {
  const { campanhas, loading, carregarCampanhas, excluirCampanha } = useSupabaseMarketing();

  useEffect(() => {
    carregarCampanhas();
  }, [carregarCampanhas]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida': return <Badge variant="success">Concluída</Badge>;
      case 'enviando': return <Badge variant="default" className="animate-pulse">Enviando</Badge>;
      case 'agendada': return <Badge variant="secondary">Agendada</Badge>;
      case 'rascunho': return <Badge variant="outline">Rascunho</Badge>;
      case 'cancelada': return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sms': return <Smartphone className="h-4 w-4 text-orange-500" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Campanhas</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas comunicações em massa</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">Carregando campanhas...</div>
      ) : campanhas.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-primary opacity-50" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma campanha</h3>
            <p className="text-muted-foreground max-w-sm">
              Você ainda não criou nenhuma campanha de marketing. Comece agora para engajar seus clientes!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((campanha) => (
            <Card key={campanha.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg bg-background border border-border">
                    {getTipoIcon(campanha.tipo)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Play className="h-4 w-4" /> Iniciar Envio
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-destructive focus:text-destructive"
                        onClick={() => excluirCampanha(campanha.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-2">{campanha.nome}</CardTitle>
                <CardDescription className="line-clamp-2">{campanha.descricao || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    {getStatusBadge(campanha.status)}
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(campanha.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-center py-2 bg-background/50 rounded-lg border border-border/50">
                    <div>
                      <p className="text-lg font-bold">{campanha.total_enviados}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Enviados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-success">
                        {campanha.metricas?.cliques || 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Cliques</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const AutomacoesMarketing = () => {
  const { automacoes, loading, carregarAutomacoes, toggleAutomacao } = useSupabaseMarketing();

  useEffect(() => {
    carregarAutomacoes();
  }, [carregarAutomacoes]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Automações</h2>
          <p className="text-sm text-muted-foreground">Mensagens automáticas baseadas em eventos</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">Carregando automações...</div>
      ) : automacoes.length === 0 ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary opacity-50" />
            </div>
            <h3 className="text-lg font-semibold">Nenhuma automação</h3>
            <p className="text-muted-foreground max-w-sm">
              Configure mensagens automáticas para economizar tempo e manter seus clientes engajados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {automacoes.map((auto) => (
            <Card key={auto.id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${auto.ativo ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{auto.nome}</h3>
                    <p className="text-sm text-muted-foreground">{auto.gatilho.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold">{auto.total_execucoes} execuções</p>
                    <p className="text-xs text-muted-foreground">
                      Última: {auto.ultima_execucao ? format(new Date(auto.ultima_execucao), 'dd/MM/yy HH:mm') : 'Nunca'}
                    </p>
                  </div>
                  <Button 
                    variant={auto.ativo ? "default" : "outline"}
                    onClick={() => toggleAutomacao(auto.id, !auto.ativo)}
                  >
                    {auto.ativo ? 'Ativo' : 'Pausado'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

