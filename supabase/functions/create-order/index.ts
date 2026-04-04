import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const buyerId = claims.claims.sub as string;

    const { app_id, product_name, amount } = await req.json();
    if (!app_id || !product_name || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: corsHeaders });
    }

    // Get app's developer
    const { data: app } = await supabase.from("apps").select("uploaded_by").eq("id", app_id).single();
    if (!app?.uploaded_by) {
      return new Response(JSON.stringify({ error: "App not found" }), { status: 404, headers: corsHeaders });
    }

    // Get Razorpay keys from admin_settings
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: settings } = await adminClient.from("admin_settings").select("key, value").in("key", ["razorpay_key_id", "razorpay_key_secret"]);
    const keyId = settings?.find(s => s.key === "razorpay_key_id")?.value;
    const keySecret = settings?.find(s => s.key === "razorpay_key_secret")?.value;

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Payment system not configured" }), { status: 500, headers: corsHeaders });
    }

    // Calculate commission
    const amountInPaise = Math.round(amount * 100);
    const commission = Math.round(amount * 0.30 * 100) / 100;
    const devShare = Math.round(amount * 0.70 * 100) / 100;

    // Create Razorpay order
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `bs_${Date.now()}`,
      }),
    });

    const rzpOrder = await rzpRes.json();
    if (!rzpOrder.id) {
      return new Response(JSON.stringify({ error: "Failed to create order" }), { status: 500, headers: corsHeaders });
    }

    // Create transaction record
    await adminClient.from("payment_transactions").insert({
      app_id,
      buyer_id: buyerId,
      developer_id: app.uploaded_by,
      product_name,
      amount,
      platform_commission: commission,
      developer_share: devShare,
      razorpay_order_id: rzpOrder.id,
      status: "pending",
    });

    return new Response(JSON.stringify({
      order_id: rzpOrder.id,
      key_id: keyId,
      amount: amountInPaise,
      currency: "INR",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
