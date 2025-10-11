import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Link, Share2, Gift, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SistemaReferencias() {
  const [emailIndicado, setEmailIndicado] = useState("");
  const [telefoneIndicado, setTelefoneIndicado] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar programa ativo e estatísticas de indicações
  const { data: dadosReferencia } = useQuery({
    queryKey: ['dados-referencia'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar programa ativo com bonus de indicação
      const { data: programa } = await supabase
        .from('programas_fidelidade')
        .select('id, nome, bonus_indicacao')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .gt('bonus_indicacao', 0)
        .single();

      if (!programa) return null;

      // Buscar indicações realizadas (via histórico)
      const { data: indicacoes } = await supabase
        .from('historico_pontos')
        .select('*, clientes!inner(nome, telefone)')
        .eq('user_id', user.id)
        .eq('tipo', 'indicacao')
        .order('created_at', { ascending: false });

      return {
        programa,
        indicacoes: indicacoes || [],
        totalIndicacoes: indicacoes?.length || 0
      };
    }
  });

  const registrarIndicacao = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (!dadosReferencia?.programa) throw new Error("Nenhum programa ativo encontrado");

      // Criar novo cliente indicado
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          user_id: user.id,
          nome: emailIndicado.split('@')[0], // Temporário, será atualizado quando cliente se cadastrar
          email: emailIndicado,
          telefone: telefoneIndicado,
          observacoes: 'Cliente indicado via programa de referências'
        })
        .select()
        .single();

      if (clienteError) throw clienteError;

      // Simular bônus de indicação (será ativado quando cliente fizer primeiro agendamento)
      toast({
        title: "✅ Indicação Registrada!",
        description: `Você receberá ${dadosReferencia.programa.bonus_indicacao} pontos quando ${emailIndicado} realizar o primeiro agendamento.`,
      });

      return novoCliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dados-referencia'] });
      setEmailIndicado("");
      setTelefoneIndicado("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a indicação",
        variant: "destructive",
      });
    }
  });

  if (!dadosReferencia?.programa) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sistema de Referências
          </CardTitle>
          <CardDescription>
            Ative um programa de fidelidade com bônus de indicação para usar este recurso
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Indique e Ganhe
          </CardTitle>
          <CardDescription>
            Ganhe {dadosReferencia.programa.bonus_indicacao} pontos por cada amigo que você indicar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-primary/10 border-primary/20">
            <Gift className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Como funciona:</strong> Indique amigos para conhecerem nossos serviços. Quando eles realizarem o primeiro agendamento, você ganha {dadosReferencia.programa.bonus_indicacao} pontos automaticamente!
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email">E-mail do Amigo</Label>
              <Input
                id="email"
                type="email"
                placeholder="amigo@email.com"
                value={emailIndicado}
                onChange={(e) => setEmailIndicado(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefoneIndicado}
                onChange={(e) => setTelefoneIndicado(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => registrarIndicacao.mutate()} 
              disabled={!emailIndicado || registrarIndicacao.isPending}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {registrarIndicacao.isPending ? "Registrando..." : "Enviar Indicação"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {dadosReferencia.indicacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Suas Indicações ({dadosReferencia.totalIndicacoes})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosReferencia.indicacoes.map((indicacao: any) => (
                <div
                  key={indicacao.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{indicacao.clientes?.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(indicacao.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="default">
                    +{indicacao.pontos} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
