import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CaktoOrder = {
  id?: string | null;
  refId?: string | null;
  status?: string | null;
  type?: string | null;
  subscription?: string | null;
  sck?: string | null;
  customer?: { email?: string | null } | null;
  product?: { id?: string | null } | null;
  offer?: { id?: string | null } | null;
};

const caktoToken = async (): Promise<string | null> => {
  const clientId = Deno.env.get("CAKTO_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("CAKTO_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) return null;

  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);

  const res = await fetch("https://api.cakto.com.br/public_api/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { access_token?: string } | null;
  const token = json?.access_token;
  if (!token) return null;
  return token;
};

const caktoGetOrder = async (orderId: string): Promise<CaktoOrder | null> => {
  const token = await caktoToken();
  if (!token) return null;

  const res = await fetch(`https://api.cakto.com.br/public_api/orders/${orderId}/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as CaktoOrder | null;
  if (!json?.id) return null;
  return json;
};

const caktoFindOrderByRefId = async (refId: string): Promise<CaktoOrder | null> => {
  const token = await caktoToken();
  if (!token) return null;

  const url = new URL("https://api.cakto.com.br/public_api/orders/");
  url.searchParams.set("refId", refId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { results?: CaktoOrder[] } | null;
  const first = json?.results?.[0];
  if (!first?.id) return null;
  return first;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json().catch(() => null)) as any;
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const configuredSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET") ?? "";
  const incomingSecret = body?.secret ?? body?.data?.secret ?? null;
  if (configuredSecret) {
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const event = String(body?.event ?? body?.type ?? body?.custom_id ?? "").trim();
  let data = (body?.data ?? {}) as any;

  const verifyByApi = (Deno.env.get("CAKTO_VERIFY_BY_API") ?? "").toLowerCase() === "true";
  if (verifyByApi) {
    const orderId = typeof data?.id === "string" ? data.id : null;
    const refId = typeof data?.refId === "string" ? data.refId : null;
    const fromApi = orderId ? await caktoGetOrder(orderId) : refId ? await caktoFindOrderByRefId(refId) : null;
    if (fromApi) {
      data = {
        ...data,
        ...fromApi,
        customer: { ...(data?.customer ?? {}), ...(fromApi.customer ?? {}) },
        product: { ...(data?.product ?? {}), ...(fromApi.product ?? {}) },
        offer: { ...(data?.offer ?? {}), ...(fromApi.offer ?? {}) },
      };
    }
  }

  const sckRaw = data?.sck ?? data?.customer?.sck ?? null;
  const customerEmail = data?.customer?.email ?? data?.email ?? null;

  let userId: string | null = typeof sckRaw === "string" && sckRaw ? sckRaw : null;
  if (!userId && typeof customerEmail === "string" && customerEmail) {
    const lookup = await supabaseAdmin.from("usuarios").select("id").eq("email", customerEmail).limit(1);
    userId = (lookup.data?.[0] as any)?.id ?? null;
  }

  if (!userId) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const caktoMensalProductId = Deno.env.get("CAKTO_MENSAL_PRODUCT_ID") ?? "";
  const caktoVitalicioProductId = Deno.env.get("CAKTO_VITALICIO_PRODUCT_ID") ?? "";
  const caktoMensalOfferId = Deno.env.get("CAKTO_MENSAL_OFFER_ID") ?? "";
  const caktoVitalicioOfferId = Deno.env.get("CAKTO_VITALICIO_OFFER_ID") ?? "";

  const productId = typeof data?.product?.id === "string" ? data.product.id : null;
  const offerId = typeof data?.offer?.id === "string" ? data.offer.id : null;
  const orderStatus = typeof data?.status === "string" ? data.status : null;

  const resolvePlanType = (): "mensal" | "vitalicio" | null => {
    if (productId && productId === caktoMensalProductId) return "mensal";
    if (productId && productId === caktoVitalicioProductId) return "vitalicio";
    if (offerId && offerId === caktoMensalOfferId) return "mensal";
    if (offerId && offerId === caktoVitalicioOfferId) return "vitalicio";

    if (data?.type === "subscription") return "mensal";
    if (data?.type === "unique") return "vitalicio";
    return null;
  };

  const resolveSubscriptionStatus = (): "trial" | "active" | "expired" | "inactive" | null => {
    const statusNormalized = String(orderStatus ?? "").toLowerCase();
    const eventNormalized = event.toLowerCase();

    if (statusNormalized === "paid" || statusNormalized === "approved") return "active";
    if (statusNormalized === "refunded" || statusNormalized === "chargedback" || statusNormalized === "chargeback") {
      return "expired";
    }
    if (statusNormalized === "canceled" || statusNormalized === "cancelled") return "inactive";

    if (eventNormalized === "purchase_approved") return "active";
    if (eventNormalized.includes("refund") || eventNormalized.includes("chargeback")) return "expired";
    if (eventNormalized.includes("cancel")) return "inactive";
    return null;
  };

  const subscriptionStatus = resolveSubscriptionStatus();
  const planType = resolvePlanType();

  const payload: Record<string, unknown> = {
    payment_provider: "cakto",
    cakto_last_event: event || null,
    cakto_last_status: orderStatus,
    cakto_customer_email: typeof customerEmail === "string" ? customerEmail : null,
    cakto_product_id: productId,
    cakto_offer_id: offerId,
    cakto_subscription_id: typeof data?.subscription === "string" ? data.subscription : null,
    cakto_order_id: typeof data?.id === "string" ? data.id : null,
    cakto_order_ref_id: typeof data?.refId === "string" ? data.refId : null,
    subscription_updated_at: new Date().toISOString(),
  };

  if (planType) payload.plan_type = planType;
  if (subscriptionStatus) payload.subscription_status = subscriptionStatus;

  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
  await supabaseAdmin.from("usuarios").update(cleaned).eq("id", userId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

