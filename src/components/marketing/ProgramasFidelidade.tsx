import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Gift, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgramaFidelidadeDialog } from "./ProgramaFidelidadeDialog";
import { Badge } from "@/components/ui/badge";

export function ProgramasFidelidade() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: programas, isLoading } = useQuery({
    queryKey: ['programas-fidelidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programas_fidelidade')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-fidelidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pontos_fidelidade')
        .select('pontos_totais, pontos_disponiveis, cliente_id');
      
      if (error) throw error;
      
      const totalPontos = data?.reduce((sum, p) => sum + p.pontos_totais, 0) || 0;
      const pontosDisponiveis = data?.reduce((sum, p) => sum + p.pontos_disponiveis, 0) || 0;
      const clientesAtivos = new Set(data?.map(p => p.cliente_id)).size;
      
      return { totalPontos, pontosDisponiveis, clientesAtivos };
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.totalPontos || 0}</div>
            <p className="text-xs text-muted-foreground">pontos distribuídos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Disponíveis</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.pontosDisponiveis || 0}</div>
            <p className="text-xs text-muted-foreground">prontos para resgate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas?.clientesAtivos || 0}</div>
            <p className="text-xs text-muted-foreground">no programa</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Programas de Fidelidade</CardTitle>
            <CardDescription>Crie e gerencie seus programas de pontos</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Programa
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : programas && programas.length > 0 ? (
            <div className="space-y-4">
              {programas.map((programa) => (
                <Card key={programa.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{programa.nome}</CardTitle>
                        {programa.descricao && (
                          <CardDescription>{programa.descricao}</CardDescription>
                        )}
                      </div>
                      <Badge variant={programa.ativo ? "default" : "secondary"}>
                        {programa.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pontos por R$</p>
                        <p className="font-medium">{programa.pontos_por_real}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor do Ponto</p>
                        <p className="font-medium">R$ {programa.valor_ponto}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mín. Resgate</p>
                        <p className="font-medium">{programa.pontos_minimos_resgate} pts</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {new Date(programa.data_inicio).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum programa de fidelidade criado ainda
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Programa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramaFidelidadeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
