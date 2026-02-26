import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, AlertTriangle, Search, Filter, PackagePlus, PackageMinus } from 'lucide-react';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { Badge } from '@/components/ui/badge';
import { ProdutoForm } from './ProdutoForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProdutosList() {
  const { produtos, loading, deleteProduto, movimentarEstoque } = useSupabaseProdutos();
  const [editingProduto, setEditingProduto] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'uso_profissional' | 'revenda' | 'consumo'>('todos');
  const [somenteBaixoEstoque, setSomenteBaixoEstoque] = useState(false);

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Desativar o produto "${nome}"? Ele ficará oculto mas o histórico será preservado.`)) {
      await deleteProduto(id);
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels = {
      uso_profissional: 'Uso Profissional',
      revenda: 'Revenda',
      consumo: 'Consumo',
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  const produtosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase().trim();
    return produtos.filter(p => {
      const matchBusca = !texto || p.nome.toLowerCase().includes(texto) || (p.codigo_barras || '').toLowerCase().includes(texto);
      const matchTipo = filtroTipo === 'todos' || p.categoria === filtroTipo;
      const matchEstoque = !somenteBaixoEstoque || p.estoque_atual <= p.estoque_minimo;
      return matchBusca && matchTipo && matchEstoque;
    });
  }, [produtos, busca, filtroTipo, somenteBaixoEstoque]);

  const ajustarEstoque = async (produto: any, tipo: 'entrada' | 'saida') => {
    const qtdStr = prompt(`Quantidade para ${tipo === 'entrada' ? 'entrada' : 'saída'} de "${produto.nome}":`, '1');
    if (!qtdStr) return;
    const quantidade = Number(qtdStr);
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert('Quantidade inválida');
      return;
    }
    const motivo = prompt('Motivo (opcional):', '') || undefined;
    await movimentarEstoque({ produto_id: produto.id, tipo, quantidade, motivo });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Produtos</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroTipo} onValueChange={(v: any) => setFiltroTipo(v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="uso_profissional">Uso Profissional</SelectItem>
              <SelectItem value="revenda">Revenda</SelectItem>
              <SelectItem value="consumo">Consumo</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={somenteBaixoEstoque ? 'default' : 'outline'}
            onClick={() => setSomenteBaixoEstoque(v => !v)}
            className="gap-2"
            title="Apenas com estoque abaixo do mínimo"
          >
            <Filter className="h-4 w-4" />
            Baixo estoque
          </Button>
          <Button onClick={() => {
            setEditingProduto(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-6">
          <ProdutoForm
            produto={editingProduto}
            onSuccess={() => {
              setShowForm(false);
              setEditingProduto(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProduto(null);
            }}
          />
        </Card>
      )}

      <div className="grid gap-3 sm:gap-4">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className="p-4 sm:p-5 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="text-base sm:text-lg font-semibold">{produto.nome}</h3>
                  <Badge variant={produto.ativo ? 'default' : 'secondary'} className="text-xs h-5">
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline" className="text-xs h-5">{getCategoriaLabel(produto.categoria)}</Badge>
                  {produto.estoque_atual <= produto.estoque_minimo && (
                    <Badge variant="destructive" className="flex items-center gap-1 text-xs h-5">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="hidden xs:inline">Estoque Baixo</span>
                      <span className="xs:hidden">Baixo</span>
                    </Badge>
                  )}
                </div>
                
                {produto.descricao && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">{produto.descricao}</p>
                )}
                
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-muted-foreground">Estoque:</span>
                    <span className="font-medium">{produto.estoque_atual} {produto.unidade_medida}</span>
                    {produto.estoque_atual <= produto.estoque_minimo && (
                      <span className="text-[11px] text-destructive">Mínimo: {produto.estoque_minimo}</span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-muted-foreground">Mínimo:</span>
                    <span className="font-medium">{produto.estoque_minimo} {produto.unidade_medida}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="font-medium">R$ {Number(produto.preco_custo).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="text-muted-foreground">Venda:</span>
                    <span className="font-medium">R$ {Number(produto.preco_venda).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ajustarEstoque(produto, 'entrada')}
                  className="flex-1 sm:flex-none h-10 btn-touch"
                  title="Entrada de estoque"
                >
                  <PackagePlus className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Entrada</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => ajustarEstoque(produto, 'saida')}
                  className="flex-1 sm:flex-none h-10 btn-touch"
                  title="Saída de estoque"
                >
                  <PackageMinus className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Saída</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProduto(produto);
                    setShowForm(true);
                  }}
                  className="flex-1 sm:flex-none h-10 btn-touch"
                >
                  <Pencil className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(produto.id, produto.nome)}
                  className="flex-1 sm:flex-none h-10 btn-touch hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Desativar</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {produtosFiltrados.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum produto encontrado.
          </Card>
        )}
      </div>
    </div>
  );
}
