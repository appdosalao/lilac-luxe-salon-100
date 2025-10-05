import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AutomacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomacaoDialog({ open, onOpenChange }: AutomacaoDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [gatilho, setGatilho] = useState<string>("novo_agendamento");
  const [acaoTipo, setAcaoTipo] = useState<string>("email");
  const [acaoMensagem, setAcaoMensagem] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const criarAutomacao = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const acoes = {
        tipo: acaoTipo,
        mensagem: acaoMensagem
      };

      const { error } = await supabase.from('automacoes_marketing').insert({
        user_id: user.id,
        nome,
        descricao,
        gatilho,
        acoes,
        ativo: true
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automacoes-marketing'] });
      toast({
        title: "Automação criada",
        description: "Automação ativada com sucesso",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a automação",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setGatilho("novo_agendamento");
    setAcaoTipo("email");
    setAcaoMensagem("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Automação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Automação</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Boas-vindas Novo Cliente"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo da automação"
            />
          </div>
          <div>
            <Label htmlFor="gatilho">Gatilho (Quando executar)</Label>
            <Select value={gatilho} onValueChange={setGatilho}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo_agendamento">Novo Agendamento</SelectItem>
                <SelectItem value="agendamento_confirmado">Agendamento Confirmado</SelectItem>
                <SelectItem value="agendamento_cancelado">Agendamento Cancelado</SelectItem>
                <SelectItem value="aniversario">Aniversário do Cliente</SelectItem>
                <SelectItem value="ausencia_dias">Cliente Ausente (X dias)</SelectItem>
                <SelectItem value="primeira_visita">Primeira Visita</SelectItem>
                <SelectItem value="fidelidade_nivel">Novo Nível de Fidelidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acaoTipo">Tipo de Ação</Label>
            <Select value={acaoTipo} onValueChange={setAcaoTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Enviar E-mail</SelectItem>
                <SelectItem value="sms">Enviar SMS</SelectItem>
                <SelectItem value="whatsapp">Enviar WhatsApp</SelectItem>
                <SelectItem value="notificacao">Enviar Notificação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acaoMensagem">Mensagem</Label>
            <Textarea
              id="acaoMensagem"
              value={acaoMensagem}
              onChange={(e) => setAcaoMensagem(e.target.value)}
              placeholder="Mensagem que será enviada automaticamente"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criarAutomacao.mutate()} disabled={!nome || !acaoMensagem || criarAutomacao.isPending}>
              {criarAutomacao.isPending ? "Criando..." : "Criar e Ativar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
