import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Trash2, TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lancamento, LancamentoFiltros } from "@/types/lancamento";
import { toast } from "@/hooks/use-toast";

interface LancamentosListProps {
  lancamentos: Lancamento[];
  filtros: LancamentoFiltros;
  categorias: string[];
  onFiltrosChange: (filtros: LancamentoFiltros) => void;
  onEdit: (lancamento: Lancamento) => void;
  onDelete: (id: string) => void;
}

export default function LancamentosList({
  lancamentos,
  filtros,
  categorias,
  onFiltrosChange,
  onEdit,
  onDelete,
}: LancamentosListProps) {
  const [busca, setBusca] = useState("");

  const lancamentosFiltrados = lancamentos.filter(lancamento =>
    lancamento.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    (lancamento.categoria?.toLowerCase().includes(busca.toLowerCase()) ?? false)
  );

  const handleDelete = (id: string) => {
    onDelete(id);
    toast({
      title: "Lançamento excluído",
      description: "O lançamento foi removido com sucesso.",
    });
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Lançamentos Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lançamento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select
            value={filtros.tipo || "todos"}
            onValueChange={(value) => 
              onFiltrosChange({ 
                ...filtros, 
                tipo: value === "todos" ? undefined : value as "entrada" | "saida"
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.categoria || "todas"}
            onValueChange={(value) => 
              onFiltrosChange({ 
                ...filtros, 
                categoria: value === "todas" ? undefined : value
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.mes ? `${filtros.mes}-${filtros.ano}` : "todos"}
            onValueChange={(value) => {
              if (value === "todos") {
                onFiltrosChange({ ...filtros, mes: undefined, ano: undefined });
              } else {
                const [mes, ano] = value.split("-").map(Number);
                onFiltrosChange({ ...filtros, mes, ano });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              <SelectItem value="12-2024">Dezembro 2024</SelectItem>
              <SelectItem value="11-2024">Novembro 2024</SelectItem>
              <SelectItem value="10-2024">Outubro 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                lancamentosFiltrados.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      <Badge 
                        variant={lancamento.tipo === "entrada" ? "default" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {lancamento.tipo === "entrada" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {lancamento.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {lancamento.descricao}
                    </TableCell>
                    <TableCell>
                      {lancamento.categoria && (
                        <Badge variant="outline">{lancamento.categoria}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(lancamento.data), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className={`font-semibold ${
                      lancamento.tipo === "entrada" ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatarValor(lancamento.valor)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(lancamento)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(lancamento.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}