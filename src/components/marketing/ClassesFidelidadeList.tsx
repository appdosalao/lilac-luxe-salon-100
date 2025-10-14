import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import type { ClasseFidelidadeFormData } from '@/types/fidelidade';

export const ClassesFidelidadeList = () => {
  const { classes, loading, criarClasse, atualizarClasse, excluirClasse } = useSupabaseFidelidade();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClasseFidelidadeFormData>({
    nome: '',
    pontos_minimos: 0,
    cor: '#94a3b8',
    beneficios: '',
    ordem: classes.length
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      pontos_minimos: 0,
      cor: '#94a3b8',
      beneficios: '',
      ordem: classes.length
    });
    setEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sucesso = editando 
      ? await atualizarClasse(editando, formData)
      : await criarClasse(formData);
    
    if (sucesso) {
      setDialogAberto(false);
      resetForm();
    }
  };

  const handleEdit = (classe: any) => {
    setFormData({
      nome: classe.nome,
      pontos_minimos: classe.pontos_minimos,
      cor: classe.cor,
      beneficios: classe.beneficios || '',
      ordem: classe.ordem
    });
    setEditando(classe.id);
    setDialogAberto(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta classe?')) {
      await excluirClasse(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Classes de Fidelidade</CardTitle>
          </div>
          <Dialog open={dialogAberto} onOpenChange={(open) => {
            setDialogAberto(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Classe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editando ? 'Editar Classe' : 'Nova Classe'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Classe</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Bronze, Prata, Ouro, Platina"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pontos_minimos">Pontos Mínimos</Label>
                  <Input
                    id="pontos_minimos"
                    type="number"
                    min="0"
                    value={formData.pontos_minimos}
                    onChange={(e) => setFormData({ ...formData, pontos_minimos: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Pontos necessários para alcançar esta classe
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cor"
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="#94a3b8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficios">Benefícios</Label>
                  <Textarea
                    id="beneficios"
                    value={formData.beneficios}
                    onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                    placeholder="Descreva os benefícios desta classe..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    min="0"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Menor número aparece primeiro
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {editando ? 'Atualizar' : 'Criar'} Classe
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Configure as classes/níveis do seu programa de fidelidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma classe configurada. Crie classes para organizar seus clientes por nível de fidelidade.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Pontos Mínimos</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Benefícios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classe) => (
                <TableRow key={classe.id}>
                  <TableCell>{classe.ordem}</TableCell>
                  <TableCell className="font-medium">{classe.nome}</TableCell>
                  <TableCell>{classe.pontos_minimos} pts</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: classe.cor }}
                      />
                      <span className="text-sm">{classe.cor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {classe.beneficios || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(classe)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(classe.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
