import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '@/middlewares/authenticate';
import { supabaseAdmin } from '@/lib/supabaseServer';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const CAKTO_PRODUCT_URL = process.env.CAKTO_PRODUCT_URL || '';
const CAKTO_WEBHOOK_SECRET = process.env.CAKTO_WEBHOOK_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'Usuário não identificado' });
    }

    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('paid_access')
      .eq('id', userId)
      .single();

    if (error || !usuario) {
      console.error('Erro ao buscar status de pagamento:', error);
      return res.status(500).json({ error: 'internal_error', message: 'Erro ao consultar banco de dados' });
    }

    return res.json({ paid_access: !!usuario.paid_access });
  } catch (error) {
    console.error('Erro na rota /status:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/checkout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized', message: 'Usuário não identificado' });
    }

    const { data: usuario, error: fetchError } = await supabaseAdmin
      .from('usuarios')
      .select('paid_access')
      .eq('id', userId)
      .single();

    if (fetchError || !usuario) {
      console.error('Erro ao buscar usuário:', fetchError);
      return res.status(500).json({ error: 'internal_error', message: 'Erro ao consultar banco de dados' });
    }

    if (usuario.paid_access) {
      return res.json({ alreadyPaid: true });
    }

    if (!CAKTO_PRODUCT_URL) {
      return res.status(500).json({ error: 'config_error', message: 'URL do produto Cakto não configurada' });
    }

    const redirectUrl = encodeURIComponent(`${FRONTEND_URL}/payment/success`);
    const checkoutUrl = `${CAKTO_PRODUCT_URL}?external_id=${userId}&redirect_url=${redirectUrl}`;

    return res.json({ checkoutUrl });
  } catch (error) {
    console.error('Erro na rota /checkout:', error);
    return res.status(500).json({ error: 'internal_error', message: 'Erro ao processar checkout' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    const incomingSecret = 
      body?.secret ?? 
      body?.data?.secret ?? 
      body?.fields?.secret ?? 
      body?.data?.fields?.secret ?? 
      null;

    if (CAKTO_WEBHOOK_SECRET && incomingSecret !== CAKTO_WEBHOOK_SECRET) {
      console.warn('Tentativa de webhook com secret inválido');
      return res.status(401).json({ error: 'unauthorized', message: 'Secret inválido' });
    }

    const externalId = body?.data?.external_id ?? body?.external_id ?? body?.data?.refId ?? body?.refId;
    
    const eventType = body?.event?.custom_id ?? body?.event ?? body?.type;
    const status = body?.data?.status ?? body?.status;

    const isApproved = 
      status === 'paid' || 
      status === 'approved' || 
      eventType === 'purchase_approved';

    if (!externalId) {
      console.warn('Webhook recebido sem externalId');
      return res.status(200).json({ received: true, message: 'Nenhum ID de usuário encontrado' });
    }

    if (!isApproved) {
      console.log(`Pagamento não aprovado para ${externalId}. Status: ${status}`);
      return res.status(200).json({ received: true });
    }

    // 3. Idempotência: Verifica se já está pago
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('paid_access')
      .eq('id', externalId)
      .single();

    if (usuario?.paid_access) {
      return res.status(200).json({ received: true, alreadyProcessed: true });
    }

    // 4. Atualiza no Supabase
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        paid_access: true,
        paid_at: new Date().toISOString()
      })
      .eq('id', externalId);

    if (updateError) {
      console.error('Erro ao atualizar acesso pago via webhook:', updateError);
      return res.status(500).json({ error: 'database_error' });
    }

    console.log(`Acesso vitalício liberado para o usuário: ${externalId}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
