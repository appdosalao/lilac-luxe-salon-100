import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export function SincronizacaoAutomatica() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Sincronização Automática
              <Badge variant="outline" className="bg-primary/10">Ativo</Badge>
            </CardTitle>
            <CardDescription>
              Sistema totalmente automatizado e integrado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Pontos Automáticos</p>
              <p className="text-xs text-muted-foreground">
                Sempre que um agendamento for marcado como "pago", os pontos são calculados e atribuídos automaticamente ao cliente baseado no valor pago e nível atual
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Cadastro Inteligente</p>
              <p className="text-xs text-muted-foreground">
                Ao criar um programa de fidelidade, o sistema identifica automaticamente todos os clientes com histórico de compras e os cadastra com pontos retroativos
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Níveis Progressivos</p>
              <p className="text-xs text-muted-foreground">
                O sistema atualiza automaticamente o nível dos clientes (Bronze → Prata → Ouro → Platina) conforme acumulam pontos, aplicando multiplicadores crescentes
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground italic text-center">
            ✨ Tudo funciona nos bastidores. Você só precisa criar o programa e registrar os pagamentos!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}