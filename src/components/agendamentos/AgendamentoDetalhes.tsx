import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  DollarSign, 
  Edit, 
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Check,
  X,
  CreditCard,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Agendamento } from '@/types/agendamento';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface AgendamentoDetalhesProps {
  agendamento: Agendamento;
  cliente: {
    nome: string;
    telefone: string;
    email?: string;
  };
  servico: {
    nome: string;
    descricao?: string;
  };
  onEdit: () => void;
  onBack: () => void;
  onCancel: () => void;
  onMarcarPagamento?: () => void;
}

const statusConfig = {
  agendado: { 
    label: 'Agendado', 
    color: 'bg-info text-info-foreground', 
    icon: Calendar,
    description: 'Agendamento confirmado'
  },
  concluido: { 
    label: 'Concluído', 
    color: 'bg-success text-success-foreground', 
    icon: Check,
    description: 'Serviço realizado com sucesso'
  },
  cancelado: { 
    label: 'Cancelado', 
    color: 'bg-destructive text-destructive-foreground', 
    icon: X,
    description: 'Agendamento cancelado'
  },
};

export default function AgendamentoDetalhes({
  agendamento,
  cliente,
  servico,
  onEdit,
  onBack,
  onCancel,
  onMarcarPagamento,
}: AgendamentoDetalhesProps) {
  const { user } = useSupabaseAuth();
  const [pontos, setPontos] = useState<number | null>(null);
  const [pontosPotenciais, setPontosPotenciais] = useState<number | null>(null);
  
  useEffect(() => {
    const carregarPontos = async () => {
      if (!user) return;
      try {
        const { data: creditos } = await supabase
          .from('pontos_fidelidade')
          .select('pontos')
          .eq('user_id', user.id)
          .eq('origem', 'agendamento')
          .eq('origem_id', agendamento.id);
        if (creditos && creditos.length > 0) {
          const total = creditos.reduce((s: number, r: any) => s + Number(r.pontos || 0), 0);
          setPontos(total);
        } else {
          const { data: programa } = await supabase
            .from('programas_fidelidade')
            .select('*')
            .eq('user_id', user.id)
            .eq('ativo', true)
            .limit(1)
            .single();
          if (programa) {
            const parseValor = (v: any): number => {
              if (typeof v === 'number') return v;
              if (typeof v === 'string') {
                const s = v.replace(/\./g, '').replace(',', '.');
                const n = Number(s);
                return isNaN(n) ? 0 : n;
              }
              return 0;
            };
            const base = parseValor(agendamento.valorPago) > 0 ? parseValor(agendamento.valorPago) : parseValor(agendamento.valor);
            const ppr = Number((programa as any).pontos_por_real || 1);
            setPontosPotenciais(Math.floor(base * (isNaN(ppr) ? 1 : ppr)));
          }
        }
      } catch {
        // ignore
      }
    };
    carregarPontos();
  }, [agendamento.id, agendamento.valor, agendamento.valorPago, user]);
  const formatarData = (data: string) => {
    // Garantir que a data seja interpretada como local, não UTC
    const [year, month, day] = data.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return format(localDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatarHora = (hora: string) => {
    return hora.slice(0, 5);
  };

  const formatarDuracao = (duracao: number) => {
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const formatarDataHora = (data: string) => {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const calcularHoraFim = () => {
    const inicio = new Date(`${agendamento.data}T${agendamento.hora}`);
    const fim = new Date(inicio.getTime() + agendamento.duracao * 60000);
    return fim.toTimeString().slice(0, 5);
  };

  const StatusIcon = statusConfig[agendamento.status].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Button>
        
        <div className="flex flex-wrap gap-2">
          {agendamento.status === 'agendado' && agendamento.statusPagamento !== 'pago' && onMarcarPagamento && (
            <Button 
              variant="default" 
              onClick={onMarcarPagamento}
              className="bg-success hover:bg-success/90"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Marcar Pagamento
            </Button>
          )}
          {agendamento.status === 'agendado' && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
          <Button onClick={onEdit} className="bg-gradient-to-r from-primary to-lilac-primary">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Card principal */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Detalhes do Agendamento</CardTitle>
            <Badge className={statusConfig[agendamento.status].color}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusConfig[agendamento.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {statusConfig[agendamento.status].description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Informações do agendamento */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Data e Hora
              </h3>
              
              <div className="space-y-3 pl-7">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Data</Label>
                  <p className="text-lg capitalize">{formatarData(agendamento.data)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Horário</Label>
                  <p className="text-lg">
                    {formatarHora(agendamento.hora)} às {calcularHoraFim()}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Duração</Label>
                  <p className="text-lg">{formatarDuracao(agendamento.duracao)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Informações de Pagamento
              </h3>
              
              <div className="pl-7 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Valor Total</Label>
                  <p className="text-2xl font-bold text-primary">{formatarValor(agendamento.valor)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor Pago</Label>
                    <p className="text-lg font-semibold text-success">{formatarValor(agendamento.valorPago)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Valor Devido</Label>
                    <p className={`text-lg font-semibold ${agendamento.valorDevido > 0 ? 'text-destructive' : 'text-success'}`}>
                      {formatarValor(agendamento.valorDevido)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">
                        {agendamento.formaPagamento === 'cartao' ? 'Cartão' :
                         agendamento.formaPagamento === 'pix' ? 'PIX' :
                         agendamento.formaPagamento === 'dinheiro' ? 'Dinheiro' : 'Fiado'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status do Pagamento</Label>
                    <Badge 
                      className={`mt-1 ${
                        agendamento.statusPagamento === 'pago' ? 'bg-success text-success-foreground' :
                        agendamento.statusPagamento === 'parcial' ? 'bg-warning text-warning-foreground' :
                        'bg-destructive text-destructive-foreground'
                      }`}
                    >
                      {agendamento.statusPagamento === 'pago' ? '✓ Pago' :
                       agendamento.statusPagamento === 'parcial' ? '⚠ Parcial' :
                       '⏳ Em aberto'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fidelidade */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Fidelidade
            </h3>
            <div className="pl-7 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Pontos deste atendimento</Label>
                {pontos !== null ? (
                  <Badge className="bg-primary/10 text-primary">+{pontos} pontos</Badge>
                ) : pontosPotenciais !== null ? (
                  <Badge variant="outline" className="bg-accent/50">Estimado: +{pontosPotenciais} pontos</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem pontos registrados</span>
                )}
              </div>
              <Button variant="outline" onClick={() => (window.location.href = '/marketing')} className="gap-2">
                Abrir Marketing
              </Button>
            </div>
          </div>

          <Separator />

          {/* Informações do cliente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Cliente
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2 pl-7">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                <p className="text-lg font-medium">{cliente.nome}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                <p className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {cliente.telefone}
                </p>
              </div>
              
              {cliente.email && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                  <p className="text-lg flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {cliente.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações do serviço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Serviço
            </h3>
            
            <div className="pl-7 space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nome do serviço</Label>
                <p className="text-lg font-medium">{servico.nome}</p>
              </div>
              
              {servico.descricao && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p className="text-base">{servico.descricao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {agendamento.observacoes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Observações
                </h3>
                
                <div className="pl-7">
                  <p className="text-base leading-relaxed bg-muted/50 p-4 rounded-lg">
                    {agendamento.observacoes}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadados */}
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <Label className="font-medium">Criado em</Label>
              <p>{formatarDataHora(agendamento.createdAt)}</p>
            </div>
            
            <div>
              <Label className="font-medium">Última atualização</Label>
              <p>{formatarDataHora(agendamento.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
