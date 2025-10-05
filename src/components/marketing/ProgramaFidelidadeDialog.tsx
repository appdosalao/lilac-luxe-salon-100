import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Gift, Trophy, Zap } from "lucide-react";

interface ProgramaFidelidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgramaFidelidadeDialog({ open, onOpenChange }: ProgramaFidelidadeDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pontosPorReal, setPontosPorReal] = useState("1.00");
  const [valorPonto, setValorPonto] = useState("0.10");
  const [pontosMinimosResgate, setPontosMinimosResgate] = useState("100");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [expiracaoPontos, setExpiracaoPontos] = useState("");
  const [bonusAniversario, setBonusAniversario] = useState("0");
  const [bonusIndicacao, setBonusIndicacao] = useState("0");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const criarPrograma = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('programas_fidelidade').insert({
        user_id: user.id,
        nome,
        descricao,
        pontos_por_real: parseFloat(pontosPorReal),
        valor_ponto: parseFloat(valorPonto),
        pontos_minimos_resgate: parseInt(pontosMinimosResgate),
        data_inicio: dataInicio,
        expiracao_pontos_dias: expiracaoPontos ? parseInt(expiracaoPontos) : null,
        bonus_aniversario: parseInt(bonusAniversario),
        bonus_indicacao: parseInt(bonusIndicacao),
        ativo: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-fidelidade'] });
      toast({
        title: "Programa criado",
        description: "Programa de fidelidade criado com sucesso",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o programa",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setPontosPorReal("1.00");
    setValorPonto("0.10");
    setPontosMinimosResgate("100");
    setDataInicio(new Date().toISOString().split('T')[0]);
    setExpiracaoPontos("");
    setBonusAniversario("0");
    setBonusIndicacao("0");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Programa de Fidelidade</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="niveis">Níveis</TabsTrigger>
            <TabsTrigger value="bonus">Bônus</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basico" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome">Nome do Programa</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Clube VIP"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva as vantagens do programa"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pontosPorReal">Pontos por R$</Label>
                <Input
                  id="pontosPorReal"
                  type="number"
                  step="0.01"
                  value={pontosPorReal}
                  onChange={(e) => setPontosPorReal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="valorPonto">Valor do Ponto (R$)</Label>
                <Input
                  id="valorPonto"
                  type="number"
                  step="0.01"
                  value={valorPonto}
                  onChange={(e) => setValorPonto(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pontosMinimos">Pontos Mínimos para Resgate</Label>
              <Input
                id="pontosMinimos"
                type="number"
                value={pontosMinimosResgate}
                onChange={(e) => setPontosMinimosResgate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="niveis" className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Sistema de Níveis Padrão</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                O sistema inclui 4 níveis progressivos com benefícios crescentes:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: '#CD7F32' }}>Bronze</Badge>
                    <span className="text-sm">0+ pontos</span>
                  </div>
                  <span className="text-sm">1x pontos</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: '#C0C0C0' }}>Prata</Badge>
                    <span className="text-sm">500+ pontos</span>
                  </div>
                  <span className="text-sm">1.2x pontos + 5% desconto</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: '#FFD700' }}>Ouro</Badge>
                    <span className="text-sm">1500+ pontos</span>
                  </div>
                  <span className="text-sm">1.5x pontos + 10% desconto</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: '#E5E4E2' }}>Platina</Badge>
                    <span className="text-sm">3000+ pontos</span>
                  </div>
                  <span className="text-sm">2x pontos + 15% desconto</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Os níveis são atualizados automaticamente conforme o cliente acumula pontos
              </p>
            </div>
          </TabsContent>

          <TabsContent value="bonus" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="expiracaoPontos">Expiração de Pontos (dias)</Label>
              <Input
                id="expiracaoPontos"
                type="number"
                value={expiracaoPontos}
                onChange={(e) => setExpiracaoPontos(e.target.value)}
                placeholder="Deixe vazio para nunca expirar"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pontos expirarão após este período de inatividade
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Bônus Especiais</h3>
              </div>
              
              <div>
                <Label htmlFor="bonusAniversario">Bônus de Aniversário (pontos)</Label>
                <Input
                  id="bonusAniversario"
                  type="number"
                  value={bonusAniversario}
                  onChange={(e) => setBonusAniversario(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pontos extras no dia do aniversário do cliente
                </p>
              </div>
              
              <div>
                <Label htmlFor="bonusIndicacao">Bônus por Indicação (pontos)</Label>
                <Input
                  id="bonusIndicacao"
                  type="number"
                  value={bonusIndicacao}
                  onChange={(e) => setBonusIndicacao(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pontos ganhos ao indicar um novo cliente
                </p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Gamificação Automática</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O sistema registra automaticamente mudanças de nível e distribui recompensas quando configuradas
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => criarPrograma.mutate()} disabled={!nome || criarPrograma.isPending}>
            {criarPrograma.isPending ? "Criando..." : "Criar Programa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
