import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Repeat,
  Edit, 
  Trash2,
  Tag,
  CheckCircle2,
  Power,
  PowerOff
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContaFixa } from "@/types/contaFixa";
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

interface ContasFixasListMobileProps {
  contas: ContaFixa[];
  onEdit: (conta: ContaFixa) => void;
  onDelete: (id: string) => void;
  onPagar: (id: string) => void;
  onToggleAtiva: (id: string, ativa: boolean) => void;
}

export function ContasFixasListMobile({ 
  contas, 
  onEdit, 
  onDelete,
  onPagar,
  onToggleAtiva
}: ContasFixasListMobileProps) {
  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_aberto':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'em_aberto':
        return 'Em Aberto';
      default:
        return status;
    }
  };

  const getFrequenciaTexto = (frequencia: string) => {
    switch (frequencia) {
      case 'mensal': return 'Mensal';
      case 'trimestral': return 'Trimestral';
      case 'semestral': return 'Semestral';
      case 'anual': return 'Anual';
      default: return frequencia;
    }
  };

  if (contas.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <Calendar className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-base font-medium text-foreground">Nenhuma conta fixa encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione sua primeira conta fixa recorrente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {contas.map((conta) => (
        <Card 
          key={conta.id} 
          className={`border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden hover-scale animate-fade-in ${
            !conta.ativa ? 'opacity-60' : ''
          }`}
        >
          <CardContent className="p-4 mobile-card">
            <div className="space-y-3">
              {/* Header with name and value */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <DollarSign className={`h-5 w-5 flex-shrink-0 ${
                    conta.status === 'pago' ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {conta.nome}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Vence dia {conta.dataVencimento}
                    </p>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base sm:text-lg text-foreground">
                    {formatarValor(conta.valor)}
                  </p>
                </div>
              </div>

              {/* Info badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(conta.status)}`}
                >
                  {getStatusText(conta.status)}
                </Badge>

                {conta.categoria && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {conta.categoria}
                    </Badge>
                  </div>
                )}

                {conta.repetir && (
                  <div className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {getFrequenciaTexto(conta.frequencia)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                {conta.status === 'em_aberto' && conta.ativa && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPagar(conta.id)}
                    className="h-10 text-xs btn-touch border-green-500/50 hover:bg-green-50 hover:text-green-700 hover-scale"
                    aria-label="Marcar conta como paga"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pagar
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleAtiva(conta.id, !conta.ativa)}
                  className="h-10 text-xs btn-touch hover-scale"
                  aria-label={conta.ativa ? 'Desativar conta' : 'Ativar conta'}
                >
                  {conta.ativa ? (
                    <>
                      <PowerOff className="h-3 w-3 mr-1" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3 mr-1" />
                      Ativar
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(conta)}
                  className="h-10 text-xs btn-touch hover-scale"
                  aria-label="Editar conta"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs btn-touch hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 hover-scale"
                      aria-label="Excluir conta"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a conta "{conta.nome}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="btn-touch">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(conta.id)}
                        className="bg-destructive hover:bg-destructive/90 btn-touch"
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
  );
}
