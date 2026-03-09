import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ff-webhook-signature, x-hotmart-hottok',
};

// === IN-MEMORY RATE LIMITER ===
const ipRequests = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_PER_SECOND = 10;
const RATE_WINDOW_MS = 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  
  // Cleanup old entries every ~100 checks to prevent memory leak
  if (ipRequests.size > 500) {
    for (const [key, val] of ipRequests) {
      if (now - val.timestamp > 10000) ipRequests.delete(key);
    }
  }
  
  if (entry && now - entry.timestamp < RATE_WINDOW_MS) {
    entry.count++;
    return entry.count <= RATE_LIMIT_PER_SECOND;
  }
  
  ipRequests.set(ip, { count: 1, timestamp: now });
  return true;
}

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

// HMAC-SHA256 signature validation for Funnelfox
async function validateHmacSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(computed, signature.toLowerCase());
  } catch {
    return false;
  }
}

function normalizeEmail(raw: string | undefined | null): string {
  return (raw || '').toLowerCase().trim().replace(/\.+$/, '');
}

async function findUserIdByEmail(supabase: any, normalizedEmail: string): Promise<string | null> {
  const perPage = 200;

  for (let page = 1; page <= 20; page++) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page, perPage } as any);

    if (listError || !listData?.users?.length) {
      return null;
    }

    const match = listData.users.find((u: { id: string; email?: string }) => normalizeEmail(u.email) === normalizedEmail);
    if (match) return match.id;

    if (listData.users.length < perPage) break;
  }

  return null;
}

serve(async (req) => {
  // Reject non-POST immediately (bots, scanners)
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  // === RATE LIMITING: Check IP before ANY processing ===
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  if (!checkRateLimit(clientIp)) {
    // Minimal response for bots — no CORS headers, no body
    return new Response(null, { status: 429 });
  }

  // === STEP 1: Check auth headers BEFORE reading body ===
  const hottok = req.headers.get('x-hotmart-hottok');
  const ffSignature = req.headers.get('ff-webhook-signature');

  // No recognized auth header — reject immediately WITHOUT reading body
  if (!hottok && !ffSignature) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Validate Hotmart via hottok header (no body needed)
  const HOTMART_HOTTOK = Deno.env.get('HOTMART_HOTTOK');
  if (hottok) {
    if (!HOTMART_HOTTOK || !timingSafeEqual(hottok, HOTMART_HOTTOK)) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // Now read body (only for authenticated requests)
  const rawBody = await req.text();

  // Validate Funnelfox/Primer via HMAC signature (needs body)
  if (!hottok && ffSignature) {
    const FF_TOKEN = Deno.env.get('FUNNELFOX_WEBHOOK_TOKEN');
    if (!FF_TOKEN || !(await validateHmacSignature(rawBody, ffSignature, FF_TOKEN))) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // === STEP 2: Auth passed — now initialize heavy resources ===
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    // Parse JSON from the already-read body
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.log('[primer-webhook] Invalid JSON payload, returning 200 to stop retries');
      return new Response(JSON.stringify({ error: 'Invalid JSON', ignored: true }), { status: 200, headers: corsHeaders });
    }

    const email = (
      payload.data?.buyer?.email ||
      payload.data?.subscriber?.email ||
      payload.customer?.email ||
      payload.email
    )?.toLowerCase().trim().replace(/\.+$/, '');

    if (!email) {
      console.log('[primer-webhook] No email found in payload, returning 200 to stop retries');
      return new Response(JSON.stringify({ error: 'No email found in payload', ignored: true }), { status: 200, headers: corsHeaders });
    }

    const buyerName = (
      payload.data?.buyer?.name ||
      payload.data?.subscriber?.name ||
      payload.customer?.name ||
      payload.name ||
      'Aluno'
    );

    const productId = (
      payload.data?.product?.id ||
      payload.oneoff?.product_id ||
      payload.product_id ||
      ''
    )?.toString();

    // Look up language and product_type from product_definitions
    let language = 'es';
    let productType = 'base';
    if (productId) {
      const { data: productDef } = await supabase
        .from('product_definitions')
        .select('language, product_type')
        .eq('product_id', productId)
        .maybeSingle();

      if (productDef?.language) language = productDef.language;
      if (productDef?.product_type) productType = productDef.product_type;
    }

    console.log(`[primer-webhook] Queuing: email=${email}, name=${buyerName}, product=${productId}, lang=${language}`);

    // Extract event_type from payload
    const eventType = (
      payload.data?.event_type ||
      payload.event_type ||
      payload.event ||
      'PURCHASE_COMPLETE'
    )?.toString().toUpperCase();

    // ALWAYS insert billing_event_logs FIRST (before email dedup)
    const { error: billingError } = await supabase
      .from('billing_event_logs')
      .insert({
        email,
        event_type: eventType,
        payload,
        status: 'pending',
        processed: false,
      });

    if (billingError) {
      console.error(`[primer-webhook] Error inserting billing event:`, billingError);
    } else {
      console.log(`[primer-webhook] Billing event logged for ${email}, type=${eventType}`);
    }

    // NEW: Try to find existing user and grant access in real-time
    const GRANT_EVENT_TYPES = [
      'SETTLED', 'STARTING_TRIAL', 'SUBSCRIPTION_SETTLED',
      'SUBSCRIPTION_TRIAL_STARTED', 'GRANTED',
      'CONVERTION', 'RENEWING', 'RESUMING',
      'RECOVERING', 'RECOVERING_AUTORENEW',
      'PURCHASE_COMPLETE', 'PURCHASE_APPROVED',
      'PURCHASE_PROTEST', 'PURCHASE_DELAYED',
    ];

    if (GRANT_EVENT_TYPES.includes(eventType)) {
      try {
        const foundUserId = await findUserIdByEmail(supabase, email);

        if (foundUserId) {
          console.log(`[primer-webhook] User found: ${foundUserId}, calling process_pending_billing_events`);
          const { error: rpcError } = await supabase.rpc('process_pending_billing_events', {
            p_user_id: foundUserId,
            p_email: email,
          });

          if (rpcError) {
            console.error(`[primer-webhook] RPC error:`, rpcError);
          } else {
            console.log(`[primer-webhook] Access granted in real-time for ${email}`);
          }
        } else {
          console.log(`[primer-webhook] User not found for ${email}, will reconcile on signup`);
        }
      } catch (lookupErr) {
        console.error(`[primer-webhook] User lookup error:`, lookupErr);
      }
    }

    // Check if welcome email was already sent (dedup against email_logs)
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('recipient_email', email)
      .eq('email_type', 'welcome')
      .maybeSingle();

    if (existingLog) {
      console.log(`[primer-webhook] Welcome email already sent to ${email}, skipping queue`);
      return new Response(JSON.stringify({ success: true, skipped: true, billing_logged: !billingError }), { headers: corsHeaders });
    }

    // Insert into pending queue (send_after = now + 5 min, fixed timer)
    const { error: insertError } = await supabase
      .from('pending_thank_you_emails')
      .insert({
        email,
        buyer_name: buyerName,
        product_id: productId || null,
        product_type: productType,
        language,
      });

    if (insertError) {
      console.error(`[primer-webhook] Error queuing email:`, insertError);
      throw new Error(insertError.message);
    }

    console.log(`[primer-webhook] Queued thank-you email for ${email}, will send after 5 min`);

    return new Response(JSON.stringify({ success: true, queued: true }), { headers: corsHeaders });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[primer-webhook] Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: corsHeaders });
  }
});
