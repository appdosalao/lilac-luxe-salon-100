import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ShoppingCart, Search, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { useSupabaseCompras } from "@/hooks/useSupabaseCompras";
import { useSupabaseVendas } from "@/hooks/useSupabaseVendas";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type MovimentacaoTipo = 'compra' | 'venda';

interface Movimentacao {
  id: string;
  tipo: MovimentacaoTipo;
  data: string;
  valor: number;
  descricao: string;
  status?: string;
  itens?: number;
}

export default function MovimentacoesProdutos() {
  const { isMobile } = useBreakpoint();
  const { compras, loading: loadingCompras } = useSupabaseCompras();
  const { vendas, loading: loadingVendas } = useSupabaseVendas();
  
  const [filtroTipo, setFiltroTipo] = useState<'todos' | MovimentacaoTipo>('todos');
  const [busca, setBusca] = useState('');

  const movimentacoes = useMemo<Movimentacao[]>(() => {
    const movs: Movimentacao[] = [];

    // Adicionar compras
    compras.forEach(compra => {
      movs.push({
        id: compra.id,
        tipo: 'compra',
        data: compra.data_compra,
        valor: compra.valor_total,
        descricao: `Compra ${compra.numero_nota ? `- Nota ${compra.numero_nota}` : ''}`,
        status: compra.status_pagamento || 'pendente',
        itens: compra.itens_compra?.length || 0,
      });
    });

    // Adicionar vendas
    vendas.forEach(venda => {
      movs.push({
        id: venda.id,
        tipo: 'venda',
        data: venda.data_venda,
        valor: venda.valor_total,
        descricao: 'Venda de produtos',
        status: venda.status_pagamento || 'pago',
        itens: venda.itens_venda?.length || 0,
      });
    });

    return movs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [compras, vendas]);

  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(mov => {
      const matchTipo = filtroTipo === 'todos' || mov.tipo === filtroTipo;
      const matchBusca = mov.descricao.toLowerCase().includes(busca.toLowerCase());
      return matchTipo && matchBusca;
    });
  }, [movimentacoes, filtroTipo, busca]);

  const totais = useMemo(() => {
    const totalCompras = movimentacoes
      .filter(m => m.tipo === 'compra')
      .reduce((sum, m) => sum + m.valor, 0);
    
    const totalVendas = movimentacoes
      .filter(m => m.tipo === 'venda')
      .reduce((sum, m) => sum + m.valor, 0);

    return {
      compras: totalCompras,
      vendas: totalVendas,
      lucro: totalVendas - totalCompras,
    };
  }, [movimentacoes]);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pago':
        return 'bg-success text-success-foreground';
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'pago_parcial':
        return 'bg-primary text-primary-foreground';
      case 'vencido':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'pago_parcial':
        return 'Parcial';
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  };

  if (loadingCompras || loadingVendas) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-responsive-lg">
      {/* Cards de Resumo */}
      <div className="grid-responsive-3">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-responsive-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive flex-shrink-0">
              <ShoppingCart className="h-6 w-6 text-destructive-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-responsive-lg font-bold text-destructive truncate">
                {formatarValor(totais.compras)}
              </p>
              <p className="text-responsive-sm text-muted-foreground">Total em Compras</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-responsive-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success flex-shrink-0">
              <Package className="h-6 w-6 text-success-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-responsive-lg font-bold text-success truncate">
                {formatarValor(totais.vendas)}
              </p>
              <p className="text-responsive-sm text-muted-foreground">Total em Vendas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-center gap-4 p-responsive-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
              totais.lucro >= 0 ? 'bg-primary' : 'bg-destructive'
            }`}>
              {totais.lucro >= 0 ? (
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              ) : (
                <TrendingDown className="h-6 w-6 text-destructive-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-responsive-lg font-bold truncate ${
                totais.lucro >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {formatarValor(totais.lucro)}
              </p>
              <p className="text-responsive-sm text-muted-foreground">Margem de Lucro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-responsive-sm">
          <div className="flex-responsive flex-responsive-row-sm gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimentação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as any)}>
              <SelectTrigger className="w-full sm:w-[200px] h-12">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="compra">Compras</SelectItem>
                <SelectItem value="venda">Vendas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimentações */}
      <div className="space-responsive-md">
        {movimentacoesFiltradas.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-responsive-lg text-center">
              <p className="text-muted-foreground">Nenhuma movimentação encontrada</p>
            </CardContent>
          </Card>
        ) : (
          movimentacoesFiltradas.map((mov) => (
            <Card key={mov.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-responsive-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${
                      mov.tipo === 'compra' ? 'bg-destructive' : 'bg-success'
                    }`}>
                      {mov.tipo === 'compra' ? (
                        <ShoppingCart className="h-5 w-5 text-destructive-foreground" />
                      ) : (
                        <Package className="h-5 w-5 text-success-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {mov.descricao}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(mov.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <p className={`font-bold text-lg whitespace-nowrap ${
                          mov.tipo === 'compra' ? 'text-destructive' : 'text-success'
                        }`}>
                          {mov.tipo === 'compra' ? '- ' : '+ '}
                          {formatarValor(mov.valor)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">
                          {mov.tipo === 'compra' ? 'Compra' : 'Venda'}
                        </Badge>
                        {mov.status && (
                          <Badge className={getStatusColor(mov.status)}>
                            {getStatusLabel(mov.status)}
                          </Badge>
                        )}
                        {mov.itens && mov.itens > 0 && (
                          <Badge variant="secondary">
                            {mov.itens} {mov.itens === 1 ? 'item' : 'itens'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
