

## Problem

The `admin-grant-access` edge function uses `supabase.auth.admin.listUsers()` without pagination to find a user by email. This only returns the first page of users (default ~50). With a growing user base, most users won't be found, causing "User not found with this email" even though `admin_lookup_email` (which queries `auth.users` directly via SQL) correctly finds them.

The screenshot confirms: "Conta encontrada" (from the RPC) but "User not found" (from the edge function).

## Solution

Replace the `listUsers()` approach in the edge function with a direct SQL query using the service role client, or use the `admin.getUserByEmail()` method if available, or paginate properly like `purchased-signup` does.

The simplest and most reliable fix: use `supabase.rpc` or a direct query on `auth.users` via the admin client instead of iterating `listUsers()`.

## Changes

**1. Fix `supabase/functions/admin-grant-access/index.ts`**

Replace the user lookup block (lines 55-68) that uses `listUsers()` with a proper paginated search (matching the pattern already used in `purchased-signup/index.ts`) or, even better, use the Supabase admin API's direct lookup:

```typescript
// Replace listUsers with proper lookup
const { data: userData, error: userError } = await supabase
  .from('auth.users')  // won't work via PostgREST
```

Actually, the best approach: reuse the same `findUserByEmail` helper from `purchased-signup` that paginates up to 10 pages of 1000 users each. This is a proven pattern already in the codebase.

Copy the `findUserByEmail` function from `purchased-signup/index.ts` into `admin-grant-access/index.ts` and use it instead of the single-page `listUsers()` call.

**Specific changes:**
- Add the `findUserByEmail` helper function (lines 43-65 of `purchased-signup`)
- Replace lines 55-68 of `admin-grant-access` with a call to `findUserByEmail(supabase, email.trim().toLowerCase())`
- Handle the null case (user not found)

This is a single-file fix in the edge function. No database or frontend changes needed.

