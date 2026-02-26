import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSupabaseFornecedores } from '@/hooks/useSupabaseFornecedores';
import { NovoFornecedor } from '@/types/fornecedor';

interface FornecedorFormProps {
  fornecedor?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FornecedorForm({ fornecedor, onSuccess, onCancel }: FornecedorFormProps) {
  const { createFornecedor, updateFornecedor } = useSupabaseFornecedores();
  
  const [formData, setFormData] = useState<NovoFornecedor>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    ativo: true,
  });

  useEffect(() => {
    if (fornecedor) {
      setFormData({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        cep: fornecedor.cep || '',
        observacoes: fornecedor.observacoes || '',
        ativo: fornecedor.ativo,
      });
    }
  }, [fornecedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (fornecedor) {
        await updateFornecedor(fornecedor.id, formData);
      } else {
        await createFornecedor(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            required
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={formData.cidade}
            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            maxLength={2}
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
        />
        <Label htmlFor="ativo">Fornecedor Ativo</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {fornecedor ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
