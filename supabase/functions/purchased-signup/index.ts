import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().replace(/\.+$/, "");
};

const normalizeLanguage = (value: unknown) => {
  if (typeof value !== "string") return "en";
  const normalized = value.trim().toLowerCase().split("-")[0];
  return normalized || "en";
};

async function findUserByEmail(supabaseAdmin: any, email: string) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const foundUser = users.find((user) => normalizeEmail(user.email) === email);

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

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const preferredLanguage = normalizeLanguage(body?.preferred_language);

    if (!email || !password || !fullName) {
      return jsonResponse({ error: "email, password and full_name are required", code: "INVALID_INPUT" }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: hasPurchase, error: purchaseError } = await supabaseAdmin.rpc("check_purchase_exists", {
      p_email: email,
    });

    if (purchaseError) {
      console.error("[purchased-signup] check_purchase_exists failed:", purchaseError);
      return jsonResponse({ error: "Failed to validate purchase", code: "PURCHASE_CHECK_FAILED" }, 500);
    }

    if (!hasPurchase) {
      return jsonResponse({ error: "No purchase found for this email", code: "NO_PURCHASE" }, 403);
    }

    const existingUser = await findUserByEmail(supabaseAdmin, email);
    if (existingUser) {
      return jsonResponse({ error: "User already registered", code: "ALREADY_EXISTS" }, 409);
    }

    const { data: createdUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUserData.user) {
      console.error("[purchased-signup] createUser failed:", createUserError);
      return jsonResponse({ error: createUserError?.message || "Failed to create user", code: "CREATE_FAILED" }, 500);
    }

    const userId = createdUserData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ preferred_language: preferredLanguage })
      .eq("id", userId);

    if (profileError) {
      console.warn("[purchased-signup] profile language update failed:", profileError);
    }

    const { error: billingError } = await supabaseAdmin.rpc("process_pending_billing_events", {
      p_user_id: userId,
      p_email: email,
    });

    if (billingError) {
      console.warn("[purchased-signup] billing reconciliation failed:", billingError);
    }

    return jsonResponse({ user_id: userId });
  } catch (error) {
    console.error("[purchased-signup] unexpected error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error", code: "UNEXPECTED_ERROR" },
      500,
    );
  }
});