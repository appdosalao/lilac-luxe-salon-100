import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useSupabaseCategorias } from '@/hooks/useSupabaseCategorias';
import { CategoriaForm } from './CategoriaForm';
import { CategoriasProduto, TipoCategoria } from '@/types/categoria';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function CategoriasList() {
  const { categorias, loading, deleteCategoria } = useSupabaseCategorias();
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriasProduto | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (categoria: CategoriasProduto) => {
    setEditingCategoria(categoria);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteCategoria(deletingId);
      setDeletingId(null);
    }
  };

  const getTipoLabel = (tipo: TipoCategoria) => {
    const labels: Record<TipoCategoria, string> = {
      revenda: 'Revenda',
      uso_profissional: 'Uso Profissional',
      consumo: 'Consumo',
    };
    return labels[tipo];
  };

  const getTipoBadgeVariant = (tipo: TipoCategoria) => {
    const variants: Record<TipoCategoria, 'default' | 'secondary' | 'outline'> = {
      revenda: 'default',
      uso_profissional: 'secondary',
      consumo: 'outline',
    };
    return variants[tipo];
  };

  if (loading) {
    return <div>Carregando categorias...</div>;
  }

  if (showForm) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>
        <CategoriaForm
          categoria={editingCategoria}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategoria(undefined);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingCategoria(undefined);
          }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Categorias de Produtos</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {categorias.length === 0 ? (
        <Card className="p-8 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma categoria cadastrada. Crie categorias para organizar seus produtos!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <h3 className="font-semibold">{categoria.nome}</h3>
                </div>
                {!categoria.ativo && (
                  <Badge variant="outline">Inativa</Badge>
                )}
              </div>
              
              <Badge variant={getTipoBadgeVariant(categoria.tipo)} className="mb-3">
                {getTipoLabel(categoria.tipo)}
              </Badge>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(categoria)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingId(categoria.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Os produtos associados não serão excluídos, mas perderão a referência à categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
