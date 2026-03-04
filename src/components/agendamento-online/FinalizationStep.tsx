import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, Clock, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AgendamentoOnlineData } from '@/types/agendamento-online';

interface FinalizationStepProps {
  formData: AgendamentoOnlineData;
  servicoSelecionado: any;
  produtos: any[];
  produtoEnabled: boolean;
  setProdutoEnabled: (v: boolean) => void;
  produtoCategoria: string;
  setProdutoCategoria: (v: string) => void;
  produtoOrdenacao: string;
  setProdutoOrdenacao: (v: string) => void;
  produtoId: string;
  setProdutoId: (v: string) => void;
  produtoQtd: number;
  setProdutoQtd: (v: number) => void;
  produtoForma: string;
  setProdutoForma: (v: string) => void;
  taxaAccepted: boolean;
  setTaxaAccepted: (v: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
}

export function FinalizationStep({
  formData,
  servicoSelecionado,
  produtos,
  produtoEnabled,
  setProdutoEnabled,
  produtoCategoria,
  setProdutoCategoria,
  produtoOrdenacao,
  setProdutoOrdenacao,
  produtoId,
  setProdutoId,
  produtoQtd,
  setProdutoQtd,
  produtoForma,
  setProdutoForma,
  taxaAccepted,
  setTaxaAccepted,
  termsAccepted,
  setTermsAccepted
}: FinalizationStepProps) {
  return (
    <div className="space-y-6">
      {/* Produtos opcionais */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Produtos (opcional)
        </h3>
        <div className="flex items-start gap-3">
          <Checkbox
            id="produtoEnabled"
            checked={produtoEnabled}
            onCheckedChange={(checked) => setProdutoEnabled(!!checked)}
          />
          <Label htmlFor="produtoEnabled" className="text-sm leading-5">
            Desejo comprar um produto do salão junto com o agendamento
          </Label>
        </div>
        {produtoEnabled && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <Label>Categoria</Label>
                <Select value={produtoCategoria} onValueChange={(v) => setProdutoCategoria(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {[...new Set(produtos.map(p => p.categoria).filter(Boolean))].map((c) => (
                      <SelectItem key={String(c)} value={String(c)}>{String(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordenar por</Label>
                <Select value={produtoOrdenacao} onValueChange={(v: any) => setProdutoOrdenacao(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="preco">Preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos
                    .filter(p => produtoCategoria === 'todas' || String(p.categoria) === produtoCategoria)
                    .sort((a, b) => {
                      if (produtoOrdenacao === 'nome') return a.nome.localeCompare(b.nome);
                      const av = typeof a.valor === 'number' ? a.valor! : 0;
                      const bv = typeof b.valor === 'number' ? b.valor! : 0;
                      return av - bv;
                    })
                    .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}{typeof p.valor === 'number' ? ` — R$ ${p.valor.toFixed(2)}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={produtoQtd}
                onChange={(e) => setProdutoQtd(Math.max(1, Number(e.target.value)))}
                placeholder="Quantidade"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Label className="sm:col-span-1">Forma de pagamento</Label>
              <div className="sm:col-span-2">
                <Select value={produtoForma} onValueChange={setProdutoForma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          O pagamento do produto será finalizado no atendimento. Seleção aqui registra sua intenção de compra.
        </p>
      </div>

      {/* Resumo do Agendamento */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Resumo do Agendamento
        </h3>
        <div className="space-y-2 text-sm">
          <p><strong>Nome:</strong> {formData.nome_completo}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Telefone:</strong> {formData.telefone}</p>
          <p><strong>Serviço:</strong> {servicoSelecionado?.nome}</p>
          <p><strong>Data:</strong> {formData.data ? new Date(formData.data).toLocaleDateString('pt-BR') : '-'}</p>
          <p><strong>Horário:</strong> {formData.horario}</p>
          <p><strong>Valor Estimado:</strong> R$ {servicoSelecionado?.valor?.toFixed(2) || '0.00'}</p>
          {formData.observacoes && (
            <p><strong>Observações:</strong> {formData.observacoes}</p>
          )}
        </div>
      </div>

      {/* Condições e Termos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Condições
        </h3>

        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-sm leading-relaxed">
            <div className="flex items-start space-x-2 mt-2">
              <Checkbox
                id="taxa"
                checked={taxaAccepted}
                onCheckedChange={(checked) => setTaxaAccepted(checked as boolean)}
                className="mt-0.5"
              />
              <Label htmlFor="taxa" className="text-sm leading-relaxed cursor-pointer">
                Oi, tudo bem? 💙 Para garantir seu horário pedimos uma taxa antecipada de R$40,00.
                Fique tranquilo(a): esse valor é abatido do serviço no dia do atendimento 😉.
                Só não conseguimos devolver em caso de cancelamento sem justificativa, tá bom? *
              </Label>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm leading-5">
            Aceito os termos e condições e concordo em receber confirmações por email e WhatsApp *
          </Label>
        </div>
      </div>
    </div>
  );
}
