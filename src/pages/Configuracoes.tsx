import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
        window.open(data.url, '_blank');
        setPortalUrl(data.url);
        setPortalOpen(false);
      } else {
        const message = data?.error || error?.message || 'Falha ao abrir portal do Stripe';
        toast.error(message);
        window.open('/assinatura', '_blank');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao abrir portal do Stripe';
      toast.error(message);
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
        const message = data?.error || error.message || 'Falha ao conectar ao Stripe';
        toast.error(message);
      } else if (data?.url) {
        toast.success('Conexão com Stripe OK');
      } else {
        toast.error(data?.error || 'Não foi possível validar a conexão');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conectividade com Stripe';
      toast.error(message);
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
    <div className="container-responsive p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
          <span>Configurações</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure os horários de atendimento, agendamento online, notificações e backup do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="flex md:grid md:grid-cols-5 gap-1 p-1 w-full bg-muted rounded-lg">
            <TabsTrigger value="horarios" className="flex items-center gap-2 min-h-[44px] flex-1">
              <Clock className="h-4 w-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="agendamento-online" className="flex items-center gap-2 min-h-[44px] flex-1">
              <Calendar className="h-4 w-4" />
              Agend. Online
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2 min-h-[44px] flex-1">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2 min-h-[44px] flex-1">
              <Download className="h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="assinatura" className="flex items-center gap-2 min-h-[44px] flex-1">
              <Crown className="h-4 w-4" />
              Assinatura
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="md:hidden" />
        </ScrollArea>

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
                    <Button variant="outline" className="gap-2" onClick={openPortal}>
                      <ExternalLink className="h-4 w-4" />
                      Abrir Portal em nova aba
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
                  Gerencie pagamento, faturas e informações da sua assinatura. 
                  Por segurança do Stripe, o portal abre em uma nova aba.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                <div className="text-sm text-muted-foreground">
                  Ao clicar em “Gerenciar Assinatura”, o portal do Stripe será aberto em nova aba.
                  Caso não abra, verifique se o bloqueador de pop‑ups está desativado para este site.
                </div>
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
