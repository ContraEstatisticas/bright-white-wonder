import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type PurchasedSignupParams = {
  email: string;
  password: string;
  fullName: string;
  preferredLanguage?: string | null;
};

type AccountCreationResult =
  | { ok: true; userId: string | null; code?: undefined; message?: undefined }
  | { ok: false; code: string | null; message: string };

const normalizeLanguage = (language?: string | null) => {
  const normalized = String(language ?? "").toLowerCase().split("-")[0];
  return normalized || "en";
};

export async function createPurchasedAccount(
  params: PurchasedSignupParams,
): Promise<AccountCreationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("purchased-signup", {
      body: {
        email: params.email,
        password: params.password,
        full_name: params.fullName,
        preferred_language: normalizeLanguage(params.preferredLanguage),
      },
    });

    if (error) {
      let message = error.message;
      let code: string | null = null;

      if (error instanceof FunctionsHttpError) {
        try {
          const payload = await error.context.json();
          message = typeof payload?.error === "string" ? payload.error : message;
          code = typeof payload?.code === "string" ? payload.code : null;
        } catch {
          code = null;
        }
      }

      return { ok: false, code, message };
    }

    const userId =
      typeof (data as { user_id?: unknown } | null)?.user_id === "string"
        ? ((data as { user_id: string }).user_id)
        : null;

    return { ok: true, userId };
  } catch (error) {
    return {
      ok: false,
      code: null,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function createPendingAccount(
  params: PurchasedSignupParams,
): Promise<AccountCreationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("pending-signup", {
      body: {
        email: params.email,
        password: params.password,
        full_name: params.fullName,
        preferred_language: normalizeLanguage(params.preferredLanguage),
      },
    });

    if (error) {
      let message = error.message;
      let code: string | null = null;

      if (error instanceof FunctionsHttpError) {
        try {
          const payload = await error.context.json();
          message = typeof payload?.error === "string" ? payload.error : message;
          code = typeof payload?.code === "string" ? payload.code : null;
        } catch {
          code = null;
        }
      }

      return { ok: false, code, message };
    }

    const userId =
      typeof (data as { user_id?: unknown } | null)?.user_id === "string"
        ? ((data as { user_id: string }).user_id)
        : null;

    return { ok: true, userId };
  } catch (error) {
    return {
      ok: false,
      code: null,
      message: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}