import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import { useSupabaseFornecedores } from '@/hooks/useSupabaseFornecedores';
import { Badge } from '@/components/ui/badge';
import { FornecedorForm } from './FornecedorForm';

export function FornecedoresList() {
  const { fornecedores, loading, deleteFornecedor } = useSupabaseFornecedores();
  const [editingFornecedor, setEditingFornecedor] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      await deleteFornecedor(id);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fornecedores</h2>
        <Button onClick={() => {
          setEditingFornecedor(null);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <FornecedorForm
            fornecedor={editingFornecedor}
            onSuccess={() => {
              setShowForm(false);
              setEditingFornecedor(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingFornecedor(null);
            }}
          />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {fornecedores.map((fornecedor) => (
          <Card key={fornecedor.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{fornecedor.nome}</h3>
                  <Badge variant={fornecedor.ativo ? 'default' : 'secondary'}>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                {fornecedor.cnpj && (
                  <p className="text-sm text-muted-foreground mb-2">CNPJ: {fornecedor.cnpj}</p>
                )}
                
                <div className="space-y-1 text-sm">
                  {fornecedor.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{fornecedor.telefone}</span>
                    </div>
                  )}
                  {fornecedor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{fornecedor.email}</span>
                    </div>
                  )}
                  {fornecedor.cidade && fornecedor.estado && (
                    <p className="text-muted-foreground">{fornecedor.cidade} - {fornecedor.estado}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingFornecedor(fornecedor);
                    setShowForm(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(fornecedor.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {fornecedores.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground col-span-2">
            Nenhum fornecedor cadastrado ainda.
          </Card>
        )}
      </div>
    </div>
  );
}
