import { Bell, X, Calendar, User, Scissors, Clock, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export function NotificacaoAgendamento() {
  const { notifications, removeNotification, clearAllNotifications } = useNotifications();
  const navigate = useNavigate();

  const getOrigemBadge = (origem: string) => {
    const badges = {
      online: { text: 'Online', variant: 'default' as const, class: 'bg-green-500/10 text-green-700 dark:text-green-400' },
      cronograma: { text: 'Automático', variant: 'secondary' as const, class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
      manual: { text: 'Manual', variant: 'outline' as const, class: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
    };
    return badges[origem as keyof typeof badges] || badges.manual;
  };

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const handleVerAgendamentos = () => {
    navigate('/agendamentos');
    clearAllNotifications();
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-fade-in">
      <Alert className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-elegant backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            <div>
              <h4 className="font-semibold text-foreground">
                {notifications.length === 1 ? 'Novo Agendamento!' : 'Novos Agendamentos!'}
              </h4>
              <AlertDescription className="text-muted-foreground">
                {notifications.length} novo(s) agendamento(s) recebido(s)
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {notifications.map((notificacao) => {
            const origemBadge = getOrigemBadge(notificacao.origem);
            return (
              <Card key={notificacao.id} className="border-primary/20 hover:bg-primary/5 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{notificacao.clienteNome}</span>
                        <Badge 
                          variant={origemBadge.variant}
                          className={`text-xs ${origemBadge.class}`}
                        >
                          {origemBadge.text}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scissors className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{notificacao.servicoNome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatData(notificacao.data)}
                        </span>
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{notificacao.horario}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notificacao.id)}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={handleVerAgendamentos}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Ver Agendamentos
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 text-xs h-7 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={clearAllNotifications}
          >
            Marcar como Visto
          </Button>
        </div>
      </Alert>
    </div>
  );
}