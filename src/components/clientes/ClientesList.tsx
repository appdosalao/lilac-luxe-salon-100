import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  Search, 
  Phone, 
  MessageCircle, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente } from "@/types/cliente";
import ClienteForm from "./ClienteForm";
import { toast } from "@/hooks/use-toast";

interface ClientesListProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => void;
  onViewDetails: (cliente: Cliente) => void;
}

export default function ClientesList({ clientes, onEdit, onDelete, onViewDetails }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClientes = clientes.filter(cliente =>
    cliente.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const sortedClientes = filteredClientes.sort((a, b) => 
    a.nomeCompleto.localeCompare(b.nomeCompleto)
  );

  const totalPages = Math.ceil(sortedClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClientes = sortedClientes.slice(startIndex, endIndex);

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return telefone;
  };

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Olá ${nome}! Tudo bem?`;
    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const ligar = (telefone: string) => {
    window.open(`tel:${telefone}`, '_self');
  };

  const handleDelete = (id: string, nome: string) => {
    onDelete(id);
    toast({
      title: "Cliente removida",
      description: `${nome} foi removida com sucesso.`,
    });
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold">
            Lista de Clientes ({filteredClientes.length})
          </CardTitle>
          
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 border-border/50"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {currentClientes.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-responsive">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold text-responsive-xs">Nome Completo</TableHead>
                    <TableHead className="font-semibold text-responsive-xs">Telefone</TableHead>
                    <TableHead className="font-semibold text-responsive-xs">Serviço Frequente</TableHead>
                    <TableHead className="font-semibold text-responsive-xs">Última Visita</TableHead>
                    <TableHead className="font-semibold text-right text-responsive-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentClientes.map((cliente) => (
                    <TableRow 
                      key={cliente.id} 
                      className="border-border/50 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => onViewDetails(cliente)}
                    >
                      <TableCell className="font-medium text-responsive-sm">{cliente.nomeCompleto}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-responsive-xs">{formatarTelefone(cliente.telefone)}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                ligar(cliente.telefone);
                              }}
                              className="btn-touch"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirWhatsApp(cliente.telefone, cliente.nomeCompleto);
                              }}
                              className="btn-touch hover:bg-green-100"
                            >
                              <MessageCircle className="h-3 w-3 text-green-600" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/50 text-responsive-xs">
                          {cliente.servicoFrequente}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-responsive-xs">
                        {format(cliente.ultimaVisita, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(cliente);
                            }}
                            className="btn-touch"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <ClienteForm
                            cliente={cliente}
                            onSubmit={(data) => onEdit({ ...cliente, ...data })}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                                className="btn-touch"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                                className="btn-touch hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-responsive-lg">Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription className="text-responsive-sm">
                                  Tem certeza que deseja excluir <strong>{cliente.nomeCompleto}</strong>? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="btn-touch text-responsive-sm">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(cliente.id, cliente.nomeCompleto)}
                                  className="bg-destructive hover:bg-destructive/90 btn-touch text-responsive-sm"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-responsive p-responsive">
              {currentClientes.map((cliente) => (
                <Card 
                  key={cliente.id} 
                  className="border-border/50 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onViewDetails(cliente)}
                >
                  <CardContent className="p-responsive">
                    <div className="space-responsive">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-responsive-lg truncate">{cliente.nomeCompleto}</h3>
                          <p className="text-responsive-sm text-muted-foreground">
                            {formatarTelefone(cliente.telefone)}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              ligar(cliente.telefone);
                            }}
                            className="btn-touch"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirWhatsApp(cliente.telefone, cliente.nomeCompleto);
                            }}
                            className="btn-touch"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <Badge variant="outline" className="bg-accent/50 text-responsive-xs w-fit">
                          {cliente.servicoFrequente}
                        </Badge>
                        <span className="text-responsive-xs text-muted-foreground">
                          {format(cliente.ultimaVisita, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <ClienteForm
                          cliente={cliente}
                          onSubmit={(data) => onEdit({ ...cliente, ...data })}
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                              className="btn-touch text-responsive-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                              className="btn-touch hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 text-responsive-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-responsive-lg">Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-responsive-sm">
                                Tem certeza que deseja excluir <strong>{cliente.nomeCompleto}</strong>? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="btn-touch text-responsive-sm">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(cliente.id, cliente.nomeCompleto)}
                                className="bg-destructive hover:bg-destructive/90 btn-touch text-responsive-sm"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, sortedClientes.length)} de {sortedClientes.length} clientes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-lilac-light/10 mx-auto">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {searchTerm ? "Nenhuma cliente encontrada" : "Nenhuma cliente cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? "Tente buscar com outros termos ou limpe o filtro." 
                : "Comece cadastrando sua primeira cliente para começar a usar o sistema."
              }
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
              >
                Limpar busca
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}