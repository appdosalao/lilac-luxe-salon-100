import { useState, useEffect } from "react";
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
import { Gift, Trophy, Zap, Plus, Trash2 } from "lucide-react";

interface ProgramaFidelidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programaEdit?: any;
}

export function ProgramaFidelidadeDialog({ open, onOpenChange, programaEdit }: ProgramaFidelidadeDialogProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [pontosPorReal, setPontosPorReal] = useState("1.00");
  const [valorPonto, setValorPonto] = useState("0.10");
  const [pontosMinimosResgate, setPontosMinimosResgate] = useState("100");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [expiracaoPontos, setExpiracaoPontos] = useState("");
  const [bonusAniversario, setBonusAniversario] = useState("0");
  const [bonusIndicacao, setBonusIndicacao] = useState("0");
  const [niveis, setNiveis] = useState([
    { nivel: 'iniciante', nome: 'Iniciante', pontos_minimos: 0, multiplicador_pontos: 1.0, desconto_percentual: 0, cor: '#9CA3AF', beneficios: ['Acúmulo padrão de pontos'] }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carregar dados do programa ao editar
  useEffect(() => {
    if (programaEdit && open) {
      setNome(programaEdit.nome || "");
      setDescricao(programaEdit.descricao || "");
      setPontosPorReal(programaEdit.pontos_por_real?.toString() || "1.00");
      setValorPonto(programaEdit.valor_ponto?.toString() || "0.10");
      setPontosMinimosResgate(programaEdit.pontos_minimos_resgate?.toString() || "100");
      setDataInicio(programaEdit.data_inicio || new Date().toISOString().split('T')[0]);
      setExpiracaoPontos(programaEdit.expiracao_pontos_dias?.toString() || "");
      setBonusAniversario(programaEdit.bonus_aniversario?.toString() || "0");
      setBonusIndicacao(programaEdit.bonus_indicacao?.toString() || "0");
      
      // Carregar configuração de níveis se existir
      if (programaEdit.niveis_config) {
        setNiveis(programaEdit.niveis_config);
      }
    } else if (!programaEdit && open) {
      resetForm();
    }
  }, [programaEdit, open]);

  const salvarPrograma = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const programaData = {
        nome,
        descricao,
        pontos_por_real: parseFloat(pontosPorReal),
        valor_ponto: parseFloat(valorPonto),
        pontos_minimos_resgate: parseInt(pontosMinimosResgate),
        data_inicio: dataInicio,
        expiracao_pontos_dias: expiracaoPontos ? parseInt(expiracaoPontos) : null,
        bonus_aniversario: parseInt(bonusAniversario),
        bonus_indicacao: parseInt(bonusIndicacao),
        niveis_config: niveis,
      };

      if (programaEdit) {
        // Atualizar programa existente
        const { data, error } = await supabase
          .from('programas_fidelidade')
          .update(programaData)
          .eq('id', programaEdit.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo programa
        const { data, error } = await supabase
          .from('programas_fidelidade')
          .insert({
            ...programaData,
            user_id: user.id,
            ativo: true
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: async (programa) => {
      queryClient.invalidateQueries({ queryKey: ['programas-fidelidade'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-fidelidade'] });
      
      if (programaEdit) {
        toast({
          title: "Programa atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Aguardar um momento para o trigger processar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Buscar quantos clientes foram cadastrados
        const { count } = await supabase
          .from('pontos_fidelidade')
          .select('*', { count: 'exact', head: true })
          .eq('programa_id', programa.id);
        
        toast({
          title: "Programa criado com sucesso!",
          description: count 
            ? `${count} cliente${count > 1 ? 's' : ''} ${count > 1 ? 'foram cadastrados' : 'foi cadastrado'} automaticamente com pontos retroativos baseados no histórico de gastos.`
            : "O programa foi criado. Clientes serão cadastrados automaticamente conforme realizarem pagamentos.",
        });
      }
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: programaEdit ? "Não foi possível atualizar o programa" : "Não foi possível criar o programa",
        variant: "destructive",
      });
    }
  });

  const adicionarNivel = () => {
    const novoNivel = {
      nivel: `nivel_${Date.now()}`,
      nome: `Nível ${niveis.length + 1}`,
      pontos_minimos: niveis[niveis.length - 1].pontos_minimos + 500,
      multiplicador_pontos: 1.0,
      desconto_percentual: 0,
      cor: '#3B82F6',
      beneficios: []
    };
    setNiveis([...niveis, novoNivel]);
  };

  const removerNivel = (index: number) => {
    if (niveis.length > 1) {
      setNiveis(niveis.filter((_, i) => i !== index));
    }
  };

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
    setNiveis([
      { nivel: 'iniciante', nome: 'Iniciante', pontos_minimos: 0, multiplicador_pontos: 1.0, desconto_percentual: 0, cor: '#9CA3AF', beneficios: ['Acúmulo padrão de pontos'] }
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{programaEdit ? 'Editar Programa de Fidelidade' : 'Novo Programa de Fidelidade'}</DialogTitle>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Configure os Níveis de Fidelidade</h3>
                </div>
                <Button onClick={adicionarNivel} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Nível
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Crie e personalize seus próprios níveis de fidelidade
              </p>
              
              <div className="space-y-3">
                {niveis.map((nivel, index) => (
                  <div key={nivel.nivel} className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge style={{ backgroundColor: nivel.cor, color: '#fff' }}>{nivel.nome}</Badge>
                      {niveis.length > 1 && (
                        <Button
                          onClick={() => removerNivel(index)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`nome-${nivel.nivel}`}>Nome do Nível</Label>
                        <Input
                          id={`nome-${nivel.nivel}`}
                          value={nivel.nome}
                          onChange={(e) => {
                            const novosNiveis = [...niveis];
                            novosNiveis[index].nome = e.target.value;
                            setNiveis(novosNiveis);
                          }}
                          placeholder="Ex: VIP, Premium..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`cor-${nivel.nivel}`}>Cor</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`cor-${nivel.nivel}`}
                            type="color"
                            value={nivel.cor}
                            onChange={(e) => {
                              const novosNiveis = [...niveis];
                              novosNiveis[index].cor = e.target.value;
                              setNiveis(novosNiveis);
                            }}
                            className="w-20 h-10"
                          />
                          <Input
                            value={nivel.cor}
                            onChange={(e) => {
                              const novosNiveis = [...niveis];
                              novosNiveis[index].cor = e.target.value;
                              setNiveis(novosNiveis);
                            }}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`pontos-${nivel.nivel}`}>Pontos Mínimos</Label>
                        <Input
                          id={`pontos-${nivel.nivel}`}
                          type="number"
                          value={nivel.pontos_minimos}
                          onChange={(e) => {
                            const novosNiveis = [...niveis];
                            novosNiveis[index].pontos_minimos = parseInt(e.target.value) || 0;
                            setNiveis(novosNiveis);
                          }}
                          disabled={index === 0}
                        />
                        {index === 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">Nível inicial</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`mult-${nivel.nivel}`}>Multiplicador</Label>
                        <Input
                          id={`mult-${nivel.nivel}`}
                          type="number"
                          step="0.1"
                          value={nivel.multiplicador_pontos}
                          onChange={(e) => {
                            const novosNiveis = [...niveis];
                            novosNiveis[index].multiplicador_pontos = parseFloat(e.target.value) || 1.0;
                            setNiveis(novosNiveis);
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-0.5">{nivel.multiplicador_pontos}x pontos</p>
                      </div>
                      
                      <div>
                        <Label htmlFor={`desc-${nivel.nivel}`}>Desconto (%)</Label>
                        <Input
                          id={`desc-${nivel.nivel}`}
                          type="number"
                          value={nivel.desconto_percentual}
                          onChange={(e) => {
                            const novosNiveis = [...niveis];
                            novosNiveis[index].desconto_percentual = parseInt(e.target.value) || 0;
                            setNiveis(novosNiveis);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 Os níveis são atualizados automaticamente quando o cliente atinge os pontos mínimos configurados
                </p>
              </div>
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
              <p className="text-sm font-medium">🚀 Automação Total</p>
              <p className="text-xs text-muted-foreground mt-1">
                • Clientes são cadastrados automaticamente com pontos retroativos baseados no histórico de gastos
              </p>
              <p className="text-xs text-muted-foreground">
                • Pontos são atribuídos automaticamente quando pagamentos são registrados
              </p>
              <p className="text-xs text-muted-foreground">
                • Níveis são atualizados automaticamente conforme os clientes acumulam pontos
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
          <Button onClick={() => salvarPrograma.mutate()} disabled={!nome || salvarPrograma.isPending}>
            {salvarPrograma.isPending ? "Salvando..." : programaEdit ? "Salvar Alterações" : "Criar Programa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
