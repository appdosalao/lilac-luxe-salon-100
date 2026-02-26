import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  Users,
  Package,
  DollarSign,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AuditoriaSugestoesProps {
  sugestoes: string[];
  estatisticas: {
    clientesInativos: number;
    servicosNuncaUsados: number;
    totalAgendamentos: number;
    agendamentosCancelados: number;
  };
}

// Categorizar sugestões
const categorizarSugestao = (sugestao: string): {
  icone: React.ReactNode;
  categoria: string;
  cor: string;
  rota: string;
} => {
  if (sugestao.includes('cliente')) {
    return {
      icone: <Users className="h-5 w-5" />,
      categoria: 'Clientes',
      cor: 'text-blue-500',
      rota: '/clientes'
    };
  }
  if (sugestao.includes('serviço') || sugestao.includes('servico')) {
    return {
      icone: <Package className="h-5 w-5" />,
      categoria: 'Serviços',
      cor: 'text-purple-500',
      rota: '/servicos'
    };
  }
  if (sugestao.includes('pagamento') || sugestao.includes('financeiro') || sugestao.includes('cobrança')) {
    return {
      icone: <DollarSign className="h-5 w-5" />,
      categoria: 'Financeiro',
      cor: 'text-green-500',
      rota: '/financeiro'
    };
  }
  if (sugestao.includes('retorno') || sugestao.includes('atraso')) {
    return {
      icone: <RefreshCw className="h-5 w-5" />,
      categoria: 'Retornos',
      cor: 'text-orange-500',
      rota: '/cronogramas'
    };
  }
  if (sugestao.includes('agendamento') || sugestao.includes('duração') || sugestao.includes('tempo')) {
    return {
      icone: <Calendar className="h-5 w-5" />,
      categoria: 'Agendamentos',
      cor: 'text-pink-500',
      rota: '/agendamentos'
    };
  }
  return {
    icone: <Lightbulb className="h-5 w-5" />,
    categoria: 'Geral',
    cor: 'text-yellow-500',
    rota: '/dashboard'
  };
};

export function AuditoriaSugestoes({ sugestoes, estatisticas }: AuditoriaSugestoesProps) {
  const navigate = useNavigate();

  // Métricas adicionais
  const taxaCancelamento = estatisticas.totalAgendamentos > 0
    ? (estatisticas.agendamentosCancelados / estatisticas.totalAgendamentos) * 100
    : 0;

  if (sugestoes.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
            Sistema Otimizado!
          </h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">
            Não há sugestões de melhorias no momento. 
            Continue monitorando regularmente para manter o alto desempenho.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {estatisticas.clientesInativos > 5 && (
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Oportunidade de Reativação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Você tem <strong>{estatisticas.clientesInativos} clientes inativos</strong>. 
                Uma campanha de reativação pode recuperar até 30% deles.
              </p>
              <Button 
                variant="link" 
                className="px-0 mt-2" 
                onClick={() => navigate('/clientes')}
              >
                Ver clientes inativos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {taxaCancelamento > 15 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Alta Taxa de Cancelamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Taxa de cancelamento de <strong>{taxaCancelamento.toFixed(1)}%</strong>. 
                Considere implementar confirmação por WhatsApp.
              </p>
              <Button 
                variant="link" 
                className="px-0 mt-2" 
                onClick={() => navigate('/configuracoes')}
              >
                Configurar lembretes <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {estatisticas.servicosNuncaUsados > 0 && (
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                Serviços Não Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <strong>{estatisticas.servicosNuncaUsados} serviços</strong> nunca foram agendados. 
                Considere promovê-los ou removê-los.
              </p>
              <Button 
                variant="link" 
                className="px-0 mt-2" 
                onClick={() => navigate('/servicos')}
              >
                Gerenciar serviços <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de Sugestões */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle>Sugestões de Melhorias</CardTitle>
          </div>
          <CardDescription>
            Recomendações baseadas na análise dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sugestoes.map((sugestao, index) => {
              const { icone, categoria, cor, rota } = categorizarSugestao(sugestao);
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className={cn("flex-shrink-0 mt-0.5", cor)}>
                    {icone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {categoria}
                      </span>
                    </div>
                    <p className="text-sm">{sugestao}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(rota)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Resolver
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dica Pro */}
      <Alert className="border-primary/20 bg-primary/5">
        <TrendingUp className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Dica Pro:</strong> Execute auditorias regularmente (semanalmente) para identificar 
          problemas antes que se tornem críticos. Salve os relatórios para acompanhar a evolução 
          do sistema ao longo do tempo.
        </AlertDescription>
      </Alert>
    </div>
  );
}
