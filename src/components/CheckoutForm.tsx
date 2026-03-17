import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { type LocalPlanState, type PlanoTipo, readLocalPlanState, writeLocalPlanState } from '@/lib/planAccess';

type Props = {
  plano: PlanoTipo;
  vitalicioConsent?: boolean;
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

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const formatYmd = (date: Date) => date.toISOString().slice(0, 10);

export function CheckoutForm({ plano, vitalicioConsent, onSuccess }: Props) {
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

  const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  const email = useMemo(() => usuario?.email || user?.email || '', [usuario?.email, user?.email]);
  const name = useMemo(() => usuario?.nome_completo || user?.user_metadata?.full_name || '', [usuario?.nome_completo, user?.user_metadata]);

  const isFormComplete = useMemo(() => {
    const cardNumberDigits = onlyDigits(cardNumber);
    const expiryDigits = onlyDigits(cardExpiry);
    const cvvDigits = onlyDigits(cardCvv);
    const cpfCnpjDigits = onlyDigits(cpfCnpj);
    const cepDigits = onlyDigits(postalCode);

    if (!email) return false;
    if (!cardHolderName.trim()) return false;
    if (cardNumberDigits.length < 13) return false;
    if (expiryDigits.length !== 4) return false;
    if (cvvDigits.length < 3) return false;
    if (cpfCnpjDigits.length < 11) return false;
    if (cepDigits.length !== 8) return false;
    if (!addressNumber.trim()) return false;
    if (plano === 'vitalicio' && !vitalicioConsent) return false;
    return true;
  }, [addressNumber, cardCvv, cardExpiry, cardHolderName, cardNumber, cpfCnpj, email, plano, postalCode, vitalicioConsent]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Você precisa estar logado para assinar');
      return;
    }

    if (plano === 'vitalicio' && !vitalicioConsent) {
      toast.error('Você precisa concordar com os termos do plano vitalício');
      return;
    }

    setLoading(true);
    try {
      const customerResponse = await fetch(`${API_URL}/api/customers`, {
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

      const now = new Date();
      const nextDueDate = formatYmd(addDays(now, 7));

      const subscriptionValue = plano === 'mensal' ? 20.0 : 350.0;
      const subscriptionCycle = plano === 'mensal' ? 'MONTHLY' : 'NO_RECURRENCE';

      const subscriptionResponse = await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          plano,
          value: subscriptionValue,
          cycle: subscriptionCycle,
          customerId,
          cardHolderName,
          cardNumber: onlyDigits(cardNumber),
          cardExpiry,
          cardCvv: onlyDigits(cardCvv),
          cpfCnpj: onlyDigits(cpfCnpj),
          email,
          postalCode: onlyDigits(postalCode),
          addressNumber,
          nextDueDate
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

      if (user?.id) {
        const previous = readLocalPlanState(user.id);
        const next: LocalPlanState = {
          planType: plano,
          isActive: true,
          trialStartDate: previous?.trialStartDate ?? now.toISOString(),
          trialEndDate: previous?.trialEndDate ?? addDays(now, 7).toISOString(),
          planExpiresAt: plano === 'mensal' ? addDays(now, 7).toISOString() : null,
          asaasCustomerId: customerId,
          asaasSubscriptionId: subscriptionId,
          paymentStatus: 'trial'
        };
        writeLocalPlanState(user.id, next);
      }

      toast.success('Plano ativado com sucesso!');
      onSuccess?.({ customerId, subscriptionId, status });
    } catch (err) {
      toast.error('Erro ao processar pagamento');
      void err;
    } finally {
      setLoading(false);
    }
  };

  return (
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

          <Button type="submit" className="w-full" disabled={loading || !isFormComplete}>
            {loading ? 'Processando...' : 'Ativar meu plano com 7 dias grátis'}
          </Button>
        </form>
  );
}

