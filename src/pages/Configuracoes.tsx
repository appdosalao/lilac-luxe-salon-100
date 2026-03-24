import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ConfiguracaoHorarios } from '@/components/configuracoes/ConfiguracaoHorarios-Simple';
import { ConfiguracaoNotificacoesAvancadas } from '@/components/configuracoes/ConfiguracaoNotificacoesAvancadas';
import { ConfiguracaoNotificacoesPush } from '@/components/configuracoes/ConfiguracaoNotificacoesPush';
import { ConfiguracaoBackup } from '@/components/configuracoes/ConfiguracaoBackup';
import { ConfiguracaoAgendamentoOnline } from '@/components/configuracoes/ConfiguracaoAgendamentoOnline';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Bell, Calendar, Crown, CreditCard, Download, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { usePaidAccess } from '@/hooks/usePaidAccess';
import { toast } from 'sonner';

export default function Configuracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'horarios';
  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { usuario, isLoading: authLoading, refreshProfile, isAuthenticated } = useSupabaseAuth();
  const { isPaid, isLoading: paidLoading, refetch } = usePaidAccess();
  const [statusLoading, setStatusLoading] = useState(false);

  const isLoading = authLoading || paidLoading;

  const trialStart = typeof usuario?.trial_start_date === 'string' ? new Date(usuario.trial_start_date) : null;
  const trialStartMs = trialStart ? trialStart.getTime() : null;
  const trialEndMs = typeof trialStartMs === 'number' && Number.isFinite(trialStartMs) ? trialStartMs + 7 * 24 * 60 * 60 * 1000 : null;
  const nowMs = Date.now();
  const trialValid =
    usuario?.subscription_status === 'trial' &&
    typeof trialStartMs === 'number' &&
    Number.isFinite(trialStartMs) &&
    nowMs < trialStartMs + 7 * 24 * 60 * 60 * 1000;
  const trialRemainingDays =
    typeof trialEndMs === 'number' && Number.isFinite(trialEndMs)
      ? Math.max(0, Math.ceil((trialEndMs - nowMs) / (1000 * 60 * 60 * 24)))
      : null;
  const trialProgress =
    typeof trialStartMs === 'number' && Number.isFinite(trialStartMs) && typeof trialEndMs === 'number' && Number.isFinite(trialEndMs)
      ? Math.min(100, Math.max(0, Math.round(((nowMs - trialStartMs) / (trialEndMs - trialStartMs)) * 100)))
      : null;

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return '—';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  };

  const statusLabel = (() => {
    if (isPaid) return 'Acesso Vitalício Ativo';
    if (trialValid) return `Teste grátis ativo — ${trialRemainingDays ?? 0} dia(s) restante(s)`;
    if (usuario?.subscription_status === 'trial') return 'Teste grátis expirado — acesso pendente';
    return 'Acesso pendente';
  })();

  const planLabel = (() => {
    if (isPaid) return 'Vitalício (Acesso Permanente)';
    return 'Teste grátis (7 dias)';
  })();
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
                Acompanhe seu acesso, o período de teste e como liberar o vitalício
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando status...</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="text-sm font-semibold">{statusLabel}</div>
                    </div>
                    <Badge variant={isPaid ? 'default' : 'outline'} className={isPaid ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {isPaid ? 'Vitalício' : trialValid ? 'Teste grátis' : 'Pendente'}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="text-sm text-muted-foreground">Plano</div>
                      <div className="text-sm font-semibold">{planLabel}</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="text-sm text-muted-foreground">Liberação</div>
                      <div className="text-sm font-semibold">{isPaid ? formatDate(usuario?.paid_at) : 'Após pagamento aprovado'}</div>
                    </div>
                  </div>

                  {trialValid ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="text-sm font-semibold text-primary">Teste grátis em andamento</div>
                          <div className="text-xs text-muted-foreground">
                            Início: {formatDate(usuario?.trial_start_date)} · Expira: {trialEndMs ? formatDate(new Date(trialEndMs)) : '—'}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">{trialProgress !== null ? `${trialProgress}%` : ''}</div>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-primary/10 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${trialProgress ?? 0}%` }} />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Você pode usar o app normalmente durante o teste. Depois, será necessário liberar o acesso vitalício.
                      </div>
                    </div>
                  ) : null}

                  {!isPaid ? (
                    <div className="rounded-lg border border-border/60 bg-card/50 p-4">
                      <div className="text-sm font-semibold">O que você recebe no vitalício</div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {[
                          'Agenda com visão diária/semana',
                          'Agendamentos e clientes ilimitados',
                          'Serviços e preços organizados',
                          'Controle financeiro e relatórios',
                          'Atualizações futuras inclusas',
                          'Suporte prioritário',
                        ].map((t) => (
                          <div key={t} className="flex items-start gap-2 text-sm">
                            <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 rounded-full p-1">
                              <Check className="h-3 w-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                            </div>
                            <span className="text-foreground/80">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        navigate('/checkout');
                      }}
                      className="w-full gap-2"
                      disabled={isPaid}
                      variant={isPaid ? "outline" : "default"}
                    >
                      <CreditCard className="h-4 w-4" />
                      {isPaid ? 'Acesso Vitalício Adquirido' : 'Comprar Acesso Vitalício'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled={statusLoading}
                      onClick={async () => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setStatusLoading(true);
                        try {
                          await refreshProfile();
                          await refetch?.();
                          toast.success('Status atualizado!');
                        } catch (e) {
                          toast.error('Erro ao verificar status');
                          void e;
                        } finally {
                          setStatusLoading(false);
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      {statusLoading ? 'Verificando...' : 'Verificar Status'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
