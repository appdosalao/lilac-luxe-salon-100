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
    expiracao_pontos_dias: programa?.expiracao_pontos_dias || 365,
    data_inicio: programa?.data_inicio || new Date().toISOString().split('T')[0]
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
        expiracao_pontos_dias: programa.expiracao_pontos_dias,
        data_inicio: programa.data_inicio
      });
    }
    setEditando(true);
  };

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Configurações do Programa</CardTitle>
              <CardDescription>
                Defina as regras e validade dos pontos para seus clientes
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {programa && (
              <div className="flex items-center gap-3 bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                <Label htmlFor="programa-ativo" className="text-sm font-semibold cursor-pointer">Status:</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${programa.ativo ? 'text-success' : 'text-destructive'}`}>
                    {programa.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    id="programa-ativo"
                    checked={programa.ativo}
                    onCheckedChange={togglePrograma}
                  />
                </div>
              </div>
            )}
            {!editando && programa && (
              <Button variant="outline" size="sm" onClick={handleEdit} className="font-semibold">
                Editar Regras
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!programa && !editando ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-muted-foreground font-medium">
                Seu salão ainda não possui um programa de fidelidade ativo. Comece agora para aumentar a retenção de seus clientes!
              </p>
              <Button onClick={handleEdit} className="rounded-xl px-8">
                Configurar Meu Primeiro Programa
              </Button>
            </div>
          </div>
        ) : editando ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Nome do Programa</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Clube VIP, Fidelidade Premium"
                  className="h-11 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos_por_real" className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  Pontos por Real Gasto
                </Label>
                <Input
                  id="pontos_por_real"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pontos_por_real}
                  onChange={(e) => setFormData({ ...formData, pontos_por_real: parseFloat(e.target.value) })}
                  className="h-11 rounded-xl"
                  required
                />
                <p className="text-xs font-medium text-primary">
                  {formData.pontos_por_real > 0 && 
                    `Simulação: R$ 100,00 gastos = ${(formData.pontos_por_real * 100).toFixed(0)} pontos`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiracao" className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Validade dos Pontos (dias)</Label>
                <Input
                  id="expiracao"
                  type="number"
                  min="0"
                  value={formData.expiracao_pontos_dias}
                  onChange={(e) => setFormData({ ...formData, expiracao_pontos_dias: parseInt(e.target.value) })}
                  className="h-11 rounded-xl"
                  required
                />
                <p className="text-xs font-medium text-muted-foreground">
                  {formData.expiracao_pontos_dias === 0 
                    ? 'Configurado para nunca expirar' 
                    : `Os pontos expirarão automaticamente após ${formData.expiracao_pontos_dias} dias`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_inicio" className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Data de Lançamento</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="rounded-xl px-8 font-bold">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
              {programa && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditando(false)}
                  className="rounded-xl px-8"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-muted/20 rounded-xl border border-border/50">
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</Label>
              <p className="text-lg font-bold text-foreground">{programa?.nome}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taxa de Conversão</Label>
              <p className="text-lg font-bold text-foreground">
                {(programa!.pontos_por_real * 100).toFixed(0)} pts / R$ 100
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Validade</Label>
              <p className="text-lg font-bold text-foreground">
                {programa!.expiracao_pontos_dias === 0 
                  ? 'Permanente' 
                  : `${programa!.expiracao_pontos_dias} dias`
                }
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Início do Programa</Label>
              <p className="text-lg font-bold text-foreground">
                {new Date(programa!.data_inicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
