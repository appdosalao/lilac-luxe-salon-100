import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, Repeat, Calendar, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ContaFixa, NovaContaFixa, CategoriaFinanceira } from '@/types/contaFixa';

const contaFixaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dataVencimento: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  observacoes: z.string().optional(),
  repetir: z.boolean(),
  frequencia: z.enum(['mensal', 'trimestral', 'semestral', 'anual']),
  ativa: z.boolean().optional(),
});

const novaCategoriaSchema = z.object({
  nome: z.string().min(1, 'Nome da categoria é obrigatório'),
  cor: z.string().optional(),
});

interface ContaFixaFormProps {
  conta?: ContaFixa;
  categorias: CategoriaFinanceira[];
  onSubmit: (data: NovaContaFixa) => void;
  onCancel: () => void;
  onCreateCategoria?: (nome: string, cor?: string) => Promise<void>;
}

export default function ContaFixaForm({ 
  conta, 
  categorias, 
  onSubmit, 
  onCancel,
  onCreateCategoria 
}: ContaFixaFormProps) {
  const [loading, setLoading] = useState(false);
  const [showCategoriaDialog, setShowCategoriaDialog] = useState(false);
  const [loadingCategoria, setLoadingCategoria] = useState(false);

  const form = useForm<NovaContaFixa>({
    resolver: zodResolver(contaFixaSchema),
    defaultValues: {
      nome: conta?.nome || '',
      valor: conta?.valor || 0,
      dataVencimento: conta?.dataVencimento || 1,
      categoria: conta?.categoria || '',
      observacoes: conta?.observacoes || '',
      repetir: conta?.repetir ?? true,
      frequencia: conta?.frequencia || 'mensal',
      ativa: conta?.ativa ?? true,
    },
  });

  const categoriaForm = useForm({
    resolver: zodResolver(novaCategoriaSchema),
    defaultValues: {
      nome: '',
      cor: '#3b82f6',
    },
  });

  const handleSubmit = async (data: NovaContaFixa) => {
    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategoria = async (data: { nome: string; cor?: string }) => {
    if (!onCreateCategoria) return;
    
    setLoadingCategoria(true);
    try {
      await onCreateCategoria(data.nome, data.cor);
      categoriaForm.reset();
      setShowCategoriaDialog(false);
      
      // Seleciona automaticamente a nova categoria
      form.setValue('categoria', data.nome);
      
      toast({
        title: "Categoria criada",
        description: `A categoria "${data.nome}" foi criada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingCategoria(false);
    }
  };

  const categoriasDespesa = categorias.filter(c => c.tipo === 'despesa');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onCancel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {conta ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
          </h1>
          <p className="text-muted-foreground">
            {conta ? 'Atualize os dados da conta fixa' : 'Cadastre uma nova despesa recorrente'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Nome da Conta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Aluguel, Energia, Internet..."
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="h-12"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataVencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Dia do Vencimento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="1"
                          className="h-12"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Categoria</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1 h-12">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoriasDespesa.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.nome}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: categoria.cor }}
                                  />
                                  {categoria.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {onCreateCategoria && (
                          <Dialog open={showCategoriaDialog} onOpenChange={setShowCategoriaDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon"
                                className="flex-shrink-0 h-12 w-12 btn-touch"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nova Categoria</DialogTitle>
                              </DialogHeader>
                              <Form {...categoriaForm}>
                                <form onSubmit={categoriaForm.handleSubmit(handleCreateCategoria)} className="space-y-4">
                                   <FormField
                                     control={categoriaForm.control}
                                     name="nome"
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel className="text-sm sm:text-base">Nome da Categoria</FormLabel>
                                         <FormControl>
                                           <Input
                                             placeholder="Ex: Aluguel, Energia, Internet..."
                                             className="h-12"
                                             {...field}
                                           />
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                  
                                   <FormField
                                     control={categoriaForm.control}
                                     name="cor"
                                     render={({ field }) => (
                                       <FormItem>
                                         <FormLabel className="text-sm sm:text-base">Cor</FormLabel>
                                         <FormControl>
                                           <div className="flex gap-2">
                                             <Input
                                               type="color"
                                               className="w-16 h-12 p-1 border rounded"
                                               {...field}
                                             />
                                             <Input
                                               placeholder="#3b82f6"
                                               {...field}
                                               className="flex-1 h-12"
                                             />
                                           </div>
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                  
                                   <div className="flex flex-col sm:flex-row gap-2 pt-4">
                                     <Button 
                                       type="submit" 
                                       disabled={loadingCategoria}
                                       className="bg-gradient-to-r from-primary to-lilac-primary h-12 btn-touch"
                                     >
                                       {loadingCategoria ? 'Criando...' : 'Criar Categoria'}
                                     </Button>
                                     <Button 
                                       type="button" 
                                       variant="outline"
                                       onClick={() => setShowCategoriaDialog(false)}
                                       className="h-12 btn-touch"
                                     >
                                       Cancelar
                                     </Button>
                                   </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Configurações de Repetição */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Repeat className="h-4 w-4 text-primary" />
                    Configurações de Repetição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="repetir"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">
                            Conta Recorrente
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Esta conta se repete automaticamente
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('repetir') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="frequencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Frequência de Repetição
                            </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                                <SelectItem value="mensal">📅 Mensal</SelectItem>
                                <SelectItem value="trimestral">📅 Trimestral (3 meses)</SelectItem>
                                <SelectItem value="semestral">📅 Semestral (6 meses)</SelectItem>
                                <SelectItem value="anual">📅 Anual (12 meses)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ativa"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">
                                Conta Ativa
                              </FormLabel>
                              <div className="text-xs text-muted-foreground">
                                Gerar automaticamente
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? true}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {form.watch('repetir') && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 mb-1">
                            Como funciona a repetição:
                          </p>
                          <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• A conta será criada automaticamente conforme a frequência</li>
                            <li>• O vencimento será no dia {form.watch('dataVencimento')} de cada período</li>
                            <li>• Você pode ativar/desativar a geração automática</li>
                            <li>• Contas já vencidas podem ser marcadas como pagas individualmente</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a conta..."
                      rows={3}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-lilac-primary h-12 btn-touch"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Conta'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-12 btn-touch"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}