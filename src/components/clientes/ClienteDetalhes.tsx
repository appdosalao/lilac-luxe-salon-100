import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Phone, MessageCircle, Calendar, FileText, Edit, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Cliente } from "@/types/cliente";
import ClienteForm from "./ClienteForm";
import { supabase } from "@/integrations/supabase/client";

interface ClienteDetalhesProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (cliente: Cliente) => void;
}

export default function ClienteDetalhes({ cliente, open, onOpenChange, onEdit }: ClienteDetalhesProps) {
  const [vendasCliente, setVendasCliente] = useState<any[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(true);
  const [historicoServicosLocal, setHistoricoServicosLocal] = useState(cliente?.historicoServicos || []);

  useEffect(() => {
    if (cliente && open) {
      carregarVendasCliente();
      carregarHistoricoServicos();
    }
  }, [cliente?.id, open]);

  const carregarVendasCliente = async () => {
    if (!cliente) return;
    
    try {
      setLoadingVendas(true);
      const { data, error } = await supabase
        .from('vendas_produtos')
        .select('*, itens_venda(*)')
        .eq('cliente_id', cliente.id)
        .order('data_venda', { ascending: false });

      if (error) throw error;
      setVendasCliente(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoadingVendas(false);
    }
  };

  const carregarHistoricoServicos = async () => {
    if (!cliente) return;
    try {
      const parseValor = (v: any): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const s = v.replace(/\./g, '').replace(',', '.');
          const n = Number(s);
          return isNaN(n) ? 0 : n;
        }
        return 0;
      };
      const { data: ags, error } = await supabase
        .from('agendamentos')
        .select('id, servico_id, data, hora, valor, valor_pago, status')
        .eq('cliente_id', cliente.id)
        .neq('status', 'cancelado')
        .order('data', { ascending: false });
      if (error) throw error;
      const { data: servs } = await supabase
        .from('servicos')
        .select('id, nome');
      const nomeMap = new Map((servs || []).map((s: any) => [s.id, s.nome]));
      const hist = (ags || []).map(a => ({
        id: a.id,
        data: new Date(`${a.data}T${(a as any).hora || '00:00'}`),
        servico: nomeMap.get(a.servico_id) || 'Serviço',
        valor: (() => {
          const vp = parseValor((a as any).valor_pago);
          const vt = parseValor((a as any).valor);
          return vp > 0 ? vp : vt;
        })()
      }));
      setHistoricoServicosLocal(hist);
    } catch {
      setHistoricoServicosLocal(cliente?.historicoServicos || []);
    }
  };

  if (!cliente) return null;

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return telefone;
  };

  const abrirWhatsApp = (telefone: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${numeroLimpo}`;
    window.open(url, '_blank');
  };

  const ligar = (telefone: string) => {
    window.open(`tel:${telefone}`, '_self');
  };

  const totalGasto = (historicoServicosLocal || []).reduce((total, servico) => total + servico.valor, 0);
  const totalGastoVendas = vendasCliente.reduce((total, venda) => total + Number(venda.valor_total), 0);
  const totalGeralGasto = totalGasto + totalGastoVendas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent">
              {cliente.nomeCompleto}
            </DialogTitle>
            <ClienteForm
              cliente={cliente}
              onSubmit={(data) => onEdit({ ...cliente, ...data })}
              trigger={
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              }
            />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações de Contato */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">{formatarTelefone(cliente.telefone)}</span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => ligar(cliente.telefone)}
                    className="h-8"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Ligar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => abrirWhatsApp(cliente.telefone)}
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-lilac-primary" />
                <span>Última visita: </span>
                <Badge variant="secondary">
                  {cliente.ultimaVisita ? (() => {
                    try {
                      const data = typeof cliente.ultimaVisita === 'string' ? new Date(cliente.ultimaVisita) : cliente.ultimaVisita;
                      return isNaN(data.getTime()) ? 'Data inválida' : format(data, "dd 'de' MMMM, yyyy", { locale: ptBR });
                    } catch (error) {
                      return 'Data inválida';
                    }
                  })() : 'Não informado'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-pink-accent" />
                <span>Serviço frequente: </span>
                <Badge variant="outline" className="bg-accent/50">
                  {cliente.servicoFrequente}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro do Cliente</CardTitle>
              <CardDescription>
                Serviços: R$ {totalGasto.toFixed(2)} • Produtos: R$ {totalGastoVendas.toFixed(2)} • Total: R$ {totalGeralGasto.toFixed(2)}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Histórico de Serviços */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Serviços</CardTitle>
              <CardDescription>
                Total de {historicoServicosLocal.length} serviços realizados • 
                Valor total: R$ {totalGasto.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicoServicosLocal.length > 0 ? (
                <div className="space-y-3">
                  {historicoServicosLocal
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map((servico) => (
                      <div key={servico.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                        <div>
                          <p className="font-medium">{servico.servico}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(servico.data, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          R$ {servico.valor.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Compras de Produtos */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Histórico de Compras de Produtos
              </CardTitle>
              <CardDescription>
                Total de {vendasCliente.length} compras • 
                Valor total: R$ {totalGastoVendas.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingVendas ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando compras...
                </div>
              ) : vendasCliente.length > 0 ? (
                <div className="space-y-3">
                  {vendasCliente.map((venda) => (
                    <div key={venda.id} className="p-3 rounded-lg border border-border/50 bg-background/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Compra de Produtos</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          R$ {Number(venda.valor_total).toFixed(2)}
                        </Badge>
                      </div>
                      {venda.itens_venda && venda.itens_venda.length > 0 && (
                        <div className="pl-4 border-l-2 border-border/50 space-y-1">
                          {venda.itens_venda.map((item: any) => (
                            <p key={item.id} className="text-sm text-muted-foreground">
                              • {item.quantidade}x - R$ {Number(item.valor_unitario).toFixed(2)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma compra de produtos registrada ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Gasto Geral */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-lilac-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto (Serviços + Produtos)</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent">
                    R$ {totalGeralGasto.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Serviços: R$ {totalGasto.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Produtos: R$ {totalGastoVendas.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {cliente.observacoes && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {cliente.observacoes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
