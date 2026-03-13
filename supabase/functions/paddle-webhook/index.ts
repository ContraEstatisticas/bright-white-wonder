import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paddle-signature",
};

// ---------- ✅ WEBHOOK FAILURE LOGGING (non-blocking) ----------
async function logWebhookFailure(
  supabase: any,
  params: {
    webhookSource: string;
    eventType?: string;
    eventId?: string;
    rawPayload: unknown;
    errorMessage: string;
    errorStack?: string;
    httpStatus: number;
  }
) {
  try {
    // Backoff exponencial: primeiro retry em 30s
    const nextRetryAt = new Date(Date.now() + 30 * 1000).toISOString();

    await supabase.from("webhook_failure_logs").insert({
      webhook_source: params.webhookSource,
      event_type: params.eventType || null,
      event_id: params.eventId || null,
      raw_payload: params.rawPayload,
      error_message: params.errorMessage,
      error_stack: params.errorStack || null,
      http_status_returned: params.httpStatus,
      next_retry_at: nextRetryAt,
      status: "pending",
    });

    console.log(
      `[paddle-webhook] Failure logged for retry: event=${params.eventType}, next_retry=${nextRetryAt}`
    );
  } catch (logErr) {
    // Nunca derrubar o webhook por causa do log de falha
    console.error("[paddle-webhook] Failed to log webhook failure:", logErr);
  }
}
// ---------- END WEBHOOK FAILURE LOGGING ----------

// Paddle event type mapping to internal types
const EVENT_MAP: Record<string, string> = {
  "transaction.completed": "PURCHASE_COMPLETE",
  "transaction.paid": "PURCHASE_COMPLETE",
  "subscription.activated": "SUBSCRIPTION_SETTLED",
  "subscription.canceled": "SUBSCRIPTION_CANCELLATION",
  "subscription.paused": "PAUSING",
  "subscription.resumed": "RESUMING",
  "subscription.past_due": "OVERDUE",
  "transaction.refunded": "REFUNDED",
  "transaction.canceled": "CANCELED"
};

// Events that should be ignored
const IGNORE_EVENTS = ["transaction.payment_failed"];

const CUSTOMER_CREATED_EVENTS = ["customer.created", "customer.create"];
// Traz para a fila (billing) eventos de entrada e de saída
const BILLING_ACTION_EVENTS = [
  "transaction.paid", 
  "transaction.completed", 
  "subscription.activated", 
  "subscription.canceled", 
  "subscription.paused", 
  "subscription.resumed", 
  "transaction.refunded",
  "subscription.past_due"
];

function normalizeEmail(rawEmail: unknown): string | null {
  if (typeof rawEmail !== "string") return null;
  const normalized = rawEmail.toLowerCase().trim().replace(/\.+$/, "");
  return normalized || null;
}

function extractCustomerId(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const nestedCustomer = data.customer as Record<string, unknown> | undefined;
  const customerId =
    (data as any).customer_id ?? (data as any).customerId ?? nestedCustomer?.id ?? (nestedCustomer as any)?.customer_id;

  return typeof customerId === "string" && customerId.trim() ? customerId.trim() : null;
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    result[key] = value;
  }
  return result;
}

async function fetchCustomerFromPaddleAPI(customerId: string): Promise<{email: string; name: string|null; locale: string|null} | null> {
  const apiKey = Deno.env.get("PADDLE_API_KEY")?.trim();
  if (!apiKey) {
    console.warn("[paddle-webhook] PADDLE_API_KEY not set, cannot fetch customer from API");
    return null;
  }
  try {
    console.log(`[paddle-webhook] Fetching customer ${customerId} from Paddle API...`);
    const resp = await fetch(`https://api.paddle.com/customers/${customerId}`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error(`[paddle-webhook] Paddle API returned ${resp.status}: ${body}`);
      return null;
    }
    const json = await resp.json();
    const email = json?.data?.email;
    if (!email) {
      console.warn("[paddle-webhook] Paddle API returned no email for customer:", customerId);
      return null;
    }
    console.log(`[paddle-webhook] Paddle API resolved customer ${customerId} -> ${email}`);
    return { email, name: json.data.name ?? null, locale: json.data.locale ?? null };
  } catch (err: any) {
    console.error("[paddle-webhook] Paddle API fetch error:", err);
    return null;
  }
}

