import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  X, 
  RefreshCw, 
  Check, 
  Phone,
  MessageCircle,
  TrendingUp,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Agendamento } from '@/types/agendamento';
import { Cliente } from '@/types/cliente';

interface ClienteHistoricoProps {
  cliente: Cliente;
  agendamentos: Agendamento[];
  onClose: () => void;
}

// Normalizar texto para busca
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export function ClienteHistorico({ cliente, agendamentos, onClose }: ClienteHistoricoProps) {
  // Calcular estatísticas do cliente
  const estatisticas = useMemo(() => {
    const agendamentosCliente = agendamentos.filter(ag => ag.clienteId === cliente.id);
    
    const concluidos = agendamentosCliente.filter(ag => ag.status === 'concluido');
    const cancelados = agendamentosCliente.filter(ag => ag.status === 'cancelado');
    const agendados = agendamentosCliente.filter(ag => ag.status === 'agendado');
    
    const totalGasto = concluidos.reduce((sum, ag) => sum + (ag.valorPago || 0), 0);
    const totalServicos = concluidos.length;
    
    // Ordenar por data (mais recente primeiro)
    const historicoOrdenado = [...agendamentosCliente].sort((a, b) => {
      const dataA = new Date(`${a.data}T${a.hora}`);
      const dataB = new Date(`${b.data}T${b.hora}`);
      return dataB.getTime() - dataA.getTime();
    });

    return {
      total: agendamentosCliente.length,
      concluidos: concluidos.length,
      cancelados: cancelados.length,
      agendados: agendados.length,
      totalGasto,
      totalServicos,
      historico: historicoOrdenado
    };
  }, [agendamentos, cliente.id]);

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return telefone;
  };

  const abrirWhatsApp = () => {
    const numeroLimpo = cliente.telefone.replace(/\D/g, '');
    const mensagem = `Olá ${cliente.nome || cliente.nomeCompleto}! Tudo bem?`;
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const ligar = () => {
    window.open(`tel:${cliente.telefone}`, '_self');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><Check className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><X className="h-3 w-3 mr-1" />Cancelado</Badge>;
      case 'agendado':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><Calendar className="h-3 w-3 mr-1" />Agendado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{cliente.nome || cliente.nomeCompleto}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatarTelefone(cliente.telefone)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Ações rápidas */}
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={ligar} className="flex-1 h-9">
            <Phone className="h-4 w-4 mr-2" />
            Ligar
          </Button>
          <Button size="sm" variant="outline" onClick={abrirWhatsApp} className="flex-1 h-9 bg-green-50 hover:bg-green-100 border-green-200">
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-primary">{formatarValor(estatisticas.totalGasto)}</p>
            <p className="text-xs text-muted-foreground">Total Gasto</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <Check className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-600">{estatisticas.concluidos}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <Calendar className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-600">{estatisticas.agendados}</p>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <X className="h-5 w-5 mx-auto text-red-600 mb-1" />
            <p className="text-lg font-bold text-red-600">{estatisticas.cancelados}</p>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </div>
        </div>

        <Separator />

        {/* Histórico de Agendamentos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Histórico Completo ({estatisticas.total})</h3>
          </div>
          
          <ScrollArea className="h-[300px] pr-4">
            {estatisticas.historico.length > 0 ? (
              <div className="space-y-3">
                {estatisticas.historico.map((ag) => (
                  <div 
                    key={ag.id} 
                    className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{ag.servicoNome}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(ag.data + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <Clock className="h-3 w-3 ml-1" />
                          <span>{ag.hora?.slice(0, 5)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {getStatusBadge(ag.status)}
                        <p className="text-sm font-semibold mt-1">
                          {formatarValor(ag.valor)}
                        </p>
                        {ag.valorPago > 0 && ag.valorPago < ag.valor && (
                          <p className="text-xs text-muted-foreground">
                            Pago: {formatarValor(ag.valorPago)}
                          </p>
                        )}
                      </div>
                    </div>
                    {ag.observacoes && (
                      <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded">
                        {ag.observacoes}
                      </p>
                    )}
                    {ag.origem && ag.origem !== 'manual' && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {ag.origem === 'cronograma' ? '📅 Cronograma' : ag.origem === 'online' ? '🌐 Online' : ag.origem}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum agendamento encontrado</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para buscar e exibir clientes
interface BuscaClienteHistoricoProps {
  buscaTexto: string;
  clientes: Cliente[];
  agendamentos: Agendamento[];
  onClienteSelect: (cliente: Cliente | null) => void;
  clienteSelecionado: Cliente | null;
}

export function BuscaClienteHistorico({ 
  buscaTexto, 
  clientes, 
  agendamentos, 
  onClienteSelect,
  clienteSelecionado 
}: BuscaClienteHistoricoProps) {
  // Filtrar clientes baseado na busca
  const clientesFiltrados = useMemo(() => {
    if (!buscaTexto || buscaTexto.length < 2) return [];
    
    const termosNormalizados = normalizeText(buscaTexto).split(/\s+/).filter(Boolean);
    
    return clientes.filter(cliente => {
      const nome = cliente.nome || cliente.nomeCompleto || '';
      const telefone = cliente.telefone?.replace(/\D/g, '') || '';
      const textoCompleto = normalizeText(`${nome} ${telefone}`);
      
      return termosNormalizados.every(termo => textoCompleto.includes(termo));
    }).slice(0, 5); // Limitar a 5 resultados
  }, [buscaTexto, clientes]);

  // Se tem cliente selecionado, mostrar histórico
  if (clienteSelecionado) {
    return (
      <ClienteHistorico 
        cliente={clienteSelecionado} 
        agendamentos={agendamentos} 
        onClose={() => onClienteSelect(null)} 
      />
    );
  }

  // Se não tem texto de busca ou menos de 2 caracteres, não mostrar nada
  if (!buscaTexto || buscaTexto.length < 2) return null;

  // Mostrar lista de clientes encontrados
  if (clientesFiltrados.length === 0) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in">
        <CardContent className="p-4 text-center text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum cliente encontrado para "{buscaTexto}"</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Clientes encontrados ({clientesFiltrados.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {clientesFiltrados.map((cliente) => {
            const agendamentosCliente = agendamentos.filter(ag => ag.clienteId === cliente.id);
            const totalGasto = agendamentosCliente
              .filter(ag => ag.status === 'concluido')
              .reduce((sum, ag) => sum + (ag.valorPago || 0), 0);

            return (
              <button
                key={cliente.id}
                onClick={() => onClienteSelect(cliente)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/80 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{cliente.nome || cliente.nomeCompleto}</p>
                  <p className="text-xs text-muted-foreground">
                    {agendamentosCliente.length} agendamento{agendamentosCliente.length !== 1 ? 's' : ''} • 
                    Total: {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
