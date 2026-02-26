import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  AlertTriangle, 
  Users, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AcaoRapida {
  id: string;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  prioridade: 'alta' | 'media' | 'baixa';
  acao: () => void;
  badge?: string;
}

interface AuditoriaAcoesRapidasProps {
  retornosAtrasados: number;
  clientesInativos: number;
  agendamentosEmAberto: number;
  problemasCriticos: number;
}

export function AuditoriaAcoesRapidas({
  retornosAtrasados,
  clientesInativos,
  agendamentosEmAberto,
  problemasCriticos
}: AuditoriaAcoesRapidasProps) {
  const navigate = useNavigate();

  const acoes: AcaoRapida[] = [
    ...(retornosAtrasados > 0 ? [{
      id: 'retornos',
      titulo: 'Resolver Retornos',
      descricao: `${retornosAtrasados} retorno(s) pendente(s) aguardando ação`,
      icone: <Clock className="h-5 w-5 text-orange-500" />,
      prioridade: 'alta' as const,
      acao: () => navigate('/cronogramas'),
      badge: `${retornosAtrasados} pendentes`
    }] : []),
    ...(problemasCriticos > 0 ? [{
      id: 'criticos',
      titulo: 'Problemas Críticos',
      descricao: `${problemasCriticos} problema(s) crítico(s) requerem atenção imediata`,
      icone: <AlertTriangle className="h-5 w-5 text-red-500" />,
      prioridade: 'alta' as const,
      acao: () => document.getElementById('tab-problemas')?.click(),
      badge: `${problemasCriticos} críticos`
    }] : []),
    ...(agendamentosEmAberto > 0 ? [{
      id: 'pagamentos',
      titulo: 'Cobrar Pagamentos',
      descricao: `${agendamentosEmAberto} agendamento(s) com pagamento pendente`,
      icone: <DollarSign className="h-5 w-5 text-yellow-500" />,
      prioridade: 'media' as const,
      acao: () => navigate('/financeiro'),
      badge: `R$ pendente`
    }] : []),
    ...(clientesInativos > 0 ? [{
      id: 'clientes',
      titulo: 'Reativar Clientes',
      descricao: `${clientesInativos} cliente(s) sem agendamento há mais de 30 dias`,
      icone: <Users className="h-5 w-5 text-blue-500" />,
      prioridade: 'baixa' as const,
      acao: () => navigate('/clientes'),
      badge: `${clientesInativos} inativos`
    }] : [])
  ];

  if (acoes.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Nenhuma ação pendente!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Todos os dados estão em dia. Continue acompanhando regularmente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </div>
        <CardDescription>
          Tarefas prioritárias que requerem sua atenção
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {acoes.map((acao) => (
            <button
              key={acao.id}
              onClick={acao.acao}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
            >
              <div className="flex-shrink-0">
                {acao.icone}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{acao.titulo}</span>
                  {acao.badge && (
                    <Badge 
                      variant={acao.prioridade === 'alta' ? 'destructive' : 
                               acao.prioridade === 'media' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {acao.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {acao.descricao}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