function maskSecret(value: string, visibleChars = 6): string {
  if (!value) return "";
  if (value.length <= visibleChars) return "*".repeat(value.length);
  return `${value.slice(0, visibleChars)}...(${value.length})`;
}

// ---------- ✅ NOVO: helpers do enqueue de e-mail (não quebra fluxo) ----------

function localeToLanguage(locale: unknown): "pt" | "en" | "es" {
  const l = String(locale ?? "").toLowerCase();
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("en")) return "en";
  return "es";
}

async function getProductType(supabase: any, productId: string): Promise<string> {
  if (!productId) return "base";

  const { data, error } = await supabase
    .from("product_definitions")
    .select("product_type")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error("[paddle-webhook] product_definitions lookup error:", error);
    return "base";
  }

  return data?.product_type ?? "base";
}

// ⚠️ ASSUMINDO o mesmo padrão do primer-webhook: email_logs.template = 'welcome'
async function alreadySentWelcome(supabase: any, email: string): Promise<boolean> {
  console.log("[paddle-webhook] alreadySentWelcome check for:", email);
  const { data, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("recipient_email", email)
    .eq("email_type", "welcome")
    .limit(1);

  if (error) {
    // não derruba webhook por causa de e-mail
    console.error("[paddle-webhook] email_logs dedupe error (non-blocking):", error);
    return false; // se não dá pra checar, melhor tentar enfileirar
  }

  const alreadySent = (data?.length ?? 0) > 0;
  console.log("[paddle-webhook] alreadySentWelcome result:", { email, alreadySent, matchCount: data?.length ?? 0 });
  return alreadySent;
}

async function enqueueWelcomeEmail(params: {
  supabase: any;
  email: string;
  buyerName: string;
  locale: string | null;
  productId: string;
}) {
  const { supabase } = params;
  const email = params.email; // já normalizado
  const buyerName = params.buyerName || "Aluno";
  const language = localeToLanguage(params.locale ?? "es");
  const productId = params.productId || "unknown";

  // 1) dedupe: se já enviou welcome, não enfileira
  const sent = await alreadySentWelcome(supabase, email);
  if (sent) return;

  // 2) lookup product_type
  const productType = await getProductType(supabase, productId);

  // 3) insert na fila
  const { error: insertErr } = await supabase.from("pending_thank_you_emails").insert({
    email,
    buyer_name: buyerName,
    product_id: productId,
    product_type: productType,
    language,
  });

  if (insertErr) {
    console.error("[paddle-webhook] pending_thank_you_emails insert error (non-blocking):", insertErr);
  } else {
    console.log("[paddle-webhook] queued welcome email:", { email, productId, productType, language });
  }
}

// ---------------------------------------------------------------------------

async function processRealtimeBillingByEmail(supabase: any, email: string) {
  try {
    let foundUser: { id: string; email_confirmed_at?: string | null } | null = null;
    let page = 1;
    const perPage = 1000;

    while (!foundUser) {
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError || !listData?.users?.length) break;

      const match = listData.users.find((u: { email?: string }) => normalizeEmail(u.email) === email);

      if (match) {
        foundUser = {
          id: match.id,
          email_confirmed_at: match.email_confirmed_at ?? null,
        };
        break;
      }

      if (listData.users.length < perPage) break;
      page++;
      if (page > 10) break;
    }

    if (foundUser) {
      if (!foundUser.email_confirmed_at) {
        const { error: confirmError } = await supabase.auth.admin.updateUserById(foundUser.id, {
          email_confirm: true,
        });

        if (confirmError) {
          console.error("[paddle-webhook] Failed to auto-confirm user after purchase:", confirmError);
        } else {
          console.log(`[paddle-webhook] User auto-confirmed after purchase: ${foundUser.id}`);
        }
      }

      console.log(`[paddle-webhook] User found: ${foundUser.id}, processing billing sync...`);
      const { error: rpcError } = await (supabase as any).rpc("process_pending_billing_events", {
        p_user_id: foundUser.id,
        p_email: email,
      });

      if (rpcError) {
        console.error("[paddle-webhook] RPC error:", rpcError);
      } else {
        console.log(`[paddle-webhook] Billing correctly validated/revoked in real-time for ${email}`);
      }
    } else {
      console.log(`[paddle-webhook] User not found for ${email}, will reconcile on signup`);
    }
  } catch (lookupErr) {
    console.error("[paddle-webhook] User lookup error:", lookupErr);
  }
}

