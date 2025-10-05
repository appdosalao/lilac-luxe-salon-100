import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Gift, TrendingUp, Star } from "lucide-react";

interface NivelInfo {
  nivel: string;
  nome: string;
  pontos_minimos: number;
  multiplicador_pontos: number;
  desconto_percentual: number;
  cor: string;
  beneficios: string[];
}

interface ClienteFidelidadeCardProps {
  clienteNome: string;
  nivel: string;
  pontosAtual: number;
  pontosDisponiveis: number;
  niveis: NivelInfo[];
}

export function ClienteFidelidadeCard({
  clienteNome,
  nivel,
  pontosAtual,
  pontosDisponiveis,
  niveis
}: ClienteFidelidadeCardProps) {
  const nivelAtualInfo = niveis.find(n => n.nivel === nivel) || niveis[0];
  const proximoNivel = niveis.find(n => n.pontos_minimos > pontosAtual);
  
  const progressoParaProximoNivel = proximoNivel 
    ? ((pontosAtual - nivelAtualInfo.pontos_minimos) / (proximoNivel.pontos_minimos - nivelAtualInfo.pontos_minimos)) * 100
    : 100;

  const getNivelIcon = (nivel: string) => {
    const icons: Record<string, any> = {
      bronze: Star,
      prata: Gift,
      ouro: Trophy,
      platina: TrendingUp
    };
    return icons[nivel] || Star;
  };

  const Icon = getNivelIcon(nivel);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: nivelAtualInfo.cor }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{clienteNome}</CardTitle>
          <Badge 
            variant="secondary"
            className="text-sm"
            style={{ backgroundColor: `${nivelAtualInfo.cor}20`, color: nivelAtualInfo.cor }}
          >
            <Icon className="h-4 w-4 mr-1" />
            {nivelAtualInfo.nome}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Pontos Totais</p>
            <p className="text-2xl font-bold">{pontosAtual.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Disponíveis</p>
            <p className="text-2xl font-bold text-primary">{pontosDisponiveis.toLocaleString()}</p>
          </div>
        </div>

        {proximoNivel && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Próximo nível: {proximoNivel.nome}</span>
              <span className="font-medium">
                {proximoNivel.pontos_minimos - pontosAtual} pts
              </span>
            </div>
            <Progress value={progressoParaProximoNivel} className="h-2" />
          </div>
        )}

        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-2">Benefícios Atuais:</p>
          <ul className="space-y-1">
            {nivelAtualInfo.beneficios.map((beneficio, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {beneficio}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
