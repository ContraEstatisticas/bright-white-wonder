import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * retry-failed-webhooks
 *
 * Edge Function invocada via cron job (ex: a cada 5 min) para
 * reprocessar webhooks que falharam.
 *
 * Fluxo:
 *  1. Busca registros em webhook_failure_logs com status 'pending' ou 'retrying'
 *     cujo next_retry_at <= now()
 *  2. Para cada registro, chama internamente a Edge Function do webhook original
 *     (paddle-webhook ou primer-webhook) passando o payload salvo
 *  3. Se sucesso → marca como 'success'
 *     Se falha e retry_count < max_retries → incrementa retry_count e agenda próximo retry
 *     Se falha e retry_count >= max_retries → marca como 'exhausted'
 *
 * Segurança: protegido por CRON_SECRET no body
 */

interface FailedWebhook {
  id: string;
  webhook_source: string;
  event_type: string | null;
  event_id: string | null;
  raw_payload: Record<string, unknown>;
  request_headers: Record<string, string> | null;
  retry_count: number;
  max_retries: number;
  status: string;
}

// Backoff exponencial: 30s, 2min, 8min, 30min, 2h
function calculateNextRetryMs(retryCount: number): number {
  return Math.pow(4, Math.min(retryCount, 4)) * 30 * 1000;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Autenticação: aceita CRON_SECRET no body ou como bearer token
    let isAuthorized = false;

    try {
      const body = await req.clone().json();
      const cronSecret = Deno.env.get("CRON_SECRET");
      if (cronSecret && body?.secret === cronSecret) {
        isAuthorized = true;
      }
    } catch {
      // body inválido, tenta bearer
    }

    if (!isAuthorized) {
      const authHeader = req.headers.get("authorization") || "";
      const cronSecret = Deno.env.get("CRON_SECRET");
      if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        isAuthorized = true;
      }
    }

    // Também aceita service_role key como fallback (para chamadas internas)
    if (!isAuthorized) {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader === `Bearer ${serviceRoleKey}`) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      console.error("[retry-failed-webhooks] Unauthorized request");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    console.log("[retry-failed-webhooks] Starting retry cycle...");

    // 1. Buscar webhooks pendentes de retry
    const { data: pendingWebhooks, error: fetchError } = await supabase
      .from("webhook_failure_logs")
      .select(
        "id, webhook_source, event_type, event_id, raw_payload, request_headers, retry_count, max_retries, status"
      )
      .in("status", ["pending", "retrying"])
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(10); // Processa no máximo 10 por ciclo para não sobrecarregar

    if (fetchError) {
      console.error(
        "[retry-failed-webhooks] Error fetching pending webhooks:",
        fetchError
      );
      throw new Error(fetchError.message);
    }

    if (!pendingWebhooks || pendingWebhooks.length === 0) {
      console.log("[retry-failed-webhooks] No pending webhooks to retry");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No pending retries",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[retry-failed-webhooks] Found ${pendingWebhooks.length} webhooks to retry`
    );

    const results: Array<{
      id: string;
      source: string;
      event_type: string | null;
      result: "success" | "retry_scheduled" | "exhausted" | "error";
      error?: string;
    }> = [];

    for (const webhook of pendingWebhooks as FailedWebhook[]) {
      console.log(
        `[retry-failed-webhooks] Retrying ${webhook.webhook_source} event=${webhook.event_type} (attempt ${webhook.retry_count + 1}/${webhook.max_retries})`
      );

      // Marcar como "retrying"
      await supabase
        .from("webhook_failure_logs")
        .update({ status: "retrying", last_retry_at: new Date().toISOString() })
        .eq("id", webhook.id);

      try {
        // Chamar a Edge Function original internamente
        const targetFunctionUrl = `${supabaseUrl}/functions/v1/${webhook.webhook_source}`;

        // Reconstruir headers seguros (sem secrets originais, usar service role)
        const retryHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        };

        // Para paddle-webhook, incluir o API key se disponível
        if (webhook.webhook_source === "paddle-webhook") {
          const paddleApiKey = Deno.env.get("PADDLE_API_KEY");
          if (paddleApiKey) {
            retryHeaders["Authorization"] = `Bearer ${paddleApiKey}`;
          }
        }

        // Para primer-webhook, incluir hottok
        if (webhook.webhook_source === "primer-webhook") {
          const hottok = Deno.env.get("HOTMART_HOTTOK");
          if (hottok) {
            retryHeaders["x-hotmart-hottok"] = hottok;
          }
        }

        const response = await fetch(targetFunctionUrl, {
          method: "POST",
          headers: retryHeaders,
          body: JSON.stringify(webhook.raw_payload),
        });

        const responseBody = await response.text();

        if (response.ok) {
          // ✅ Sucesso!
          console.log(
            `[retry-failed-webhooks] ✓ Retry successful for ${webhook.id}`
          );

          await supabase
            .from("webhook_failure_logs")
            .update({
              status: "success",
              resolved_at: new Date().toISOString(),
              last_retry_at: new Date().toISOString(),
              retry_count: webhook.retry_count + 1,
            })
            .eq("id", webhook.id);

          results.push({
            id: webhook.id,
            source: webhook.webhook_source,
            event_type: webhook.event_type,
            result: "success",
          });
        } else {
          // ❌ Falhou novamente
          const newRetryCount = webhook.retry_count + 1;

          if (newRetryCount >= webhook.max_retries) {
            // Esgotou as tentativas
            console.warn(
              `[retry-failed-webhooks] ✗ Max retries exhausted for ${webhook.id} (${webhook.webhook_source})`
            );

            await supabase
              .from("webhook_failure_logs")
              .update({
                status: "exhausted",
                retry_count: newRetryCount,
                last_retry_at: new Date().toISOString(),
                last_retry_error: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
              })
              .eq("id", webhook.id);

            results.push({
              id: webhook.id,
              source: webhook.webhook_source,
              event_type: webhook.event_type,
              result: "exhausted",
              error: `HTTP ${response.status}`,
            });
          } else {
            // Agendar próximo retry
            const nextRetryMs = calculateNextRetryMs(newRetryCount);
            const nextRetryAt = new Date(Date.now() + nextRetryMs).toISOString();

            console.log(
              `[retry-failed-webhooks] ✗ Retry failed for ${webhook.id}, next attempt in ${nextRetryMs / 1000}s`
            );

            await supabase
              .from("webhook_failure_logs")
              .update({
                status: "pending",
                retry_count: newRetryCount,
                next_retry_at: nextRetryAt,
                last_retry_at: new Date().toISOString(),
                last_retry_error: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
              })
              .eq("id", webhook.id);

            results.push({
              id: webhook.id,
              source: webhook.webhook_source,
              event_type: webhook.event_type,
              result: "retry_scheduled",
              error: `HTTP ${response.status}, next retry at ${nextRetryAt}`,
            });
          }
        }
      } catch (retryError) {
        const errorMsg =
          retryError instanceof Error ? retryError.message : "Unknown error";
        console.error(
          `[retry-failed-webhooks] Error retrying ${webhook.id}:`,
          retryError
        );

        const newRetryCount = webhook.retry_count + 1;
        const isExhausted = newRetryCount >= webhook.max_retries;

        await supabase
          .from("webhook_failure_logs")
          .update({
            status: isExhausted ? "exhausted" : "pending",
            retry_count: newRetryCount,
            last_retry_at: new Date().toISOString(),
            last_retry_error: errorMsg,
            ...(isExhausted
              ? {}
              : {
                  next_retry_at: new Date(
                    Date.now() + calculateNextRetryMs(newRetryCount)
                  ).toISOString(),
                }),
          })
          .eq("id", webhook.id);

        results.push({
          id: webhook.id,
          source: webhook.webhook_source,
          event_type: webhook.event_type,
          result: isExhausted ? "exhausted" : "retry_scheduled",
          error: errorMsg,
        });
      }

      // Rate limiting entre retries (2s)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const summary = {
      success: true,
      processed: results.length,
      succeeded: results.filter((r) => r.result === "success").length,
      retryScheduled: results.filter((r) => r.result === "retry_scheduled")
        .length,
      exhausted: results.filter((r) => r.result === "exhausted").length,
      results,
    };

    console.log(
      `[retry-failed-webhooks] Cycle complete: ${summary.succeeded} success, ${summary.retryScheduled} scheduled, ${summary.exhausted} exhausted`
    );

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[retry-failed-webhooks] Fatal error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
