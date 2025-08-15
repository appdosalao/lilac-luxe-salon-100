import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, Smartphone, Volume2, Clock, DollarSign, CheckCircle, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ConfiguracaoNotificacoesAvancadas() {
  const { configuracoes, updateConfiguracoes } = useConfiguracoes();
  const { 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe, 
    sendTestNotification,
    isLoading 
  } = usePushNotifications();

  const [localConfig, setLocalConfig] = useState(configuracoes?.notificacoes);

  useEffect(() => {
    if (configuracoes?.notificacoes) {
      setLocalConfig(configuracoes.notificacoes);
    }
  }, [configuracoes]);

  const handleSave = async () => {
    if (!configuracoes || !localConfig) return;

    try {
      await updateConfiguracoes({
        ...configuracoes,
        notificacoes: localConfig
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações de notificação foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePushToggle = async () => {
    if (!localConfig) return;

    if (isSubscribed) {
      await unsubscribe();
      setLocalConfig({
        ...localConfig,
        push: { ...localConfig.push, ativo: false }
      });
    } else {
      const success = await subscribe();
      if (success) {
        setLocalConfig({
          ...localConfig,
          push: { ...localConfig.push, ativo: true }
        });
      }
    }
  };

  if (!localConfig) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notificações Push (Mobile)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Seu navegador não suporta notificações push ou você está usando HTTP. 
                Para ativar notificações push, use HTTPS.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações no seu celular mesmo quando o app não estiver aberto
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSubscribed && <Badge variant="outline">Ativado</Badge>}
              <Switch
                checked={isSubscribed}
                onCheckedChange={handlePushToggle}
                disabled={!isSupported || isLoading}
              />
            </div>
          </div>

          {isSubscribed && (
            <Button 
              variant="outline" 
              onClick={sendTestNotification}
              className="w-full"
            >
              Enviar Notificação de Teste
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Novos Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Novos Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="novos-visual">Visual</Label>
              <Switch
                id="novos-visual"
                checked={localConfig.novosAgendamentos.visual}
                onCheckedChange={(checked) =>
                  setLocalConfig({
                    ...localConfig,
                    novosAgendamentos: { ...localConfig.novosAgendamentos, visual: checked }
                  })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="novos-sonoro">Sonoro</Label>
              <Switch
                id="novos-sonoro"
                checked={localConfig.novosAgendamentos.sonoro}
                onCheckedChange={(checked) =>
                  setLocalConfig({
                    ...localConfig,
                    novosAgendamentos: { ...localConfig.novosAgendamentos, sonoro: checked }
                  })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="novos-push">Push</Label>
              <Switch
                id="novos-push"
                checked={localConfig.novosAgendamentos.push}
                onCheckedChange={(checked) =>
                  setLocalConfig({
                    ...localConfig,
                    novosAgendamentos: { ...localConfig.novosAgendamentos, push: checked }
                  })
                }
                disabled={!isSubscribed}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="som-notificacao">Som da Notificação</Label>
            <Select
              value={localConfig.novosAgendamentos.som}
              onValueChange={(value: 'notification1' | 'notification2' | 'notification3') =>
                setLocalConfig({
                  ...localConfig,
                  novosAgendamentos: { ...localConfig.novosAgendamentos, som: value }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notification1">Som 1 (Padrão)</SelectItem>
                <SelectItem value="notification2">Som 2 (Suave)</SelectItem>
                <SelectItem value="notification3">Som 3 (Alerta)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lembretes de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lembretes de Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações antes dos agendamentos
              </p>
            </div>
            <Switch
              checked={localConfig.lembretesAgendamento.ativo}
              onCheckedChange={(checked) =>
                setLocalConfig({
                  ...localConfig,
                  lembretesAgendamento: { ...localConfig.lembretesAgendamento, ativo: checked }
                })
              }
            />
          </div>

          {localConfig.lembretesAgendamento.ativo && (
            <>
              <div className="space-y-2">
                <Label htmlFor="antecedencia-agendamento">Antecedência (minutos)</Label>
                <Input
                  id="antecedencia-agendamento"
                  type="number"
                  min="5"
                  max="1440"
                  value={localConfig.lembretesAgendamento.antecedencia}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      lembretesAgendamento: { 
                        ...localConfig.lembretesAgendamento, 
                        antecedencia: parseInt(e.target.value) || 60 
                      }
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lembrete-push">Push</Label>
                  <Switch
                    id="lembrete-push"
                    checked={localConfig.lembretesAgendamento.push}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        lembretesAgendamento: { ...localConfig.lembretesAgendamento, push: checked }
                      })
                    }
                    disabled={!isSubscribed}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lembrete-sonoro">Sonoro</Label>
                  <Switch
                    id="lembrete-sonoro"
                    checked={localConfig.lembretesAgendamento.sonoro}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        lembretesAgendamento: { ...localConfig.lembretesAgendamento, sonoro: checked }
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Retorno de Cronograma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Retorno de Cronograma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando um cliente precisa retornar
              </p>
            </div>
            <Switch
              checked={localConfig.retornoCronograma.ativo}
              onCheckedChange={(checked) =>
                setLocalConfig({
                  ...localConfig,
                  retornoCronograma: { ...localConfig.retornoCronograma, ativo: checked }
                })
              }
            />
          </div>

          {localConfig.retornoCronograma.ativo && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="retorno-push">Push</Label>
                <Switch
                  id="retorno-push"
                  checked={localConfig.retornoCronograma.push}
                  onCheckedChange={(checked) =>
                    setLocalConfig({
                      ...localConfig,
                      retornoCronograma: { ...localConfig.retornoCronograma, push: checked }
                    })
                  }
                  disabled={!isSubscribed}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="retorno-sonoro">Sonoro</Label>
                <Switch
                  id="retorno-sonoro"
                  checked={localConfig.retornoCronograma.sonoro}
                  onCheckedChange={(checked) =>
                    setLocalConfig({
                      ...localConfig,
                      retornoCronograma: { ...localConfig.retornoCronograma, sonoro: checked }
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Despesas Fixas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Despesas Fixas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Lembretes</Label>
              <p className="text-sm text-muted-foreground">
                Notificar sobre vencimento de despesas fixas
              </p>
            </div>
            <Switch
              checked={localConfig.despesasFixas.ativo}
              onCheckedChange={(checked) =>
                setLocalConfig({
                  ...localConfig,
                  despesasFixas: { ...localConfig.despesasFixas, ativo: checked }
                })
              }
            />
          </div>

          {localConfig.despesasFixas.ativo && (
            <>
              <div className="space-y-2">
                <Label htmlFor="antecedencia-despesa">Antecedência (dias)</Label>
                <Input
                  id="antecedencia-despesa"
                  type="number"
                  min="1"
                  max="30"
                  value={localConfig.despesasFixas.antecedencia}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      despesasFixas: { 
                        ...localConfig.despesasFixas, 
                        antecedencia: parseInt(e.target.value) || 7 
                      }
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="despesa-push">Push</Label>
                  <Switch
                    id="despesa-push"
                    checked={localConfig.despesasFixas.push}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        despesasFixas: { ...localConfig.despesasFixas, push: checked }
                      })
                    }
                    disabled={!isSubscribed}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="despesa-sonoro">Sonoro</Label>
                  <Switch
                    id="despesa-sonoro"
                    checked={localConfig.despesasFixas.sonoro}
                    onCheckedChange={(checked) =>
                      setLocalConfig({
                        ...localConfig,
                        despesasFixas: { ...localConfig.despesasFixas, sonoro: checked }
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Serviço Finalizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Serviço Finalizado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Ativar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando um serviço for finalizado
              </p>
            </div>
            <Switch
              checked={localConfig.servicoFinalizado.ativo}
              onCheckedChange={(checked) =>
                setLocalConfig({
                  ...localConfig,
                  servicoFinalizado: { ...localConfig.servicoFinalizado, ativo: checked }
                })
              }
            />
          </div>

          {localConfig.servicoFinalizado.ativo && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="finalizado-push">Push</Label>
                <Switch
                  id="finalizado-push"
                  checked={localConfig.servicoFinalizado.push}
                  onCheckedChange={(checked) =>
                    setLocalConfig({
                      ...localConfig,
                      servicoFinalizado: { ...localConfig.servicoFinalizado, push: checked }
                    })
                  }
                  disabled={!isSubscribed}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="finalizado-sonoro">Sonoro</Label>
                <Switch
                  id="finalizado-sonoro"
                  checked={localConfig.servicoFinalizado.sonoro}
                  onCheckedChange={(checked) =>
                    setLocalConfig({
                      ...localConfig,
                      servicoFinalizado: { ...localConfig.servicoFinalizado, sonoro: checked }
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[120px]">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}