import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelatorioHistorico {
  id: string;
  data_execucao: string;
  total_problemas: number;
  problemas_criticos: number;
  problemas_altos: number;
  problemas_medios: number;
  problemas_baixos: number;
  estatisticas?: any;
}

interface AuditoriaHistoricoProps {
  relatorios: RelatorioHistorico[];
  onCarregar: () => void;
  unresolvedCounts?: Record<string, number>;
}

export function AuditoriaHistorico({ relatorios, onCarregar, unresolvedCounts }: AuditoriaHistoricoProps) {
  const [filtro, setFiltro] = React.useState<'todos' | 'abertos' | 'resolvidos'>('todos');

  const listaFiltrada = React.useMemo(() => {
    if (!unresolvedCounts) return relatorios;
    if (filtro === 'todos') return relatorios;
    if (filtro === 'abertos') return relatorios.filter(r => (unresolvedCounts[r.id] || 0) > 0);
    return relatorios.filter(r => (unresolvedCounts[r.id] || 0) === 0);
  }, [relatorios, unresolvedCounts, filtro]);
  const calcularSaude = (rel: RelatorioHistorico) => {
    return Math.max(0, 100 - (rel.problemas_criticos * 10 + rel.problemas_altos * 5));
  };

  const calcularTendencia = (index: number) => {
    if (index >= relatorios.length - 1) return null;
    
    const atual = calcularSaude(relatorios[index]);
    const anterior = calcularSaude(relatorios[index + 1]);
    
    if (atual > anterior) return 'melhorou';
    if (atual < anterior) return 'piorou';
    return 'estavel';
  };

  if (relatorios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Nenhum Relatório Salvo</h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">
            Clique em "Salvar Relatório" para começar a criar um histórico de auditorias.
            Isso permite acompanhar a evolução da saúde do sistema ao longo do tempo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Auditorias</CardTitle>
          <CardDescription>
            Últimos {relatorios.length} relatórios salvos • Acompanhe a evolução do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unresolvedCounts && (
            <div className="flex items-center gap-2 mb-3">
              <button
                className={`px-3 py-1.5 rounded-md border text-sm ${filtro === 'todos' ? 'bg-accent' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                Todos
              </button>
              <button
                className={`px-3 py-1.5 rounded-md border text-sm ${filtro === 'abertos' ? 'bg-accent' : ''}`}
                onClick={() => setFiltro('abertos')}
              >
                Com abertos
              </button>
              <button
                className={`px-3 py-1.5 rounded-md border text-sm ${filtro === 'resolvidos' ? 'bg-accent' : ''}`}
                onClick={() => setFiltro('resolvidos')}
              >
                Todos resolvidos
              </button>
            </div>
          )}
          <div className="space-y-3">
            {listaFiltrada.map((rel, index) => {
              const saude = calcularSaude(rel);
              const tendencia = calcularTendencia(index);
              const data = new Date(rel.data_execucao);
              const abertos = unresolvedCounts ? (unresolvedCounts[rel.id] || 0) : null;
              
              return (
                <div 
                  key={rel.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    index === 0 ? "bg-accent/50 border-primary/20" : "hover:bg-accent/30"
                  )}
                >
                  {/* Data e hora */}
                  <div className="flex-shrink-0 text-center min-w-[80px]">
                    <div className="text-2xl font-bold">
                      {data.getDate().toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase">
                      {data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Indicador de saúde */}
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold",
                      saude > 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : 
                      saude > 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" : 
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {saude}%
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Mais recente
                        </Badge>
                      )}
                      {abertos !== null && (
                        abertos > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {abertos} abertos
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Todos resolvidos
                          </Badge>
                        )
                      )}
                      {tendencia && (
                        <span className={cn(
                          "flex items-center gap-1 text-xs",
                          tendencia === 'melhorou' ? "text-green-600 dark:text-green-400" :
                          tendencia === 'piorou' ? "text-red-600 dark:text-red-400" :
                          "text-muted-foreground"
                        )}>
                          {tendencia === 'melhorou' && <TrendingUp className="h-3 w-3" />}
                          {tendencia === 'piorou' && <TrendingDown className="h-3 w-3" />}
                          {tendencia === 'melhorou' ? 'Melhorou' :
                           tendencia === 'piorou' ? 'Piorou' : 'Estável'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium">
                        {rel.total_problemas} problemas
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      {rel.problemas_criticos > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {rel.problemas_criticos} críticos
                        </Badge>
                      )}
                      {rel.problemas_altos > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {rel.problemas_altos} altos
                        </Badge>
                      )}
                      {rel.problemas_medios > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {rel.problemas_medios} médios
                        </Badge>
                      )}
                      {rel.problemas_baixos > 0 && (
                        <Badge variant="default" className="text-xs bg-muted text-muted-foreground">
                          {rel.problemas_baixos} baixos
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Tendência */}
      {relatorios.length >= 3 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Análise de Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const primeiro = calcularSaude(relatorios[relatorios.length - 1]);
                const ultimo = calcularSaude(relatorios[0]);
                const diferenca = ultimo - primeiro;
                
                if (diferenca > 10) {
                  return `A saúde do sistema melhorou ${diferenca.toFixed(0)}% desde a primeira auditoria. Continue com o bom trabalho!`;
                } else if (diferenca < -10) {
                  return `A saúde do sistema caiu ${Math.abs(diferenca).toFixed(0)}% desde a primeira auditoria. Revise os problemas críticos.`;
                } else {
                  return `A saúde do sistema permanece estável. Continue monitorando regularmente.`;
                }
              })()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
