import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send, Users, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CampanhaDialog } from "./CampanhaDialog";
import { Badge } from "@/components/ui/badge";

export function CampanhasMarketing() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: campanhas, isLoading } = useQuery({
    queryKey: ['campanhas-marketing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const statusMap = {
    rascunho: { label: "Rascunho", variant: "secondary" as const },
    agendada: { label: "Agendada", variant: "default" as const },
    enviando: { label: "Enviando", variant: "default" as const },
    concluida: { label: "Concluída", variant: "outline" as const },
    cancelada: { label: "Cancelada", variant: "destructive" as const }
  };

  const tipoMap = {
    email: "E-mail",
    sms: "SMS",
    whatsapp: "WhatsApp",
    notificacao: "Notificação"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campanhas de Marketing</CardTitle>
            <CardDescription>Crie e gerencie campanhas para seus clientes</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Campanha
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : campanhas && campanhas.length > 0 ? (
            <div className="space-y-4">
              {campanhas.map((campanha) => (
                <Card key={campanha.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{campanha.nome}</CardTitle>
                          <Badge variant={statusMap[campanha.status as keyof typeof statusMap]?.variant}>
                            {statusMap[campanha.status as keyof typeof statusMap]?.label}
                          </Badge>
                        </div>
                        {campanha.descricao && (
                          <CardDescription>{campanha.descricao}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Tipo</p>
                          <p className="font-medium">{tipoMap[campanha.tipo as keyof typeof tipoMap]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Destinatários</p>
                          <p className="font-medium">{campanha.total_destinatarios || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Enviados</p>
                          <p className="font-medium">{campanha.total_enviados || 0}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data</p>
                        <p className="font-medium">
                          {campanha.data_envio 
                            ? new Date(campanha.data_envio).toLocaleDateString()
                            : campanha.data_agendamento
                            ? new Date(campanha.data_agendamento).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                    {campanha.status === 'concluida' && campanha.metricas && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Métricas</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Aberturas</p>
                            <p className="font-medium">{(campanha.metricas as any).aberturas || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cliques</p>
                            <p className="font-medium">{(campanha.metricas as any).cliques || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversões</p>
                            <p className="font-medium">{(campanha.metricas as any).conversoes || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma campanha criada ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Campanha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CampanhaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
