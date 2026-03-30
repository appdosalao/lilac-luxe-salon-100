import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Plus, Pencil, Trash2 } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import type { RecompensaFormData } from '@/types/fidelidade';

export const RecompensasList = () => {
  const { recompensas, classes, loading, criarRecompensa, atualizarRecompensa, excluirRecompensa } = useSupabaseFidelidade();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecompensaFormData>({
    nome: '',
    descricao: '',
    pontos_necessarios: 0,
    tipo: 'desconto_percentual',
    valor_desconto: 0,
    classe_id: undefined,
    validade_dias: 30
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      pontos_necessarios: 0,
      tipo: 'desconto_percentual',
      valor_desconto: 0,
      classe_id: undefined,
      validade_dias: 30
    });
    setEditandoId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editandoId) {
      await atualizarRecompensa(editandoId, formData);
    } else {
      await criarRecompensa(formData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (recompensa: any) => {
    setFormData({
      nome: recompensa.nome,
      descricao: recompensa.descricao || '',
      pontos_necessarios: recompensa.pontos_necessarios,
      tipo: recompensa.tipo,
      valor_desconto: recompensa.valor_desconto,
      classe_id: recompensa.classe_id,
      validade_dias: recompensa.validade_dias
    });
    setEditandoId(recompensa.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta recompensa?')) {
      await excluirRecompensa(id);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      desconto_percentual: 'Desconto %',
      desconto_valor: 'Desconto R$',
      servico_gratis: 'Serviço Grátis'
    };
    return tipos[tipo] || tipo;
  };

  const getClasseNome = (classeId?: string) => {
    if (!classeId) return 'Todas';
    const classe = classes.find(c => c.id === classeId);
    return classe?.nome || 'Todas';
  };

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Catálogo de Recompensas</CardTitle>
              <CardDescription>
                Gerencie as recompensas disponíveis para resgate de pontos
              </CardDescription>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-bold px-6 shadow-md hover:shadow-lg transition-all">
                <Plus className="h-5 w-5 mr-2" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden border-none">
              <DialogHeader className="p-6 bg-muted/50">
                <DialogTitle className="text-2xl font-extrabold tracking-tight">
                  {editandoId ? 'Editar Recompensa' : 'Nova Recompensa'}
                </DialogTitle>
                <DialogDescription className="font-medium">
                  Preencha os dados abaixo para configurar a recompensa
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="nome" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome da Recompensa</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: 10% de desconto no corte"
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="descricao" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Descrição Detalhada</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva o que o cliente ganha com esta recompensa..."
                      rows={2}
                      className="rounded-xl resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pontos" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Custo em Pontos</Label>
                    <Input
                      id="pontos"
                      type="number"
                      min="0"
                      value={formData.pontos_necessarios}
                      onChange={(e) => setFormData({ ...formData, pontos_necessarios: parseInt(e.target.value) })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tipo de Benefício</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desconto_percentual">Desconto Percentual (%)</SelectItem>
                        <SelectItem value="desconto_valor">Desconto em Valor (R$)</SelectItem>
                        <SelectItem value="servico_gratis">Serviço Gratuito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Valor do Benefício</Label>
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step={formData.tipo === 'desconto_percentual' ? '1' : '0.01'}
                      value={formData.valor_desconto}
                      onChange={(e) => setFormData({ ...formData, valor_desconto: parseFloat(e.target.value) })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classe" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Exclusividade</Label>
                    <Select
                      value={formData.classe_id || 'todas'}
                      onValueChange={(value) => setFormData({ ...formData, classe_id: value === 'todas' ? undefined : value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Todas as classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Disponível para Todos</SelectItem>
                        {classes.map((classe) => (
                          <SelectItem key={classe.id} value={classe.id}>
                            Apenas {classe.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validade" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Validade após Resgate (dias)</Label>
                    <Input
                      id="validade"
                      type="number"
                      min="1"
                      value={formData.validade_dias}
                      onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl font-bold text-lg shadow-md">
                    {editandoId ? 'Atualizar Recompensa' : 'Criar Recompensa'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-12 rounded-xl font-bold">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {recompensas.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Sem recompensas no momento</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
              Crie recompensas atrativas para incentivar seus clientes a frequentarem mais seu salão.
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="rounded-xl font-bold border-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeira recompensa
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground py-4">Recompensa</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Tipo</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Custo</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Benefício</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Classe</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recompensas.map((recompensa) => (
                  <TableRow key={recompensa.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{recompensa.nome}</span>
                        {recompensa.descricao && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{recompensa.descricao}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider py-0.5 bg-background shadow-sm border-border/50">
                        {getTipoLabel(recompensa.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <Award className="h-4 w-4" />
                        <span>{recompensa.pontos_necessarios} pts</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-extrabold text-foreground">
                        {recompensa.tipo === 'desconto_percentual'
                          ? `${recompensa.valor_desconto}% OFF`
                          : recompensa.tipo === 'desconto_valor'
                          ? `R$ ${recompensa.valor_desconto.toFixed(2)}`
                          : 'GRÁTIS'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`font-bold text-[10px] uppercase tracking-wider py-0.5 shadow-sm border-border/50 ${recompensa.classe_id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                      >
                        {getClasseNome(recompensa.classe_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${recompensa.ativo ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {recompensa.ativo ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleEdit(recompensa)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(recompensa.id)}
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
