import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\.+$/, "");
};

const SUPPORTED_LANGS = ["pt", "en", "es", "fr", "de", "it", "ru"];

const normalizeLanguage = (value: unknown, fallback = "es") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(normalized) ? normalized : fallback;
};

// deno-lint-ignore no-explicit-any
async function findUserByEmail(supabaseAdmin: any, email: string) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const foundUser = users.find((user: any) => normalizeEmail(user.email) === email);

    if (foundUser) {
      return foundUser;
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate admin via JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: isAdmin } = await supabaseAuth.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { email, products, duration_days, language } =
      await req.json();

    if (!email || !products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "email and products are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email with pagination
    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByEmail(supabase, normalizedEmail);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found with this email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const now = new Date();
    const expiresAt = duration_days
      ? new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const grantedProducts: string[] = [];
    const timestamp = now.getTime();

    // Grant each product
    for (const productType of products) {
      const productId = `manual_grant_${productType}`;

      const { error: productError } = await supabase
        .from("user_product_access")
        .upsert(
          {
            user_id: userId,
            product_id: productId,
            product_type: productType,
            is_active: true,
            granted_at: now.toISOString(),
            expires_at: expiresAt,
            revoked_at: null,
          },
          { onConflict: "user_id,product_id" }
        );

      if (productError) {
        console.error(`Error granting ${productType}:`, productError);
        continue;
      }
      grantedProducts.push(productType);
    }

    // Update premium access
    const { error: premiumError } = await supabase
      .from("user_premium_access")
      .upsert(
        {
          user_id: userId,
          is_premium: true,
          plan_type: "premium",
          purchased_at: now.toISOString(),
          plan_updated_at: now.toISOString(),
          expires_at: expiresAt,
        },
        { onConflict: "user_id" }
      );

    if (premiumError) {
      console.error("Error updating premium:", premiumError);
    }

    // Always schedule welcome email when access is granted, using the user's language.
    let welcomeEmailScheduled = false;
    let welcomeEmailSkippedReason: string | null = null;
    let resolvedEmailLanguage = "es";

    if (grantedProducts.length > 0) {
      const buyerName = user.user_metadata?.full_name || "Aluno";
      const { data: profileData } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", userId)
        .maybeSingle();

      resolvedEmailLanguage = normalizeLanguage(
        language ||
          profileData?.preferred_language ||
          user.user_metadata?.preferred_language ||
          user.user_metadata?.language ||
          "es"
      );

      // Dedup: do not re-queue a welcome email if it was already sent.
      const { data: existingWelcomeLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("recipient_email", normalizedEmail)
        .eq("email_type", "welcome")
        .maybeSingle();

      if (existingWelcomeLog) {
        welcomeEmailSkippedReason = "already_sent";
      } else {
        for (const pt of grantedProducts) {
          await supabase.from("pending_thank_you_emails").insert({
            email: normalizedEmail,
            buyer_name: buyerName,
            product_type: pt,
            product_id: `manual_grant_${pt}`,
            language: resolvedEmailLanguage,
            send_after: new Date(now.getTime() + 1 * 60 * 1000).toISOString(),
            sent: false,
          });
        }

        welcomeEmailScheduled = true;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        granted_products: grantedProducts,
        expires_at: expiresAt,
        welcome_email_scheduled: welcomeEmailScheduled,
        welcome_email_language: resolvedEmailLanguage,
        welcome_email_skipped_reason: welcomeEmailSkippedReason,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in admin-grant-access:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
