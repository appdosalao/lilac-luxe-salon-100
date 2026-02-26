import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle, Search, Filter, ExternalLink, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

interface ProblemaAuditoria {
  id: string;
  categoria: 'critico' | 'alto' | 'medio' | 'baixo';
  tipo: string;
  descricao: string;
  entidade: string;
  entidadeId: string;
  campo?: string;
  valorAtual?: any;
  valorEsperado?: any;
  sugestao?: string;
}

interface AuditoriaProblemasTableProps {
  problemas: ProblemaAuditoria[];
  onResolverLote?: (selecionados: ProblemaAuditoria[]) => Promise<void> | void;
  unresolvedKeys?: Set<string>;
}

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

const entidadeRoutes: Record<string, string> = {
  cliente: '/clientes',
  servico: '/servicos',
  agendamento: '/agendamentos',
  lancamento: '/financeiro',
  retorno: '/cronogramas',
  cronograma: '/cronogramas'
};

export function AuditoriaProblemasTable({ problemas, onResolverLote, unresolvedKeys }: AuditoriaProblemasTableProps) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [filtrosCategorias, setFiltrosCategorias] = useState<string[]>([]);
  const [filtrosEntidades, setFiltrosEntidades] = useState<string[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [apenasNaoResolvidos, setApenasNaoResolvidos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina] = useState(20);

  const categoriasDisponiveis = useMemo(() => [...new Set(problemas.map(p => p.categoria))], [problemas]);
  const entidadesDisponiveis = useMemo(() => [...new Set(problemas.map(p => p.entidade))], [problemas]);

  const problemasFiltrados = useMemo(() => {
    return problemas.filter(problema => {
      const textoBusca = busca.toLowerCase();
      const matchBusca =
        busca === '' ||
        problema.descricao.toLowerCase().includes(textoBusca) ||
        problema.tipo.toLowerCase().includes(textoBusca) ||
        problema.entidade.toLowerCase().includes(textoBusca) ||
        (problema.sugestao?.toLowerCase().includes(textoBusca));
      const matchCategoria = filtrosCategorias.length === 0 || filtrosCategorias.includes(problema.categoria);
      const matchEntidade = filtrosEntidades.length === 0 || filtrosEntidades.includes(problema.entidade);
      const key = `${problema.tipo}|${problema.entidade}|${problema.entidadeId}`;
      const matchNaoResolvido = !apenasNaoResolvidos || (unresolvedKeys ? unresolvedKeys.has(key) : true);
      return matchBusca && matchCategoria && matchEntidade && matchNaoResolvido;
    });
  }, [problemas, busca, filtrosCategorias, filtrosEntidades, apenasNaoResolvidos, unresolvedKeys]);

  const totalPaginas = Math.max(1, Math.ceil(problemasFiltrados.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const fim = inicio + porPagina;
  const paginaProblemas = problemasFiltrados.slice(inicio, fim);

  const irParaPagina = (p: number) => setPagina(Math.min(Math.max(1, p), totalPaginas));

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const toggleSelecionarTodos = () => {
    setSelecionados(prev => {
      if (prev.size === problemasFiltrados.length) return new Set();
      return new Set(problemasFiltrados.map(p => p.id));
    });
  };

  const contagemPorCategoria = useMemo(
    () => ({
      critico: problemas.filter(p => p.categoria === 'critico').length,
      alto: problemas.filter(p => p.categoria === 'alto').length,
      medio: problemas.filter(p => p.categoria === 'medio').length,
      baixo: problemas.filter(p => p.categoria === 'baixo').length
    }),
    [problemas]
  );

  const toggleFiltroCategoria = (categoria: string) => {
    setFiltrosCategorias(prev => (prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]));
  };

  const toggleFiltroEntidade = (entidade: string) => {
    setFiltrosEntidades(prev => (prev.includes(entidade) ? prev.filter(e => e !== entidade) : [...prev, entidade]));
  };

  const irParaEntidade = (entidade: string) => {
    const route = entidadeRoutes[entidade];
    if (route) navigate(route);
  };

  if (problemas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold">Sistema 100% Saudável!</h3>
          <p className="text-muted-foreground text-center mt-2 max-w-md">Nenhum problema foi detectado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Problemas Detectados</CardTitle>
            <CardDescription>
              {problemasFiltrados.length} de {problemas.length} problemas
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {contagemPorCategoria.critico > 0 && (
              <Button
                variant={filtrosCategorias.includes('critico') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleFiltroCategoria('critico')}
                className="gap-1"
              >
                <XCircle className="h-3 w-3" />
                Críticos ({contagemPorCategoria.critico})
              </Button>
            )}
            {contagemPorCategoria.alto > 0 && (
              <Button
                variant={filtrosCategorias.includes('alto') ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleFiltroCategoria('alto')}
                className="gap-1"
              >
                <AlertTriangle className="h-3 w-3" />
                Altos ({contagemPorCategoria.alto})
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar problemas..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-semibold">Entidades</div>
              {entidadesDisponiveis.map(entidade => (
                <DropdownMenuCheckboxItem
                  key={entidade}
                  checked={filtrosEntidades.includes(entidade)}
                  onCheckedChange={() => toggleFiltroEntidade(entidade)}
                  className="capitalize"
                >
                  {entidade}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selecionados.size === problemasFiltrados.length && problemasFiltrados.length > 0}
              onCheckedChange={toggleSelecionarTodos}
            />
            <span className="text-sm text-muted-foreground">
              Selecionados {selecionados.size}/{problemasFiltrados.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {unresolvedKeys && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={apenasNaoResolvidos} onCheckedChange={v => setApenasNaoResolvidos(Boolean(v))} />
                Somente não resolvidos
              </label>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!onResolverLote || selecionados.size === 0}
              onClick={async () => {
                const ok = window.confirm(`Marcar ${selecionados.size} problema(s) como resolvidos?`);
                if (!ok) return;
                if (!onResolverLote) return;
                const items = problemasFiltrados.filter(p => selecionados.has(p.id));
                await onResolverLote(items);
                setSelecionados(new Set());
              }}
            >
              Marcar como resolvidos
            </Button>
          </div>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[36px]"></TableHead>
                <TableHead className="w-[100px]">Prioridade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden lg:table-cell">Sugestão</TableHead>
                <TableHead className="w-[84px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginaProblemas.map(problema => {
                const IconeCategoria = categoriaIcones[problema.categoria];
                const key = `${problema.tipo}|${problema.entidade}|${problema.entidadeId}`;
                const resolvido = unresolvedKeys ? !unresolvedKeys.has(key) : false;
                return (
                  <TableRow key={problema.id} className="group hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selecionados.has(problema.id)}
                        onCheckedChange={() => toggleSelecionado(problema.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoriaCores[problema.categoria]} className="flex items-center gap-1 w-fit">
                        <IconeCategoria className="h-3 w-3" />
                        <span className="hidden sm:inline">{problema.categoria.toUpperCase()}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{problema.tipo.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {problema.descricao}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="capitalize text-sm font-medium">{problema.entidade}</span>
                        <span className="text-xs text-muted-foreground font-mono">{problema.entidadeId.slice(0, 8)}...</span>
                        {resolvido && (
                          <span className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground mt-1">
                            Resolvido
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-xs truncate">
                      {problema.sugestao}
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => irParaEntidade(problema.entidade)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ir para a entidade"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {onResolverLote && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await onResolverLote([problema]);
                            setSelecionados(prev => {
                              const novo = new Set(prev);
                              novo.delete(problema.id);
                              return novo;
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Marcar resolvido"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="text-muted-foreground">
            Exibindo {problemasFiltrados.length === 0 ? 0 : inicio + 1}-{Math.min(fim, problemasFiltrados.length)} de{' '}
            {problemasFiltrados.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => irParaPagina(pagina - 1)} disabled={pagina <= 1}>
              Anterior
            </Button>
            <span className="text-muted-foreground">
              Página {pagina} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => irParaPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
            >
              Próxima
            </Button>
          </div>
        </div>
        {problemasFiltrados.length === 0 && problemas.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum problema encontrado com os filtros atuais.
            <Button
              variant="link"
              onClick={() => {
                setBusca('');
                setFiltrosCategorias([]);
                setFiltrosEntidades([]);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
