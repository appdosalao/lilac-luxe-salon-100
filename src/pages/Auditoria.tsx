import { useState, useMemo, useEffect } from 'react';
import { useAuditoria } from '@/hooks/useAuditoria';
import { useRetornos } from '@/hooks/useCronogramas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Settings,
  FileText,
  BarChart3,
  Lightbulb,
  Clock
} from 'lucide-react';

// Componentes da auditoria
import { AuditoriaSummaryCards } from '@/components/auditoria/AuditoriaSummaryCards';
import { AuditoriaAcoesRapidas } from '@/components/auditoria/AuditoriaAcoesRapidas';
import { AuditoriaProblemasTable } from '@/components/auditoria/AuditoriaProblemasTable';
import { AuditoriaEstatisticas } from '@/components/auditoria/AuditoriaEstatisticas';
import { AuditoriaSugestoes } from '@/components/auditoria/AuditoriaSugestoes';
import { AuditoriaHistorico } from '@/components/auditoria/AuditoriaHistorico';
import ResolverRetornos from '@/components/auditoria/ResolverRetornos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Auditoria() {
  const { 
    relatorioAuditoria, 
    exportarRelatorio, 
    salvarRelatorio, 
    salvando,
    carregarHistorico,
    relatoriosHistorico,
    carregandoBackend,
    executarAgora,
    origemRelatorio,
    resolverProblemasSelecionados,
    reabrirProblemasSelecionados
  } = useAuditoria();

  const { retornos } = useRetornos();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [unresolvedKeys, setUnresolvedKeys] = useState<Set<string>>(new Set());
  const [unresolvedCounts, setUnresolvedCounts] = useState<Record<string, number>>({});

  // Calcular métricas adicionais
  const retornosAtrasados = useMemo(() => {
    const hoje = new Date();
    return retornos.filter(r => {
      if (r.status !== 'Pendente') return false;
      const dataRetorno = new Date(r.data_retorno);
      return dataRetorno < hoje;
    }).length;
  }, [retornos]);

  const agendamentosEmAberto = useMemo(() => {
    return relatorioAuditoria.problemas.filter(p => 
      p.tipo === 'dados_inconsistentes' && 
      p.campo === 'statusPagamento'
    ).length;
  }, [relatorioAuditoria.problemas]);

  const porcentagemSaude = Math.max(0, 100 - (relatorioAuditoria.problemasCriticos * 10 + relatorioAuditoria.problemasAltos * 5));

  // Carregar histórico ao montar
  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  useEffect(() => {
    const carregarNaoResolvidos = async () => {
      const { data } = await supabase
        .from('problemas_auditoria')
        .select('tipo,entidade,entidade_id')
        .eq('resolvido', false);
      const set = new Set<string>();
      (data || []).forEach((r: any) => {
        set.add(`${r.tipo}|${r.entidade}|${r.entidade_id}`);
      });
      setUnresolvedKeys(set);
    };
    carregarNaoResolvidos();
  }, []);

  useEffect(() => {
    const calcularCounts = async () => {
      if (!relatoriosHistorico || relatoriosHistorico.length === 0) {
        setUnresolvedCounts({});
        return;
      }
      const ids = relatoriosHistorico.map((r: any) => r.id);
      const { data } = await supabase
        .from('problemas_auditoria')
        .select('relatorio_id')
        .in('relatorio_id', ids)
        .eq('resolvido', false);
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.relatorio_id] = (counts[r.relatorio_id] || 0) + 1;
      });
      setUnresolvedCounts(counts);
    };
    calcularCounts();
  }, [relatoriosHistorico]);

  useEffect(() => {
    const carregarNaoResolvidos = async () => {
      const { data } = await supabase
        .from('problemas_auditoria')
        .select('tipo,entidade,entidade_id')
        .eq('resolvido', false);
      const set = new Set<string>();
      (data || []).forEach((r: any) => {
        set.add(`${r.tipo}|${r.entidade}|${r.entidade_id}`);
      });
      setUnresolvedKeys(set);
    };
    carregarNaoResolvidos();
  }, []);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {carregandoBackend && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Executando Auditoria
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Analisando dados e verificando inconsistências...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h1>
          <p className="text-muted-foreground">
            Última análise: {new Date(relatorioAuditoria.dataExecucao).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={executarAgora}
            disabled={carregandoBackend}
            className="gap-2"
            title={origemRelatorio === 'backend' ? 'Relatório do servidor' : 'Relatório local'}
          >
            <RefreshCw className={`h-4 w-4 ${carregandoBackend ? 'animate-spin' : ''}`} />
            {carregandoBackend ? 'Executando...' : 'Executar Auditoria'}
          </Button>
          <Button 
            variant="default"
            onClick={salvarRelatorio}
            disabled={salvando}
            className="gap-2"
          >
            {salvando ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Salvar Relatório
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => exportarRelatorio('csv')}
            title="Exportar CSV"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => exportarRelatorio('json')}
            title="Exportar JSON"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerta crítico */}
      {relatorioAuditoria.problemasCriticos > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção: Problemas Críticos Detectados!</AlertTitle>
          <AlertDescription>
            Foram encontrados {relatorioAuditoria.problemasCriticos} problemas críticos que precisam de atenção imediata.
            Verifique a aba "Problemas" para mais detalhes e tome as ações necessárias.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de resumo */}
      <AuditoriaSummaryCards
        porcentagemSaude={porcentagemSaude}
        totalProblemas={relatorioAuditoria.totalProblemas}
        problemasCriticos={relatorioAuditoria.problemasCriticos}
        problemasAltos={relatorioAuditoria.problemasAltos}
        valorTotalReceitas={relatorioAuditoria.estatisticas.valorTotalReceitas}
        valorTotalDespesas={relatorioAuditoria.estatisticas.valorTotalDespesas}
        totalAgendamentos={relatorioAuditoria.estatisticas.totalAgendamentos}
        agendamentosAtivos={relatorioAuditoria.estatisticas.agendamentosAtivos}
        agendamentosConcluidos={relatorioAuditoria.estatisticas.agendamentosConcluidos}
      />

      {/* Ações rápidas */}
      <AuditoriaAcoesRapidas
        retornosAtrasados={retornosAtrasados}
        clientesInativos={relatorioAuditoria.estatisticas.clientesInativos}
        agendamentosEmAberto={agendamentosEmAberto}
        problemasCriticos={relatorioAuditoria.problemasCriticos}
      />

      {/* Tabs de conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="visao-geral" className="gap-2">
            <BarChart3 className="h-4 w-4 hidden sm:inline" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="problemas" id="tab-problemas" className="gap-2">
            <AlertTriangle className="h-4 w-4 hidden sm:inline" />
            Problemas
            {relatorioAuditoria.totalProblemas > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {relatorioAuditoria.totalProblemas}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolver" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:inline" />
            Resolver
          </TabsTrigger>
          <TabsTrigger value="sugestoes" className="gap-2">
            <Lightbulb className="h-4 w-4 hidden sm:inline" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <Clock className="h-4 w-4 hidden sm:inline" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4 mt-6">
          <AuditoriaEstatisticas estatisticas={relatorioAuditoria.estatisticas} />
        </TabsContent>

        <TabsContent value="problemas" className="space-y-4 mt-6">
          <AuditoriaProblemasTable 
            problemas={relatorioAuditoria.problemas} 
            onResolverLote={async (items) => {
              const ok = await resolverProblemasSelecionados(items);
              if (ok) {
                toast.success('Problemas resolvidos', {
                  action: {
                    label: 'Desfazer',
                    onClick: async () => {
                      await reabrirProblemasSelecionados(items);
                    }
                  }
                } as any);
              }
              const { data } = await supabase
                .from('problemas_auditoria')
                .select('tipo,entidade,entidade_id')
                .eq('resolvido', false);
              const set = new Set<string>();
              (data || []).forEach((r: any) => {
                set.add(`${r.tipo}|${r.entidade}|${r.entidade_id}`);
              });
              setUnresolvedKeys(set);
            }}
            unresolvedKeys={unresolvedKeys}
          />
        </TabsContent>

        <TabsContent value="resolver" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ferramentas de Resolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResolverRetornos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sugestoes" className="space-y-4 mt-6">
          <AuditoriaSugestoes 
            sugestoes={relatorioAuditoria.sugestoesMelhorias}
            estatisticas={{
              clientesInativos: relatorioAuditoria.estatisticas.clientesInativos,
              servicosNuncaUsados: relatorioAuditoria.estatisticas.servicosNuncaUsados,
              totalAgendamentos: relatorioAuditoria.estatisticas.totalAgendamentos,
              agendamentosCancelados: relatorioAuditoria.estatisticas.agendamentosCancelados
            }}
          />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-6">
          <AuditoriaHistorico 
            relatorios={relatoriosHistorico}
            onCarregar={carregarHistorico}
            unresolvedCounts={unresolvedCounts}
          />
        </TabsContent>
      </Tabs>

      {/* Info footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
            <p>
              <strong>Dados analisados:</strong> {relatorioAuditoria.estatisticas.totalClientes} clientes • 
              {relatorioAuditoria.estatisticas.totalServicos} serviços • 
              {relatorioAuditoria.estatisticas.totalAgendamentos} agendamentos • 
              {relatorioAuditoria.estatisticas.totalLancamentos} lançamentos
            </p>
            <p className="text-xs">
              Auditoria executada automaticamente ao acessar a página
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
