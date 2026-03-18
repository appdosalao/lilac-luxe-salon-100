import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { asaas } from '../services/asaas.js';
import { caktoFindOrderByRefId, caktoGetOrder } from '../services/cakto.js';
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

router.post('/webhooks/cakto', async (req, res) => {
  const schema = z
    .object({
      secret: z.string().optional().nullable(),
      event: z.string().optional().nullable(),
      data: z.any().optional().nullable()
    })
    .passthrough();

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(200).json({ ok: true });
  }

  const body = parsed.data as any;
  const configuredSecret = process.env.CAKTO_WEBHOOK_SECRET;
  const incomingSecret: string | null | undefined = body?.secret ?? body?.data?.secret;

  if (configuredSecret) {
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return res.status(200).json({ ok: true });
    }
  }

  const eventRaw: string = String(body?.event ?? body?.type ?? body?.custom_id ?? '');
  const event = eventRaw.trim();
  let data = (body?.data ?? {}) as any;

  const shouldVerifyByApi = String(process.env.CAKTO_VERIFY_BY_API ?? '').toLowerCase() === 'true';
  if (shouldVerifyByApi) {
    const orderId = typeof data?.id === 'string' ? data.id : null;
    const refId = typeof data?.refId === 'string' ? data.refId : null;
    const fromApi = orderId ? await caktoGetOrder(orderId) : refId ? await caktoFindOrderByRefId(refId) : null;
    if (fromApi) {
      data = {
        ...data,
        ...fromApi,
        customer: { ...(data?.customer ?? {}), ...(fromApi.customer ?? {}) },
        product: { ...(data?.product ?? {}), ...(fromApi.product ?? {}) },
        offer: { ...(data?.offer ?? {}), ...(fromApi.offer ?? {}) }
      };
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(200).json({ ok: true });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const sckRaw = data?.sck ?? data?.customer?.sck ?? null;
  const customerEmail = data?.customer?.email ?? data?.email ?? null;
  let userId: string | null = typeof sckRaw === 'string' && sckRaw ? sckRaw : null;

  if (!userId && typeof customerEmail === 'string' && customerEmail) {
    const lookup = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', customerEmail)
      .limit(1);
    userId = (lookup.data?.[0] as any)?.id ?? null;
  }

  if (!userId) {
    return res.status(200).json({ ok: true });
  }

  const caktoMensalProductId = process.env.CAKTO_MENSAL_PRODUCT_ID ?? '';
  const caktoVitalicioProductId = process.env.CAKTO_VITALICIO_PRODUCT_ID ?? '';
  const caktoMensalOfferId = process.env.CAKTO_MENSAL_OFFER_ID ?? '';
  const caktoVitalicioOfferId = process.env.CAKTO_VITALICIO_OFFER_ID ?? '';

  const productId: string | null = typeof data?.product?.id === 'string' ? data.product.id : null;
  const offerId: string | null = typeof data?.offer?.id === 'string' ? data.offer.id : null;
  const orderStatus: string | null = typeof data?.status === 'string' ? data.status : null;

  const resolvePlanType = (): 'mensal' | 'vitalicio' | null => {
    if (productId && productId === caktoMensalProductId) return 'mensal';
    if (productId && productId === caktoVitalicioProductId) return 'vitalicio';
    if (offerId && offerId === caktoMensalOfferId) return 'mensal';
    if (offerId && offerId === caktoVitalicioOfferId) return 'vitalicio';

    if (data?.type === 'subscription') return 'mensal';
    if (data?.type === 'unique') return 'vitalicio';
    return null;
  };

  const resolveSubscriptionStatus = (): 'trial' | 'active' | 'expired' | 'inactive' | null => {
    const statusNormalized = String(orderStatus ?? '').toLowerCase();
    const eventNormalized = event.toLowerCase();

    if (statusNormalized === 'paid' || statusNormalized === 'approved') return 'active';
    if (statusNormalized === 'refunded' || statusNormalized === 'chargedback' || statusNormalized === 'chargeback') return 'expired';
    if (statusNormalized === 'canceled' || statusNormalized === 'cancelled') return 'inactive';

    if (eventNormalized === 'purchase_approved') return 'active';
    if (eventNormalized.includes('refund') || eventNormalized.includes('chargeback')) return 'expired';
    if (eventNormalized.includes('cancel')) return 'inactive';
    return null;
  };

  const subscriptionStatus = resolveSubscriptionStatus();
  const planType = resolvePlanType();

  const updatePayload: Record<string, any> = {
    payment_provider: 'cakto',
    cakto_last_event: event || null,
    cakto_last_status: orderStatus,
    cakto_customer_email: typeof customerEmail === 'string' ? customerEmail : null,
    cakto_product_id: productId,
    cakto_offer_id: offerId,
    cakto_subscription_id: typeof data?.subscription === 'string' ? data.subscription : null,
    cakto_order_id: typeof data?.id === 'string' ? data.id : null,
    cakto_order_ref_id: typeof data?.refId === 'string' ? data.refId : null,
    subscription_updated_at: new Date().toISOString()
  };

  if (planType) {
    updatePayload.plan_type = planType;
  }

  if (subscriptionStatus) {
    updatePayload.subscription_status = subscriptionStatus;
  }

  const cleaned = Object.fromEntries(Object.entries(updatePayload).filter(([, v]) => v !== undefined));
  await supabaseAdmin.from('usuarios').update(cleaned).eq('id', userId);

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

