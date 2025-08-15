import { useState } from 'react';
import { useAuditoria } from '@/hooks/useAuditoria';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Package,
  BarChart3,
  FileText,
  RefreshCw,
  Settings
} from 'lucide-react';
import ResolverRetornos from '@/components/auditoria/ResolverRetornos';

const categoriaCores = {
  critico: 'destructive',
  alto: 'secondary',
  medio: 'outline',
  baixo: 'default'
} as const;

const categoriaIcones = {
  critico: XCircle,
  alto: AlertTriangle,
  medio: AlertTriangle,
  baixo: CheckCircle
};

export default function Auditoria() {
  const { relatorioAuditoria, exportarRelatorio } = useAuditoria();
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  const problemasFiltrados = filtroCategoria === 'todos' 
    ? relatorioAuditoria.problemas 
    : relatorioAuditoria.problemas.filter(p => p.categoria === filtroCategoria);

  const porcentagemSaude = Math.max(0, 100 - (relatorioAuditoria.problemasCriticos * 10 + relatorioAuditoria.problemasAltos * 5));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h1>
          <p className="text-muted-foreground">
            Análise completa dos dados e consistência do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportarRelatorio('csv')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportarRelatorio('json')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saúde do Sistema</CardTitle>
            <div className="flex items-center gap-1">
              {porcentagemSaude > 80 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : porcentagemSaude > 60 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{porcentagemSaude.toFixed(0)}%</div>
            <Progress value={porcentagemSaude} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Problemas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioAuditoria.totalProblemas}</div>
            <p className="text-xs text-muted-foreground">
              {relatorioAuditoria.problemasCriticos} críticos • {relatorioAuditoria.problemasAltos} altos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Totais</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {relatorioAuditoria.estatisticas.valorTotalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Despesas: R$ {relatorioAuditoria.estatisticas.valorTotalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioAuditoria.estatisticas.totalAgendamentos}</div>
            <p className="text-xs text-muted-foreground">
              {relatorioAuditoria.estatisticas.agendamentosAtivos} ativos • {relatorioAuditoria.estatisticas.agendamentosConcluidos} concluídos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {relatorioAuditoria.problemasCriticos > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Problemas Críticos Detectados!</AlertTitle>
          <AlertDescription>
            Foram encontrados {relatorioAuditoria.problemasCriticos} problemas críticos que precisam de atenção imediata.
            Verifique a aba "Problemas" para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="problemas" className="w-full">
        <TabsList>
          <TabsTrigger value="problemas">Problemas</TabsTrigger>
          <TabsTrigger value="resolver">
            <Settings className="h-4 w-4 mr-1" />
            Resolver
          </TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="problemas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Problemas Detectados</CardTitle>
                  <CardDescription>
                    Lista completa de inconsistências e problemas encontrados
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filtroCategoria === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroCategoria('todos')}
                  >
                    Todos ({relatorioAuditoria.totalProblemas})
                  </Button>
                  <Button
                    variant={filtroCategoria === 'critico' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroCategoria('critico')}
                  >
                    Críticos ({relatorioAuditoria.problemasCriticos})
                  </Button>
                  <Button
                    variant={filtroCategoria === 'alto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFiltroCategoria('alto')}
                  >
                    Altos ({relatorioAuditoria.problemasAltos})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {problemasFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Nenhum problema encontrado!</h3>
                    <p className="text-muted-foreground">
                      {filtroCategoria === 'todos' 
                        ? 'Todos os dados estão consistentes.' 
                        : `Nenhum problema da categoria "${filtroCategoria}" foi encontrado.`
                      }
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Sugestão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problemasFiltrados.map((problema) => {
                        const IconeCategoria = categoriaIcones[problema.categoria];
                        return (
                          <TableRow key={problema.id}>
                            <TableCell>
                              <Badge variant={categoriaCores[problema.categoria]} className="flex items-center gap-1 w-fit">
                                <IconeCategoria className="h-3 w-3" />
                                {problema.categoria.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{problema.tipo}</TableCell>
                            <TableCell>{problema.descricao}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{problema.entidade}</div>
                                <div className="text-muted-foreground">ID: {problema.entidadeId}</div>
                                {problema.campo && (
                                  <div className="text-xs text-muted-foreground">Campo: {problema.campo}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {problema.sugestao}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolver" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolver Problemas</CardTitle>
              <CardDescription>
                Ferramentas para resolver problemas detectados na auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResolverRetornos />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatorioAuditoria.estatisticas.totalClientes}</div>
                <p className="text-xs text-muted-foreground">
                  {relatorioAuditoria.estatisticas.clientesInativos} inativos (&gt;30 dias)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatorioAuditoria.estatisticas.totalServicos}</div>
                <p className="text-xs text-muted-foreground">
                  {relatorioAuditoria.estatisticas.servicosNuncaUsados} nunca utilizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lançamentos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatorioAuditoria.estatisticas.totalLancamentos}</div>
                <p className="text-xs text-muted-foreground">
                  Receitas vs Despesas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cronogramas</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{relatorioAuditoria.estatisticas.totalCronogramas}</div>
                <p className="text-xs text-muted-foreground">
                  {relatorioAuditoria.estatisticas.totalRetornos} retornos cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {relatorioAuditoria.estatisticas.totalAgendamentos > 0 
                    ? ((relatorioAuditoria.estatisticas.agendamentosCancelados / relatorioAuditoria.estatisticas.totalAgendamentos) * 100).toFixed(1)
                    : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  {relatorioAuditoria.estatisticas.agendamentosCancelados} de {relatorioAuditoria.estatisticas.totalAgendamentos} agendamentos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {(relatorioAuditoria.estatisticas.valorTotalReceitas - relatorioAuditoria.estatisticas.valorTotalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receitas - Despesas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sugestoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões de Melhorias</CardTitle>
              <CardDescription>
                Recomendações para otimizar o funcionamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatorioAuditoria.sugestoesMelhorias.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Sistema funcionando perfeitamente!</h3>
                    <p className="text-muted-foreground">
                      Não há sugestões de melhorias no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatorioAuditoria.sugestoesMelhorias.map((sugestao, index) => (
                      <Alert key={index}>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>{sugestao}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p><strong>Data de Execução:</strong> {new Date(relatorioAuditoria.dataExecucao).toLocaleString('pt-BR')}</p>
            <p><strong>Dados Analisados:</strong> {relatorioAuditoria.estatisticas.totalClientes} clientes, {relatorioAuditoria.estatisticas.totalServicos} serviços, {relatorioAuditoria.estatisticas.totalAgendamentos} agendamentos, {relatorioAuditoria.estatisticas.totalLancamentos} lançamentos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}