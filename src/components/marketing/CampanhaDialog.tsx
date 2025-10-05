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

interface CampanhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampanhaDialog({ open, onOpenChange }: CampanhaDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<string>("email");
  const [segmento, setSegmento] = useState<string>("todos");
  const [mensagem, setMensagem] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const criarCampanha = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('campanhas_marketing').insert({
        user_id: user.id,
        nome,
        descricao,
        tipo,
        segmento_clientes: segmento,
        mensagem,
        status: 'rascunho'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas-marketing'] });
      toast({
        title: "Campanha criada",
        description: "Campanha salva como rascunho",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a campanha",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setTipo("email");
    setSegmento("todos");
    setMensagem("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Campanha</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Promoção de Verão"
            />
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Objetivo da campanha"
            />
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="notificacao">Notificação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="segmento">Segmento de Clientes</Label>
            <Select value={segmento} onValueChange={setSegmento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                <SelectItem value="ativos">Clientes Ativos</SelectItem>
                <SelectItem value="inativos">Clientes Inativos</SelectItem>
                <SelectItem value="aniversariantes">Aniversariantes do Mês</SelectItem>
                <SelectItem value="fidelidade">Programa de Fidelidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem que será enviada"
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => criarCampanha.mutate()} disabled={!nome || !mensagem || criarCampanha.isPending}>
              {criarCampanha.isPending ? "Criando..." : "Criar Rascunho"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