function isValidAuthorizationHeader(authHeader: string, expectedApiKey: string): boolean {
  const trimmedHeader = authHeader.trim();
  if (!trimmedHeader) return false;

  const token = trimmedHeader.toLowerCase().startsWith("bearer ") ? trimmedHeader.slice(7).trim() : trimmedHeader;

  return token === expectedApiKey.trim();
}

async function verifyPaddleSignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  try {
    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(/[;,]/)) {
      const trimmedPart = part.trim();
      const separatorIndex = trimmedPart.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = trimmedPart.slice(0, separatorIndex).trim().toLowerCase();
      const value = trimmedPart.slice(separatorIndex + 1).trim();
      if (key && value) parts[key] = value;
    }

    const ts = parts["ts"];
    const h1 = parts["h1"];
    if (!ts || !h1) return false;

    const signedPayload = `${ts}:${rawBody}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
    ]);

    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const computedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHex === h1.toLowerCase();
  } catch (err) {
    console.error("[paddle-webhook] Signature verification error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let rawBody = "";
  try {
    rawBody = await req.text();
    const requestHeaders = headersToObject(req.headers);

    console.log(
      "[paddle-webhook] Incoming POST request:",
      JSON.stringify({
        method: req.method,
        url: req.url,
        headers: requestHeaders,
        body: rawBody,
      }),
    );

    try {
      console.log("[paddle-webhook] Incoming POST body (parsed):", JSON.parse(rawBody));
    } catch {
      console.log("[paddle-webhook] Incoming POST body is not valid JSON");
    }

    const authorizationHeader = req.headers.get("authorization") || "";
    const signatureHeader = req.headers.get("paddle-signature") || req.headers.get("Paddle-Signature") || "";
    const paddleApiKey = Deno.env.get("PADDLE_API_KEY")?.trim() || "";
    const webhookSecret = Deno.env.get("PADDLE_WEBHOOK_SECRET")?.trim() || "";

    console.log("[paddle-webhook] Auth diagnostics:", {
      hasAuthorizationHeader: Boolean(authorizationHeader),
      authorizationHeaderPreview: maskSecret(authorizationHeader),
      hasPaddleSignatureHeader: Boolean(signatureHeader),
      paddleSignatureHeaderPreview: maskSecret(signatureHeader, 20),
      hasPaddleApiKeyEnv: Boolean(paddleApiKey),
      paddleApiKeyEnvLength: paddleApiKey.length,
      hasWebhookSecretEnv: Boolean(webhookSecret),
      webhookSecretEnvLength: webhookSecret.length,
    });

    if (!paddleApiKey && !webhookSecret) {
      console.error("[paddle-webhook] Neither PADDLE_API_KEY nor PADDLE_WEBHOOK_SECRET is configured");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: corsHeaders });
    }

    let isAuthorized = false;
    let authValidationMethod = "none";

    if (paddleApiKey && authorizationHeader) {
      isAuthorized = isValidAuthorizationHeader(authorizationHeader, paddleApiKey);
      if (isAuthorized) {
        authValidationMethod = "authorization";
        console.log("[paddle-webhook] Request validated by authorization header");
      } else {
        console.warn("[paddle-webhook] Authorization header provided but token did not match PADDLE_API_KEY");
      }
    }

    if (!isAuthorized && webhookSecret && signatureHeader) {
      isAuthorized = await verifyPaddleSignature(rawBody, signatureHeader, webhookSecret);
      if (isAuthorized) {
        authValidationMethod = "paddle-signature";
        console.log("[paddle-webhook] Request validated by paddle-signature");
      } else {
        console.warn("[paddle-webhook] Paddle signature provided but verification failed");
      }
    }

    if (!isAuthorized) {
      console.error(
        "[paddle-webhook] Unauthorized request: invalid authorization and invalid/missing paddle-signature",
      );
      return new Response(JSON.stringify({ error: "Unauthorized request" }), { status: 401, headers: corsHeaders });
    }

    console.log(`[paddle-webhook] Authorization successful via: ${authValidationMethod}`);

    const payload = JSON.parse(rawBody);
    const paddleEventType = payload.event_type;
    const eventId = payload.event_id;
    const notificationId = payload.notification_id;
    const occurredAt = payload.occurred_at;

    console.log(`[paddle-webhook] Received event: ${paddleEventType}`);

    if (IGNORE_EVENTS.includes(paddleEventType)) {
      console.log(`[paddle-webhook] Ignoring event: ${paddleEventType}`);
      return new Response(JSON.stringify({ success: true, ignored: true }), { headers: corsHeaders });
    }

    const internalEventType = EVENT_MAP[paddleEventType];
    if (!internalEventType) {
      console.log(`[paddle-webhook] Unknown event type: ${paddleEventType}, storing as-is`);
    }
    const eventType = internalEventType || paddleEventType.toUpperCase().replace(/\./g, "_");

    if (CUSTOMER_CREATED_EVENTS.includes(paddleEventType)) {
      const customerId = payload.data?.id;
      const customerEmail = normalizeEmail(payload.data?.email);

      if (!customerId || !customerEmail) {
        console.error("[paddle-webhook] Invalid customer.created payload");
        return new Response(JSON.stringify({ error: "Invalid customer.created payload" }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      console.log("[paddle-webhook] customer event detected, attempting upsert:", {
        event: paddleEventType,
        customerId,
        customerEmail,
        eventId: eventId ?? null,
        notificationId: notificationId ?? null,
      });

      const { data: customerUpsertData, error: customerUpsertError } = await supabase
        .from("paddle_customer")
        .upsert(
          {
            customer_id: customerId,
            email: customerEmail,
            name: payload.data?.name ?? null,
            locale: payload.data?.locale ?? null,
            status: payload.data?.status ?? null,
            marketing_consent: payload.data?.marketing_consent ?? null,
            custom_data: payload.data?.custom_data ?? null,
            import_meta: payload.data?.import_meta ?? null,
            created_at_paddle: payload.data?.created_at ?? null,
            updated_at_paddle: payload.data?.updated_at ?? null,
            last_event_id: eventId ?? null,
            last_notification_id: notificationId ?? null,
            last_payload: payload,
          },
          {
            onConflict: "customer_id",
          },
        )
        .select("customer_id, email, updated_at_paddle, last_event_id, last_notification_id")
        .maybeSingle();

      if (customerUpsertError) {
        console.error("[paddle-webhook] Error upserting paddle_customer:", customerUpsertError);
        return new Response(JSON.stringify({ error: "Failed to save customer data" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      console.log("[paddle-webhook] paddle_customer upsert successful:", customerUpsertData ?? null);

      return new Response(JSON.stringify({ success: true, event: paddleEventType, customer_id: customerId }), {
        headers: corsHeaders,
      });
    }

    // 6. Process billing action using customer_id -> paddle_customer(email)
    if (BILLING_ACTION_EVENTS.includes(paddleEventType)) {
      const customerId = extractCustomerId(payload);
      if (!customerId) {
        console.error(`[paddle-webhook] ${paddleEventType} without customer_id`);
        return new Response(JSON.stringify({ error: `${paddleEventType} missing customer_id` }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (typeof eventId === "string" && eventId.trim()) {
        const { data: existingBillingEvent, error: existingBillingError } = await supabase
          .from("billing_event_logs")
          .select("id")
          .contains("payload", { event_id: eventId })
          .maybeSingle();

        if (existingBillingError) {
          console.error("[paddle-webhook] Error checking duplicated transaction event:", existingBillingError);
          return new Response(JSON.stringify({ error: "Failed to validate duplicated event" }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        if (existingBillingEvent?.id) {
          return new Response(
            JSON.stringify({ success: true, duplicated: true, event: eventType, event_id: eventId }),
            { headers: corsHeaders },
          );
        }
      }

      // ✅ ALTERAÇÃO: agora pega também name/locale pra montar o e-mail
      const { data: customerRow, error: customerLookupError } = await supabase
        .from("paddle_customer")
        .select("email, name, locale")
        .eq("customer_id", customerId)
        .maybeSingle();

      if (customerLookupError) {
        console.error("[paddle-webhook] Error reading paddle_customer:", customerLookupError);
        return new Response(JSON.stringify({ error: "Failed to resolve customer email" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      const email = normalizeEmail(customerRow?.email);
      if (!email) {
        console.warn(`[paddle-webhook] Customer ${customerId} not found yet. Requesting retry.`);
        return new Response(
          JSON.stringify({ error: "Customer not synced yet, retry later", customer_id: customerId }),
          { status: 409, headers: corsHeaders },
        );
      }

      const productId = payload.data?.items?.[0]?.price?.product_id || payload.data?.items?.[0]?.product?.id || "";

      console.log(
        `[paddle-webhook] Processing billing action: email=${email}, event=${eventType}, product=${productId}`,
      );

      const payloadWithCustomer = {
        ...payload,
        resolved_customer_id: customerId,
        resolved_email: email,
      };

      const { error: billingError } = await supabase.from("billing_event_logs").insert({
        email,
        event_type: eventType,
        payload: payloadWithCustomer,
        status: "pending",
        processed: false,
      });

      if (billingError) {
        console.error("[paddle-webhook] Error inserting billing event:", billingError);
        return new Response(JSON.stringify({ error: "Failed to create billing event" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      console.log(`[paddle-webhook] Billing event logged for ${email}`);

      if (BILLING_ACTION_EVENTS.includes(paddleEventType)) {
        await processRealtimeBillingByEmail(supabase, email);
      }

      // ✅ enfileirar e-mail pós-compra (apenas para novas compras)
      try {
        if (["PURCHASE_COMPLETE", "SUBSCRIPTION_SETTLED"].includes(eventType)) {
          const buyerName = (customerRow as any)?.name || payload?.data?.customer?.name || "Aluno";
          const buyerLocale = (customerRow as any)?.locale || payload?.data?.customer?.locale || "es";

          console.log("[paddle-webhook] About to enqueue welcome email:", {
            email,
            buyerName,
            buyerLocale,
            productId: productId || "unknown",
          });

          await enqueueWelcomeEmail({
            supabase,
            email,
            buyerName,
            locale: buyerLocale,
            productId: productId || "unknown",
          });

          console.log("[paddle-webhook] enqueueWelcomeEmail completed successfully for:", email);
        }
      } catch (e) {
        console.error("[paddle-webhook] enqueue welcome failed (non-blocking):", e);
      }

      return new Response(JSON.stringify({ success: true, event: eventType, customer_id: customerId }), {
        headers: corsHeaders,
      });
    }

    // 7. Persist all other Paddle events in paddle_geral
    if (typeof eventId === "string" && eventId.trim()) {
      const { data: existingRawEvent, error: existingRawError } = await supabase
        .from("paddle_geral")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existingRawError) {
        console.error("[paddle-webhook] Error checking duplicated raw event:", existingRawError);
        return new Response(JSON.stringify({ error: "Failed to validate duplicated raw event" }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      if (existingRawEvent?.id) {
        return new Response(
          JSON.stringify({
            success: true,
            duplicated: true,
            stored_in: "paddle_geral",
            event: paddleEventType,
            event_id: eventId,
          }),
          { headers: corsHeaders },
        );
      }
    }

    const { error: rawLogError } = await supabase.from("paddle_geral").insert({
      event_id: eventId ?? null,
      notification_id: notificationId ?? null,
      event_type: paddleEventType,
      occurred_at: occurredAt ?? null,
      payload,
    });

    if (rawLogError) {
      console.error("[paddle-webhook] Error inserting paddle_geral event:", rawLogError);
      return new Response(JSON.stringify({ error: "Failed to save event payload" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, stored_in: "paddle_geral", event: paddleEventType }), {
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[paddle-webhook] Error:", error);

    // Log failure for automatic retry (non-blocking)
    try {
      const failPayload = rawBody ? JSON.parse(rawBody) : { _raw_unavailable: true };
      await logWebhookFailure(supabase, {
        webhookSource: "paddle-webhook",
        eventType: failPayload?.event_type,
        eventId: failPayload?.event_id,
        rawPayload: failPayload,
        errorMessage,
        errorStack,
        httpStatus: 500,
      });
    } catch {
      // Se não conseguir logar, tudo bem — o console.error acima já registra
    }

    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: corsHeaders });
  }
});
