import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseFornecedores } from '@/hooks/useSupabaseFornecedores';
import { useSupabaseCategorias } from '@/hooks/useSupabaseCategorias';
import { NovoProduto } from '@/types/produto';
import { Switch } from '@/components/ui/switch';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ProdutoFormProps {
  produto?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProdutoForm({ produto, onSuccess, onCancel }: ProdutoFormProps) {
  const { createProduto, updateProduto, uploadImagem } = useSupabaseProdutos();
  const { fornecedores } = useSupabaseFornecedores();
  const { categorias } = useSupabaseCategorias();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<NovoProduto>({
    nome: '',
    descricao: '',
    codigo_barras: '',
    categoria: 'uso_profissional',
    categoria_id: '',
    fornecedor_id: '',
    estoque_minimo: 0,
    unidade_medida: 'un',
    preco_custo: 0,
    preco_venda: 0,
    imagem_url: '',
    ativo: true,
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || '',
        codigo_barras: produto.codigo_barras || '',
        categoria: produto.categoria,
        categoria_id: produto.categoria_id || '',
        fornecedor_id: produto.fornecedor_id || '',
        estoque_minimo: produto.estoque_minimo,
        unidade_medida: produto.unidade_medida,
        preco_custo: produto.preco_custo,
        preco_venda: produto.preco_venda,
        imagem_url: produto.imagem_url || '',
        ativo: produto.ativo,
      });
    }
  }, [produto]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImagem(file);
      if (url) {
        setFormData(prev => ({ ...prev, imagem_url: url }));
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imagem_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (produto) {
        await updateProduto(produto.id, formData);
      } else {
        await createProduto(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="nome" className="text-sm sm:text-base">Nome *</Label>
          <Input
            id="nome"
            required
            className="h-12 sm:h-11 text-base sm:text-sm"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Tipo *</Label>
          <Select
            value={formData.categoria}
            onValueChange={(value: any) => setFormData({ ...formData, categoria: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uso_profissional">Uso Profissional</SelectItem>
              <SelectItem value="revenda">Revenda</SelectItem>
              <SelectItem value="consumo">Consumo</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {formData.categoria === 'revenda' && 'Produtos para revender aos clientes'}
            {formData.categoria === 'uso_profissional' && 'Produtos usados em procedimentos'}
            {formData.categoria === 'consumo' && 'Produtos de uso próprio do salão'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria_id">Categoria Personalizada</Label>
          <Select
            value={formData.categoria_id || 'none'}
            onValueChange={(value) => {
              const selectedCat = categorias.find(c => c.id === value);
              if (selectedCat) {
                setFormData({ 
                  ...formData, 
                  categoria_id: value,
                  categoria: selectedCat.tipo as any
                });
              } else {
                setFormData({ ...formData, categoria_id: value === 'none' ? undefined : value });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {categorias
                .filter(c => c.ativo)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} ({c.tipo === 'revenda' ? 'Revenda' : c.tipo === 'uso_profissional' ? 'Uso Profissional' : 'Consumo'})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fornecedor_id">Fornecedor</Label>
          <Select
            value={formData.fornecedor_id}
            onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="codigo_barras">Código de Barras</Label>
          <Input
            id="codigo_barras"
            value={formData.codigo_barras}
            onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
          <Input
            id="estoque_minimo"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.estoque_minimo}
            onChange={(e) => setFormData({ ...formData, estoque_minimo: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unidade_medida">Unidade de Medida *</Label>
          <Input
            id="unidade_medida"
            required
            value={formData.unidade_medida}
            onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
            placeholder="Ex: un, kg, L"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_custo">Preço de Custo (R$) *</Label>
          <Input
            id="preco_custo"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.preco_custo}
            onChange={(e) => setFormData({ ...formData, preco_custo: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preco_venda">Preço de Venda (R$) *</Label>
          <Input
            id="preco_venda"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.preco_venda}
            onChange={(e) => setFormData({ ...formData, preco_venda: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Imagem do Produto</Label>
        <div className="flex flex-col gap-4">
          {formData.imagem_url ? (
            <div className="relative w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden border-2 border-primary/10 shadow-lg group">
              <img 
                src={formData.imagem_url} 
                alt="Prévia do produto" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-xl shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-[200px] aspect-square rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-all group"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Enviando...</span>
                </>
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">Adicionar Foto</span>
                </>
              )}
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Recomendado: Imagem quadrada (1:1), formato PNG ou JPG, até 2MB.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
        />
        <Label htmlFor="ativo">Produto Ativo</Label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="h-11 btn-touch sm:flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="h-11 btn-touch sm:flex-1">
          {produto ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
