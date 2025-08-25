import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useSupabaseConfiguracoes } from '@/hooks/useSupabaseConfiguracoes';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  Bell, 
  Smartphone, 
  Volume2, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  Settings, 
  Save,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export function ConfiguracaoNotificacoesAvancadas() {
  const { configuracaoNotificacoes, loading, salvarNotificacoes } = useSupabaseConfiguracoes();
  const { 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    sendTestNotification,
    isLoading: pushLoading 
  } = usePushNotifications();

  const [localConfig, setLocalConfig] = useState({
    notificacoes_push: true,
    notificacoes_email: true,
    notificacoes_som: true,
    som_personalizado: 'notification.mp3',
    lembrete_agendamento_minutos: 30,
    lembrete_vencimento_dias: 3,
    lembrete_contas_fixas_dias: 5,
    notificar_cancelamentos: true,
    notificar_reagendamentos: true,
    notificar_pagamentos: true,
    notificar_novos_agendamentos: true,
    horario_inicio_notificacoes: '08:00',
    horario_fim_notificacoes: '20:00',
  });

  useEffect(() => {
    if (configuracaoNotificacoes) {
      setLocalConfig({
        notificacoes_push: configuracaoNotificacoes.notificacoes_push,
        notificacoes_email: configuracaoNotificacoes.notificacoes_email,
        notificacoes_som: configuracaoNotificacoes.notificacoes_som,
        som_personalizado: configuracaoNotificacoes.som_personalizado || 'notification.mp3',
        lembrete_agendamento_minutos: configuracaoNotificacoes.lembrete_agendamento_minutos,
        lembrete_vencimento_dias: configuracaoNotificacoes.lembrete_vencimento_dias,
        lembrete_contas_fixas_dias: configuracaoNotificacoes.lembrete_contas_fixas_dias,
        notificar_cancelamentos: configuracaoNotificacoes.notificar_cancelamentos,
        notificar_reagendamentos: configuracaoNotificacoes.notificar_reagendamentos,
        notificar_pagamentos: configuracaoNotificacoes.notificar_pagamentos,
        notificar_novos_agendamentos: configuracaoNotificacoes.notificar_novos_agendamentos,
        horario_inicio_notificacoes: configuracaoNotificacoes.horario_inicio_notificacoes,
        horario_fim_notificacoes: configuracaoNotificacoes.horario_fim_notificacoes,
      });
    }
  }, [configuracaoNotificacoes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações de notificações...</div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    try {
      await salvarNotificacoes(localConfig);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      setLocalConfig(prev => ({ ...prev, notificacoes_push: false }));
    } else {
      const success = await subscribe();
      if (success) {
        setLocalConfig(prev => ({ ...prev, notificacoes_push: true }));
      }
    }
  };

  const playTestSound = () => {
    try {
      const audio = new Audio(`/sounds/${localConfig.som_personalizado}`);
      audio.play().catch(error => {
        console.log('Erro ao reproduzir som:', error);
        toast.error('Não foi possível reproduzir o som selecionado');
      });
    } catch (error) {
      console.log('Erro ao criar áudio:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Geral das Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status das Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={localConfig.notificacoes_push ? "default" : "secondary"}>
                Push {localConfig.notificacoes_push ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={localConfig.notificacoes_email ? "default" : "secondary"}>
                Email {localConfig.notificacoes_email ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={localConfig.notificacoes_som ? "default" : "secondary"}>
                Som {localConfig.notificacoes_som ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
          
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Todas as Configurações
          </Button>
        </CardContent>
      </Card>

      {/* Configurações Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações Principais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Receba notificações no celular mesmo com o app fechado
                </p>
                {!isSupported && (
                  <p className="text-xs text-orange-600">
                    Não suportado neste navegador
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={isSubscribed && localConfig.notificacoes_push}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported || pushLoading}
            />
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <Label className="text-base font-medium">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba resumos e alertas importantes por email
                </p>
              </div>
            </div>
            <Switch
              checked={localConfig.notificacoes_email}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, notificacoes_email: checked }))
              }
            />
          </div>

          {/* Sound Notifications */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5" />
                <div>
                  <Label className="text-base font-medium">Notificações Sonoras</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir som ao receber notificações
                  </p>
                </div>
              </div>
              <Switch
                checked={localConfig.notificacoes_som}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, notificacoes_som: checked }))
                }
              />
            </div>

            {localConfig.notificacoes_som && (
              <div className="space-y-2">
                <Label htmlFor="som-select">Som das Notificações</Label>
                <div className="flex gap-2">
                  <Select
                    value={localConfig.som_personalizado}
                    onValueChange={(value) => 
                      setLocalConfig(prev => ({ ...prev, som_personalizado: value }))
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification.mp3">Som Padrão</SelectItem>
                      <SelectItem value="notification2.mp3">Som Campainha</SelectItem>
                      <SelectItem value="notification3.mp3">Som Suave</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={playTestSound}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Horários de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inicio-notif">Horário de Início</Label>
              <Input
                id="inicio-notif"
                type="time"
                value={localConfig.horario_inicio_notificacoes}
                onChange={(e) => 
                  setLocalConfig(prev => ({ ...prev, horario_inicio_notificacoes: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="fim-notif">Horário de Fim</Label>
              <Input
                id="fim-notif"
                type="time"
                value={localConfig.horario_fim_notificacoes}
                onChange={(e) => 
                  setLocalConfig(prev => ({ ...prev, horario_fim_notificacoes: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Período ativo:</strong> {localConfig.horario_inicio_notificacoes} às {localConfig.horario_fim_notificacoes}
              <br />
              <span className="text-xs">Notificações fora deste horário serão silenciadas</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tipos de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="novos-agend">Novos Agendamentos</Label>
              <Switch
                id="novos-agend"
                checked={localConfig.notificar_novos_agendamentos}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, notificar_novos_agendamentos: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="cancelamentos">Cancelamentos</Label>
              <Switch
                id="cancelamentos"
                checked={localConfig.notificar_cancelamentos}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, notificar_cancelamentos: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="reagendamentos">Reagendamentos</Label>
              <Switch
                id="reagendamentos"
                checked={localConfig.notificar_reagendamentos}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, notificar_reagendamentos: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="pagamentos">Pagamentos</Label>
              <Switch
                id="pagamentos"
                checked={localConfig.notificar_pagamentos}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({ ...prev, notificar_pagamentos: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lembretes e Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Lembretes e Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lembrete de Agendamentos */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Lembrete de Agendamentos</Label>
            <div className="space-y-2">
              <Label className="text-sm">Antecedência: {localConfig.lembrete_agendamento_minutos} minutos</Label>
              <Slider
                value={[localConfig.lembrete_agendamento_minutos]}
                onValueChange={([value]) => 
                  setLocalConfig(prev => ({ ...prev, lembrete_agendamento_minutos: value }))
                }
                max={480}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>8 horas</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lembrete de Vencimentos */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Lembrete de Vencimentos</Label>
            <div className="space-y-2">
              <Label className="text-sm">Antecedência: {localConfig.lembrete_vencimento_dias} dias</Label>
              <Slider
                value={[localConfig.lembrete_vencimento_dias]}
                onValueChange={([value]) => 
                  setLocalConfig(prev => ({ ...prev, lembrete_vencimento_dias: value }))
                }
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 dia</span>
                <span>30 dias</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Lembrete de Contas Fixas */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Lembrete de Contas Fixas</Label>
            <div className="space-y-2">
              <Label className="text-sm">Antecedência: {localConfig.lembrete_contas_fixas_dias} dias</Label>
              <Slider
                value={[localConfig.lembrete_contas_fixas_dias]}
                onValueChange={([value]) => 
                  setLocalConfig(prev => ({ ...prev, lembrete_contas_fixas_dias: value }))
                }
                max={30}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 dia</span>
                <span>30 dias</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Notificações */}
      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Teste de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={sendTestNotification}
              className="w-full"
              disabled={pushLoading}
            >
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificação de Teste
            </Button>
            
            <Button 
              variant="outline" 
              onClick={playTestSound}
              className="w-full"
              disabled={!localConfig.notificacoes_som}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Testar Som da Notificação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informações de Ajuda */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Sobre as Notificações
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Notificações push funcionam apenas em HTTPS ou localhost</li>
            <li>• Configure horários para evitar notificações em períodos de descanso</li>
            <li>• Lembretes ajudam a não esquecer de agendamentos e vencimentos importantes</li>
            <li>• Todas as configurações são salvas automaticamente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}