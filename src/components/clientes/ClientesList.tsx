import { useState, useMemo, useCallback } from "react";
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
  Eye,
  User,
  Calendar,
  X
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

// Função para normalizar texto (remover acentos e converter para minúsculas)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Função para verificar se todos os termos de busca estão presentes
const matchesAllTerms = (text: string, searchTerms: string[]): boolean => {
  const normalizedText = normalizeText(text);
  return searchTerms.every(term => normalizedText.includes(term));
};

// Função para destacar texto encontrado
const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  const searchTerms = normalizeText(searchTerm).split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) return text;
  
  const normalizedText = normalizeText(text);
  let result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Encontrar todas as posições de match
  const matches: { start: number; end: number }[] = [];
  
  searchTerms.forEach(term => {
    let index = normalizedText.indexOf(term);
    while (index !== -1) {
      matches.push({ start: index, end: index + term.length });
      index = normalizedText.indexOf(term, index + 1);
    }
  });
  
  // Ordenar e mesclar matches sobrepostos
  matches.sort((a, b) => a.start - b.start);
  const mergedMatches: { start: number; end: number }[] = [];
  
  for (const match of matches) {
    if (mergedMatches.length === 0 || match.start > mergedMatches[mergedMatches.length - 1].end) {
      mergedMatches.push({ ...match });
    } else {
      mergedMatches[mergedMatches.length - 1].end = Math.max(
        mergedMatches[mergedMatches.length - 1].end,
        match.end
      );
    }
  }
  
  // Construir resultado com destaques
  for (const match of mergedMatches) {
    if (match.start > lastIndex) {
      result.push(text.slice(lastIndex, match.start));
    }
    result.push(
      <mark key={match.start} className="bg-primary/20 text-primary rounded px-0.5">
        {text.slice(match.start, match.end)}
      </mark>
    );
    lastIndex = match.end;
  }
  
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  
  return result.length > 0 ? result : text;
};

export default function ClientesList({ clientes, onEdit, onDelete, onViewDetails }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Busca otimizada com suporte a múltiplos termos e campos
  const filteredClientes = useMemo(() => {
    if (!searchTerm.trim()) return clientes;
    
    const searchTerms = normalizeText(searchTerm).split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return clientes;
    
    return clientes.filter(cliente => {
      const nome = cliente.nomeCompleto || cliente.nome || '';
      const telefone = cliente.telefone?.replace(/\D/g, '') || '';
      const telefoneFormatado = cliente.telefone || '';
      const email = cliente.email || '';
      const servico = cliente.servicoFrequente || '';
      
      // Combinar todos os campos para busca
      const searchableText = `${nome} ${telefone} ${telefoneFormatado} ${email} ${servico}`;
      
      return matchesAllTerms(searchableText, searchTerms);
    });
  }, [clientes, searchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  const sortedClientes = filteredClientes.sort((a, b) => 
    (a.nomeCompleto || a.nome || '').localeCompare(b.nomeCompleto || b.nome || '')
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
          
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-10 border-border/50"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Indicador de resultados da busca */}
        {searchTerm && (
          <div className="px-6 pb-2 text-sm text-muted-foreground">
            {filteredClientes.length === 0 ? (
              <span>Nenhum cliente encontrado para "<strong>{searchTerm}</strong>"</span>
            ) : (
              <span>
                {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} encontrado{filteredClientes.length !== 1 ? 's' : ''} para "<strong>{searchTerm}</strong>"
              </span>
            )}
          </div>
        )}
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
                      <TableCell className="font-medium text-responsive-sm">
                        {highlightText(cliente.nomeCompleto || cliente.nome || '', searchTerm)}
                      </TableCell>
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
                                abrirWhatsApp(cliente.telefone, cliente.nomeCompleto || cliente.nome || '');
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
                           {cliente.servicoFrequente || 'Não definido'}
                         </Badge>
                      </TableCell>
                        <TableCell className="text-responsive-xs">
                          {cliente.ultimaVisita ? (() => {
                            try {
                              const data = new Date(cliente.ultimaVisita);
                              return isNaN(data.getTime()) ? 'Data inválida' : format(data, "dd/MM/yyyy", { locale: ptBR });
                            } catch (error) {
                              return 'Data inválida';
                            }
                          })() : 'Não definido'}
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
                                   Tem certeza que deseja excluir <strong>{cliente.nomeCompleto || cliente.nome}</strong>?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="btn-touch text-responsive-sm">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                   onClick={() => handleDelete(cliente.id, cliente.nomeCompleto || cliente.nome || '')}
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

            {/* Mobile Cards - Otimizados */}
            <div className="lg:hidden space-y-3 p-4">
              {currentClientes.map((cliente) => (
                <Card 
                  key={cliente.id} 
                  className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => onViewDetails(cliente)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header com avatar placeholder e info */}
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate">
                            {highlightText(cliente.nomeCompleto || cliente.nome || '', searchTerm)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatarTelefone(cliente.telefone)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Info badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-accent/50 text-xs h-6">
                          {cliente.servicoFrequente || 'Não definido'}
                        </Badge>
                        <Badge variant="outline" className="text-xs h-6">
                          <Calendar className="h-3 w-3 mr-1" />
                          {cliente.ultimaVisita ? (() => {
                            try {
                              const data = new Date(cliente.ultimaVisita);
                              return isNaN(data.getTime()) ? 'Sem visita' : format(data, "dd/MM/yy", { locale: ptBR });
                            } catch (error) {
                              return 'Sem visita';
                            }
                          })() : 'Sem visita'}
                        </Badge>
                      </div>

                      {/* Quick actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            ligar(cliente.telefone);
                          }}
                          className="flex-1 h-11 btn-touch"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirWhatsApp(cliente.telefone, cliente.nomeCompleto || cliente.nome || '');
                          }}
                          className="flex-1 h-11 btn-touch bg-green-50 hover:bg-green-100"
                        >
                          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                          WhatsApp
                        </Button>
                      </div>

                      {/* Edit/Delete actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                        <ClienteForm
                          cliente={cliente}
                          onSubmit={(data) => onEdit({ ...cliente, ...data })}
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                              className="h-10 text-xs btn-touch"
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
                              className="h-10 text-xs btn-touch hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir <strong>{cliente.nomeCompleto || cliente.nome}</strong>? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="btn-touch m-0">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(cliente.id, cliente.nomeCompleto || cliente.nome || '')}
                                className="bg-destructive hover:bg-destructive/90 btn-touch m-0"
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