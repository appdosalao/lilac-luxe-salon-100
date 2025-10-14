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
import { Gift, Plus, Pencil, Trash2 } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import type { RecompensaFormData } from '@/types/fidelidade';

export const RecompensasList = () => {
  const { recompensas, loading, criarRecompensa, atualizarRecompensa, excluirRecompensa } = useSupabaseFidelidade();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RecompensaFormData>({
    nome: '',
    descricao: '',
    pontos_necessarios: 0,
    tipo: 'desconto_percentual',
    valor_desconto: 0,
    validade_dias: 30
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      pontos_necessarios: 0,
      tipo: 'desconto_percentual',
      valor_desconto: 0,
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Recompensa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editandoId ? 'Editar Recompensa' : 'Nova Recompensa'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma recompensa que os clientes podem resgatar com pontos
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Recompensa</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: 10% de desconto"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Detalhes da recompensa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pontos">Pontos Necessários</Label>
                    <Input
                      id="pontos"
                      type="number"
                      min="1"
                      value={formData.pontos_necessarios}
                      onChange={(e) => setFormData({ ...formData, pontos_necessarios: parseInt(e.target.value) })}
                      required
                    />
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

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Recompensa</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desconto_percentual">Desconto Percentual (%)</SelectItem>
                      <SelectItem value="desconto_valor">Desconto em Valor (R$)</SelectItem>
                      <SelectItem value="servico_gratis">Serviço Grátis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo !== 'servico_gratis' && (
                  <div className="space-y-2">
                    <Label htmlFor="valor">
                      {formData.tipo === 'desconto_percentual' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                    </Label>
                    <Input
                      id="valor"
                      type="number"
                      step={formData.tipo === 'desconto_percentual' ? '1' : '0.01'}
                      min="0"
                      max={formData.tipo === 'desconto_percentual' ? '100' : undefined}
                      value={formData.valor_desconto}
                      onChange={(e) => setFormData({ ...formData, valor_desconto: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {editandoId ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Configure as recompensas disponíveis para resgate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recompensas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma recompensa cadastrada ainda
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recompensa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Pontos</TableHead>
                <TableHead className="text-center">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recompensas.map((recompensa) => (
                <TableRow key={recompensa.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{recompensa.nome}</div>
                      {recompensa.descricao && (
                        <div className="text-sm text-muted-foreground">
                          {recompensa.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTipoLabel(recompensa.tipo)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {recompensa.pontos_necessarios} pts
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {recompensa.tipo === 'desconto_percentual' && `${recompensa.valor_desconto}%`}
                    {recompensa.tipo === 'desconto_valor' && `R$ ${recompensa.valor_desconto.toFixed(2)}`}
                    {recompensa.tipo === 'servico_gratis' && '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={recompensa.ativo ? 'default' : 'secondary'}>
                      {recompensa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(recompensa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(recompensa.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
