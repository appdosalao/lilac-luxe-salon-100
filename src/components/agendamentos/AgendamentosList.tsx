import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  DollarSign, 
  Edit, 
  Trash2, 
  X,
  Check,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Agendamento, AgendamentoFiltros } from '@/types/agendamento';

interface AgendamentosListProps {
  agendamentos: Agendamento[];
  filtros: AgendamentoFiltros;
  onFiltrosChange: (filtros: AgendamentoFiltros) => void;
  onEdit: (agendamento: Agendamento) => void;
  onDelete: (id: string) => void;
  onCancel: (id: string) => void;
  onViewDetails: (agendamento: Agendamento) => void;
  onReagendar?: (agendamento: Agendamento) => void;
  onTrocarHorario?: (agendamento: Agendamento) => void;
  onMarcarPagamento?: (agendamento: Agendamento) => void;
  clientes: Array<{id: string, nome: string}>;
  paginaAtual: number;
  totalPaginas: number;
  onPaginaChange: (pagina: number) => void;
}

const statusConfig = {
  agendado: { label: 'Agendado', color: 'bg-info', icon: Calendar },
  concluido: { label: 'Concluído', color: 'bg-success', icon: Check },
  cancelado: { label: 'Cancelado', color: 'bg-destructive', icon: X },
};

