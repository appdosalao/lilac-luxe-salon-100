import { Router } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { caktoFindOrderByRefId, caktoGetOrder } from '../services/cakto.js';

const router = Router();

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

export default router;

