import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

type Props = {
  onSuccess?: (result: { customerId: string; subscriptionId: string; status: unknown }) => void;
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const formatCardNumber = (value: string) => {
  const digits = onlyDigits(value).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value: string) => {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCpfCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    return [p1, p2, p3].filter(Boolean).join('.') + (p4 ? `-${p4}` : '');
  }
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  const p4 = digits.slice(8, 12);
  const p5 = digits.slice(12, 14);
  return `${p1}${p2 ? `.${p2}` : ''}${p3 ? `.${p3}` : ''}${p4 ? `/${p4}` : ''}${p5 ? `-${p5}` : ''}`;
};

const formatCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export function CheckoutForm({ onSuccess }: Props) {
  const { user, usuario, session } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [phone, setPhone] = useState('');

  const email = useMemo(() => usuario?.email || user?.email || '', [usuario?.email, user?.email]);
  const name = useMemo(() => usuario?.nome_completo || user?.user_metadata?.full_name || '', [usuario?.nome_completo, user?.user_metadata]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Você precisa estar logado para assinar');
      return;
    }

    setLoading(true);
    try {
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          name: name || cardHolderName,
          email,
          cpfCnpj: onlyDigits(cpfCnpj),
          phone: phone || usuario?.telefone || null
        })
      });

      const customerJson = await customerResponse.json().catch(() => null);
      if (!customerResponse.ok) {
        toast.error(customerJson?.error || 'Falha ao criar cliente');
        return;
      }

      const customerId = customerJson?.customerId;
      if (!customerId) {
        toast.error('Não foi possível obter o ID do cliente');
        return;
      }

      localStorage.setItem('asaasCustomerId', customerId);

      const subscriptionResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          customerId,
          cardHolderName,
          cardNumber: onlyDigits(cardNumber),
          cardExpiry,
          cardCvv: onlyDigits(cardCvv),
          cpfCnpj: onlyDigits(cpfCnpj),
          email,
          postalCode: onlyDigits(postalCode),
          addressNumber
        })
      });

      const subscriptionJson = await subscriptionResponse.json().catch(() => null);
      if (!subscriptionResponse.ok) {
        toast.error(subscriptionJson?.error || 'Falha ao criar assinatura');
        return;
      }

      const subscriptionId = subscriptionJson?.subscriptionId;
      const status = subscriptionJson?.status;

      if (!subscriptionId) {
        toast.error('Não foi possível obter o ID da assinatura');
        return;
      }

      localStorage.setItem('asaasSubscriptionId', subscriptionId);
      toast.success('Assinatura criada com sucesso!');
      onSuccess?.({ customerId, subscriptionId, status });
    } catch (err) {
      toast.error('Erro ao processar pagamento');
      void err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
        <CardDescription>Preencha os dados do cartão para assinar o plano mensal (R$ 49,90).</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="cardHolderName">Nome no cartão</Label>
            <Input
              id="cardHolderName"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder="Nome completo"
              autoComplete="cc-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do cartão</Label>
            <Input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              autoComplete="cc-number"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cardExpiry">Validade (MM/AA)</Label>
              <Input
                id="cardExpiry"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardCvv">CVV</Label>
              <Input
                id="cardCvv"
                value={cardCvv}
                onChange={(e) => setCardCvv(onlyDigits(e.target.value).slice(0, 4))}
                placeholder="000"
                inputMode="numeric"
                autoComplete="cc-csc"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="postalCode">CEP</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(formatCep(e.target.value))}
                placeholder="00000-000"
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressNumber">Número</Label>
              <Input
                id="addressNumber"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                placeholder="123"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processando...' : 'Assinar Plano Mensal'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

