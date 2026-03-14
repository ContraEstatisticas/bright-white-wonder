

## Problem

The `admin_lookup_email` RPC function returns `{error: 'unauthorized'}` as a JSON object (not a Supabase error) when `is_admin()` fails. The `EmailLookup.tsx` component doesn't check for this — it treats any non-error response as valid lookup data, causing it to silently show "Ainda não criou conta" and "Nenhum evento de billing" even when data exists.

## Fix

**Edit `src/components/admin/EmailLookup.tsx`**: After receiving the RPC response, check if `data.error` exists. If it does, show a toast with the error message instead of rendering empty results.

```typescript
const { data, error } = await supabase.rpc("admin_lookup_email", { p_email: email.trim() });
if (error) throw error;
if (data?.error) {
  toast.error("Erro: " + data.error);
  return;
}
setResult(data as unknown as LookupResult);
```

This is a 3-line change that ensures admin authorization failures are surfaced to the user instead of showing misleading empty results.

