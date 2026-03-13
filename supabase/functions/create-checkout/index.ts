import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID");
    if (!stripePriceId) {
      throw new Error("STRIPE_PRICE_ID is not set");
    }

    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    logStep("Extracting token", { 
      tokenLength: token.length,
      hasBearer: authHeader.startsWith("Bearer ")
    });
    
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      logStep("ERROR: Auth failed", {
        error: authError.message,
        name: authError.name
      });
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) {
      logStep("ERROR: User or email missing");
      throw new Error("User not authenticated or email not available");
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { 
      apiVersion: "2025-08-27.basil" 
    });

    const origin =
      req.headers.get("origin") ??
      Deno.env.get("SITE_URL") ??
      "http://localhost:3000";

    const { data: profile } = await supabaseClient
      .from("usuarios")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId: string | undefined = profile?.stripe_customer_id ?? undefined;

    if (customerId) {
      try {
        const retrieved = await stripe.customers.retrieve(customerId);
        if (retrieved.deleted) {
          logStep("Stripe customer in profile is deleted, will re-create", { customerId });
          customerId = undefined;
        } else {
          logStep("Using Stripe customer from profile", { customerId });
        }
      } catch (e) {
        logStep("Stripe customer in profile not found, will re-create", { customerId });
        customerId = undefined;
        void e;
      }
    }

    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer by email", { customerId });
      } else {
        logStep("Creating new customer");
        const created = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = created.id;
        logStep("Stripe customer created", { customerId });
      }
    }

    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        const current = (customer.metadata ?? {}) as Record<string, string>;
        if (current.supabase_user_id !== user.id) {
          await stripe.customers.update(customerId, {
            metadata: { ...current, supabase_user_id: user.id },
          });
        }
      }
    } catch (e) {
      void e;
    }

    try {
      await supabaseClient
        .from("usuarios")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    } catch (e) {
      void e;
    }

    if (customerId) {
      
      // ✅ VERIFICAR SE JÁ TEM ASSINATURA ATIVA
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
      });
      
      logStep("Checking existing subscriptions", { 
        total: subscriptions.data.length,
        statuses: subscriptions.data.map(s => ({ id: s.id, status: s.status }))
      });
      
      // Filtrar assinaturas válidas (active ou trialing)
      const validSubscriptions = subscriptions.data.filter(s => 
        s.status === 'active' || s.status === 'trialing'
      );
      
      if (validSubscriptions.length > 0) {
        logStep("User already has active subscription, redirecting", {
          subscriptionId: validSubscriptions[0].id,
          status: validSubscriptions[0].status
        });
        
        // Atualizar status no banco
        await supabaseClient
          .from('usuarios')
          .update({ 
            subscription_status: validSubscriptions[0].status === 'trialing' ? 'trial' : 'active',
            trial_used: true 
          })
          .eq('id', user.id);
        
        return new Response(JSON.stringify({ 
          message: 'Already subscribed',
          redirect: `${origin}/`,
          subscription: {
            id: validSubscriptions[0].id,
            status: validSubscriptions[0].status
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // ✅ CRIAR NOVA ASSINATURA COM TRIAL DE 7 DIAS
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Trial de 7 dias para todos os novos clientes
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      metadata: { supabase_user_id: user.id },
      client_reference_id: user.id,
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assinatura`,
    });

    logStep("Checkout session created", { 
      sessionId: session.id,
      hasTrial: true,
      url: session.url 
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
