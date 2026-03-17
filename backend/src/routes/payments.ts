import { Router } from 'express';
import { z } from 'zod';
import { asaas } from '../services/asaas.js';
import { requireAuth } from '../auth.js';
import {
  getUserByAsaasCustomerId,
  getUserByAsaasSubscriptionId,
  getUserByEmail,
  setAsaasCustomerId,
  setPaymentStateByCustomerId,
  setSubscription,
  upsertUserByEmail
} from '../db.js';

const router = Router();

const friendlyError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as any).response;
    const data = response?.data;
    if (data?.errors?.length && typeof data.errors[0]?.description === 'string') {
      return data.errors[0].description;
    }
    if (typeof data?.message === 'string') return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

router.post('/webhooks/asaas', async (req, res) => {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (configuredToken) {
    const headerToken = req.header('asaas-access-token');
    if (!headerToken || headerToken !== configuredToken) {
      return res.status(200).json({ ok: true });
    }
  }

  const schema = z.object({
    event: z.string(),
    payment: z.any().optional().nullable()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(200).json({ ok: true });
  }

  const event = parsed.data.event;
  const payment = parsed.data.payment as any;
  const customerId: string | undefined = payment?.customer;

  if (!customerId) {
    return res.status(200).json({ ok: true });
  }

  const today = new Date();
  const plus30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
    setPaymentStateByCustomerId(customerId, {
      isActive: true,
      planExpiresAt: plus30,
      paymentStatus: 'active'
    });
  } else if (event === 'PAYMENT_OVERDUE') {
    setPaymentStateByCustomerId(customerId, { paymentStatus: 'overdue' });
  } else if (event === 'PAYMENT_DELETED' || event === 'SUBSCRIPTION_DELETED') {
    setPaymentStateByCustomerId(customerId, {
      isActive: false,
      paymentStatus: 'cancelled'
    });
    setSubscription(customerId, null);
  }

  return res.status(200).json({ ok: true });
});

router.use(requireAuth);

router.post('/customers', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    cpfCnpj: z.string().min(11).max(18),
    phone: z.string().min(8).optional().nullable()
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos. Verifique nome, email e CPF/CNPJ.' });
  }

  const authUser = (req as any).authUser as { email?: string; user_metadata?: Record<string, unknown> };
  const authedEmail = authUser?.email;
  if (!authedEmail) return res.status(401).json({ error: 'Sessão inválida.' });
  if (parsed.data.email !== authedEmail) return res.status(403).json({ error: 'Email não corresponde ao usuário logado.' });

  if (!process.env.ASAAS_API_KEY) return res.status(500).json({ error: 'Asaas não configurado no backend.' });

  try {
    const existing = getUserByEmail(parsed.data.email);
    if (existing?.asaasCustomerId) {
      return res.status(200).json({ customerId: existing.asaasCustomerId });
    }

    upsertUserByEmail(parsed.data);
    const response = await asaas.post('/customers', {
      name: parsed.data.name,
      email: parsed.data.email,
      cpfCnpj: parsed.data.cpfCnpj,
      phone: parsed.data.phone ?? undefined
    });

    const customerId = response.data?.id;
    if (!customerId) return res.status(502).json({ error: 'Asaas não retornou o ID do cliente.' });

    setAsaasCustomerId(parsed.data.email, customerId);

    return res.status(200).json({ customerId });
  } catch (error) {
    const message = friendlyError(error, 'Falha ao criar cliente no Asaas.');
    return res.status(500).json({ error: message });
  }
});

