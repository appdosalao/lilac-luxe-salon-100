import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Megaphone, 
  Users, 
  Award, 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  MousePointer2, 
  Target, 
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useSupabaseMarketing } from '@/hooks/useSupabaseMarketing';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export const MarketingDashboard = () => {
  const { campanhas, carregarCampanhas } = useSupabaseMarketing();
  const { estatisticas, recarregar: recarregarFid } = useSupabaseFidelidade();

  useEffect(() => {
    carregarCampanhas();
    recarregarFid();
  }, [carregarCampanhas, recarregarFid]);

  // Dados fictícios para gráficos se não houver dados reais suficientes
  const dadosPerformance = [
    { name: 'Jan', alcance: 400, cliques: 240, conversoes: 100 },
    { name: 'Fev', alcance: 300, cliques: 139, conversoes: 80 },
    { name: 'Mar', alcance: 200, cliques: 980, conversoes: 300 },
    { name: 'Abr', alcance: 278, cliques: 390, conversoes: 200 },
    { name: 'Mai', alcance: 189, cliques: 480, conversoes: 250 },
    { name: 'Jun', alcance: 239, cliques: 380, conversoes: 180 },
  ];

  const totalCampanhasAtivas = campanhas.filter(c => c.status === 'enviando' || c.status === 'agendada').length;
  const totalDestinatarios = campanhas.reduce((acc, c) => acc + (c.total_destinatarios || 0), 0);
  const totalAberturas = campanhas.reduce((acc, c) => acc + (c.metricas?.aberturas || 0), 0);
  const totalCliques = campanhas.reduce((acc, c) => acc + (c.metricas?.cliques || 0), 0);

  const taxaAberturaMedia = totalDestinatarios > 0 ? (totalAberturas / totalDestinatarios) * 100 : 0;
  const taxaCliqueMedia = totalAberturas > 0 ? (totalCliques / totalAberturas) * 100 : 0;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* KPIs de Marketing */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Megaphone className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampanhasAtivas}</div>
            <p className="text-xs text-muted-foreground">Total de campanhas em andamento</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
            <Users className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDestinatarios.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Clientes impactados por campanhas</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaCliqueMedia.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média de cliques por abertura</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fidelidade Ativa</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.total_clientes_programa || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes no programa de fidelidade</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de Performance */}
        <Card className="md:col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Desempenho de Campanhas</CardTitle>
            <CardDescription>Visualização de alcance e interações ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosPerformance}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="alcance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="cliques" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="conversoes" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alertas e Insights Estratégicos */}
        <Card className="md:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Alertas e Insights</CardTitle>
            <CardDescription>Informações estratégicas em tempo real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Oportunidade de Segmentação</p>
                <p className="text-xs text-muted-foreground">Você tem 15 clientes que não visitam o salão há mais de 30 dias. Que tal uma campanha de retorno?</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Campanha Pendente</p>
                <p className="text-xs text-muted-foreground">A campanha "Promoção de Outono" está em rascunho há 3 dias. Conclua o envio para impactar seus clientes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <Bell className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Aniversariantes do Mês</p>
                <p className="text-xs text-muted-foreground">8 clientes fazem aniversário este mês. A automação de aniversário está ativa e enviando mensagens.</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span>Meta Mensal de Conversão</span>
                <span className="font-semibold">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Distribuição por Canal */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Engajamento por Canal</CardTitle>
            <CardDescription>Comparativo de interações entre diferentes canais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { canal: 'WhatsApp', engajamento: 85 },
                  { canal: 'SMS', engajamento: 45 },
                  { canal: 'E-mail', engajamento: 30 },
                  { canal: 'Push', engajamento: 60 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="canal" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="engajamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Últimas Atividades */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Últimas Campanhas</CardTitle>
            <CardDescription>Resumo dos envios recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campanhas.slice(0, 4).map((campanha) => (
                <div key={campanha.id} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {campanha.tipo === 'whatsapp' ? <MessageSquare className="h-4 w-4 text-green-500" /> : <Mail className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{campanha.nome}</p>
                      <p className="text-xs text-muted-foreground">{campanha.status}</p>
                    </div>
                  </div>
                  <Badge variant={campanha.status === 'concluida' ? 'success' : 'outline'}>
                    {campanha.total_enviados} envios
                  </Badge>
                </div>
              ))}
              {campanhas.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">Nenhuma campanha registrada ainda.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
