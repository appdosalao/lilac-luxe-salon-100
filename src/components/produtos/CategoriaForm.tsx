import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CategoriasProduto, NovaCategoria, TipoCategoria } from '@/types/categoria';
import { useSupabaseCategorias } from '@/hooks/useSupabaseCategorias';

interface CategoriaFormProps {
  categoria?: CategoriasProduto;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoriaForm({ categoria, onSuccess, onCancel }: CategoriaFormProps) {
  const { createCategoria, updateCategoria } = useSupabaseCategorias();
  const [formData, setFormData] = useState<NovaCategoria>({
    nome: '',
    tipo: 'revenda',
    cor: '#94a3b8',
    ativo: true,
  });

  useEffect(() => {
    if (categoria) {
      setFormData({
        nome: categoria.nome,
        tipo: categoria.tipo,
        cor: categoria.cor || '#94a3b8',
        icone: categoria.icone,
        ativo: categoria.ativo,
      });
    }
  }, [categoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (categoria) {
        await updateCategoria(categoria.id, formData);
      } else {
        await createCategoria(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da Categoria</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          placeholder="Ex: Esmaltes, Shampoos, Material de Limpeza"
          required
        />
      </div>

      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          value={formData.tipo}
          onValueChange={(value: TipoCategoria) => setFormData({ ...formData, tipo: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenda">{getTipoLabel('revenda')}</SelectItem>
            <SelectItem value="uso_profissional">{getTipoLabel('uso_profissional')}</SelectItem>
            <SelectItem value="consumo">{getTipoLabel('consumo')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          {formData.tipo === 'revenda' && 'Produtos que você compra para revender no salão'}
          {formData.tipo === 'uso_profissional' && 'Produtos usados em procedimentos com clientes'}
          {formData.tipo === 'consumo' && 'Produtos para uso próprio do salão'}
        </p>
      </div>

      <div>
        <Label htmlFor="cor">Cor</Label>
        <div className="flex gap-2">
          <Input
            id="cor"
            type="color"
            value={formData.cor}
            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
            className="w-20 h-10"
          />
          <Input
            value={formData.cor}
            onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
            placeholder="#94a3b8"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="ativo">Categoria Ativa</Label>
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {categoria ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
