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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Recompensas</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editandoId ? 'Editar Recompensa' : 'Nova Recompensa'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma recompensa para seus clientes fiéis
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="nome">Nome da Recompensa</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: 10% de desconto"
                      required
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Detalhes da recompensa..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pontos">Pontos Necessários</Label>
                    <Input
                      id="pontos"
                      type="number"
                      min="0"
                      value={formData.pontos_necessarios}
                      onChange={(e) => setFormData({ ...formData, pontos_necessarios: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desconto_percentual">Desconto %</SelectItem>
                        <SelectItem value="desconto_valor">Desconto R$</SelectItem>
                        <SelectItem value="servico_gratis">Serviço Grátis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor do Desconto</Label>
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step={formData.tipo === 'desconto_percentual' ? '1' : '0.01'}
                      value={formData.valor_desconto}
                      onChange={(e) => setFormData({ ...formData, valor_desconto: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classe">Classe Exclusiva</Label>
                    <Select
                      value={formData.classe_id || 'todas'}
                      onValueChange={(value) => setFormData({ ...formData, classe_id: value === 'todas' ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as classes</SelectItem>
                        {classes.map((classe) => (
                          <SelectItem key={classe.id} value={classe.id}>
                            {classe.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Restrinja esta recompensa a uma classe específica
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validade">Validade (dias)</Label>
                    <Input
                      id="validade"
                      type="number"
                      min="1"
                      value={formData.validade_dias}
                      onChange={(e) => setFormData({ ...formData, validade_dias: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {editandoId ? 'Atualizar' : 'Criar'} Recompensa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Configure recompensas que seus clientes podem resgatar com pontos
        </CardDescription>
      </CardHeader>

      <CardContent>
        {recompensas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma recompensa cadastrada. Crie recompensas para incentivar seus clientes.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pontos</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recompensas.map((recompensa) => (
                <TableRow key={recompensa.id}>
                  <TableCell className="font-medium">{recompensa.nome}</TableCell>
                  <TableCell>{getTipoLabel(recompensa.tipo)}</TableCell>
                  <TableCell>{recompensa.pontos_necessarios} pts</TableCell>
                  <TableCell>
                    {recompensa.tipo === 'desconto_percentual'
                      ? `${recompensa.valor_desconto}%`
                      : recompensa.tipo === 'desconto_valor'
                      ? `R$ ${recompensa.valor_desconto.toFixed(2)}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getClasseNome(recompensa.classe_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={recompensa.ativo ? 'default' : 'secondary'}>
                      {recompensa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(recompensa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
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
        )}
      </CardContent>
    </Card>
  );
};
