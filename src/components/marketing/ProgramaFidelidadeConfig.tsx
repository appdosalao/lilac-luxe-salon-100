import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { useSupabaseFidelidade } from '@/hooks/useSupabaseFidelidade';
import type { ProgramaFidelidadeFormData } from '@/types/fidelidade';

export const ProgramaFidelidadeConfig = () => {
  const { programa, loading, salvarPrograma, togglePrograma } = useSupabaseFidelidade();
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState<ProgramaFidelidadeFormData>({
    nome: programa?.nome || 'Programa de Fidelidade',
    pontos_por_real: programa?.pontos_por_real || 0.1,
    expiracao_pontos_dias: programa?.expiracao_pontos_dias || 365
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sucesso = await salvarPrograma(formData);
    if (sucesso) {
      setEditando(false);
    }
  };

  const handleEdit = () => {
    if (programa) {
      setFormData({
        nome: programa.nome,
        pontos_por_real: programa.pontos_por_real,
        expiracao_pontos_dias: programa.expiracao_pontos_dias
      });
    }
    setEditando(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Configurações do Programa</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            {programa && (
              <div className="flex items-center gap-2">
                <Label htmlFor="programa-ativo">Ativo</Label>
                <Switch
                  id="programa-ativo"
                  checked={programa.ativo}
                  onCheckedChange={togglePrograma}
                />
              </div>
            )}
            {!editando && programa && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Editar
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          Configure as regras do seu programa de fidelidade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!programa && !editando ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Você ainda não configurou seu programa de fidelidade
            </p>
            <Button onClick={handleEdit}>
              Criar Programa
            </Button>
          </div>
        ) : editando ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Programa</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Clube VIP, Fidelidade Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pontos_por_real">
                Pontos por Real Gasto
              </Label>
              <Input
                id="pontos_por_real"
                type="number"
                step="0.01"
                min="0"
                value={formData.pontos_por_real}
                onChange={(e) => setFormData({ ...formData, pontos_por_real: parseFloat(e.target.value) })}
                required
              />
              <p className="text-sm text-muted-foreground">
                {formData.pontos_por_real > 0 && 
                  `Clientes ganharão ${(formData.pontos_por_real * 100).toFixed(0)} pontos a cada R$ 100,00 gastos`
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiracao">Validade dos Pontos (dias)</Label>
              <Input
                id="expiracao"
                type="number"
                min="0"
                value={formData.expiracao_pontos_dias}
                onChange={(e) => setFormData({ ...formData, expiracao_pontos_dias: parseInt(e.target.value) })}
                required
              />
              <p className="text-sm text-muted-foreground">
                {formData.expiracao_pontos_dias === 0 
                  ? 'Pontos não expiram' 
                  : `Pontos expiram após ${formData.expiracao_pontos_dias} dias`
                }
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              {programa && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="grid gap-4">
            <div>
              <Label className="text-muted-foreground">Nome</Label>
              <p className="text-lg font-medium">{programa?.nome}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Pontos por Real</Label>
              <p className="text-lg font-medium">
                {(programa!.pontos_por_real * 100).toFixed(0)} pontos / R$ 100
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Validade</Label>
              <p className="text-lg font-medium">
                {programa!.expiracao_pontos_dias === 0 
                  ? 'Pontos não expiram' 
                  : `${programa!.expiracao_pontos_dias} dias`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