router.post('/subscriptions', async (req, res) => {
  const schema = z.object({
    plano: z.enum(['mensal', 'vitalicio']),
    customerId: z.string().min(3),
    cardHolderName: z.string().min(2),
    cardNumber: z.string().min(12),
    cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/),
    cardCvv: z.string().min(3).max(4),
    cpfCnpj: z.string().min(11).max(18),
    email: z.string().email(),
    postalCode: z.string().min(8).max(9),
    addressNumber: z.string().min(1),
    nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados do pagamento inválidos.' });
  }

  const authUser = (req as any).authUser as { email?: string };
  const authedEmail = authUser?.email;
  if (!authedEmail) return res.status(401).json({ error: 'Sessão inválida.' });
  if (parsed.data.email !== authedEmail) return res.status(403).json({ error: 'Email não corresponde ao usuário logado.' });

  if (!process.env.ASAAS_API_KEY) return res.status(500).json({ error: 'Asaas não configurado no backend.' });

  const [expiryMonthRaw, expiryYearRaw] = parsed.data.cardExpiry.split('/');
  const expiryMonth = Number(expiryMonthRaw);
  const expiryYear2 = Number(expiryYearRaw);
  const expiryYear = expiryYear2 >= 0 && expiryYear2 <= 99 ? 2000 + expiryYear2 : expiryYear2;

  if (!Number.isFinite(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
    return res.status(400).json({ error: 'Validade do cartão inválida.' });
  }

  const nextDueDate = parsed.data.nextDueDate;
  const value = parsed.data.plano === 'mensal' ? 20.0 : 350.0;
  const cycle = parsed.data.plano === 'mensal' ? 'MONTHLY' : 'NO_RECURRENCE';
  const description =
    parsed.data.plano === 'mensal'
      ? 'Salão de Bolso — Plano Mensal'
      : 'Salão de Bolso — Plano Vitalício';

  try {
    const response = await asaas.post('/subscriptions', {
      customer: parsed.data.customerId,
      billingType: 'CREDIT_CARD',
      value,
      nextDueDate,
      cycle,
      description,
      creditCard: {
        holderName: parsed.data.cardHolderName,
        number: parsed.data.cardNumber.replace(/\s/g, ''),
        expiryMonth,
        expiryYear,
        ccv: parsed.data.cardCvv
      },
      creditCardHolderInfo: {
        name: parsed.data.cardHolderName,
        email: parsed.data.email,
        cpfCnpj: parsed.data.cpfCnpj,
        postalCode: parsed.data.postalCode.replace(/\D/g, ''),
        addressNumber: parsed.data.addressNumber
      },
      remoteIp: req.ip
    });

    const subscriptionId = response.data?.id;
    const status = response.data?.status ?? null;

    if (!subscriptionId) {
      return res.status(502).json({ error: 'Asaas não retornou o ID da assinatura.' });
    }

    setSubscription(parsed.data.customerId, subscriptionId);
    setPaymentStateByCustomerId(parsed.data.customerId, { paymentStatus: 'pending' });

    return res.status(200).json({ subscriptionId, status });
  } catch (error) {
    const message = friendlyError(error, 'Falha ao criar assinatura no Asaas.');
    return res.status(500).json({ error: message });
  }
});

router.get('/subscriptions/:customerId', async (req, res) => {
  const customerId = req.params.customerId;
  if (!customerId) return res.status(400).json({ error: 'customerId inválido' });

  const authUser = (req as any).authUser as { email?: string };
  const authedEmail = authUser?.email;
  if (!authedEmail) return res.status(401).json({ error: 'Sessão inválida.' });

  const owner = getUserByAsaasCustomerId(customerId);
  if (!owner) return res.status(404).json({ error: 'Cliente não encontrado.' });
  if (owner.email !== authedEmail) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const response = await asaas.get('/subscriptions', { params: { customer: customerId } });
    return res.status(200).json(response.data);
  } catch (error) {
    const message = friendlyError(error, 'Falha ao consultar assinatura no Asaas.');
    return res.status(500).json({ error: message });
  }
});

router.delete('/subscriptions/:subscriptionId', async (req, res) => {
  const subscriptionId = req.params.subscriptionId;
  if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId inválido' });

  const authUser = (req as any).authUser as { email?: string };
  const authedEmail = authUser?.email;
  if (!authedEmail) return res.status(401).json({ error: 'Sessão inválida.' });

  const owner = getUserByAsaasSubscriptionId(subscriptionId);
  if (!owner) return res.status(404).json({ error: 'Assinatura não encontrada.' });
  if (owner.email !== authedEmail) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const response = await asaas.delete(`/subscriptions/${subscriptionId}`);
    if (owner.asaasCustomerId) {
      setPaymentStateByCustomerId(owner.asaasCustomerId, { isActive: false, paymentStatus: 'cancelled' });
      setSubscription(owner.asaasCustomerId, null);
    }
    return res.status(200).json({ cancelled: true, data: response.data });
  } catch (error) {
    const message = friendlyError(error, 'Falha ao cancelar assinatura no Asaas.');
    return res.status(500).json({ error: message });
  }
});

export default router;