export default function AgendamentosList({
  agendamentos,
  filtros,
  onFiltrosChange,
  onEdit,
  onDelete,
  onCancel,
  onViewDetails,
  onReagendar,
  onTrocarHorario,
  onMarcarPagamento,
  clientes,
  paginaAtual,
  totalPaginas,
  onPaginaChange,
}: AgendamentosListProps) {
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState<string | null>(null);

  const formatarData = (data: string) => {
    return format(new Date(data + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR });
  };

  const formatarHora = (hora: string) => {
    return hora.slice(0, 5);
  };

  const formatarDuracao = (duracao: number) => {
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Busca principal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou serviço..."
                value={filtros.busca || ''}
                onChange={(e) => onFiltrosChange({ ...filtros, busca: e.target.value })}
                className="pl-10 h-10 sm:h-11 text-sm"
              />
            </div>
            
            {/* Filtros em grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <Input
                type="date"
                value={filtros.data || ''}
                onChange={(e) => onFiltrosChange({ ...filtros, data: e.target.value })}
                placeholder="Data"
                className="h-10 sm:h-11 text-sm"
              />
              
              <Select
                value={filtros.status || 'all'}
                onValueChange={(value) => onFiltrosChange({ ...filtros, status: value === 'all' ? undefined : value as any })}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filtros.clienteId || 'all'}
                onValueChange={(value) => onFiltrosChange({ ...filtros, clienteId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filtros.statusPagamento || 'all'}
                onValueChange={(value) => onFiltrosChange({ ...filtros, statusPagamento: value === 'all' ? undefined : value as any })}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">✓ Pago</SelectItem>
                  <SelectItem value="parcial">⚠ Parcial</SelectItem>
                  <SelectItem value="em_aberto">⏳ Em aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filtros.busca || filtros.data || filtros.status || filtros.clienteId || filtros.statusPagamento) && (
            <div className="mt-4 pt-4 border-t border-border/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltrosChange({})}
                className="h-9 text-xs"
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <div className="space-y-3 animate-fade-in">
        {agendamentos.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center p-4 sm:p-6">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {Object.keys(filtros).length > 0 ? 
                  'Tente ajustar os filtros ou criar um novo agendamento.' :
                  'Comece criando seu primeiro agendamento.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          agendamentos.map((agendamento, index) => {
            const StatusIcon = statusConfig[agendamento.status].icon;
            
            return (
              <Card 
                key={agendamento.id} 
                className="agendamento-card animate-fade-in touch-feedback"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => onViewDetails(agendamento)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Header com cliente e status */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-lilac-light/10 flex-shrink-0">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {agendamento.clienteNome}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Scissors className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{agendamento.servicoNome}</span>
                          </p>
                        </div>
                        
                        {/* Menu de ações - sempre visível no mobile */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onEdit(agendamento);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            
                            {agendamento.status === 'agendado' && onReagendar && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onReagendar(agendamento);
                              }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reagendar
                              </DropdownMenuItem>
                            )}
                            
                            {agendamento.status === 'agendado' && onTrocarHorario && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onTrocarHorario(agendamento);
                              }}>
                                <ArrowLeftRight className="h-4 w-4 mr-2" />
                                Trocar Horário
                              </DropdownMenuItem>
                            )}
                            
                            {agendamento.status === 'agendado' && agendamento.statusPagamento !== 'pago' && onMarcarPagamento && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onMarcarPagamento(agendamento);
                              }}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Marcar Pagamento
                              </DropdownMenuItem>
                            )}
                            
                            {agendamento.status === 'agendado' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onCancel(agendamento.id);
                              }}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setAgendamentoParaExcluir(agendamento.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Status badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          className={`${statusConfig[agendamento.status].color} text-white text-xs h-6`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{statusConfig[agendamento.status].label}</span>
                          <span className="sm:hidden">{statusConfig[agendamento.status].label.charAt(0)}</span>
                        </Badge>
                        
                        {agendamento.origem === 'online' && (
                          <Badge className="bg-purple-500 text-white text-xs h-6">
                            <span className="text-xs">📱</span>
                            <span className="ml-1 hidden sm:inline">Online</span>
                          </Badge>
                        )}
                        
                        <Badge 
                          className={`${
                            agendamento.statusPagamento === 'pago' ? 'bg-green-500' :
                            agendamento.statusPagamento === 'parcial' ? 'bg-yellow-500' :
                            'bg-red-500'
                          } text-white text-xs h-6`}
                        >
                          {agendamento.statusPagamento === 'pago' ? '✓' :
                           agendamento.statusPagamento === 'parcial' ? '⚠' :
                           '⏳'}
                          <span className="ml-1 hidden sm:inline">
                            {agendamento.statusPagamento === 'pago' ? 'Pago' :
                             agendamento.statusPagamento === 'parcial' ? 'Parcial' :
                             'Em aberto'}
                          </span>
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Informações do agendamento */}
                    <div className="grid gap-3 text-xs sm:text-sm">
                      {/* Data e hora */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{formatarData(agendamento.data)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{formatarHora(agendamento.hora)} ({formatarDuracao(agendamento.duracao)})</span>
                        </div>
                      </div>
                      
                      {/* Informações financeiras */}
                      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                        <DollarSign className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-medium text-foreground text-sm">
                            Total: {formatarValor(agendamento.valor)}
                          </div>
                          
                          {agendamento.valorPago > 0 && (
                            <div className="text-green-600 text-xs">
                              Pago: {formatarValor(agendamento.valorPago)}
                            </div>
                          )}
                          
                          {agendamento.valorDevido > 0 && (
                            <div className="text-red-500 text-xs font-medium">
                              Pendente: {formatarValor(agendamento.valorDevido)}
                            </div>
                          )}
                          
                          {agendamento.dataPrevistaPagamento && (agendamento.formaPagamento === 'fiado' || agendamento.statusPagamento === 'parcial' || agendamento.statusPagamento === 'em_aberto') && (
                            <div className="text-blue-600 text-xs">
                              Previsto: {formatarData(agendamento.dataPrevistaPagamento)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => paginaAtual > 1 && onPaginaChange(paginaAtual - 1)}
                  className={paginaAtual <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <PaginationItem key={pagina}>
                  <PaginationLink
                    onClick={() => onPaginaChange(pagina)}
                    isActive={pagina === paginaAtual}
                    className="cursor-pointer"
                  >
                    {pagina}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => paginaAtual < totalPaginas && onPaginaChange(paginaAtual + 1)}
                  className={paginaAtual >= totalPaginas ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={!!agendamentoParaExcluir} onOpenChange={() => setAgendamentoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (agendamentoParaExcluir) {
                  onDelete(agendamentoParaExcluir);
                  setAgendamentoParaExcluir(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}