import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phone, MessageCircle, Calendar, FileText, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente } from "@/types/cliente";
import ClienteForm from "./ClienteForm";

interface ClienteDetalhesProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (cliente: Cliente) => void;
}

export default function ClienteDetalhes({ cliente, open, onOpenChange, onEdit }: ClienteDetalhesProps) {
  if (!cliente) return null;

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return telefone;
  };

  const abrirWhatsApp = (telefone: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${numeroLimpo}`;
    window.open(url, '_blank');
  };

  const ligar = (telefone: string) => {
    window.open(`tel:${telefone}`, '_self');
  };

  const totalGasto = cliente.historicoServicos.reduce((total, servico) => total + servico.valor, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent">
              {cliente.nomeCompleto}
            </DialogTitle>
            <ClienteForm
              cliente={cliente}
              onSubmit={(data) => onEdit({ ...cliente, ...data })}
              trigger={
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              }
            />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações de Contato */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">{formatarTelefone(cliente.telefone)}</span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ligar(cliente.telefone)}
                    className="h-8"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Ligar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirWhatsApp(cliente.telefone)}
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-lilac-primary" />
                <span>Última visita: </span>
                <Badge variant="secondary">
                  {format(cliente.ultimaVisita, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-pink-accent" />
                <span>Serviço frequente: </span>
                <Badge variant="outline" className="bg-accent/50">
                  {cliente.servicoFrequente}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Serviços */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Serviços</CardTitle>
              <CardDescription>
                Total de {cliente.historicoServicos.length} serviços realizados • 
                Valor total: R$ {totalGasto.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cliente.historicoServicos.length > 0 ? (
                <div className="space-y-3">
                  {cliente.historicoServicos
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((servico) => (
                      <div key={servico.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                        <div>
                          <p className="font-medium">{servico.servico}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(servico.data, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          R$ {servico.valor.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {cliente.observacoes && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {cliente.observacoes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}