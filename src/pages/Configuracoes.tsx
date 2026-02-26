import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfiguracaoHorarios } from '@/components/configuracoes/ConfiguracaoHorarios-Simple';
import { ConfiguracaoNotificacoesAvancadas } from '@/components/configuracoes/ConfiguracaoNotificacoesAvancadas';
import { ConfiguracaoNotificacoesPush } from '@/components/configuracoes/ConfiguracaoNotificacoesPush';
import { ConfiguracaoBackup } from '@/components/configuracoes/ConfiguracaoBackup';
import { ConfiguracaoAgendamentoOnline } from '@/components/configuracoes/ConfiguracaoAgendamentoOnline';
import { Clock, Bell, Download, Settings, Calendar, Crown, CreditCard, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Configuracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'horarios';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { subscription, isSubscriptionLoading, session } = useSupabaseAuth();
  const [portalOpen, setPortalOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    if (!session) {
      navigate('/login');
      return;
    }
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (!error && data?.url) {
        setPortalUrl(data.url);
        setPortalOpen(true);
      } else {
        window.open(data?.url || '/assinatura', '_blank');
      }
    } catch {
      window.open('/assinatura', '_blank');
    } finally {
      setPortalLoading(false);
    }
  };

  const testStripeConnection = async () => {
    if (!session) {
      navigate('/login');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (error) {
        toast.error('Falha ao conectar ao Stripe');
      } else if (data?.url) {
        toast.success('Conexão com Stripe OK');
      } else {
        toast.error('Não foi possível validar a conexão');
      }
    } catch {
      toast.error('Erro de conectividade com Stripe');
    }
  };
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          <span>Configurações</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure os horários de atendimento, agendamento online, notificações e backup do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="horarios" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="agendamento-online" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agend. Online
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="assinatura" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Horários e Dias de Trabalho</span>
              </CardTitle>
              <CardDescription>
                Configure os dias da semana e horários em que você atenderá clientes. 
                Estas configurações serão respeitadas nos formulários de agendamento.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <ConfiguracaoHorarios />

          {/* Informações sobre horários */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📋 Integração com Agendamentos
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Os horários configurados aqui serão automaticamente aplicados aos formulários 
                de agendamento interno e externo, bloqueando horários indisponíveis.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamento-online" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Configurações do Agendamento Online</span>
              </CardTitle>
              <CardDescription>
                Configure o formulário público de agendamento, informações do salão, redes sociais e regras de agendamento.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <ConfiguracaoAgendamentoOnline />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <ConfiguracaoNotificacoesAvancadas />
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <ConfiguracaoBackup />
        </TabsContent>

        <TabsContent value="assinatura" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>Plano e Assinatura</span>
              </CardTitle>
              <CardDescription>
                Gerencie pagamento, faturas e status do seu plano
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSubscriptionLoading ? (
                <p className="text-sm text-muted-foreground">Carregando status...</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="text-sm font-medium">
                      {subscription?.status === 'active' ? 'Ativo' :
                       subscription?.status === 'trial' ? 'Em teste' :
                       subscription?.status === 'expired' ? 'Expirado' : 'Inativo'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Plano</div>
                    <div className="text-sm font-medium">Premium</div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button onClick={openPortal} className="gap-2" disabled={portalLoading}>
                      <CreditCard className="h-4 w-4" />
                      {portalLoading ? 'Abrindo...' : 'Gerenciar Assinatura'}
                    </Button>
                    <Button variant="outline" onClick={testStripeConnection}>
                      Testar Conexão Stripe
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
            <DialogContent className="sm:max-w-[900px] h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Portal de Assinatura
                </DialogTitle>
                <DialogDescription>
                  Gerencie pagamento, faturas e informações da sua assinatura
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                {portalUrl ? (
                  <iframe
                    src={portalUrl}
                    className="w-full h-full rounded-md border"
                    title="Portal de Assinatura"
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Não foi possível carregar o portal embutido. 
                    <a href="/configuracoes?tab=assinatura" className="inline-flex items-center gap-1 text-primary underline ml-1" target="_blank" rel="noreferrer">
                      Abrir em nova aba <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div className="mt-2">
                  {portalUrl && (
                    <a href={portalUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline inline-flex items-center gap-1">
                      Abrir em nova aba <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
