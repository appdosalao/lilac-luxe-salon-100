import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, TestTube, Volume2, Vibrate } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ConfiguracaoNotificacoesPush = () => {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    isLoading: subscriptionLoading,
    subscribe, 
    unsubscribe,
    sendTestNotification
  } = usePushSubscription();

  const {
    preferences,
    isLoading: preferencesLoading,
    updatePreferences
  } = useNotificationPreferences();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (preferencesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Configure as notificações push do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status das Notificações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled">Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed 
                  ? 'Você receberá notificações push' 
                  : 'Ative para receber notificações em tempo real'}
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={isSubscribed}
              onCheckedChange={(checked) => {
                if (checked) {
                  subscribe();
                } else {
                  unsubscribe();
                }
              }}
              disabled={subscriptionLoading}
            />
          </div>

          {permission === 'denied' && (
            <Alert variant="destructive">
              <AlertDescription>
                Você bloqueou as notificações. Para ativá-las, acesse as configurações do navegador.
              </AlertDescription>
            </Alert>
          )}

          {isSubscribed && (
            <Button
              variant="outline"
              onClick={sendTestNotification}
              className="w-full"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Enviar Notificação de Teste
            </Button>
          )}
        </div>

        {/* Preferências de Notificação para Staff */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold">Notificações para Equipe</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="novo-agendamento" className="flex-1 cursor-pointer">
              Novos Agendamentos
            </Label>
            <Switch
              id="novo-agendamento"
              checked={preferences?.novo_agendamento || false}
              onCheckedChange={(checked) => 
                updatePreferences({ novo_agendamento: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cancelamento" className="flex-1 cursor-pointer">
              Cancelamentos
            </Label>
            <Switch
              id="cancelamento"
              checked={preferences?.cancelamento_agendamento || false}
              onCheckedChange={(checked) => 
                updatePreferences({ cancelamento_agendamento: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lembrete-agendamento" className="flex-1 cursor-pointer">
              Lembretes de Agendamentos
            </Label>
            <Switch
              id="lembrete-agendamento"
              checked={preferences?.lembrete_agendamento || false}
              onCheckedChange={(checked) => 
                updatePreferences({ lembrete_agendamento: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alerta-financeiro" className="flex-1 cursor-pointer">
              Alertas Financeiros
            </Label>
            <Switch
              id="alerta-financeiro"
              checked={preferences?.alerta_financeiro || false}
              onCheckedChange={(checked) => 
                updatePreferences({ alerta_financeiro: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="retorno-cronograma" className="flex-1 cursor-pointer">
              Retornos de Cronograma
            </Label>
            <Switch
              id="retorno-cronograma"
              checked={preferences?.retorno_cronograma || false}
              onCheckedChange={(checked) => 
                updatePreferences({ retorno_cronograma: checked })
              }
              disabled={!isSubscribed}
            />
          </div>
        </div>

        {/* Preferências de Notificação para Clientes */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold">Notificações para Clientes</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmacao-cliente" className="flex-1 cursor-pointer">
              Confirmações de Agendamento
            </Label>
            <Switch
              id="confirmacao-cliente"
              checked={preferences?.confirmacao_cliente || false}
              onCheckedChange={(checked) => 
                updatePreferences({ confirmacao_cliente: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lembrete-cliente" className="flex-1 cursor-pointer">
              Lembretes de Agendamento
            </Label>
            <Switch
              id="lembrete-cliente"
              checked={preferences?.lembrete_cliente || false}
              onCheckedChange={(checked) => 
                updatePreferences({ lembrete_cliente: checked })
              }
              disabled={!isSubscribed}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ofertas-fidelidade" className="flex-1 cursor-pointer">
              Ofertas do Programa de Fidelidade
            </Label>
            <Switch
              id="ofertas-fidelidade"
              checked={preferences?.ofertas_fidelidade || false}
              onCheckedChange={(checked) => 
                updatePreferences({ ofertas_fidelidade: checked })
              }
              disabled={!isSubscribed}
            />
          </div>
        </div>

        {/* Configurações de Som e Vibração */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold">Configurações Adicionais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="som-notificacao" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Som da Notificação
            </Label>
            <Select
              value={preferences?.som_notificacao || 'notification'}
              onValueChange={(value) => updatePreferences({ som_notificacao: value })}
              disabled={!isSubscribed}
            >
              <SelectTrigger id="som-notificacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notification">Padrão</SelectItem>
                <SelectItem value="notification2">Suave</SelectItem>
                <SelectItem value="notification3">Alegre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vibracao" className="flex items-center gap-2 flex-1 cursor-pointer">
              <Vibrate className="h-4 w-4" />
              Vibração
            </Label>
            <Switch
              id="vibracao"
              checked={preferences?.vibracao || false}
              onCheckedChange={(checked) => 
                updatePreferences({ vibracao: checked })
              }
              disabled={!isSubscribed}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
