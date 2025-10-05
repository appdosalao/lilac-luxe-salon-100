import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, CreditCard, Edit2, Filter, Search, Trash2, DollarSign, Repeat, Power } from 'lucide-react';
import { ContaFixa, CategoriaFinanceira } from '@/types/contaFixa';

interface ContasFixasListProps {
  contas: ContaFixa[];
  categorias: CategoriaFinanceira[];
  onEdit: (conta: ContaFixa) => void;
  onDelete: (id: string) => void;
  onPagar: (contaId: string, valor?: number) => void;
  onToggleAtiva: (contaId: string, ativa: boolean) => void;
}

export default function ContasFixasList({ 
  contas, 
  categorias, 
  onEdit, 
  onDelete, 
  onPagar,
  onToggleAtiva
}: ContasFixasListProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    const matchBusca = conta.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = filtroCategoria === 'todas' || conta.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todos' || conta.status === filtroStatus;
    
    return matchBusca && matchCategoria && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'em_aberto':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getVencimentoStatus = (dataVencimento: number) => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const diaAtual = hoje.getDate();
    
    const vencimento = new Date(anoAtual, mesAtual - 1, dataVencimento);
    const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasParaVencimento < 0) {
      return { texto: 'Vencido', cor: 'text-red-600' };
    } else if (diasParaVencimento <= 3) {
      return { texto: 'Vence em breve', cor: 'text-orange-600' };
    } else {
      return { texto: `Vence dia ${dataVencimento}`, cor: 'text-gray-600' };
    }
  };

  const getFrequenciaTexto = (frequencia: string) => {
    switch (frequencia) {
      case 'mensal':
        return 'Mensal';
      case 'trimestral':
        return 'Trimestral';
      case 'semestral':
        return 'Semestral';
      case 'anual':
        return 'Anual';
      default:
        return 'Única';
    }
  };

  const totalEmAberto = contasFiltradas
    .filter(c => c.status === 'em_aberto')
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPago = contasFiltradas
    .filter(c => c.status === 'pago')
    .reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEmAberto)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pagas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Contas</p>
                <p className="text-2xl font-bold">{contasFiltradas.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conta..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.filter(c => c.tipo === 'despesa').map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.nome}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="em_aberto">Em Aberto</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setBusca('');
                setFiltroCategoria('todas');
                setFiltroStatus('todos');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Fixas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Repetição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasFiltradas.map((conta) => {
                  const vencimentoStatus = getVencimentoStatus(conta.dataVencimento);
                  return (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{conta.categoria}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell>
                        <span className={vencimentoStatus.cor}>
                          {vencimentoStatus.texto}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {conta.repetir ? (
                            <>
                              <Repeat className="h-4 w-4 text-blue-600" />
                              <div className="text-sm">
                                <div className="font-medium">{getFrequenciaTexto(conta.frequencia)}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Power className={`h-3 w-3 ${conta.ativa ? 'text-green-600' : 'text-gray-400'}`} />
                                  {conta.ativa ? 'Ativa' : 'Inativa'}
                                </div>
                              </div>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Única
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(conta.status)}>
                          {conta.status === 'pago' ? 'Pago' : 'Em Aberto'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {conta.status === 'em_aberto' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onPagar(conta.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                          
                          {conta.repetir && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onToggleAtiva(conta.id, !conta.ativa)}
                              className={conta.ativa ? 'text-orange-600 border-orange-600' : 'text-green-600 border-green-600'}
                            >
                              <Power className="h-4 w-4 mr-1" />
                              {conta.ativa ? 'Desativar' : 'Ativar'}
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(conta)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Conta Fixa</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir a conta "{conta.nome}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(conta.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {contasFiltradas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta fixa encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}