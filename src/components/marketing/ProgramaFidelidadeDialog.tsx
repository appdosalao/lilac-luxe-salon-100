import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProgramaFidelidade {
  id: string;
  nome: string;
  descricao?: string;
  pontos_por_real: number;
  valor_ponto: number;
  pontos_minimos_resgate: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
}

interface ProgramaFidelidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programa?: ProgramaFidelidade | null;
}

export function ProgramaFidelidadeDialog({ open, onOpenChange, programa }: ProgramaFidelidadeDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pontosPorReal, setPontosPorReal] = useState("1.00");
  const [valorPonto, setValorPonto] = useState("0.10");
  const [pontosMinimosResgate, setPontosMinimosResgate] = useState("100");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState("");

  // Preencher formulário quando programa for editado
  useEffect(() => {
    if (programa) {
      setNome(programa.nome);
      setDescricao(programa.descricao || "");
      setPontosPorReal(programa.pontos_por_real.toString());
      setValorPonto(programa.valor_ponto.toString());
      setPontosMinimosResgate(programa.pontos_minimos_resgate.toString());
      setDataInicio(programa.data_inicio);
      setDataFim(programa.data_fim || "");
    } else {
      resetForm();
    }
  }, [programa, open]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const salvarPrograma = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const dados = {
        user_id: user.id,
        nome,
        descricao: descricao || null,
        pontos_por_real: parseFloat(pontosPorReal),
        valor_ponto: parseFloat(valorPonto),
        pontos_minimos_resgate: parseInt(pontosMinimosResgate),
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        ativo: true
      };

      if (programa) {
        // Atualizar programa existente
        const { error } = await supabase
          .from('programas_fidelidade')
          .update(dados)
          .eq('id', programa.id);
        if (error) throw error;
      } else {
        // Criar novo programa
        const { error } = await supabase
          .from('programas_fidelidade')
          .insert(dados);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-fidelidade'] });
      toast({
        title: programa ? "Programa atualizado" : "Programa criado",
        description: programa 
          ? "Programa de fidelidade atualizado com sucesso"
          : "Programa de fidelidade criado com sucesso",
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
    setDataFim("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {programa ? "Editar Programa de Fidelidade" : "Novo Programa de Fidelidade"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data de Término (Opcional)</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => salvarPrograma.mutate()} disabled={!nome || salvarPrograma.isPending}>
              {salvarPrograma.isPending ? "Salvando..." : (programa ? "Atualizar" : "Criar Programa")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
