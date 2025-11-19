import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    // Buscar cliente existente
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
      
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
          redirect: `${req.headers.get("origin")}/`,
          subscription: {
            id: validSubscriptions[0].id,
            status: validSubscriptions[0].status
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      logStep("Creating new customer");
    }

    // ✅ CRIAR NOVA ASSINATURA COM TRIAL DE 7 DIAS
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1STfSQHEo75Bn3U3GaTXOsrh", // Plano Mensal - prod_TQWVfarZ7rQSgy
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Trial de 7 dias para todos os novos clientes
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${req.headers.get("origin")}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/assinatura`,
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
