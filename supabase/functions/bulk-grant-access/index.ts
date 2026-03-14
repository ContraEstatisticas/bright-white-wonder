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

/**
 * Maps the "Produtos Comprados" string from the CSV to an array of product_types.
 * Examples:
 *   "Educly" → ["base"]
 *   "Educly, Educly Premium" → ["base", "freelancer"]
 *   "Combo Educly Premium + AI Pack, Educly" → ["combo_freelancer_ai", "base"]
 */
function mapProductsString(productsString: string): string[] {
  const parts = productsString.split(",").map((s) => s.trim().toLowerCase());
  const types = new Set<string>();

  for (const part of parts) {
    if (part.includes("combo")) {
      types.add("combo_freelancer_ai");
    } else if (part === "educly ai pack") {
      types.add("ai_hub");
    } else if (part === "educly premium") {
      types.add("freelancer");
    } else if (part === "educly") {
      types.add("base");
    }
  }

  // If combo is present, it already includes freelancer + ai_hub, so remove individual ones
  if (types.has("combo_freelancer_ai")) {
    types.delete("freelancer");
    types.delete("ai_hub");
  }

  return Array.from(types);
}

// deno-lint-ignore no-explicit-any
async function findUserByEmail(supabaseAdmin: any, email: string) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data?.users ?? [];
    // deno-lint-ignore no-explicit-any
    const foundUser = users.find((user: any) => normalizeEmail(user.email) === email);
    if (foundUser) return foundUser;
    if (users.length < perPage) break;
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

    // Validate admin
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

    // Service role client for writes
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { entries } = await req.json() as {
      entries: { email: string; products_string: string }[];
    };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "entries array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap at 50 per call
    const batch = entries.slice(0, 50);

    let eventsInserted = 0;
    let usersProcessed = 0;
    let usersPending = 0;
    let skippedDuplicate = 0;
    const errors: string[] = [];

    for (const entry of batch) {
      const email = normalizeEmail(entry.email);
      if (!email) continue;

      const productTypes = mapProductsString(entry.products_string || "Educly");

      for (const productType of productTypes) {
        // Dedup: check if GRANTED event already exists for this email+product_type
        const { data: existing } = await supabase
          .from("billing_event_logs")
          .select("id")
          .eq("event_type", "GRANTED")
          .ilike("email", email)
          .eq("payload->>product_type", productType)
          .eq("payload->>source", "bulk_import")
          .maybeSingle();

        if (existing) {
          skippedDuplicate++;
          continue;
        }

        const { error: insertError } = await supabase
          .from("billing_event_logs")
          .insert({
            email,
            event_type: "GRANTED",
            status: "pending",
            processed: false,
            payload: {
              product_type: productType,
              product_id: `bulk_import_${productType}`,
              source: "bulk_import",
            },
          });

        if (insertError) {
          errors.push(`Insert error for ${email}/${productType}: ${insertError.message}`);
          continue;
        }

        eventsInserted++;
      }

      // Try to find user and process immediately
      try {
        const user = await findUserByEmail(supabase, email);
        if (user) {
          const { error: rpcError } = await supabase.rpc("process_pending_billing_events", {
            p_user_id: user.id,
            p_email: email,
          });

          if (rpcError) {
            errors.push(`Process error for ${email}: ${rpcError.message}`);
          } else {
            usersProcessed++;
          }
        } else {
          usersPending++;
        }
      } catch (e: any) {
        errors.push(`Lookup error for ${email}: ${e.message}`);
        usersPending++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        batch_size: batch.length,
        events_inserted: eventsInserted,
        users_processed_immediately: usersProcessed,
        users_pending_signup: usersPending,
        skipped_duplicate: skippedDuplicate,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in bulk-grant-access:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
