import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Níveis de Fidelidade</CardTitle>
              <CardDescription>
                Categorize seus clientes conforme o acúmulo de pontos
              </CardDescription>
            </div>
          </div>
          <Dialog open={dialogAberto} onOpenChange={(open) => {
            setDialogAberto(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold px-6 shadow-md hover:shadow-lg transition-all">
                <Plus className="h-5 w-5 mr-2" />
                Nova Classe
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl p-0 overflow-hidden border-none max-w-md">
              <DialogHeader className="p-6 bg-muted/50">
                <DialogTitle className="text-2xl font-extrabold tracking-tight">
                  {editando ? 'Editar Classe' : 'Nova Classe'}
                </DialogTitle>
                <DialogDescription className="font-medium">
                  Defina os critérios e benefícios para este nível
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome da Classe</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Bronze, Prata, Ouro, VIP"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pontos_minimos" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pontos Mínimos</Label>
                    <Input
                      id="pontos_minimos"
                      type="number"
                      min="0"
                      value={formData.pontos_minimos}
                      onChange={(e) => setFormData({ ...formData, pontos_minimos: parseInt(e.target.value) })}
                      className="h-11 rounded-xl"
                      required
                    />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                      O cliente entra nesta classe ao atingir este valor
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cor" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Identidade Visual (Cor)</Label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Input
                          id="cor"
                          type="color"
                          value={formData.cor}
                          onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                          className="w-14 h-11 p-1 rounded-xl cursor-pointer"
                        />
                      </div>
                      <Input
                        type="text"
                        value={formData.cor}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        placeholder="#94a3b8"
                        className="h-11 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficios" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Benefícios Exclusivos</Label>
                    <Textarea
                      id="beneficios"
                      value={formData.beneficios}
                      onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                      placeholder="Descreva o que este nível oferece de especial..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ordem" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Hierarquia (Ordem)</Label>
                    <Input
                      id="ordem"
                      type="number"
                      min="0"
                      value={formData.ordem}
                      onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl font-bold text-lg shadow-md">
                    {editando ? 'Atualizar Classe' : 'Criar Classe'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogAberto(false)} className="h-12 rounded-xl font-bold">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {classes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Sem classes definidas</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
              Organize seus clientes por níveis de engajamento e ofereça benefícios crescentes.
            </p>
            <Button variant="outline" onClick={() => setDialogAberto(true)} className="rounded-xl font-bold border-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira classe
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground py-4 pl-6 w-[80px]">Ordem</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Nível</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Mínimo</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Visual</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Benefícios</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classe) => (
                  <TableRow key={classe.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4 pl-6 font-extrabold text-muted-foreground">
                      #{classe.ordem}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {classe.nome}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-primary flex items-center gap-1">
                        {classe.pontos_minimos} <span className="text-[10px] uppercase">pts</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-4 rounded-full border border-border/50 shadow-sm"
                          style={{ backgroundColor: classe.cor }}
                        />
                        <span className="text-xs font-mono font-medium text-muted-foreground">{classe.cor.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        {classe.beneficios || 'Nenhum benefício listado'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleEdit(classe)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
